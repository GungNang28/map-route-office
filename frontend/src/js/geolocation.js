/**
 * Geolocation Service Module
 * จัดการการขอสิทธิ์และดึงพิกัดปัจจุบันจากเบราว์เซอร์
 */

export class GeolocationService {
  /**
   * ขอพิกัดปัจจุบันของผู้ใช้งาน
   * @param {PositionOptions} options
   * @returns {Promise<{lat: number, lng: number, accuracy: number}>}
   */
  static getCurrentLocation(options = {}) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง (Geolocation is not supported)'));
      }

      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
        ...options
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          let message = 'ไม่สามารถระบุตำแหน่งได้';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'ผู้ใช้ปฏิเสธการเข้าถึงตำแหน่ง กรุณาอนุญาตการเข้าถึงพิกัดในเบราว์เซอร์';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'ข้อมูลตำแหน่งไม่พร้อมใช้งานในขณะนี้';
              break;
            case error.TIMEOUT:
              message = 'หมดเวลาในการร้องขอข้อมูลตำแหน่ง';
              break;
          }
          reject(new Error(message));
        },
        defaultOptions
      );
    });
  }
}
