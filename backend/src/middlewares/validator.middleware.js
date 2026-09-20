/**
 * Middleware สำหรับตรวจสอบความถูกต้องของพิกัด Latitude และ Longitude
 */
export const validateCoordinates = (req, res, next) => {
  const { userLat, userLng } = req.body;

  if (userLat === undefined || userLng === undefined) {
    return res.status(400).json({
      success: false,
      error: 'กรุณาระบุพิกัด userLat และ userLng ใน Request Body'
    });
  }

  const lat = parseFloat(userLat);
  const lng = parseFloat(userLng);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({
      success: false,
      error: 'พิกัด userLat และ userLng ต้องเป็นตัวเลข (Number) เท่านั้น'
    });
  }

  if (lat < -90 || lat > 90) {
    return res.status(400).json({
      success: false,
      error: 'พิกัด userLat (ละติจูด) ต้องอยู่ระหว่าง -90 ถึง 90 องศา'
    });
  }

  if (lng < -180 || lng > 180) {
    return res.status(400).json({
      success: false,
      error: 'พิกัด userLng (ลองจิจูด) ต้องอยู่ระหว่าง -180 ถึง 180 องศา'
    });
  }

  // ส่งค่าพิกัดที่แปลงเป็น Float แล้วเข้าสู่ req.validCoordinates
  req.validCoordinates = { userLat: lat, userLng: lng };
  next();
};
