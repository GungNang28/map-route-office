import { MapController } from './map.js';
import { GeolocationService } from './geolocation.js';
import { RouteApiClient } from './api.js';
import { UIController } from './ui.js';
import { config } from './config.js';

class App {
  constructor() {
    this.mapCtrl = new MapController('map');
    this.uiCtrl = new UIController();
    this.currentUserLocation = null;
    this.serverConfig = null;
  }

  async init() {
    this.uiCtrl.setLoading(true, 'กำลังเริ่มต้นระบบแผนที่...');

    // ดักจับการสลับ Engine แผนที่
    this.mapCtrl.onEngineChange = (engine, reason) => {
      if (engine === 'google') {
        console.log('✅ ใช้งาน Official Google Maps สำเร็จ');
      } else if (engine === 'leaflet') {
        console.log('ℹ️ สลับใช้งานแผนที่สำรอง:', reason);
        if (reason) {
          this.uiCtrl.showToast(`แสดงผลแผนที่สำรอง: ${reason}`, 'info');
        }
      }
    };

    // 1. ดึงการตั้งค่าจาก Backend (รวมถึง Google API Key และข้อมูลบริษัท)
    try {
      this.serverConfig = await RouteApiClient.fetchConfig();
      await this.mapCtrl.initMap(this.serverConfig.googleMapsApiKey);
    } catch (err) {
      console.warn('Init map warning:', err.message);
      await this.mapCtrl.initMap(null); // Fallback to Leaflet immediately
    }

    // ปักหมุดเริ่มต้นทันทีเพื่อให้เห็นแผนที่ไม่ว่างเปล่า
    if (this.serverConfig?.office) {
      this.mapCtrl.setOfficeMarker(
        this.serverConfig.office.latitude,
        this.serverConfig.office.longitude,
        this.serverConfig.office.name
      );
    }

    // 2. ผูก Event ปุ่มต่างๆ
    this.bindEvents();

    // 3. เริ่มค้นหาตำแหน่งและคำนวณเส้นทาง
    await this.loadRouteToOffice();
  }

  bindEvents() {
    const refreshBtn = document.getElementById('btn-refresh-location');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        await this.loadRouteToOffice();
      });
    }
  }

  async loadRouteToOffice() {
    this.uiCtrl.setLoading(true, 'กำลังระบุตำแหน่งของคุณและคำนวณเส้นทาง...');

    try {
      // 1. ขอพิกัดผู้ใช้จาก Browser
      let userCoords;
      try {
        userCoords = await GeolocationService.getCurrentLocation();
        this.currentUserLocation = userCoords;
      } catch (geoError) {
        console.warn('Geolocation fallback:', geoError.message);
        this.uiCtrl.showToast('ใช้พิกัดเริ่มต้น (อนุสาวรีย์ชัยฯ) เนื่องจากไม่ได้รับสิทธิ์พิกัด', 'info');
        userCoords = config.defaultLocation;
      }

      // ปักหมุดตำแหน่งผู้ใช้ทันที
      this.mapCtrl.setUserMarker(userCoords.lat, userCoords.lng);

      // 2. ขอข้อมูลเส้นทางจริงจาก Backend
      const routeData = await RouteApiClient.fetchRouteToOffice(userCoords.lat, userCoords.lng);

      // 3. ปักหมุดบริษัท SCG
      this.mapCtrl.setOfficeMarker(
        routeData.destination.lat,
        routeData.destination.lng,
        routeData.destination.label
      );

      // 4. วาดเส้นทางบนแผนที่
      if (routeData.polyline) {
        this.mapCtrl.drawRoute(routeData.polyline);
      } else if (routeData.coordinates) {
        this.mapCtrl.drawRoute(routeData.coordinates);
      }

      // 5. อัปเดตข้อมูลบนหน้าจอ
      this.uiCtrl.updateRouteInfo(routeData);

      if (routeData.isSimulated) {
        this.uiCtrl.showToast('คำนวณเส้นทางในโหมดจำลองเรียบร้อยแล้ว', 'info');
      } else {
        this.uiCtrl.showToast(`คำนวณเส้นทาง Google Routes สำเร็จ (${routeData.distance.text} / ${routeData.duration.text})`, 'info');
      }
    } catch (error) {
      console.error('Failed to load route:', error);
      this.uiCtrl.showToast(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
    } finally {
      this.uiCtrl.setLoading(false);
    }
  }
}

// เริ่มต้นแอปเมื่อโหลด DOM เสร็จสมบูรณ์
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
