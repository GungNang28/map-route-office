import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const officeConfig = {
  name: process.env.OFFICE_NAME || 'สำนักงานใหญ่ SCG (บริษัท ปูนซิเมนต์ไทย จำกัด (มหาชน))',
  // พิกัดสำนักงานใหญ่ SCG บางซื่อ: 13.806490, 100.538290
  latitude: parseFloat(process.env.OFFICE_LAT) || 13.806490,
  longitude: parseFloat(process.env.OFFICE_LNG) || 100.538290
};
