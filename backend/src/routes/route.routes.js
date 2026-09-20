import { Router } from 'express';
import { getRouteToOffice, getMapConfig } from '../controllers/route.controller.js';
import { validateCoordinates } from '../middlewares/validator.middleware.js';

const router = Router();

/**
 * @route   GET /api/routes/config
 * @desc    ดึงข้อมูลการตั้งค่าเริ่มต้นและพิกัดบริษัท
 */
router.get('/config', getMapConfig);

/**
 * @route   POST /api/routes/to-office
 * @desc    คำนวณและดึงข้อมูลเส้นทางจากพิกัดผู้ใช้ไปยังบริษัท
 * @access  Public
 */
router.post('/to-office', validateCoordinates, getRouteToOffice);

export default router;
