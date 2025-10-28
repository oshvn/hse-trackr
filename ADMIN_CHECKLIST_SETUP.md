# 📋 Hướng Dẫn Setup Yêu Cầu Checklist Cho Admin

## Tổng Quan

Hệ thống cho phép Admin **cấu hình tài liệu nào là bắt buộc** cho từng loại tài liệu, từ đó **tự động áp dụng** cho quy trình nộp hồ sơ của nhà thầu.

---

## 🏗️ Kiến Trúc Giải Pháp

### **3 Thành Phần Chính**

```
┌─────────────────────────────────────────────────────┐
│     1. Bảng Database: checklist_requirements        │
│     Lưu trữ yêu cầu (bắt buộc/tùy chọn)            │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│     2. Admin UI: ChecklistRequirementsManager       │
│     Giao diện để cấu hình                           │
└─────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│     3. Component: DocumentChecklistStep             │
│     Sử dụng yêu cầu từ database                     │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Bảng Database: checklist_requirements

### Schema

```sql
CREATE TABLE public.checklist_requirements (
  id UUID PRIMARY KEY,
  doc_type_id UUID NOT NULL,              -- Tham chiếu tới doc_types
  checklist_item_id TEXT NOT NULL,        -- ID tài liệu (VD: "1.1.1.1")
  checklist_label TEXT NOT NULL,          -- Tên tài liệu
  is_required BOOLEAN NOT NULL DEFAULT true, -- Bắt buộc hay tùy chọn?
  position INT DEFAULT 0,                 -- Thứ tự hiển thị
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(doc_type_id, checklist_item_id)
);
```

### Dữ Liệu Ví Dụ

| doc_type_id | checklist_item_id | checklist_label | is_required | position |
|---|---|---|---|---|
| UUID-MC | 1.1.1.1 | CMND/Hộ chiếu | true | 0 |
| UUID-MC | 1.1.1.2 | Sơ yếu lý lịch | true | 1 |
| UUID-MC | 1.1.1.7 | Chứng chỉ sơ cấp cứu | false | 7 |

---

## 🖥️ Admin UI: Cách Sử Dụng

### **Truy Cập**

1. Đăng nhập Admin
2. Vào **Cấu Hình Hệ Thống HSE** (Settings)
3. Chọn tab **"Yêu Cầu Checklist"**

### **Giao Diện**

```
┌─────────────────────────────────────────────────┐
│ Cấu Hình Yêu Cầu Checklist                      │
├─────────────────────────────────────────────────┤
│                                                 │
│ 📝 Construction Manager          [5/9]          │
│    Danh mục: 1.1.1 Management Teams           │
│    Mã: MT_CM                                   │
│                                   [Init Checklist]
│                                                 │
│    ✓ CMND/Hộ chiếu [Bắt buộc]                │
│    ✓ Sơ yếu lý lịch [Bắt buộc]               │
│    ☐ Chứng chỉ sơ cấp cứu [Tùy chọn]        │
│    ... more items ...                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

### **Quy Trình Cấu Hình**

#### **Bước 1: Khởi Tạo Checklist Items**

```
Loại Tài Liệu: Construction Manager
Trạng thái: Không có checklist được cấu hình
           ↓
[Nút: "Khởi Tạo Checklist"]
           ↓
Hệ thống sẽ:
1. Tìm danh mục từ CATEGORY_HIERARCHY
2. Lấy tất cả required_documents
3. Tạo record trong checklist_requirements
   - Mặc định tất cả đều là bắt buộc (is_required = true)
```

#### **Bước 2: Đánh Dấu Tùy Chọn**

```
Mục: Chứng chỉ sơ cấp cứu
Trạng thái: [Bắt buộc] ← Công tắc
           ↓ (Nhấp để chuyển)
Trạng thái: [Tùy chọn]
           ↓
Lưu vào database tự động
```

#### **Bước 3: Xác Nhận**

```
Tất cả item đã được cấu hình
Badge hiển thị: [5/9] = 5/9 item được cấu hình
```

---

## 📝 Component ChecklistRequirementsManager

### **File**

```
src/components/admin/ChecklistRequirementsManager.tsx
```

### **Tính Năng**

✅ **Tải danh sách doc_types**
- Lấy từ database doc_types

✅ **Tải checklist_requirements hiện tại**
- Lấy từ database checklist_requirements
- Nhóm theo doc_type_id

✅ **Khởi tạo Checklist Items**
```typescript
// Khi nhấp "Khởi Tạo Checklist":
1. Tìm doc_type dựa trên code
2. Lấy danh mục từ CATEGORY_HIERARCHY
3. Trích xuất required_documents
4. Tạo batch insert vào database
   {
     doc_type_id: UUID,
     checklist_item_id: "1.1.1.1",
     checklist_label: "CMND/Hộ chiếu",
     is_required: true,
     position: 0
   }
```

✅ **Toggle Required/Optional**
```typescript
// Khi nhấp công tắc:
UPDATE checklist_requirements
SET is_required = !is_required
WHERE id = checklist_req_id
```

---

## 🔄 Component DocumentChecklistStep

### **Cách Hoạt Động**

#### **Trước (Hardcoded)**
```typescript
const requiredItems = selectedCategory.required_documents
  .filter(item => item.required !== false);
```

#### **Sau (Từ Database)**
```typescript
// 1. Tìm doc_type_id theo code
const { data: docType } = await supabase
  .from('doc_types')
  .select('id')
  .eq('code', selectedCategory.docTypeId)
  .single();

// 2. Lấy checklist_requirements
const { data: requirements } = await supabase
  .from('checklist_requirements')
  .select('*')
  .eq('doc_type_id', docType.id);

// 3. Filter theo is_required
const requiredItems = requirements
  .filter(req => req.is_required === true);
```

### **Fallback Logic**

Nếu không tìm được trong database, sẽ sử dụng hardcoded từ `CategoryNode`:

```typescript
if (!requirementsData || requirementsData.length === 0) {
  // Sử dụng selectedCategory.required_documents
  const fallbackReqs = selectedCategory.required_documents
    .map(doc => ({
      checklist_item_id: doc.id,
      checklist_label: doc.label,
      is_required: doc.required !== false
    }));
}
```

---

## 🎯 Quy Trình Hoàn Chỉnh

### **Scenario: Admin Setup cho Construction Manager**

```
1. Admin truy cập Settings → Yêu Cầu Checklist
   └─ Thấy "Construction Manager" (Chưa cấu hình)

2. Admin nhấp "Khởi Tạo Checklist"
   └─ Hệ thống tạo 9 item từ CATEGORY_HIERARCHY
   └─ Tất cả đặt là bắt buộc (is_required = true)
   └─ Hiển thị: [9/9]

3. Admin xem danh sách:
   ✓ CMND/Hộ chiếu [Bắt buộc]
   ✓ Sơ yếu lý lịch [Bắt buộc]
   ✓ Bằng cấp [Bắt buộc]
   ...
   ✓ Chứng chỉ sơ cấp cứu [Bắt buộc]

4. Admin quyết định chứng chỉ sơ cấp cứu là tùy chọn
   └─ Nhấp công tắc
   └─ Lưu ngay vào database

5. Nhà thầu nộp hồ sơ cho Construction Manager
   └─ App lấy yêu cầu từ database
   └─ Hiển thị trong DocumentChecklistStep
   └─ 8 item bắt buộc, 1 tùy chọn
   └─ Nhà thầu phải chọn tất cả 8 item bắt buộc
```

---

## 📦 Dữ Liệu Khởi Tạo

### **Migration: 20251028120000_checklist_requirements.sql**

```sql
-- Tạo bảng checklist_requirements
CREATE TABLE public.checklist_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type_id UUID NOT NULL REFERENCES doc_types(id),
  checklist_item_id TEXT NOT NULL,
  checklist_label TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(doc_type_id, checklist_item_id)
);

-- Enable RLS
ALTER TABLE checklist_requirements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "allow_admin_" ON checklist_requirements ...
```

---

## 🔗 Liên Kết Đến Các File

| File | Mục Đích |
|------|---------|
| `supabase/migrations/20251028120000_checklist_requirements.sql` | Migration database |
| `src/components/admin/ChecklistRequirementsManager.tsx` | Admin UI component |
| `src/pages/admin/settings.tsx` | Trang settings (có tab mới) |
| `src/components/submissions/DocumentChecklistStep.tsx` | Component nộp hồ sơ (cập nhật lấy từ DB) |
| `src/lib/checklistData.ts` | Data structure, helpers |

---

## 📋 Kiểm Tra & Xác Thực

### **Kiểm Tra 1: Admin Setup**

```
1. Vào Settings → Yêu Cầu Checklist
2. Xem danh sách doc_types
3. Nhấp "Khởi Tạo Checklist" cho một loại
4. Xác nhận các item hiển thị
5. Toggle một item → Lưu vào DB
6. Reload → Xác nhận thay đổi đó
```

### **Kiểm Tra 2: Nhà Thầu Nộp Hồ Sơ**

```
1. Nhà thầu chọn danh mục (VD: Construction Manager)
2. Chuyển sang Bước 2: Kiểm Tra Tài Liệu
3. Xác nhận:
   - 8 item được đánh dấu [Bắt buộc]
   - 1 item được đánh dấu [Tùy chọn]
   - Phải chọn tất cả 8 bắt buộc để tiếp tục
   - Chọn tùy chọn không yêu cầu
```

### **Kiểm Tra 3: Fallback**

```
1. Xóa tất cả record từ checklist_requirements
2. Nhà thầu nộp hồ sơ
3. App vẫn hiển thị bình thường (fallback to hardcoded)
4. Thêm một số item vào DB
5. App lấy từ DB (không fallback)
```

---

## 🚀 Lợi Ích

✅ **Admin Linh Hoạt**
- Có thể thay đổi yêu cầu mà không cần deploy
- Có thể khác nhau cho từng loại tài liệu

✅ **Dễ Quản Lý**
- UI trực quan, click-to-toggle
- Tự động lưu vào database

✅ **Có Fallback**
- Nếu không có trong database, vẫn sử dụng hardcoded
- Không bao giờ fail hoàn toàn

✅ **Tương Thích**
- Không phá vỡ existing logic
- Existing data vẫn hoạt động

---

## ⚙️ Advanced: Mở Rộng

### **Tương Lai: Per-Contractor Requirements**

Nếu muốn yêu cầu khác cho từng nhà thầu:

```sql
CREATE TABLE contractor_checklist_requirements (
  id UUID PRIMARY KEY,
  contractor_id UUID NOT NULL,
  doc_type_id UUID NOT NULL,
  checklist_item_id TEXT NOT NULL,
  is_required BOOLEAN,
  ...
);
```

Khi đó ở `DocumentChecklistStep`:

```typescript
// Ưu tiên contractor-specific trước
const requirements = contractor_specific || global_default;
```

---

## 📞 FAQ

### **Q: Admin không khởi tạo, nhà thầu nộp hồ sơ sẽ thế nào?**
A: Sẽ sử dụng fallback - dữ liệu từ `CategoryNode.required_documents`. Mọi thứ vẫn hoạt động bình thường.

### **Q: Có thể thay đổi sau khi nhà thầu đã nộp?**
A: Có. Thay đổi sẽ áp dụng cho submission tiếp theo. Submission cũ vẫn giữ nguyên vì lưu note trong database.

### **Q: Nếu admin xóa một item khỏi checklist?**
A: Item đó sẽ không yêu cầu nữa. Nhà thầu mới không cần nộp. Nhà thầu cũ không bị ảnh hưởng.

### **Q: Có thể reorder các item?**
A: Có thể - sử dụng cột `position`. Cần thêm UI drag-and-drop.

---

## ✅ Hoàn Thành

Giải pháp cấu hình checklist đã được triển khai hoàn chỉnh:

✓ Bảng database `checklist_requirements`  
✓ Admin UI component  
✓ Integration vào settings  
✓ DocumentChecklistStep lấy từ DB  
✓ Fallback logic  
✓ Migration & initialization  

**Hệ thống sẵn sàng!** 🎉
