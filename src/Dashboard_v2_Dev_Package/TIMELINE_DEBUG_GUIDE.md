# 🔍 Timeline Debug Guide

## Vấn đề
Biểu đồ timeline không hiển thị dữ liệu - có thể do lỗi data hoặc không có dữ liệu trong database.

## 🛠️ Debug Steps

### 1. Mở Browser Console
- Mở DevTools (F12)
- Chuyển đến tab **Console**
- Click vào một category trong Category Progress

### 2. Kiểm tra Debug Logs

#### **Step 1: Category Timeline Data Generation**
Tìm logs bắt đầu với `🔍 Category Timeline Data Generation:`
```javascript
🔍 Category Timeline Data Generation: {
  selectedCategory: "category-id-here",
  hasCategories: true,
  hasContractors: true,
  categoriesCount: 5,
  contractorsCount: 3
}
```

**Nếu thấy:**
- ❌ `selectedCategory: null` → Vấn đề với integration state
- ❌ `hasCategories: false` → Không có data categories từ database
- ❌ `hasContractors: false` → Không có data contractors từ database

#### **Step 2: Category Data Validation**
Tìm logs bắt đầu với `🔍 CategoryDetailModal - Data Validation:`
```javascript
🔍 CategoryDetailModal - Data Validation: {
  hasCategoryData: true,
  categoryData: { ... },
  timelineDataLength: 31,
  contractorsLength: 3
}
```

**Nếu thấy:**
- ❌ `hasCategoryData: false` → Category data không được truyền vào modal
- ❌ `timelineDataLength: 0` → Không có timeline data được generate
- ❌ `contractorsLength: 0` → Không có contractor data

#### **Step 3: Timeline Data Generation**
Tìm logs bắt đầu với `🔍 generateCategoryTimeline called with:`
```javascript
🔍 generateCategoryTimeline called with: {
  category: { id: "...", name: "...", approved: 12, pending: 3, missing: 1 },
  contractors: 3,
  days: 30
}
```

**Nếu thấy:**
- ❌ `category.approved: 0` → Category không có approved data
- ❌ `category.pending: 0` → Category không có pending data  
- ❌ `category.missing: 0` → Category không có missing data

#### **Step 4: Generated Data**
Tìm logs bắt đầu với `📊 Generated CategoryTimelineData:`
```javascript
📊 Generated CategoryTimelineData: {
  categoryId: "category-id",
  categoryName: "Safety Plans",
  timelineDataLength: 31,
  contractorsLength: 3,
  sampleTimelineData: [
    { day: "Start", approved: 0, pending: 0, missing: 1, total: 1 },
    { day: "Day 1", approved: 0, pending: 0, missing: 1, total: 1 },
    { day: "Day 2", approved: 0, pending: 0, missing: 1, total: 1 }
  ]
}
```

## 🔧 Possible Issues & Solutions

### Issue 1: No Category Data from Database
**Symptoms:**
- `hasCategories: false` hoặc `categoriesCount: 0`
- Category Progress component không hiển thị

**Solution:**
```typescript
// Kiểm tra useDashboardData hook
// Đảm bảo API trả về categories data
```

### Issue 2: Category Missing Required Properties
**Symptoms:**
- `category.approved: 0`, `category.pending: 0`, `category.missing: 0`
- Timeline data được generate nhưng tất cả values = 0

**Solution:**
```typescript
// Kiểm tra database schema
// Đảm bảo categories table có columns: approved, pending, missing
// Hoặc update data mapping trong useDashboardData
```

### Issue 3: Integration State Not Set
**Symptoms:**
- `selectedCategory: null`
- Modal mở nhưng không có data

**Solution:**
```typescript
// Kiểm tra handleCategoryDrillDown function
// Đảm bảo integration state được set đúng
```

### Issue 4: Chart Data Format Issue
**Symptoms:**
- Timeline data có nhưng chart không render
- Console errors về chart data format

**Solution:**
```typescript
// Kiểm tra formatCategoryTimelineForChart function
// Đảm bảo data format đúng cho Recharts
```

## 🧪 Test Data Generation

### Manual Test
```javascript
// Trong browser console, chạy:
const testCategory = {
  id: 'test-category',
  name: 'Test Category',
  approved: 10,
  pending: 5,
  missing: 2
};

const testContractors = [
  { id: 'c1', name: 'Contractor A', categories: [] },
  { id: 'c2', name: 'Contractor B', categories: [] }
];

// Test function
generateCategoryTimeline(testCategory, testContractors);
```

### Expected Output
```javascript
{
  categoryId: "test-category",
  categoryName: "Test Category", 
  categoryColor: "#3b82f6",
  timelineData: [
    { day: "Start", approved: 0, pending: 0, missing: 2, total: 2 },
    { day: "Day 1", approved: 0, pending: 0, missing: 2, total: 2 },
    // ... more data
    { day: "Today", approved: 10, pending: 5, missing: 0, total: 15 }
  ],
  contractors: [
    { id: "c1", name: "Contractor A", color: "#10b981", progress: [0, 5, 10, ...] },
    { id: "c2", name: "Contractor B", color: "#f59e0b", progress: [0, 3, 8, ...] }
  ]
}
```

## 📊 Database Check

### Kiểm tra Categories Table
```sql
SELECT id, name, approved, pending, missing, is_critical 
FROM categories 
LIMIT 5;
```

### Kiểm tra Contractors Table  
```sql
SELECT id, name 
FROM contractors 
LIMIT 5;
```

### Kiểm tra Data Mapping
```typescript
// Trong useDashboardData hook
console.log('Raw data from API:', data);
console.log('Processed categories:', data?.categories);
console.log('Processed contractors:', data?.contractors);
```

## 🚀 Quick Fix

Nếu tất cả data đều 0, có thể thêm test data:

```typescript
// Trong generateCategoryTimeline function, thêm fallback:
const safeCategory = {
  id: category.id,
  name: category.name,
  approved: category.approved || 15, // Test data
  pending: category.pending || 8,    // Test data  
  missing: category.missing || 3,    // Test data
  isCritical: category.isCritical || false,
  criticalReason: category.criticalReason || ''
};
```

## 📝 Next Steps

1. **Chạy debug steps** và ghi lại kết quả
2. **Xác định root cause** từ debug logs
3. **Apply appropriate solution** dựa trên issue type
4. **Test lại** sau khi fix
5. **Remove debug logs** khi đã fix xong

## 🔄 Cleanup

Sau khi fix xong, nhớ remove debug logs:
- `console.log` statements trong dashboard.tsx
- `console.log` statements trong CategoryDetailModal.tsx  
- `console.log` statements trong categoryTimelineUtils.ts
