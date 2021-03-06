import * as React from "react";

export const Disclaimer = ({ className }) =>(
  <div className={`disclaimer-th ${className || ""}`}>
    <div>
      {" "}
      <h4>บริการนี้เป็นการสมัครแบบสมาชิกรายวัน โดยระบบจะส่ง URL ให้ทาง SMS วันละ 1 SMS กรุณาเชื่อมต่อ GPRS/3G เพื่อทำการดาวน์โหลด
สมัครบริการพิมพ์ A2 ส่งมาที่ 4541311 ยกเลิกพิมพ์ STOP A2 ส่งมาที่ 4541311 สอบถามโทร : 02 -1158814, 9.00 - 18.00 (จันทร์ - ศุกร์)
บริการนี้สำหรับอินเตอร์เนทมือถือเท่านั้น</h4>
    </div>
    
  </div>
);