# 📐 Tính toán lại chiều rộng Admin Dashboard

## 🎯 Phân tích chiều rộng thực tế

### **Cấu trúc Layout**
```
┌─────────────────────────────────────────────────────────┐
│ VIEWPORT: 1920px × 961px                               │
├─────────────────────────────────────────────────────────┤
│ SIDEBAR: 256px (mở) / 56px (thu gọn)                   │
│ HEADER: 64px (chiều cao)                               │
│ MAIN CONTENT: 1920px - 256px = 1664px (khi sidebar mở) │
│ MAIN CONTENT: 1920px - 56px = 1864px (khi sidebar thu) │
├─────────────────────────────────────────────────────────┤
│ DASHBOARD GRID:                                        │
│ - Padding: 24px × 2 = 48px                            │
│ - Effective width: 1664px - 48px = 1616px (sidebar mở) │
│ - Effective width: 1864px - 48px = 1816px (sidebar thu)│
└─────────────────────────────────────────────────────────┘
```

### **Breakpoints thực tế cần thiết**

#### **1. Sidebar mở (256px)**
- **1200px viewport**: 1200px - 256px - 48px = **896px** effective
- **1400px viewport**: 1400px - 256px - 48px = **1096px** effective  
- **1600px viewport**: 1600px - 256px - 48px = **1296px** effective
- **1920px viewport**: 1920px - 256px - 48px = **1616px** effective

#### **2. Sidebar thu gọn (56px)**
- **1200px viewport**: 1200px - 56px - 48px = **1096px** effective
- **1400px viewport**: 1400px - 56px - 48px = **1296px** effective
- **1600px viewport**: 1600px - 56px - 48px = **1496px** effective
- **1920px viewport**: 1920px - 56px - 48px = **1816px** effective

### **Vấn đề với thiết kế hiện tại**
1. **Breakpoints không phù hợp**: `xl: 1280px` không tính đến sidebar
2. **Grid quá lớn**: 16-20 cột không phù hợp với chiều rộng thực tế
3. **Không tính sidebar**: Thiết kế không xem xét sidebar có thể thu gọn

### **Giải pháp đúng**
Cần thiết kế responsive dựa trên **effective width** thay vì viewport width.
