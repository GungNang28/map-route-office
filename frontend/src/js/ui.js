/**
 * UI Controller Module
 * จัดการการอัปเดตหน้าจอ แสดงข้อมูลสรุป สถานะโหลด และแจ้งเตือน
 */
export class UIController {
  constructor() {
    this.distanceEl = document.getElementById('metric-distance');
    this.durationEl = document.getElementById('metric-duration');
    this.etaEl = document.getElementById('metric-eta');
    this.trafficEl = document.getElementById('traffic-info-text');
    this.userCoordsEl = document.getElementById('user-coordinates');
    this.officeCoordsEl = document.getElementById('office-coordinates');
    this.officeTitleEl = document.getElementById('office-title');
    this.loadingOverlay = document.getElementById('loading-overlay');
    this.toastEl = document.getElementById('toast-alert');
    this.toastMessageEl = document.getElementById('toast-message');
    this.openGoogleMapsBtn = document.getElementById('btn-open-google');
    this.toastTimeout = null;
  }

  /**
   * แสดงหรือซ่อนหน้าต่างโหลด
   */
  setLoading(isLoading, message = 'กำลังคำนวณเส้นทาง...') {
    if (this.loadingOverlay) {
      const textEl = this.loadingOverlay.querySelector('p');
      if (textEl) textEl.textContent = message;
      this.loadingOverlay.classList.toggle('active', isLoading);
    }
  }

  /**
   * อัปเดตข้อมูลสรุปเส้นทางบนหน้าจอ
   */
  updateRouteInfo(routeData) {
    if (!routeData) return;

    // อัปเดตระยะทาง
    if (this.distanceEl && routeData.distance) {
      this.distanceEl.textContent = routeData.distance.text;
    }

    // อัปเดตเวลาเดินทาง
    if (this.durationEl && routeData.duration) {
      this.durationEl.textContent = routeData.duration.text;
    }

    // คำนวณเวลาคาดว่าจะถึง (ETA) อ้างอิงเวลาปัจจุบัน
    if (this.etaEl && routeData.duration) {
      const now = new Date();
      const arrivalDate = new Date(now.getTime() + (routeData.duration.seconds || 0) * 1000);
      const hours = arrivalDate.getHours().toString().padStart(2, '0');
      const minutes = arrivalDate.getMinutes().toString().padStart(2, '0');
      this.etaEl.textContent = `ถึงเวลาประมาณ ${hours}:${minutes} น.`;
    }

    // อัปเดตข้อมูลการจราจร
    if (this.trafficEl) {
      if (routeData.duration?.trafficModel === 'TRAFFIC_AWARE') {
        this.trafficEl.textContent = 'คำนวณตามสภาพการจราจรแบบเรียลไทม์ (Google Routes API)';
      } else {
        this.trafficEl.textContent = 'คำนวณเวลาเดินทางมาตรฐานตามเส้นทาง';
      }
    }

    // อัปเดตพิกัดผู้ใช้
    if (this.userCoordsEl && routeData.origin) {
      this.userCoordsEl.textContent = `${routeData.origin.lat.toFixed(4)}, ${routeData.origin.lng.toFixed(4)}`;
    }

    // อัปเดตข้อมูลบริษัท
    if (this.officeTitleEl && routeData.destination?.label) {
      this.officeTitleEl.textContent = routeData.destination.label;
    }
    if (this.officeCoordsEl && routeData.destination) {
      this.officeCoordsEl.textContent = `${routeData.destination.lat.toFixed(4)}, ${routeData.destination.lng.toFixed(4)}`;
    }

    // อัปเดตปุ่มเปิด Google Maps สำหรับผู้ใช้ที่ต้องการนำทางบนมือถือ
    if (this.openGoogleMapsBtn && routeData.origin && routeData.destination) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${routeData.origin.lat},${routeData.origin.lng}&destination=${routeData.destination.lat},${routeData.destination.lng}&travelmode=driving`;
      this.openGoogleMapsBtn.href = url;
      this.openGoogleMapsBtn.style.display = 'flex';
    }
  }

  /**
   * แสดงกล่องข้อความแจ้งเตือน (Toast Notification)
   */
  showToast(message, type = 'info') {
    if (!this.toastEl || !this.toastMessageEl) return;

    this.toastMessageEl.textContent = message;
    this.toastEl.className = `toast-alert show ${type}`;

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, 4500);
  }
}
