// HSE Document Checklist Data
export interface ChecklistItem {
  id: string;
  label: string;
  category?: string;
}

export interface DocumentChecklist {
  [key: string]: ChecklistItem[];
}

export const HSE_CHECKLISTS: DocumentChecklist = {
  "1.1.1": [ // Management Teams
    { id: "1.1.1.1", label: "CMND/Hộ chiếu + Ảnh 3x4" },
    { id: "1.1.1.2", label: "Sơ yếu lý lịch (CV)" },
    { id: "1.1.1.3", label: "Quyết định bổ nhiệm hoặc hợp đồng lao động" },
    { id: "1.1.1.4", label: "Bằng cấp chuyên môn (ĐH/CĐ hoặc chứng chỉ liên quan)" },
    { id: "1.1.1.5", label: "Chứng chỉ huấn luyện an toàn vệ sinh lao động (đúng nhóm theo công việc)" },
    { id: "1.1.1.6", label: "Giấy khám sức khỏe (trong 12 tháng gần nhất)" },
    { id: "1.1.1.7", label: "Chứng chỉ sơ cấp cứu / PCCC (nếu được phân công)" },
    { id: "1.1.1.8", label: "Biên bản phổ biến nội quy công trường & phiếu kiểm tra đầu vào" },
    { id: "1.1.1.9", label: "Phiếu cấp phát PPE" }
  ],
  "1.1.2": [ // Management Plan
    { id: "1.1.2.1", label: "HSE Plan (Health, Safety, Environment Plan)" },
    { id: "1.1.2.2", label: "Construction H&S Plan" },
    { id: "1.1.2.3", label: "Sơ đồ tổ chức HSE" },
    { id: "1.1.2.4", label: "Ma trận đào tạo (Training Matrix)" },
    { id: "1.1.2.5", label: "Danh mục luật định (Legal Register)" },
    { id: "1.1.2.6", label: "Kế hoạch kiểm tra, đánh giá nội bộ (Inspection & Audit Schedule)" }
  ],
  "1.1.3": [ // Equipments
    { id: "1.1.3.1", label: "Danh mục thiết bị thi công (Equipment List)" },
    { id: "1.1.3.2", label: "Hồ sơ kiểm định kỹ thuật an toàn (Còn hiệu lực)" },
    { id: "1.1.3.3", label: "Giấy phép/chứng chỉ người vận hành thiết bị" },
    { id: "1.1.3.4", label: "Nhật ký kiểm tra & bảo dưỡng định kỳ" },
    { id: "1.1.3.5", label: "Hình ảnh/biên bản kiểm tra hiện trường" }
  ],
  "1.1.4.1": [ // Workers Regulation Documents
    { id: "1.1.4.1.1", label: "Sổ tay nội quy & quy định công trường" },
    { id: "1.1.4.1.2", label: "Biên bản phổ biến nội quy có chữ ký người lao động" }
  ],
  "1.1.4.2": [ // Attendees Signatures
    { id: "1.1.4.2.1", label: "Danh sách học viên tham gia huấn luyện (tên, chữ ký, ngày đào tạo)" }
  ],
  "1.1.4.3": [ // Test
    { id: "1.1.4.3.1", label: "Bài kiểm tra sau huấn luyện (đề & kết quả)" }
  ],
  "1.1.4.4": [ // Evidence Picture
    { id: "1.1.4.4.1", label: "Ảnh minh chứng thực tế (PPE, biển báo, rào chắn, khu vực làm việc an toàn)" }
  ],
  "1.2": [ // Risk Assessment
    { id: "1.2.1", label: "Risk Assessment tổng thể (HIRA)" },
    { id: "1.2.2", label: "Risk Register (liệt kê mối nguy, biện pháp kiểm soát)" },
    { id: "1.2.3", label: "Phê duyệt của HSE Manager và Chủ đầu tư" }
  ],
  "1.3": [ // JHA
    { id: "1.3.1", label: "JHA/JSA form có chữ ký nhóm thi công" },
    { id: "1.3.2", label: "Mô tả công việc, mối nguy, biện pháp kiểm soát" },
    { id: "1.3.3", label: "Hình ảnh minh họa hiện trường (nếu có)" }
  ],
  "1.4": [ // Safe Method Statement
    { id: "1.4.1", label: "Biện pháp thi công an toàn (SMS)" },
    { id: "1.4.2", label: "Sơ đồ bố trí hiện trường" },
    { id: "1.4.3", label: "Tính toán tải trọng/nâng hạ (nếu có)" },
    { id: "1.4.4", label: "Chữ ký phê duyệt của Project Manager & HSE Manager" }
  ],
  "1.5.1": [ // ERP Training
    { id: "1.5.1.1", label: "Kế hoạch huấn luyện ứng phó khẩn cấp" },
    { id: "1.5.1.2", label: "Danh sách học viên, người đào tạo, ngày tổ chức" },
    { id: "1.5.1.3", label: "Biên bản xác nhận hoàn thành" }
  ],
  "1.5.2": [ // Emergency Drills
    { id: "1.5.2.1", label: "Kịch bản diễn tập khẩn cấp" },
    { id: "1.5.2.2", label: "Biên bản thực hiện & bài học rút kinh nghiệm" },
    { id: "1.5.2.3", label: "Ảnh/video minh chứng" }
  ],
  "1.5.3": [ // Emergency Equipment Check
    { id: "1.5.3.1", label: "Checklist kiểm tra bình chữa cháy, tủ sơ cứu, AED, trạm rửa mắt, v.v." },
    { id: "1.5.3.2", label: "Kết quả kiểm tra (tình trạng, hành động khắc phục nếu có)" },
    { id: "1.5.3.3", label: "Ngày kiểm tra & người thực hiện" }
  ]
};

export const MAJOR_CATEGORIES = [
  { value: "1.1", label: "1.1 Document Register" },
  { value: "1.2", label: "1.2 Risk Assessment" },
  { value: "1.3", label: "1.3 JHA" },
  { value: "1.4", label: "1.4 Safe Method Statement" },
  { value: "1.5", label: "1.5 Emergency Action Plan" }
];
