import express from 'express';
import cors from 'cors';
import { envConfig } from './config/env.config.js';
import routeRoutes from './routes/route.routes.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';

const app = express();

// Middleware การจัดการ CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // อนุญาตคำขอที่ไม่มี Origin (เช่น mobile apps หรือ curl) หรือตรงกับ Whitelist
      if (!origin || envConfig.corsOrigins.includes(origin) || envConfig.corsOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(null, true); // ในสภาพแวดล้อมพัฒนา ยอมรับทุก Origin เพื่อความสะดวก
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body Parser สำหรับ JSON
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'map-route-office-backend'
  });
});

// กำหนดเส้นทาง API หลัก
app.use('/api/routes', routeRoutes);

// จัดการ 404 Not Found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `ไม่พบ Endpoint: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// เริ่มต้นรันเซิร์ฟเวอร์
const PORT = envConfig.port;
app.listen(PORT, () => {
  console.log('==============================================');
  console.log(`🚀 Backend Server กำลังทำงานที่ port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📍 Route API:    http://localhost:${PORT}/api/routes/to-office`);
  console.log('==============================================');
});
