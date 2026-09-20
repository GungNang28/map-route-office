import { envConfig } from '../config/env.config.js';
import { officeConfig } from '../config/office.config.js';
import { formatDistanceText, formatDurationText } from '../utils/formatters.util.js';

/**
 * Service สำหรับคำนวณเส้นทางจากตำแหน่งผู้ใช้ไปยังบริษัท
 * 
 * จุดประสงค์ด้านความปลอดภัย:
 * - ฟังก์ชันนี้ทำงานบน Backend เท่านั้น
 * - ใช้ GOOGLE_MAPS_API_KEY จาก Environment Variable
 * - ไม่มีการส่ง Key ออกไปยัง Frontend
 * 
 * @param {number} userLat ละติจูดของผู้ใช้
 * @param {number} userLng ลองจิจูดของผู้ใช้
 * @returns {Promise<Object>} ข้อมูลระยะทาง, เวลาเดินทาง และ Polyline
 */
export const calculateRouteToOffice = async (userLat, userLng) => {
  const apiKey = envConfig.googleMapsApiKey;
  const destination = {
    lat: officeConfig.latitude,
    lng: officeConfig.longitude,
    name: officeConfig.name
  };

  const currentDepartureTime = new Date().toISOString();

  // กรณีมี Google API Key: เรียก Google Routes API (v2:computeRoutes)
  if (apiKey && apiKey !== 'your_google_maps_api_key_here') {
    try {
      const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'
        },
        body: JSON.stringify({
          origin: {
            location: {
              latLng: {
                latitude: userLat,
                longitude: userLng
              }
            }
          },
          destination: {
            location: {
              latLng: {
                latitude: destination.lat,
                longitude: destination.lng
              }
            }
          },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE', // คำนวณตามสภาพการจราจรปัจจุบันแบบเรียลไทม์
          computeAlternativeRoutes: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Google Routes API Error:', errorData);
        throw new Error(errorData.error?.message || 'ไม่สามารถดึงข้อมูลเส้นทางจาก Google Routes API ได้');
      }

      const data = await response.json();
      const route = data.routes?.[0];

      if (!route) {
        throw new Error('ไม่พบเส้นทางระหว่างสองตำแหน่งนี้');
      }

      // ดึงค่าวินาที (Google Routes API ส่งมาในรูปแบบ "1234s")
      const durationSeconds = parseInt(route.duration?.replace('s', ''), 10) || 0;
      const distanceMeters = route.distanceMeters || 0;

      return {
        origin: { lat: userLat, lng: userLng, label: 'ตำแหน่งปัจจุบันของคุณ' },
        destination: { lat: destination.lat, lng: destination.lng, label: destination.name },
        distance: {
          meters: distanceMeters,
          text: formatDistanceText(distanceMeters)
        },
        duration: {
          seconds: durationSeconds,
          text: formatDurationText(durationSeconds),
          trafficModel: 'TRAFFIC_AWARE'
        },
        departureTime: currentDepartureTime,
        polyline: route.polyline?.encodedPolyline || '',
        isSimulated: false
      };
    } catch (err) {
      console.warn('⚠️ Google Routes API ขัดข้อง, สลับไปใช้โหมดจำลองเส้นทาง:', err.message);
      // Fallback ไปโหมดจำลองเพื่อให้ระบบยังแสดงผลได้ระหว่างพัฒนา
      return generateSimulatedRoute(userLat, userLng, destination, currentDepartureTime);
    }
  }

  // กรณีที่ยังไม่ได้ระบุ API Key: สร้างข้อมูลจำลองสำหรับการทดสอบโครงสร้างระบบ
  return generateSimulatedRoute(userLat, userLng, destination, currentDepartureTime);
};

/**
 * ฟังก์ชันสร้างข้อมูลเส้นทางจำลอง (Simulation Mode)
 * ใช้เมื่อยังไม่ได้ใส่ Google API Key หรือระหว่างพัฒนาโครงสร้างระบบ
 */
function generateSimulatedRoute(userLat, userLng, destination, departureTime) {
  // คำนวณระยะห่างคร่าวๆ ด้วยสูตร Haversine (กิโลเมตร)
  const R = 6371; // รัศมีโลก (กม.)
  const dLat = (destination.lat - userLat) * (Math.PI / 180);
  const dLng = (destination.lng - userLng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(userLat * (Math.PI / 180)) *
    Math.cos(destination.lat * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directDistanceKm = R * c;

  // ประมาณการระยะทางวิ่งบนถนนจริง (คูณ 1.3) และความเร็วเฉลี่ยในเมือง 30 กม./ชม.
  const estimatedRoadKm = directDistanceKm * 1.3;
  const distanceMeters = Math.round(estimatedRoadKm * 1000);
  const durationSeconds = Math.round((estimatedRoadKm / 30) * 3600);

  return {
    origin: { lat: userLat, lng: userLng, label: 'ตำแหน่งปัจจุบันของคุณ' },
    destination: { lat: destination.lat, lng: destination.lng, label: destination.name },
    distance: {
      meters: distanceMeters,
      text: formatDistanceText(distanceMeters)
    },
    duration: {
      seconds: durationSeconds,
      text: formatDurationText(durationSeconds),
      trafficModel: 'SIMULATED'
    },
    departureTime,
    // พิกัดเส้นทางจำลองระหว่างจุดเริ่มต้นและปลายทาง
    coordinates: [
      [userLat, userLng],
      [(userLat + destination.lat) / 2 + 0.002, (userLng + destination.lng) / 2 - 0.002],
      [destination.lat, destination.lng]
    ],
    isSimulated: true
  };
}
