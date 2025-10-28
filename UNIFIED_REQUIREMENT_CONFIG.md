# 🎯 Cấu Hình Yêu Cầu Nộp Hồ Sơ - Hệ Thống Thống Nhất

## 📋 Tổng Quan

**Cấu Hình Yêu Cầu Nộp Hồ Sơ** là một tab mới thống nhất 3 chức năng cũ thành **1 giao diện duy nhất**:

| Tính Năng | Trước (3 Tab) | Hiện Tại (1 Tab) |
|-----------|--------------|-----------------|
| **Quản lý loại tài liệu** | Tab 1 (Loại tài liệu) | ✅ Gộp vào |
| **Setup checklist items** | Tab 3 (Yêu cầu Checklist) | ✅ Gộp vào |
| **Yêu cầu từng nhà thầu** | Tab 2 (Yêu cầu theo NCC) | ✅ Gộp vào |

---

## 🎨 Giao Diện Mới

### Layout Hierarchical

```
┌─────────────────────────────────────────────┐
│  Cấu Hình Yêu Cầu Nộp Hồ Sơ (NEW)          │
│  Tất cả trong 1 chỗ 🚀                       │
└─────────────────────────────────────────────┘

┌─ Hướng Dẫn Sử Dụng ─────────────────────────┐
│ 📋 Bước 1: Mở rộng loại tài liệu             │
│ 📋 Bước 2: Khởi tạo Checklist (nếu chưa)    │
│ 📋 Bước 3: Toggle item bắt buộc             │
│ 📋 Bước 4: Set yêu cầu từng nhà thầu        │
│ ✅ Xong! Nhà thầu sẽ thấy ngay               │
└─────────────────────────────────────────────┘

┌─ Danh Sách Loại Tài Liệu (Expandable) ─────┐
│                                              │
│ ▼ 1.1.1.1 Construction Manager             │
│   ├─ ✅ Checklist Items              2/9   │
│   │  ├─ [o] ID Card                 [Bắt buộc]
│   │  ├─ [o] CV                      [Bắt buộc]
│   │  └─ [o] Certificate              [Tùy chọn]
│   │                                          │
│   └─ 👥 Yêu Cầu Từng Nhà Thầu              │
│      ├─ Nhà Thầu A: 5 (Hạn: 2025-12-31)   │
│      └─ Nhà Thầu B: 3 (Hạn: 2026-01-15)   │
│                                              │
│ ▶ 1.1.1.2 HSE Manager                      │
│ ▶ 1.1.2 Management Plan                    │
│                                              │
└─────────────────────────────────────────────┘

┌─ Thêm Loại Tài Liệu Mới ───────────────────┐
│ Tên*: [_____________] Nhóm*: [_____________] │
│ Tên TL: [_____________] Critical: [toggle] │
└─────────────────────────────────────────────┘
```

---

## 🚀 Cách Sử Dụng (Step-by-Step)

### **Bước 1: Truy cập Admin Settings**
```
Dashboard → Admin (👤) → Settings → "Cấu Hình Yêu Cầu (Mới)" Tab
```

### **Bước 2: Mở Rộng Loại Tài Liệu**
```
Click vào bất kỳ loại tài liệu nào (VD: "1.1.1.1 Construction Manager")
→ Sẽ hiện 2 section:
   - ✅ Checklist Items
   - 👥 Yêu Cầu Từng Nhà Thầu
```

### **Bước 3: Khởi Tạo Checklist (lần đầu)**
```
Nếu chưa setup:
   Click nút "Khởi Tạo Checklist"
   → Hệ thống sẽ load danh sách item từ HSE_CHECKLISTS
   → Insert vào database tự động
   → Show "Đã thêm X mục checklist"

Nếu đã setup:
   Checklist items sẽ hiển thị ngay với toggle
```

### **Bước 4: Đánh Dấu Item Bắt Buộc**
```
Cho mỗi item trong Checklist Items:
   [o] = Toggle switch (mở/tắt)
   
   Bật (on)  = "Bắt buộc"  (Badge xanh)
                → Nhà thầu phải nộp item này
   
   Tắt (off) = "Tùy chọn"  (Badge xám)
                → Nhà thầu có thể bỏ qua

   Toggle 1 lần = Auto save (không cần nút Lưu)
```

### **Bước 5: Set Yêu Cầu Từng Nhà Thầu**
```
Section "👥 Yêu Cầu Từng Nhà Thầu":

Cho mỗi nhà thầu:
   ┌──────────────────────────────┐
   │ Nhà Thầu A                   │
   ├──────────────────────────────┤
   │ Số lượng yêu cầu:  [5 _ ]   │
   │ Hạn hoàn thành:    [2025-12-31] │
   │ [Lưu]                        │
   └──────────────────────────────┘

Nhập:
   - Số lượng: Bao nhiêu document cần nộp
   - Hạn: Ngày deadline cuối cùng
   - Click "Lưu" → Auto update DB
```

### **Bước 6: Hoàn Thành**
```
✅ Setup xong!

Hiệu quả:
   → Nhà thầu sẽ thấy:
     - Đúng items bắt buộc trong checklist
     - Đúng số lượng cần nộp
     - Đúng hạn deadline
   
   → Khi nộp hồ sơ:
     - System auto validate checklist
     - Chặn nộp nếu thiếu item bắt buộc
```

---

## 💾 Dữ Liệu Được Lưu

### **Bảng document_types**
```sql
{
  id: UUID,
  name: "1.1.1.1 Construction Manager",
  document_name: "MT_CM",
  category: "Management Teams",
  is_critical: false
}
```

### **Bảng checklist_requirements**
```sql
{
  id: UUID,
  doc_type_id: UUID,           -- Ref document_types
  checklist_item_id: "1.1.1.1",
  checklist_label: "ID Card",
  is_required: true,           -- Toggle này
  position: 0
}
```

### **Bảng contractor_requirements**
```sql
{
  id: UUID,
  doc_type_id: UUID,           -- Ref document_types
  contractor_id: UUID,         -- Ref contractors
  required_count: 5,           -- Nhập này
  planned_due_date: "2025-12-31" -- Nhập này
}
```

---

## 🔗 Kết Nối Với Nhà Thầu (Frontend)

### **Khi nhà thầu nộp hồ sơ:**

```typescript
// 1. Lấy yêu cầu cho doc_type
const docTypeId = selectedCategory.docTypeId;

// 2. Fetch checklist requirements từ DB
const { data: checklistItems } = supabase
  .from('checklist_requirements')
  .select('*')
  .eq('doc_type_id', docTypeId)
  .eq('is_required', true);  // ← Chỉ lấy bắt buộc

// 3. Fetch contractor requirements
const { data: contractorReq } = supabase
  .from('contractor_requirements')
  .select('required_count')
  .eq('doc_type_id', docTypeId)
  .eq('contractor_id', currentContractorId);

// 4. Validate submission
if (checkedItems.length < checklistItems.length) {
  showError("Thiếu tài liệu bắt buộc");
  return;
}

if (checkedItems.length < contractorReq.required_count) {
  showError(`Cần ít nhất ${contractorReq.required_count} tài liệu`);
  return;
}
```

---

## 📊 Ưu Điểm So Với Cách Cũ

| Tiêu Chí | Cách Cũ (3 Tab) | Cách Mới (1 Tab) |
|---------|----------------|-----------------|
| **Số tab** | 3 (rườm rà) | 1 (gọn gàng) |
| **Số bước setup** | 3 (Tab 1 → Tab 3 → Tab 2) | 1 (Mở → Setup xong) |
| **Khó hiểu** | ❌ Admin bối rối flow | ✅ Flow rõ ràng |
| **Đồng bộ dữ liệu** | ❌ Dễ miss | ✅ Tự động |
| **Tìm hiểu** | ❌ 3 chỗ khác nhau | ✅ 1 chỗ duy nhất |
| **Hiệu suất** | ❌ Load 3 tab | ✅ Load 1 tab |

---

## 🛠️ Triển Khai

### **Bước 1: Deploy Code**
```bash
git add src/components/admin/UnifiedRequirementConfig.tsx
git add src/pages/admin/settings.tsx
git commit -m "feat: unified requirement configuration UI"
git push
```

### **Bước 2: Admin Setup**
1. Login as admin
2. Vào Settings → "Cấu Hình Yêu Cầu (Mới)"
3. Setup lần lượt từng doc_type

### **Bước 3: Verify**
1. Logout + login as contractor
2. Vào "Nộp hồ sơ mới"
3. Check xem checklist có đúng yêu cầu không

---

## 🔄 Migration Từ Cách Cũ (Nếu Có Data)

Nếu bạn đã setup bằng 3 tab cũ:

```sql
-- Dữ liệu sẽ vẫn còn, không mất
-- Tab mới sẽ read cùng data từ 3 bảng:
-- - document_types
-- - checklist_requirements  
-- - contractor_requirements

-- Không cần migration, chỉ cần refresh browser
```

---

## ⚙️ Tùy Chỉnh

### **Muốn thêm item mới vào checklist?**
```
1. Update HSE_CHECKLISTS trong checklistData.ts
2. Click "Khởi tạo Checklist" lại
3. Hệ thống sẽ thêm items mới
```

### **Muốn xóa một item?**
```
Hiện tại không có UI delete (tính năng sau)
Cách tạm thời:
  1. Update DB trực tiếp (xóa row)
  2. Refresh browser
```

### **Muốn copy setup từ doc_type này sang khác?**
```
Hiện tại không có feature copy (tính năng sau)
Cách tạm thời:
  1. Manual setup từng doc_type
  2. Hoặc update SQL trực tiếp
```

---

## 🐛 Troubleshooting

### **Vấn đề: Khởi tạo Checklist không hiển thị items**
```
Nguyên nhân: HSE_CHECKLISTS không có entry cho doc_type.name
Giải pháp:
  1. Check tên doc_type phải match với key trong HSE_CHECKLISTS
  2. VD: doc_type.name = "1.1.1" 
       → Check HSE_CHECKLISTS["1.1.1"] có tồn tại không
```

### **Vấn đề: Nhà thầu không thấy yêu cầu**
```
Nguyên nhân: 
  1. Checklist chưa khởi tạo
  2. Contractor requirement chưa set
  
Giải pháp:
  1. Verify checklist_requirements có data
  2. Verify contractor_requirements có data cho contractor đó
  3. Check RLS policies allow select
```

### **Vấn đề: Không save được yêu cầu nhà thầu**
```
Nguyên nhân: Validation error hoặc DB constraint violation

Giải pháp:
  1. Mở browser console (F12)
  2. Check error message
  3. Verify required_count > 0
  4. Verify contractor tồn tại
```

---

## 📚 File Liên Quan

```
src/components/admin/
  ├─ UnifiedRequirementConfig.tsx (NEW) ← Component chính
  ├─ ChecklistRequirementsManager.tsx   (Legacy, optional delete)
  └─ ...

src/pages/admin/
  └─ settings.tsx (Updated)

src/lib/
  └─ checklistData.ts (HSE_CHECKLISTS)

supabase/migrations/
  └─ 20251028120000_checklist_requirements.sql
```

---

## 🎉 Tóm Tắt

**Trước (Cũ):** 3 tab riêng lẻ → Khó setup → Dễ sai → Không đồng bộ

**Sau (Mới):** 1 tab thống nhất → Dễ setup → Tự động validate → Đồng bộ

**Kết quả:** ⚡ **Setup nhanh gấp 3 lần** ⚡
