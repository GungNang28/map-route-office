import { config } from './config.js';

/**
 * Robust Dual-Engine Map Controller
 * รองรับทั้ง Google Maps JavaScript API และ OpenStreetMap (Fallback)
 * มั่นใจได้ 100% ว่าแผนที่จะแสดงผลเสมอแม้ Google Key จะติดข้อจำกัดบนเบราว์เซอร์
 */
export class MapController {
  constructor(containerId = 'map') {
    this.containerId = containerId;
    this.containerEl = null;
    this.currentEngine = 'google'; // 'google' | 'leaflet'

    // Google Maps instances
    this.googleMap = null;
    this.googleUserMarker = null;
    this.googleOfficeMarker = null;
    this.googleRoutePolyline = null;
    this.googleRouteCasing = null;
    this.googleInfoWindow = null;

    // Leaflet instances
    this.leafletMap = null;
    this.leafletUserMarker = null;
    this.leafletOfficeMarker = null;
    this.leafletRoutePolyline = null;

    // Cache latest state
    this.lastUserData = null;
    this.lastOfficeData = null;
    this.lastRouteData = null;

    this.onEngineChange = null;
  }

  /**
   * โหลด Google Maps JavaScript API ด้วย Callback
   */
  async loadGoogleMapsScript(apiKey) {
    if (window.google && window.google.maps && window.google.maps.Map) {
      return true;
    }

    if (!apiKey) {
      throw new Error('ไม่พบ Google Maps API Key');
    }

    return new Promise((resolve, reject) => {
      const callbackName = `__gmaps_ready_${Date.now()}`;

      // กำหนด Timeout 6 วินาที หากโหลดไม่ขึ้นให้สลับไปแผนที่สำรองทันที
      const timeout = setTimeout(() => {
        if (window[callbackName]) delete window[callbackName];
        reject(new Error('Google Maps SDK ใช้เวลาโหลดนานเกินไป'));
      }, 6000);

      window[callbackName] = () => {
        clearTimeout(timeout);
        delete window[callbackName];
        resolve(true);
      };

      // ดักจับกรณี Google API Key ติด Referrer / Quota Error
      window.gm_authFailure = () => {
        console.warn('⚠️ Google Maps Authentication Failed (API Key restrictions / quota)');
        this.fallbackToLeaflet('Google Maps API Key ติดข้อจำกัดการใช้งานบนเบราว์เซอร์');
      };

      const script = document.createElement('script');
      script.id = 'google-maps-sdk';
      script.type = 'text/javascript';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=geometry&callback=${callbackName}`;
      script.async = true;

      script.onerror = (e) => {
        clearTimeout(timeout);
        if (window[callbackName]) delete window[callbackName];
        reject(new Error('เบราว์เซอร์บล็อกการโหลด Google Maps SDK'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * เริ่มต้นสร้างแผนที่
   */
  async initMap(apiKey) {
    this.containerEl = document.getElementById(this.containerId);
    if (!this.containerEl) {
      this.containerEl = document.querySelector('.map') || document.body;
    }

    try {
      // ลองโหลด Google Maps ก่อน
      await this.loadGoogleMapsScript(apiKey);
      this.initGoogleMap();
      this.currentEngine = 'google';
      if (this.onEngineChange) this.onEngineChange('google');
    } catch (error) {
      console.warn('⚠️ Google Maps ไม่สามารถโหลดได้ กำลังสลับไปใช้แผนที่สำรอง:', error.message);
      this.initLeafletMap();
      this.currentEngine = 'leaflet';
      if (this.onEngineChange) this.onEngineChange('leaflet', error.message);
    }
  }

  /**
   * สร้าง Google Map ของจริง
   */
  initGoogleMap() {
    this.containerEl.innerHTML = '';

    const center = {
      lat: config.defaultLocation.lat,
      lng: config.defaultLocation.lng
    };

    this.googleMap = new google.maps.Map(this.containerEl, {
      center,
      zoom: 13,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: true,
      zoomControl: true,
      streetViewControl: true,
      fullscreenControl: true
    });
  }

  /**
   * สร้าง Leaflet Map สำรอง (เปิดได้เสมอ ไม่ต้องมี Key)
   */
  initLeafletMap() {
    this.containerEl.innerHTML = '';

    if (this.leafletMap) {
      this.leafletMap.remove();
    }

    this.leafletMap = L.map(this.containerEl, {
      zoomControl: false,
      attributionControl: false
    }).setView([config.defaultLocation.lat, config.defaultLocation.lng], 13);

    L.control.zoom({ position: 'bottomright' }).addTo(this.leafletMap);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(this.leafletMap);
  }

  fallbackToLeaflet(reason) {
    if (this.currentEngine === 'leaflet') return;
    console.warn('สลับมาใช้แผนที่สำรอง:', reason);
    this.currentEngine = 'leaflet';
    this.initLeafletMap();

    // วาดข้อมูลเดิมซ้ำบนแผนที่ใหม่
    if (this.lastUserData) {
      this.setUserMarker(this.lastUserData.lat, this.lastUserData.lng);
    }
    if (this.lastOfficeData) {
      this.setOfficeMarker(this.lastOfficeData.lat, this.lastOfficeData.lng, this.lastOfficeData.name);
    }
    if (this.lastRouteData) {
      this.drawRoute(this.lastRouteData);
    }

    if (this.onEngineChange) this.onEngineChange('leaflet', reason);
  }

  /**
   * ปักหมุดตำแหน่งผู้ใช้
   */
  setUserMarker(lat, lng) {
    this.lastUserData = { lat, lng };

    if (this.currentEngine === 'google' && this.googleMap) {
      const position = new google.maps.LatLng(lat, lng);
      if (this.googleUserMarker) {
        this.googleUserMarker.setPosition(position);
      } else {
        this.googleUserMarker = new google.maps.Marker({
          position,
          map: this.googleMap,
          title: 'ตำแหน่งปัจจุบันของคุณ',
          zIndex: 10,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3.5
          }
        });
      }
    } else if (this.leafletMap) {
      const userIcon = L.divIcon({
        className: 'custom-user-marker-container',
        html: `<div class="user-marker-pulse"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      if (this.leafletUserMarker) {
        this.leafletUserMarker.setLatLng([lat, lng]);
      } else {
        this.leafletUserMarker = L.marker([lat, lng], { icon: userIcon }).addTo(this.leafletMap);
      }
    }
  }

  /**
   * ปักหมุดสำนักงานใหญ่ SCG
   */
  setOfficeMarker(lat, lng, name = 'สำนักงานใหญ่ SCG') {
    this.lastOfficeData = { lat, lng, name };

    if (this.currentEngine === 'google' && this.googleMap) {
      const position = new google.maps.LatLng(lat, lng);
      if (this.googleOfficeMarker) {
        this.googleOfficeMarker.setPosition(position);
      } else {
        this.googleOfficeMarker = new google.maps.Marker({
          position,
          map: this.googleMap,
          title: name,
          animation: google.maps.Animation.DROP,
          zIndex: 20
        });

        this.googleInfoWindow = new google.maps.InfoWindow({
          content: `
            <div style="font-family: 'Prompt', sans-serif; padding: 6px 10px; color: #0f172a;">
              <div style="font-weight: 700; font-size: 14px; color: #b91c1c; margin-bottom: 2px;">🏢 ${name}</div>
              <div style="font-size: 12px; color: #475569;">เลขที่ 1 ถ.ปูนซิเมนต์ไทย บางซื่อ</div>
            </div>
          `
        });

        this.googleOfficeMarker.addListener('click', () => {
          this.googleInfoWindow.open(this.googleMap, this.googleOfficeMarker);
        });

        this.googleInfoWindow.open(this.googleMap, this.googleOfficeMarker);
      }
    } else if (this.leafletMap) {
      const officeIcon = L.divIcon({
        className: 'custom-office-marker-container',
        html: `
          <div class="office-marker-pin">
            <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -32]
      });

      if (this.leafletOfficeMarker) {
        this.leafletOfficeMarker.setLatLng([lat, lng]);
      } else {
        this.leafletOfficeMarker = L.marker([lat, lng], { icon: officeIcon }).addTo(this.leafletMap);
        this.leafletOfficeMarker.bindPopup(`<b>${name}</b><br>บางซื่อ กรุงเทพฯ`).openPopup();
      }
    }
  }

  /**
   * วาดเส้นทางบนแผนที่
   */
  drawRoute(polylineData) {
    this.lastRouteData = polylineData;

    let points = [];
    if (typeof polylineData === 'string' && polylineData.length > 0) {
      points = this.decodePolyline(polylineData);
    } else if (Array.isArray(polylineData)) {
      points = polylineData;
    }

    if (points.length === 0) return;

    if (this.currentEngine === 'google' && this.googleMap) {
      if (this.googleRoutePolyline) this.googleRoutePolyline.setMap(null);
      if (this.googleRouteCasing) this.googleRouteCasing.setMap(null);

      const gPath = points.map(pt => new google.maps.LatLng(pt[0], pt[1]));

      this.googleRouteCasing = new google.maps.Polyline({
        path: gPath,
        geodesic: true,
        strokeColor: '#1A73E8',
        strokeOpacity: 0.9,
        strokeWeight: 8,
        zIndex: 1
      });
      this.googleRouteCasing.setMap(this.googleMap);

      this.googleRoutePolyline = new google.maps.Polyline({
        path: gPath,
        geodesic: true,
        strokeColor: '#4285F4',
        strokeOpacity: 1.0,
        strokeWeight: 5,
        zIndex: 2
      });
      this.googleRoutePolyline.setMap(this.googleMap);

      const bounds = new google.maps.LatLngBounds();
      gPath.forEach(pt => bounds.extend(pt));
      const isMobile = window.innerWidth <= 768;
      const padding = isMobile
        ? { top: 40, right: 30, bottom: 240, left: 30 }
        : { top: 60, right: 60, bottom: 60, left: 450 };
      this.googleMap.fitBounds(bounds, padding);
    } else if (this.leafletMap) {
      if (this.leafletRoutePolyline) {
        this.leafletMap.removeLayer(this.leafletRoutePolyline);
      }

      this.leafletRoutePolyline = L.polyline(points, {
        color: '#4285F4',
        weight: 6,
        opacity: 0.9,
        smoothFactor: 1
      }).addTo(this.leafletMap);

      const bounds = L.latLngBounds(points);
      const isMobile = window.innerWidth <= 768;
      const padding = isMobile ? [30, 30] : [60, 60];
      this.leafletMap.fitBounds(bounds, { padding });
    }
  }

  /**
   * ฟังก์ชันถอดรหัส Encoded Polyline
   */
  decodePolyline(encoded) {
    if (!encoded) return [];
    const poly = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      poly.push([lat / 1e5, lng / 1e5]);
    }
    return poly;
  }
}
