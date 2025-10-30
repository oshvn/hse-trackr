# 🧪 Timeline Chart Test Guide

## Vấn đề
- Data đã được generate thành công
- Tất cả debug logs đều OK
- Nhưng chart không hiển thị trong Timeline tab
- Có lỗi 500 Internal Server Error khi load InteractiveChart.tsx

## 🛠️ Test Steps

### 1. Restart Dev Server
```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### 2. Test Fallback Chart
Sau khi restart, click vào category → Timeline tab:

**Expected Result:**
- Thấy một box màu xanh với text "Test Chart"
- Hiển thị "Data: 31 points" và "Contractors: 3"

**Nếu thấy Test Chart:**
✅ Chart container hoạt động bình thường
❌ Vấn đề là với Recharts component

**Nếu không thấy gì:**
❌ Vấn đề là với CSS hoặc container

### 3. Check Console Logs
Tìm logs:
```javascript
✅ InteractiveChart: Rendering chart with data {
  dataLength: 31,
  contractorsLength: 3,
  height: 400,
  sampleData: [...],
  dataKeys: [...],
  contractors: [...]
}
```

**Nếu có logs này:**
✅ Component render thành công
❌ Vấn đề là với CSS visibility

**Nếu không có logs:**
❌ Component không render

### 4. Check Data Format
Trong console, kiểm tra:
```javascript
// Sample data structure
sampleData: [
  {
    day: "Start",
    approved: 0,
    pending: 0,
    missing: 2,
    total: 2,
    "Contractor A Expected": 0,
    "Contractor A Actual": 0,
    // ... more contractor data
  }
]

// Data keys
dataKeys: ["day", "approved", "pending", "missing", "total", "Contractor A Expected", "Contractor A Actual", ...]
```

**Nếu dataKeys có contractor data:**
✅ Data format đúng cho Recharts
❌ Vấn đề là với Recharts rendering

**Nếu dataKeys chỉ có basic data:**
❌ Vấn đề là với data formatting

## 🔧 Possible Solutions

### Solution 1: Fix Recharts Import
```typescript
// Kiểm tra import trong InteractiveChart.tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Brush,
  ReferenceArea,
  ReferenceLine
} from 'recharts';
```

### Solution 2: Fix Data Format
```typescript
// Trong formatCategoryTimelineForChart function
// Đảm bảo contractor data được add đúng format
data.contractors.forEach(contractor => {
  chartData[`${contractor.name} Expected`] = contractor.progress[index] || 0;
  chartData[`${contractor.name} Actual`] = contractor.progress[index] || 0;
});
```

### Solution 3: Fix CSS Issues
```typescript
// Đảm bảo container có height
<div className="w-full h-full" style={{ height: 400 }}>
  <TestChart />
</div>
```

### Solution 4: Enable Recharts
Nếu Test Chart hoạt động, uncomment Recharts:

```typescript
// Comment out TestChart
{/* <TestChart /> */}

// Uncomment Recharts
<ResponsiveContainer width="100%" height={height}>
  <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
    // ... rest of chart
  </LineChart>
</ResponsiveContainer>
```

## 📊 Expected Results

### Test Chart (Current)
```
┌─────────────────────────┐
│        📊               │
│    Test Chart           │
│   Data: 31 points       │
│  Contractors: 3         │
└─────────────────────────┘
```

### Recharts Chart (Target)
```
┌─────────────────────────┐
│  Progress (%)           │
│ 100 ┤                   │
│  80 ┤ ●───●───●         │
│  60 ┤ ●───●───●         │
│  40 ┤ ●───●───●         │
│  20 ┤ ●───●───●         │
│   0 └───────────────────│
│     Start Day1 Day2 ... │
└─────────────────────────┘
```

## 🚀 Next Steps

1. **Restart dev server** và test Test Chart
2. **Nếu Test Chart hiển thị** → Fix Recharts component
3. **Nếu Test Chart không hiển thị** → Fix CSS/container
4. **Enable Recharts** khi Test Chart hoạt động
5. **Remove debug logs** khi hoàn thành

## 🔄 Cleanup

Sau khi fix xong:
- Remove `TestChart` component
- Uncomment Recharts code
- Remove debug `console.log` statements
- Test final functionality
