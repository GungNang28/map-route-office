/**
 * Global Frontend Configuration
 */
export const config = {
  // URL ของ Backend REST API
  apiBaseUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api',

  // พิกัดเริ่มต้น (กรณียังไม่ได้รับอนุญาตหรือกำลังรอตำแหน่ง: อนุสาวรีย์ชัยสมรภูมิ)
  defaultLocation: {
    lat: 13.7649,
    lng: 100.5383
  }
};
