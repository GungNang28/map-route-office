/**
 * แปลงระยะทางจากเมตรเป็นข้อความภาษาไทย
 * @param {number} meters 
 * @returns {string} เช่น "4.2 กม." หรือ "850 ม."
 */
export const formatDistanceText = (meters) => {
  if (meters == null || isNaN(meters)) return 'ไม่ทราบระยะทาง';
  if (meters < 1000) {
    return `${Math.round(meters)} ม.`;
  }
  return `${(meters / 1000).toFixed(1)} กม.`;
};

/**
 * แปลงเวลาจากวินาทีเป็นข้อความภาษาไทย
 * @param {number} seconds 
 * @returns {string} เช่น "15 นาที" หรือ "1 ชม. 25 นาที"
 */
export const formatDurationText = (seconds) => {
  if (seconds == null || isNaN(seconds)) return 'ไม่ทราบเวลาเดินทาง';

  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 1) return 'น้อยกว่า 1 นาที';

  if (totalMinutes < 60) {
    return `${totalMinutes} นาที`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} ชม.`;
  }
  return `${hours} ชม. ${remainingMinutes} นาที`;
};
