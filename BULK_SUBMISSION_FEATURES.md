# Tính Năng Quy Trình Nộp Hồ Sơ Phân Cấp

## 📋 Tổng Quan

Hệ thống cung cấp một quy trình nộp hồ sơ **hiện đại, trực quan, và dễ sử dụng** với 3 bước chính.

---

## 🎯 3 Bước Chính

### **Bước 1️⃣ - Chọn Danh Mục**

**Tính năng:**
- 📍 **Breadcrumb Navigation:** Theo dõi đường dẫn hiện tại (VD: HSE > 1.1 > 1.1.1)
- 🗂️ **Danh Mục Phân Cấp:** Hỗ trợ tối đa 4 cấp:
  - Cấp 1: Danh mục chính (VD: 1.1 Document Register)
  - Cấp 2: Danh mục con (VD: 1.1.1 Management Teams)
  - Cấp 3: Danh mục chi tiết (VD: 1.1.1.1 Construction Manager)
  - Cấp 4: Danh mục lá (nếu có)

- 🃏 **Card Grid Display:** Hiển thị các danh mục dạng card dễ nhìn
- ↔️ **Navigation:** 
  - Nhấp vào danh mục có con → Mở danh mục con
  - Nhấp vào danh mục lá → Tiến sang bước 2
  - Nút "Quay lại" → Quay lại danh mục cha

**Ví dụ Luồng:**
```
Bước 1: Chọn "1.1 Document Register" → Xem 4 danh mục con
Bước 2: Chọn "1.1.1 Management Teams" → Xem 5 danh mục con (roles)
Bước 3: Chọn "1.1.1.1 Construction Manager" (lá) → Chuyển sang Bước 2
```

---

### **Bước 2️⃣ - Kiểm Tra Danh Sách Tài Liệu**

**Tính năng:**
- 📊 **Progress Bar:** Hiển thị phần trăm tài liệu đã chọn
- ✅ **Danh Sách Checkbox:** 
  - Các tài liệu bắt buộc được đánh dấu 🟢 (Required)
  - Các tài liệu tùy chọn được đánh dấu 🟡 (Optional)
- 🎯 **Xác Thực Tài Liệu:**
  - ❌ Không thể tiến tục nếu tài liệu bắt buộc chưa được chọn
  - Alert hiển thị danh sách các tài liệu bắt buộc còn thiếu
- 📎 **Link Validation:**
  - URL phải hợp lệ (bắt đầu với `http://` hoặc `https://`)
  - Real-time validation với thông báo lỗi/thành công
- 🔗 **Single Link Per Category:**
  - Nhập link duy nhất chứa tất cả tài liệu (Google Drive, OneDrive, v.v.)
  - Đảm bảo link đã được chia sẻ

**Ví dụ:**
```
Danh sách tài liệu cho "Construction Manager":
✅ ✓ CMND/Hộ chiếu + Ảnh 3x4 (Bắt buộc)
✅ ✓ Sơ yếu lý lịch (CV) (Bắt buộc)
⭕ ☐ Chứng chỉ sơ cấp cứu (Tùy chọn)
...
Link: https://drive.google.com/... ✓

Tiến độ: 8/9 tài liệu → Có thể tiếp tục
```

---

### **Bước 3️⃣ - Xác Nhận và Nộp**

**Tính năng:**
- 📝 **Tóm Tắt Thông Tin:**
  - Danh mục được chọn
  - Số lượng tài liệu
  - Progress bar
  - Link hồ sơ
- 💬 **Form Ghi Chú (Tùy chọn):**
  - Cho phép nhập ghi chú cho quản trị viên
  - Hạn chế 1000 ký tự
  - Ví dụ: "Một số tài liệu vẫn đang chuẩn bị"
- ⚠️ **Lưu Ý Quan Trọng:**
  - Hồ sơ chuyển sang trạng thái "Đang xử lý"
  - Nhận thông báo khi quản trị viên xem xét
  - Đảm bảo link chia sẻ đang hoạt động
- 🔐 **Modal Xác Nhận:**
  - Hiển thị lại tóm tắt trước khi gửi
  - Hỏi xác nhận: "Bạn chắc chắn muốn nộp hồ sơ này?"
  - Hành động này không thể hoàn tác

**Ví dụ Modal:**
```
Xác Nhận Nộp Hồ Sơ
━━━━━━━━━━━━━━━━━━

Danh mục: 1.1.1.1 Construction Manager
─────────────────────────────────────
Tài liệu: 8 tài liệu

Ghi chú: Đã chuẩn bị tất cả tài liệu

[Hủy] [Xác nhận nộp]
```

---

## 🎨 Giao Diện Đặc Điểm

### **Breadcrumb Navigation**
```
Path: HSE > 1.1 > 1.1.1
```

### **Card Grid**
```
┌─────────────────────┬─────────────────────┐
│ 📁 1.1.1            │ 📁 1.1.2            │
│ Management Teams    │ Management Plan     │
│ 5 danh mục con      │ Danh mục cuối       │
│ ├─ 1.1.1.1          │                     │
│ ├─ 1.1.1.2          │                     │
│ └─ ...              │                     │
└─────────────────────┴─────────────────────┘
```

### **Progress Visualization**
```
Tiến độ kiểm tra
████████░░ 80%

Đã chọn: 8/10 tài liệu
[Chọn tất cả]
```

---

## 🔄 Luồng Xử Lý Chi Tiết

### **Khi Chọn Danh Mục:**
```javascript
1. User click danh mục
2. Kiểm tra: Có con hay là lá?
3. Nếu có con → Thêm vào navigationPath
4. Nếu là lá → Lưu selectedCategory + Chuyển sang Bước 2
```

### **Khi Nộp Hồ Sơ:**
```javascript
1. Validate: Tất cả tài liệu bắt buộc được chọn?
2. Validate: Link hợp lệ?
3. Tìm doc_type_id từ database dựa trên docTypeId
4. Tạo submission record:
   {
     contractor_id: "...",
     doc_type_id: "uuid-từ-db",
     status: "submitted",
     submitted_at: "now()",
     cnt: 8,
     note: "Tóm tắt + ghi chú"
   }
5. Reset form → Quay về My Submissions
```

---

## 🛡️ Xác Thực Dữ Liệu

### **Bước 1:**
- ✅ Danh mục phải tồn tại trong CATEGORY_HIERARCHY

### **Bước 2:**
- ✅ Tất cả tài liệu bắt buộc phải được chọn
- ✅ Link phải là URL hợp lệ
- ✅ Ít nhất 1 tài liệu phải được chọn

### **Bước 3:**
- ✅ docTypeId phải có trong doc_types table
- ✅ contractor_id phải hợp lệ
- ✅ Ghi chú không vượt quá 1000 ký tự

---

## 📱 Responsive Design

- **Desktop:** Grid 2 cột cho danh mục
- **Tablet:** Grid 1-2 cột
- **Mobile:** Grid 1 cột, giao diện thu gọn

---

## 🚀 Tính Năng Nâng Cao

### **Admin Mode:**
- Admin có thể chọn nhà thầu để nộp hồ sơ thay cho họ
- Dropdown "Chọn nhà thầu" trên trang bulk-submission

### **Sidebar Integration:**
- Mục "New Submission" xuất hiện trong sidebar
- Link tới `/bulk-submission`
- Cho cả contractor và admin

### **Nút Nhanh:**
- Nút "+ Nộp hồ sơ mới" trên trang My Submissions
- Điều hướng nhanh tới `/bulk-submission`

---

## 📊 Dữ Liệu Được Lưu

Mỗi submission được lưu với:
```javascript
{
  contractor_id,     // UUID
  doc_type_id,       // UUID từ database
  status,            // "submitted"
  submitted_at,      // ISO timestamp
  cnt,               // Số tài liệu (int)
  note,              // Tóm tắt danh mục + ghi chú (text)
  created_at         // Tự động (now())
}
```

---

## 🎯 Lợi Ích

✅ **Dễ Sử Dụng:** Giao diện trực quan, từng bước rõ ràng  
✅ **Phân Cấp Mạnh:** Hỗ trợ danh mục lồng nhau tới 4 cấp  
✅ **Xác Thực Chặt:** Kiểm tra tài liệu bắt buộc, link hợp lệ  
✅ **Responsive:** Hoạt động tốt trên mọi thiết bị  
✅ **Tiếng Việt:** Hoàn toàn bằng tiếng Việt  
✅ **Progress Tracking:** Thấy rõ tiến độ, không bị lúng túng  
✅ **Modal Xác Nhận:** Tránh nộp hồ sơ nhầm lẫn  

---

## 🔗 File Cài Đặt

| File | Mô Tả |
|------|-------|
| `CategoryNavigationStep.tsx` | Chọn danh mục phân cấp |
| `DocumentChecklistStep.tsx` | Kiểm tra danh sách tài liệu |
| `SubmissionFormStep.tsx` | Xác nhận và nộp |
| `BulkSubmissionFlow.tsx` | Kết hợp 3 bước chính |
| `checklistData.ts` | Cấu trúc danh mục |
| `bulk-submission.tsx` | Page wrapper |
| `App.tsx` | Route `/bulk-submission` |
| `Sidebar.tsx` | Navigation menu |
