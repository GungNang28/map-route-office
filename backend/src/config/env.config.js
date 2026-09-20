import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// โหลดตัวแปรจากไฟล์ .env (ที่อยู่ในโฟลเดอร์ backend/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const envConfig = {
  port: process.env.PORT || 5000,
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  corsOrigins: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) 
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5500']
};

// ตรวจสอบความพร้อมของ Google API Key
if (!envConfig.googleMapsApiKey) {
  console.warn(
    '⚠️ [Config Warning]: GOOGLE_MAPS_API_KEY ยังไม่ได้ถูกระบุในไฟล์ .env (ระบบจะเปิดใช้งาน Fallback Simulation Mode สำหรับการทดสอบ)'
  );
}
