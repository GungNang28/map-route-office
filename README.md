# Map Route to Office (Web Application)

เว็บแอปพลิเคชันสำหรับคำนวณและแสดงเส้นทางจากตำแหน่งปัจจุบันของผู้ใช้งานไปยังตำแหน่งของบริษัทแบบเรียลไทม์ พร้อมการคำนวณระยะทางและระยะเวลาเดินทางโดยอ้างอิงสภาพการจราจรในปัจจุบัน

---

## 🌟 คุณสมบัติเด่น (Features)

- **Frontend**:
  - ดึงตำแหน่งปัจจุบันของผู้ใช้ผ่าน HTML5 Geolocation API
  - ปักหมุดตำแหน่งผู้ใช้งาน (Current Location) และตำแหน่งบริษัท (Office Location)
  - วาดเส้นทาง (Route Polyline) จากผู้ใช้งานไปยังบริษัท
  - แสดงการ์ดสรุปผล: ระยะทาง (Distance) และระยะเวลาเดินทาง (Duration) ที่อิงสภาพการจราจรแบบเรียลไทม์
  - ดีไซน์ทันสมัยแบบ Glassmorphism Responsive รองรับทุกขนาดหน้าจอ
  - **Zero Key Exposure**: ไม่มีการเปิดเผย Google API Key ไปยังฝั่งหน้าบ้านอย่างเด็ดขาด

- **Backend**:
  - RESTful API สร้างด้วย Node.js & Express
  - จัดการเรียก Google Routes API (`v2:computeRoutes`) พร้อมระบบคำนวณการจราจร `TRAFFIC_AWARE` และ `departureTime="now"`
  - ระบบตรวจสอบความถูกต้องของพิกัดละติจูด-ลองจิจูด (Validation Middleware)
  - จัดเก็บ API Key และการตั้งค่าอย่างปลอดภัยผ่าน `.env`

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
map-route-office/
├── .gitignore                      # ป้องกันการ commit ไฟล์ .env, node_modules และไฟล์ส่วนตัว
├── README.md                       # คู่มือการใช้งานโปรเจกต์
│
├── backend/                        # REST API Server (Node.js & Express)
│   ├── .env.example                # ตัวอย่างการตั้งค่า Environment Variables
│   ├── .env                        # เก็บ Google API Key (ห้าม Commit)
│   ├── package.json
│   └── src/
│       ├── config/
│       │   ├── env.config.js       # จัดการ Environment Variables
│       │   └── office.config.js    # กำหนดพิกัดและข้อมูลของบริษัท
│       ├── controllers/
│       │   └── route.controller.js # จัดการ Request และ Response
│       ├── services/
│       │   └── googleMaps.service.js # เชื่อมต่อ Google Routes API
│       ├── routes/
│       │   └── route.routes.js     # กำหนดเส้นทาง REST API
│       ├── middlewares/
│       │   ├── errorHandler.middleware.js # จัดการ Error รวม
│       │   └── validator.middleware.js    # ตรวจสอบพิกัด Lat/Lng
│       ├── utils/
│       │   └── formatters.util.js  # จัดรูปแบบระยะทางและเวลา
│       └── server.js               # Entry Point ของ Backend Server
│
└── frontend/                       # Client UI
    ├── index.html                  # โครงสร้างหน้าเว็บหลัก
    ├── package.json
    ├── public/                     # ไฟล์ Static เช่น Favicon และ Icons
    └── src/
        ├── css/
        │   ├── variables.css       # โทนสี ฟอนต์ และ Design Tokens
        │   └── style.css           # สไตล์หลัก ดีไซน์ทันสมัยแบบ Glassmorphism
        └── js/
            ├── config.js           # การตั้งค่า API Base URL
            ├── geolocation.js      # ดึงพิกัดปัจจุบันจาก Browser
            ├── api.js              # ติดต่อสื่อสารกับ Backend REST API
            ├── map.js              # ควบคุมการเรนเดอร์แผนที่และเส้นทาง
            ├── ui.js               # อัปเดต UI และข้อมูลสรุปบนหน้าจอ
            └── main.js             # ควบคุม Flow การทำงานหลัก
```

---

## 🚀 วิธีการติดตั้งและรันโปรเจกต์ (Getting Started)

### 1. ติดตั้งและรัน Backend

1. เข้าไปที่โฟลเดอร์ `backend`:
   ```bash
   cd backend
   ```
2. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```
3. คัดลอกไฟล์ `.env.example` ไปเป็น `.env`:
   ```bash
   cp .env.example .env
   ```
4. เปิดไฟล์ `.env` แล้วระบุค่า `GOOGLE_MAPS_API_KEY` และพิกัดของบริษัท
5. สตาร์ท Backend Server:
   ```bash
   npm run dev
   # เซิร์ฟเวอร์จะรันที่ http://localhost:5000
   ```

### 2. ติดตั้งและรัน Frontend

1. เข้าไปที่โฟลเดอร์ `frontend`:
   ```bash
   cd frontend
   ```
2. ติดตั้ง Dependencies (สำหรับ Dev Server):
   ```bash
   npm install
   ```
3. สตาร์ท Frontend Dev Server:
   ```bash
   npm run dev
   # เว็บแอปพลิเคชันจะเปิดที่ http://localhost:5173 หรือเปิด index.html ผ่าน Live Server
   ```

---

## 🔒 ข้อกำหนดด้านความปลอดภัย (Security Rules)

- **ห้าม Commit `.env`**: ไฟล์ `.env` ถูกตั้งค่าใน `.gitignore` เรียบร้อยแล้ว
- **Google API Key อยู่เฉพาะใน Backend**: ฝั่ง Frontend จะสื่อสารกับ Backend ผ่าน `/api/routes/to-office` เท่านั้น โดยไม่เคยเห็นหรือได้รับ API Key ของ Google เลย
