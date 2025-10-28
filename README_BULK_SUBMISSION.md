# Quy Trình Nộp Hồ Sơ Phân Cấp (Bulk Submission Flow)

## Tổng Quan

Hệ thống triển khai quy trình nộp hồ sơ cho nhà thầu với 3 bước chính, hỗ trợ danh mục phân cấp tối đa 4 cấp:

1. **Bước 1: Chọn danh mục** - Điều hướng qua cấu trúc danh mục phân cấp
2. **Bước 2: Kiểm tra tài liệu** - Chọn tài liệu và cung cấp link
3. **Bước 3: Xác nhận và nộp** - Điền thông tin và xác nhận trước khi gửi

---

## Kiến Trúc Component

### Component Chính

#### `BulkSubmissionFlow.tsx`
Quản lý toàn bộ quy trình 3 bước, xử lý:
- Chuyển đổi giữa các bước
- Quản lý state cho navigation path, danh mục được chọn, tài liệu, link
- Xử lý logic nộp hồ sơ (gửi dữ liệu lên database)
- Hiển thị progress bar cho từng bước

**Props:**
```typescript
interface BulkSubmissionFlowProps {
  contractorId: string;
  onSubmissionComplete: () => void;
}
```

### Component Bước 1

#### `CategoryNavigationStep.tsx`
Cho phép người dùng điều hướng qua cấu trúc danh mục phân cấp:

**Tính năng:**
- Hiển thị breadcrumb navigation path
- Duyệt qua các cấp danh mục (tối đa 4 cấp)
- Tự động detect danh mục "lá" và chuyển sang bước tiếp theo
- Nút "Quay lại" để quay lại danh mục cha

**Props:**
```typescript
interface CategoryNavigationStepProps {
  navigationPath: string[];
  onCategorySelect: (categoryId: string) => void;
  onBack: () => void;
  onNext: (selectedNode: CategoryNode) => void;
}
```

### Component Bước 2

#### `DocumentChecklistStep.tsx`
Hiển thị danh sách tài liệu cần thiết và xác nhận:

**Tính năng:**
- Progress bar tiến độ kiểm tra
- Danh sách checkbox cho tất cả tài liệu
- Phân biệt tài liệu bắt buộc vs tùy chọn
- Xác thực link (URL validation)
- Cảnh báo nếu tài liệu bắt buộc chưa được chọn
- Nút "Chọn tất cả"

**Props:**
```typescript
interface DocumentChecklistStepProps {
  selectedCategory: CategoryNode;
  onBack: () => void;
  onNext: (checkedItems: string[], documentLink: string) => void;
}
```

### Component Bước 3

#### `SubmissionFormStep.tsx`
Xác nhận thông tin trước khi nộp:

**Tính năng:**
- Hiển thị tóm tắt danh mục, tài liệu được chọn, link
- Form ghi chú (tùy chọn)
- Modal xác nhận trước khi gửi
- Xử lý lỗi và hiển thị thông báo thành công

**Props:**
```typescript
interface SubmissionFormStepProps {
  selectedCategory: CategoryNode;
  checkedItems: string[];
  documentLink: string;
  onBack: () => void;
  onSubmit: (note: string) => Promise<void>;
}
```

---

## Cấu Trúc Dữ Liệu

### CategoryNode
Biểu diễn một node trong cây danh mục:

```typescript
interface CategoryNode {
  id: string;           // ID duy nhất, ví dụ: "1.1.1.1"
  name: string;         // Tên hiển thị
  level: number;        // Cấp (1-4)
  parentId?: string;    // ID cha (nếu có)
  children?: CategoryNode[];  // Danh mục con
  docTypeId?: string;   // Code loại tài liệu (chỉ ở cấp lá)
  required_documents?: ChecklistItem[];  // Danh sách tài liệu cần thiết
}
```

### CATEGORY_HIERARCHY
Cấu trúc phân cấp đầy đủ được định nghĩa trong `src/lib/checklistData.ts`:

**Cấu trúc ví dụ:**
```
1. Document Register (cấp 1)
   ├── 1.1 Management Teams (cấp 2)
   │   ├── 1.1.1 Construction Manager (cấp 3) → docTypeId: MT_CM
   │   ├── 1.1.2 HSE Manager (cấp 3) → docTypeId: MT_HSE
   │   └── ...
   ├── 1.1.2 Management Plan (cấp 2) → docTypeId: MP
   └── ...
2. Risk Assessment (cấp 1) → docTypeId: RA
...
```

### Helper Functions

**`findCategoryNode(nodeId: string): CategoryNode | null`**
Tìm node theo ID (tìm kiếm đệ quy)

**`getSubCategories(nodeId: string): CategoryNode[]`**
Lấy danh sách danh mục con của một node

**`isLeafCategory(node: CategoryNode | null): boolean`**
Kiểm tra xem node có phải là danh mục "lá" (cuối cùng) không

---

## Luồng Dữ Liệu

### 1. Bước 1: Chọn Danh Mục
```
CATEGORY_HIERARCHY
    ↓
Hiển thị danh mục cấp 1 trong CategoryNavigationStep
    ↓
Người dùng chọn một danh mục
    ↓
Nếu có con: Cập nhật navigationPath, tải danh mục con
Nếu là lá: Chuyển sang bước 2
```

### 2. Bước 2: Kiểm Tra Tài Liệu
```
selectedCategory.required_documents
    ↓
Hiển thị danh sách checkbox trong DocumentChecklistStep
    ↓
Người dùng chọn tài liệu + nhập link
    ↓
Xác thực link (URL format)
    ↓
Nếu hợp lệ: Chuyển sang bước 3
```

### 3. Bước 3: Xác Nhận và Nộp
```
SubmissionFormStep hiển thị tóm tắt
    ↓
Người dùng xem xét + nhập ghi chú (tùy chọn)
    ↓
Nhấp "Nộp hồ sơ" → Hiển thị modal xác nhận
    ↓
Người dùng xác nhận
    ↓
BulkSubmissionFlow.handleFormSubmit()
    ├── Tìm doc_type_id từ docTypeId
    ├── Tạo submission record trong database
    ├── Reset form
    └── Gọi onSubmissionComplete() → Quay về /my-submissions
```

---

## Integratio với Database

### Bảng Liên Quan

**`doc_types`**
```sql
CREATE TABLE doc_types (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE,        -- ví dụ: "MT_CM", "MP", "RA"
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  is_critical BOOLEAN,
  weight INT,
  created_at TIMESTAMPTZ
);
```

**`submissions`**
```sql
CREATE TABLE submissions (
  id UUID PRIMARY KEY,
  contractor_id UUID NOT NULL REFERENCES contractors(id),
  doc_type_id UUID NOT NULL REFERENCES doc_types(id),
  status TEXT CHECK (status IN ('prepared','submitted','approved','rejected','revision')),
  cnt INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  note TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Dữ Liệu Được Lưu

Khi nộp hồ sơ, `BulkSubmissionFlow` tạo record mới:

```typescript
{
  contractor_id: string,        // Từ props
  doc_type_id: string,          // Tìm từ selectedCategory.docTypeId
  status: 'submitted',          // Trạng thái ban đầu
  submitted_at: new Date(),     // Thời gian nộp
  cnt: number,                  // Số lượng tài liệu được chọn
  note: string,                 // Tổng hợp: danh mục, tài liệu, link, ghi chú
}
```

---

## Sử Dụng

### Từ Trang My-Submissions
1. Nhấp nút "Nộp hồ sơ mới" (+ icon)
2. Điều hướng tới `/bulk-submission`

### Route
```typescript
<Route path="bulk-submission" element={<ProtectedBulkSubmission />} />
```

### Sidebar Navigation
Mục "New Submission" được thêm vào sidebar cho vai trò `contractor` và `admin`

---

## Xác Thực & Lỗi

### Xác Thực Bước 2
- ✅ Tất cả tài liệu bắt buộc phải được chọn
- ✅ Link phải là URL hợp lệ (http:// hoặc https://)

### Xác Thực Bước 3
- ✅ Tìm thấy doc_type_id trong database
- ✅ Lưu thành công submission record

### Thông Báo Lỗi
- Hiển thị alert với mô tả lỗi
- Toast notification cho thành công/thất bại

---

## Tùy Chỉnh

### Thêm Danh Mục Mới

1. **Thêm vào `checklistData.ts`:**
```typescript
export const CATEGORY_HIERARCHY: CategoryNode[] = [
  // ... existing categories ...
  {
    id: "1.6",
    name: "1.6 New Category",
    level: 1,
    docTypeId: "NEW_CODE",
    required_documents: [
      { id: "1.6.1", label: "Document 1", required: true },
      // ...
    ]
  }
];
```

2. **Thêm doc_type vào database:**
```sql
INSERT INTO doc_types (code, name, category, is_critical)
VALUES ('NEW_CODE', 'New Category', '1.6 New Category', true);
```

### Thay Đổi Giao Diện

- **Màu sắc:** Chỉnh sửa class Tailwind trong các component
- **Bố cục:** Thay đổi `grid` layout trong `CategoryNavigationStep`
- **Text:** Thay đổi strings trong các component (tất cả đều là tiếng Việt)

---

## Testing

### Test Cases

**Scenario 1: Chọn danh mục phân cấp**
- Chọn danh mục cấp 1 → Xem danh mục cấp 2
- Chọn danh mục cấp 2 → Xem danh mục cấp 3
- Chọn danh mục cấp 3 (lá) → Tự động chuyển sang bước 2

**Scenario 2: Kiểm tra tài liệu**
- Chọn danh sách tài liệu → Xem tiến độ
- Nhập link không hợp lệ → Hiển thị lỗi
- Nhập link hợp lệ → Kích hoạt nút "Tiếp tục"
- Không chọn tài liệu bắt buộc → Không thể tiến hành

**Scenario 3: Nộp hồ sơ**
- Xem xét tóm tắt
- Nhấp xác nhận → Modal xác nhận
- Xác nhận → Gửi, reset, quay về

---

## Troubleshooting

| Vấn Đề | Nguyên Nhân | Giải Pháp |
|--------|-----------|----------|
| "Không tìm thấy loại tài liệu trong database" | docTypeId không tồn tại | Kiểm tra doc_types table, đảm bảo code khớp |
| Nút "Tiếp tục" không hoạt động | Link không hợp lệ hoặc tài liệu bắt buộc chưa chọn | Kiểm tra URL format, chọn tất cả tài liệu bắt buộc |
| Danh mục không hiển thị | CategoryNode chưa được thêm vào CATEGORY_HIERARCHY | Thêm vào checklistData.ts |

---

## Files Liên Quan

```
src/
├── components/submissions/
│   ├── BulkSubmissionFlow.tsx          [Main component]
│   ├── CategoryNavigationStep.tsx       [Step 1]
│   ├── DocumentChecklistStep.tsx        [Step 2]
│   └── SubmissionFormStep.tsx           [Step 3]
├── lib/
│   └── checklistData.ts                 [Data structure]
├── pages/
│   └── bulk-submission.tsx              [Page wrapper]
├── App.tsx                              [Routes]
└── components/layout/
    ├── Sidebar.tsx                      [Navigation]
    └── ...
```
