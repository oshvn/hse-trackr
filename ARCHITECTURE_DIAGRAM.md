# 🏗️ Sơ Đồ Kiến Trúc Quy Trình Nộp Hồ Sơ Phân Cấp

## 📐 Kiến Trúc Component

```
┌─────────────────────────────────────────────────────────────┐
│                     Page Layer                               │
│                  bulk-submission.tsx                         │
│  (Xác thực quyền, chọn nhà thầu, hiển thị BulkSubmissionFlow│
└────────────────────┬────────────────────────────────────────┘
                     │
┌─────────────────────┴────────────────────────────────────────┐
│              BulkSubmissionFlow (Main Orchestrator)          │
│  - Quản lý state (currentStep, navigationPath, selectedCategory)
│  - Xử lý callback từ 3 component bước
│  - Logic nộp hồ sơ → Database
│  - Progress bar hiển thị
└─────────────────────┬────────────────────────────────────────┘
                      │
            ┌─────────┼─────────┐
            │         │         │
            ▼         ▼         ▼
    ┌──────────────┐ ┌──────────────────┐ ┌─────────────────┐
    │   Bước 1     │ │    Bước 2        │ │    Bước 3       │
    │  Chọn Danh   │ │ Kiểm Tra Tài     │ │  Xác Nhận &     │
    │   Mục        │ │ Liệu             │ │  Nộp            │
    └──────────────┘ └──────────────────┘ └─────────────────┘
```

---

## 🔄 Luồng Dữ Liệu (Data Flow)

### **Bước 1: CategoryNavigationStep**

```
CATEGORY_HIERARCHY (Immutable)
    │
    ├─ findCategoryNode()
    ├─ getSubCategories()
    └─ isLeafCategory()
    │
    ▼
Component State:
    ├─ navigationPath: string[]  → Đường dẫn hiện tại
    ├─ currentNode: CategoryNode → Node đang xem
    └─ displayedCategories: CategoryNode[] → Danh mục con
    │
    ▼ (User Click)
    ├─ Nếu có children: updateNavigationPath()
    └─ Nếu là lá: onNext(node) → BulkSubmissionFlow
```

### **Bước 2: DocumentChecklistStep**

```
selectedCategory.required_documents
    │
    ├─ Filter: required vs optional
    ├─ Sort: bắt buộc trước
    │
    ▼
Component State:
    ├─ checkedItems: Set<string> → Tài liệu được chọn
    ├─ documentLink: string → Link duy nhất
    └─ linkError: string → Thông báo lỗi
    │
    ▼ (User Input)
    ├─ handleCheckboxChange()
    ├─ handleLinkChange() + URL validation
    │
    ▼ (Xác thực)
    ├─ allRequiredChecked: boolean
    ├─ isValidLink: boolean
    ├─ canProceed: boolean ← allRequiredChecked && isValidLink
    │
    ▼ (User Click "Tiếp tục")
    └─ onNext(checkedItems, link) → BulkSubmissionFlow
```

### **Bước 3: SubmissionFormStep**

```
Props từ BulkSubmissionFlow:
    ├─ selectedCategory
    ├─ checkedItems[]
    └─ documentLink
    │
    ▼
Component State:
    ├─ note: string → Ghi chú người dùng
    ├─ showConfirmDialog: boolean
    └─ isSubmitting: boolean
    │
    ▼ (User Click "Nộp hồ sơ")
    └─ setShowConfirmDialog(true)
         │
         ▼ (Modal xác nhận)
         User xác nhận
         │
         ▼ onSubmit(note) → BulkSubmissionFlow.handleFormSubmit()
            │
            ├─ Tìm doc_type_id từ db (dựa trên docTypeId)
            ├─ Tạo submissions record
            ├─ Reset form
            └─ Navigate /my-submissions
```

---

## 🗂️ Cấu Trúc Danh Mục

```
CATEGORY_HIERARCHY
│
├─ 1.1 Document Register (Level 1)
│  ├─ 1.1.1 Management Teams (Level 2)
│  │  ├─ 1.1.1.1 Construction Manager (Level 3, Leaf)
│  │  │  └─ required_documents: []
│  │  ├─ 1.1.1.2 HSE Manager (Level 3, Leaf)
│  │  │  └─ required_documents: []
│  │  └─ ...
│  ├─ 1.1.2 Management Plan (Level 2, Leaf)
│  │  └─ required_documents: []
│  └─ ...
│
├─ 1.2 Risk Assessment (Level 1, Leaf)
│  └─ required_documents: []
│
└─ ...
```

---

## 💾 Database Integration

### **Data Flow to Database**

```
Form Input
    │
    ├─ category: CategoryNode
    ├─ checkedItems: string[]
    ├─ documentLink: string
    └─ note: string
    │
    ▼ (BulkSubmissionFlow.handleFormSubmit)
    │
    ├─ selectedCategory.docTypeId → "MT_CM"
    │
    ├─ Query: SELECT id FROM doc_types WHERE code = "MT_CM"
    │  Result: docTypeId (UUID from database)
    │
    ├─ Build note:
    │  "Danh mục: 1.1.1.1 Construction Manager\n
    │   Tài liệu: 8\n
    │   Link: https://...\n
    │   Ghi chú: user note"
    │
    ▼
    │ INSERT INTO submissions
    │ (contractor_id, doc_type_id, status, cnt, submitted_at, note)
    │ VALUES (...)
    │
    ▼
    Success → Toast notification + Redirect
    │
    Error → Toast error message
```

---

## 🔌 Integration Points

### **App.tsx Routes**

```
App (QueryClientProvider, TooltipProvider, BrowserRouter)
    │
    ├─ /login → LoginPage
    ├─ /forgot-password → ForgotPasswordPage
    │
    └─ / (AppShell)
        ├─ /dashboard → Dashboard
        ├─ /my-submissions → MySubmissions
        ├─ /bulk-submission → ProtectedBulkSubmission (NEW!)
        │
        └─ /admin
            ├─ /approvals → AdminApprovals
            ├─ /settings → AdminSettings
            └─ /users → AdminUsers
```

### **Sidebar Navigation**

```
Sidebar (userRole-based filtering)
    ├─ Dashboard (All roles)
    ├─ My Submissions (contractor, admin)
    ├─ New Submission (contractor, admin) ← NEW!
    │
    └─ Admin Section (admin, super_admin)
        ├─ Approvals Queue
        ├─ Users & Roles
        └─ Admin Settings
```

---

## 📦 State Management

### **BulkSubmissionFlow State**

```typescript
interface BulkSubmissionFlowState {
  currentStep: 'category' | 'checklist' | 'form';
  navigationPath: string[];              // [id1, id2, id3, ...]
  selectedCategory: CategoryNode | null;
  checkedItems: string[];                // [doc1, doc2, ...]
  documentLink: string;
}
```

### **CategoryNavigationStep State**

```typescript
interface CategoryNavigationStepState {
  // Props: navigationPath
  currentNode: CategoryNode | null;
  displayedCategories: CategoryNode[];
}
```

### **DocumentChecklistStep State**

```typescript
interface DocumentChecklistStepState {
  checkedItems: Set<string>;
  documentLink: string;
  linkError: string;
  allRequiredChecked: boolean;
  isValidLink: boolean;
}
```

### **SubmissionFormStep State**

```typescript
interface SubmissionFormStepState {
  note: string;
  showConfirmDialog: boolean;
  isSubmitting: boolean;
}
```

---

## 🎯 Control Flow

```
User Action          Component              BulkSubmissionFlow      Database
    │                    │                        │                     │
    ├─ Nhấp danh mục ─→ CategoryNav Step  ─→  updateNavigationPath
    │                    │
    │                    └─ Nếu lá ─→ onNext(node) ─→ currentStep='checklist'
    │                                                    selectedCategory=node
    │
    │                                         
    ├─ Chọn tài liệu ─→ DocumentChecklist ─→ handleCheckboxChange
    │                     │
    │                     └─ Nhập link ─→ handleLinkChange
    │                     │
    │                     └─ Nếu hợp lệ ─→ onNext() ─→ currentStep='form'
    │
    │
    ├─ Nhập ghi chú ─→ SubmissionForm
    │
    │
    ├─ Nhấp "Nộp" ─→ showConfirmDialog=true
    │                    │
    │                    └─ [Modal xác nhận]
    │
    │
    └─ Xác nhận ─→ handleFormSubmit() ─→ Query doc_types ─→ db.query()
                        │                                      │
                        │              ┌─ Tìm docTypeId ──┬─→ SELECT id
                        │              │                  │
                        │              └─ Tạo record ────┴─→ INSERT submissions
                        │
                        ├─ Reset state
                        ├─ Toast success
                        └─ Navigate /my-submissions
```

---

## 📊 Data Structure Tree

```typescript
// CATEGORY_HIERARCHY: CategoryNode[]

CategoryNode {
  id: "1.1",
  name: "1.1 Document Register",
  level: 1,
  parentId?: undefined,
  children: [
    {
      id: "1.1.1",
      name: "1.1.1 Management Teams",
      level: 2,
      parentId: "1.1",
      children: [
        {
          id: "1.1.1.1",
          name: "1.1.1.1 Construction Manager",
          level: 3,
          parentId: "1.1.1",
          docTypeId: "MT_CM",
          required_documents: [
            {
              id: "1.1.1.1",
              label: "CMND/Hộ chiếu...",
              required: true
            },
            // ...
          ]
        },
        // ...
      ]
    },
    // ...
  ]
}
```

---

## 🔐 Permission & Access Control

```
User Access
    │
    ├─ Guest
    │  └─ Can access: Dashboard
    │
    ├─ Contractor
    │  └─ Can access: Dashboard, My Submissions, New Submission
    │     └─ Use own contractor_id
    │
    └─ Admin/Super Admin
       └─ Can access: Dashboard, My Submissions, New Submission, Admin pages
          └─ Can select any contractor_id
```

---

## 🔄 Component Lifecycle

```
BulkSubmissionFlow Mount
    │
    ├─ Initial state: currentStep = 'category'
    │
    ├─ User navigates → componentStep changes
    │  ├─ category (Step 1)
    │  ├─ checklist (Step 2)
    │  └─ form (Step 3)
    │
    └─ Submit → Reset all state → Navigate

All State Reset:
    ├─ currentStep = 'category'
    ├─ navigationPath = []
    ├─ selectedCategory = null
    ├─ checkedItems = []
    └─ documentLink = ''
```

---

## 📱 Responsive Breakpoints

```
Grid Layout:
    Desktop (>= 768px)  →  grid-cols-2
    Tablet (< 768px)    →  grid-cols-1
    Mobile (< 640px)    →  grid-cols-1 (full width)

Sidebar:
    Desktop    →  Always visible
    Tablet     →  Auto (collapsible)
    Mobile     →  Hidden (toggle button)
```

---

## ✨ Features Architecture

```
┌─ Category Navigation
│  ├─ Breadcrumb display
│  ├─ Recursive traversal
│  └─ Auto-detect leaf nodes
│
├─ Document Validation
│  ├─ Required vs Optional
│  ├─ URL validation
│  └─ Progress tracking
│
├─ Submission Processing
│  ├─ Database lookup
│  ├─ Record creation
│  └─ Error handling
│
├─ User Feedback
│  ├─ Progress indicators
│  ├─ Alert messages
│  ├─ Toast notifications
│  └─ Modal confirmation
│
└─ Access Control
   ├─ Role-based routing
   ├─ Admin impersonation
   └─ Contractor assignment
```
