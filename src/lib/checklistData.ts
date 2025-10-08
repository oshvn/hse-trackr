// HSE Document Checklist Data
export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
}

export interface ChecklistCategory {
  id: string;
  title: string;
  description: string;
  appliesTo: string;
  format: string;
  items: ChecklistItem[];
}

export interface DocumentChecklist {
  [key: string]: ChecklistItem[];
}

export const HSE_CHECKLISTS: DocumentChecklist = {
  "1.1.1": [ // Management Teams
    { id: "1.1.1.1", label: "CMND/Hộ chiếu + Ảnh 3x4", required: true },
    { id: "1.1.1.2", label: "Sơ yếu lý lịch (CV)", required: true },
    { id: "1.1.1.3", label: "Quyết định bổ nhiệm hoặc hợp đồng lao động", required: true },
    { id: "1.1.1.4", label: "Bằng cấp chuyên môn (ĐH/CĐ hoặc chứng chỉ liên quan)", required: true },
    { id: "1.1.1.5", label: "Chứng chỉ huấn luyện an toàn vệ sinh lao động (đúng nhóm theo công việc)", required: true },
    { id: "1.1.1.6", label: "Giấy khám sức khỏe (trong 12 tháng gần nhất)", required: true },
    { id: "1.1.1.7", label: "Chứng chỉ sơ cấp cứu / PCCC (nếu được phân công)", required: false },
    { id: "1.1.1.8", label: "Biên bản phổ biến nội quy công trường & phiếu kiểm tra đầu vào", required: true },
    { id: "1.1.1.9", label: "Phiếu cấp phát PPE", required: true }
  ],
  "1.1.2": [ // Management Plan
    { id: "1.1.2.1", label: "HSE Plan (Health, Safety, Environment Plan)", required: true },
    { id: "1.1.2.2", label: "Construction H&S Plan", required: true },
    { id: "1.1.2.3", label: "Sơ đồ tổ chức HSE", required: true },
    { id: "1.1.2.4", label: "Ma trận đào tạo (Training Matrix)", required: true },
    { id: "1.1.2.5", label: "Danh mục luật định (Legal Register)", required: true },
    { id: "1.1.2.6", label: "Kế hoạch kiểm tra, đánh giá nội bộ (Inspection & Audit Schedule)", required: true }
  ],
  "1.1.3": [ // Equipments
    { id: "1.1.3.1", label: "Danh mục thiết bị thi công (Equipment List)", required: true },
    { id: "1.1.3.2", label: "Hồ sơ kiểm định kỹ thuật an toàn (Còn hiệu lực)", required: true },
    { id: "1.1.3.3", label: "Giấy phép/chứng chỉ người vận hành thiết bị", required: true },
    { id: "1.1.3.4", label: "Nhật ký kiểm tra & bảo dưỡng định kỳ", required: true },
    { id: "1.1.3.5", label: "Hình ảnh/biên bản kiểm tra hiện trường", required: true }
  ],
  "1.1.4.1": [ // Workers Regulation Documents
    { id: "1.1.4.1.1", label: "Sổ tay nội quy & quy định công trường", required: true },
    { id: "1.1.4.1.2", label: "Biên bản phổ biến nội quy có chữ ký người lao động", required: true }
  ],
  "1.1.4.2": [ // Attendees Signatures
    { id: "1.1.4.2.1", label: "Danh sách học viên tham gia huấn luyện (tên, chữ ký, ngày đào tạo)", required: true }
  ],
  "1.1.4.3": [ // Test
    { id: "1.1.4.3.1", label: "Bài kiểm tra sau huấn luyện (đề & kết quả)", required: true }
  ],
  "1.1.4.4": [ // Evidence Picture
    { id: "1.1.4.4.1", label: "Ảnh minh chứng thực tế (PPE, biển báo, rào chắn, khu vực làm việc an toàn)", required: true }
  ],
  "1.2": [ // Risk Assessment
    { id: "1.2.1", label: "Risk Assessment tổng thể (HIRA)", required: true },
    { id: "1.2.2", label: "Risk Register (liệt kê mối nguy, biện pháp kiểm soát)", required: true },
    { id: "1.2.3", label: "Phê duyệt của HSE Manager và Chủ đầu tư", required: true }
  ],
  "1.3": [ // JHA
    { id: "1.3.1", label: "JHA/JSA form có chữ ký nhóm thi công", required: true },
    { id: "1.3.2", label: "Mô tả công việc, mối nguy, biện pháp kiểm soát", required: true },
    { id: "1.3.3", label: "Hình ảnh minh họa hiện trường (nếu có)", required: false }
  ],
  "1.4": [ // Safe Method Statement
    { id: "1.4.1", label: "Biện pháp thi công an toàn (SMS)", required: true },
    { id: "1.4.2", label: "Sơ đồ bố trí hiện trường", required: true },
    { id: "1.4.3", label: "Tính toán tải trọng/nâng hạ (nếu có)", required: false },
    { id: "1.4.4", label: "Chữ ký phê duyệt của Project Manager & HSE Manager", required: true }
  ],
  "1.5.1": [ // ERP Training
    { id: "1.5.1.1", label: "Kế hoạch huấn luyện ứng phó khẩn cấp", required: true },
    { id: "1.5.1.2", label: "Danh sách học viên, người đào tạo, ngày tổ chức", required: true },
    { id: "1.5.1.3", label: "Biên bản xác nhận hoàn thành", required: true }
  ],
  "1.5.2": [ // Emergency Drills
    { id: "1.5.2.1", label: "Kịch bản diễn tập khẩn cấp", required: true },
    { id: "1.5.2.2", label: "Biên bản thực hiện & bài học rút kinh nghiệm", required: true },
    { id: "1.5.2.3", label: "Ảnh/video minh chứng", required: true }
  ],
  "1.5.3": [ // Emergency Equipment Check
    { id: "1.5.3.1", label: "Checklist kiểm tra bình chữa cháy, tủ sơ cứu, AED, trạm rửa mắt, v.v.", required: true },
    { id: "1.5.3.2", label: "Kết quả kiểm tra (tình trạng, hành động khắc phục nếu có)", required: true },
    { id: "1.5.3.3", label: "Ngày kiểm tra & người thực hiện", required: true }
  ]
};

export const MAJOR_CATEGORIES = [
  { value: "1.1", label: "1.1 Document Register" },
  { value: "1.2", label: "1.2 Risk Assessment" },
  { value: "1.3", label: "1.3 JHA" },
  { value: "1.4", label: "1.4 Safe Method Statement" },
  { value: "1.5", label: "1.5 Emergency Action Plan" }
];

export const DETAILED_CATEGORIES: ChecklistCategory[] = [
  {
    id: "1.1.1",
    title: "1.1.1 Management Teams",
    description: "Hồ sơ nhân sự quản lý",
    appliesTo: "Construction Manager, HSE Manager, Project Manager, Site Manager, Supervisors",
    format: "Mỗi người nộp 1 bộ, định dạng PDF/JPG",
    items: HSE_CHECKLISTS["1.1.1"]
  },
  {
    id: "1.1.1.1",
    title: "1.1.1.1 Construction Manager",
    description: "Hồ sơ Construction Manager",
    appliesTo: "Construction Manager",
    format: "Định dạng: PDF/JPG",
    items: HSE_CHECKLISTS["1.1.1"]
  },
  {
    id: "1.1.1.2",
    title: "1.1.1.2 HSE Manager",
    description: "Hồ sơ HSE Manager",
    appliesTo: "HSE Manager",
    format: "Định dạng: PDF/JPG",
    items: HSE_CHECKLISTS["1.1.1"]
  },
  {
    id: "1.1.1.3",
    title: "1.1.1.3 Project Manager",
    description: "Hồ sơ Project Manager",
    appliesTo: "Project Manager",
    format: "Định dạng: PDF/JPG",
    items: HSE_CHECKLISTS["1.1.1"]
  },
  {
    id: "1.1.1.4",
    title: "1.1.1.4 Site Manager",
    description: "Hồ sơ Site Manager",
    appliesTo: "Site Manager",
    format: "Định dạng: PDF/JPG",
    items: HSE_CHECKLISTS["1.1.1"]
  },
  {
    id: "1.1.1.5",
    title: "1.1.1.5 Supervisors",
    description: "Hồ sơ Supervisors",
    appliesTo: "Supervisors",
    format: "Định dạng: PDF/JPG",
    items: HSE_CHECKLISTS["1.1.1"]
  },
  {
    id: "1.1.2",
    title: "1.1.2 Management Plan",
    description: "Kế hoạch quản lý dự án",
    appliesTo: "toàn dự án",
    format: "Định dạng: PDF",
    items: HSE_CHECKLISTS["1.1.2"]
  },
  {
    id: "1.1.3",
    title: "1.1.3 Equipments",
    description: "Hồ sơ thiết bị thi công",
    appliesTo: "từng thiết bị thi công",
    format: "Định dạng: PDF/Excel",
    items: HSE_CHECKLISTS["1.1.3"]
  },
  {
    id: "1.1.4",
    title: "1.1.4 Internal Training & Workers",
    description: "Đào tạo nội bộ và hồ sơ người lao động",
    appliesTo: "toàn bộ nhân sự",
    format: "Định dạng: PDF/JPG",
    items: [
      ...HSE_CHECKLISTS["1.1.4.1"],
      ...HSE_CHECKLISTS["1.1.4.2"],
      ...HSE_CHECKLISTS["1.1.4.3"],
      ...HSE_CHECKLISTS["1.1.4.4"]
    ]
  },
  {
    id: "1.2",
    title: "1.2 Risk Assessment",
    description: "Đánh giá rủi ro",
    appliesTo: "toàn dự án và từng hoạt động",
    format: "Định dạng: PDF/Excel",
    items: HSE_CHECKLISTS["1.2"]
  },
  {
    id: "1.3",
    title: "1.3 JHA (Job Hazard Analysis)",
    description: "Phân tích mối nguy công việc",
    appliesTo: "từng công tác",
    format: "Định dạng: PDF",
    items: HSE_CHECKLISTS["1.3"]
  },
  {
    id: "1.4",
    title: "1.4 Safe Method Statement",
    description: "Biện pháp thi công an toàn",
    appliesTo: "các hoạt động rủi ro cao",
    format: "Định dạng: PDF",
    items: HSE_CHECKLISTS["1.4"]
  },
  {
    id: "1.5",
    title: "1.5 Emergency Action Plan",
    description: "Kế hoạch ứng phó khẩn cấp",
    appliesTo: "toàn dự án",
    format: "Định dạng: PDF",
    items: [
      ...HSE_CHECKLISTS["1.5.1"],
      ...HSE_CHECKLISTS["1.5.2"],
      ...HSE_CHECKLISTS["1.5.3"]
    ]
  }
];

export const SUB_CATEGORIES = {
  "1.1": [
    { id: "1.1.1", label: "1.1.1 Management Teams" },
    { id: "1.1.1.1", label: "1.1.1.1 Construction Manager" },
    { id: "1.1.1.2", label: "1.1.1.2 HSE Manager" },
    { id: "1.1.1.3", label: "1.1.1.3 Project Manager" },
    { id: "1.1.1.4", label: "1.1.1.4 Site Manager" },
    { id: "1.1.1.5", label: "1.1.1.5 Supervisors" },
    { id: "1.1.2", label: "1.1.2 Management Plan" },
    { id: "1.1.3", label: "1.1.3 Equipments" },
    { id: "1.1.4", label: "1.1.4 Internal Training & Workers" }
  ],
  "1.5": [
    { id: "1.5.1", label: "1.5.1 ERP Training" },
    { id: "1.5.2", label: "1.5.2 Emergency Drills" },
    { id: "1.5.3", label: "1.5.3 Emergency Equipment Check" }
  ]
};
