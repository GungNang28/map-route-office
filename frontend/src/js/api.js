import { config } from './config.js';

/**
 * REST API Client for communicating with Backend
 */
export class RouteApiClient {
  /**
   * ดึงข้อมูลการตั้งค่าเริ่มต้นและ API Key จาก Backend
   * @returns {Promise<Object>}
   */
  static async fetchConfig() {
    try {
      const response = await fetch(`${config.apiBaseUrl}/routes/config`);
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'ไม่สามารถดึงข้อมูลการตั้งค่าจากเซิร์ฟเวอร์ได้');
      }
      return result.data;
    } catch (error) {
      console.error('Fetch Config Error:', error);
      throw error;
    }
  }

  /**
   * ส่งพิกัดผู้ใช้ไปขอข้อมูลเส้นทาง ระยะทาง และระยะเวลาเดินทางจาก Backend
   * @param {number} userLat ละติจูดของผู้ใช้
   * @param {number} userLng ลองจิจูดของผู้ใช้
   * @returns {Promise<Object>} ข้อมูลเส้นทางจาก Backend
   */
  static async fetchRouteToOffice(userLat, userLng) {
    try {
      const response = await fetch(`${config.apiBaseUrl}/routes/to-office`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userLat,
          userLng
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'เกิดข้อผิดพลาดในการดึงข้อมูลเส้นทาง');
      }

      return result.data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }
}
