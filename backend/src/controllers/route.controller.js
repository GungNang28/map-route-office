import { calculateRouteToOffice } from '../services/googleMaps.service.js';
import { envConfig } from '../config/env.config.js';
import { officeConfig } from '../config/office.config.js';

/**
 * Controller สำหรับดึงข้อมูลการตั้งค่าแผนที่และพิกัดเริ่มต้น
 * GET /api/routes/config
 */
export const getMapConfig = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        googleMapsApiKey: envConfig.googleMapsApiKey,
        office: officeConfig
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller สำหรับดึงข้อมูลเส้นทางจากตำแหน่งผู้ใช้ไปยังบริษัท
 * POST /api/routes/to-office
 */
export const getRouteToOffice = async (req, res, next) => {
  try {
    const { userLat, userLng } = req.validCoordinates;

    const routeData = await calculateRouteToOffice(userLat, userLng);

    return res.status(200).json({
      success: true,
      data: routeData
    });
  } catch (error) {
    next(error);
  }
};
