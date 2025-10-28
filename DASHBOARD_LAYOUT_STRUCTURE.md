# 🎨 Dashboard Layout Structure - Clean & Organized

**Version:** 2.0 - Optimized BentoGrid  
**Date:** 2025-10-28  
**Status:** ✅ **Production Ready**

---

## 📐 Desktop Layout (1200px+)

```
┌─────────────────────────────────────────────────────────────────┐
│  HSE Dashboard - Xin chào Admin                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Filters: [Contractor ▼] [Category ▼] [Search...]               │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┬──────────────────────┬──────────────────────┐
│  KPI: Hoàn thành     │  KPI: Cảnh báo       │  KPI: Xử lý TB       │
│  Chỉ số Tổng quát    │  Rủi ro              │  Thời gian Trung bình │
│                      │                      │                      │
│  └─ Xem chi tiết     │  └─ Xem chi tiết     │  └─ Xem chi tiết     │
└──────────────────────┴──────────────────────┴──────────────────────┘

┌──────────────────────────────────┬──────────────────────────────────┐
│  Chart: So sánh Hiệu suất Radar   │  Chart: Hiệu suất theo Loại NCC  │
│  (Large Radar Chart)              │  (Performance Bars)               │
│                                   │                                  │
│  └─ Mở rộng                       │  └─ Mở rộng                      │
└──────────────────────────────────┴──────────────────────────────────┘

┌──────────────────────┬──────────────────────┬──────────────────────┐
│  Heatmap: NCC vs NCC │  Trend: Xu hướng      │  Category: Tiến độ    │
│  (Performance Heat)   │  (Time Series)        │  (Progress by Type)   │
│                      │                      │                      │
│  └─ Mở rộng          │  └─ Mở rộng          │  └─ Mở rộng          │
└──────────────────────┴──────────────────────┴──────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Timeline: Phân tích Thời gian (Full Width)                    │
│  ├─ Milestone Events                                            │
│  └─ Bottleneck Analysis                                         │
│  └─ Xem chi tiết                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 Tablet Layout (768px - 1024px)

```
┌──────────────────────────────────┐
│  KPI: Hoàn thành                 │
│  └─ Xem chi tiết                 │
├──────────────────────────────────┤
│  KPI: Cảnh báo                   │
│  └─ Xem chi tiết                 │
├─────────────────────────────────┐
│                                  │
│  KPI: Xử lý TB (Full Width)     │
│  └─ Xem chi tiết                │
└──────────────────────────────────┘

┌─────────────────────────────────┐
│  Radar (Full Width)              │
│  └─ Mở rộng                      │
├─────────────────────────────────┤
│  Performance Bars (Full Width)   │
│  └─ Mở rộng                      │
└─────────────────────────────────┘

┌──────────────────────┬──────────────────────┐
│  Heatmap             │  Trend               │
│  └─ Mở rộng          │  └─ Mở rộng          │
├──────────────────────┴──────────────────────┤
│  Category (Full Width)                      │
│  └─ Mở rộng                                 │
└─────────────────────────────────────────────┘
```

---

## 📲 Mobile Layout (<768px)

```
┌──────────────────────┐
│  KPI: Hoàn thành     │
│  └─ Xem chi tiết     │
├──────────────────────┤
│  KPI: Cảnh báo       │
│  └─ Xem chi tiết     │
├──────────────────────┤
│  KPI: Xử lý TB       │
│  └─ Xem chi tiết     │
├──────────────────────┤
│  Radar               │
│  └─ Mở rộng          │
├──────────────────────┤
│  Performance Bars    │
│  └─ Mở rộng          │
├──────────────────────┤
│  Heatmap             │
│  └─ Mở rộng          │
├──────────────────────┤
│  Trend               │
│  └─ Mở rộng          │
├──────────────────────┤
│  Category            │
│  └─ Mở rộng          │
├──────────────────────┤
│  Timeline            │
│  └─ Xem chi tiết     │
└──────────────────────┘
```

---

## 🏗️ Grid System

### **Desktop (12-column grid)**

| Component | Columns | Height | Notes |
|-----------|---------|--------|-------|
| KPI Cards (3x) | 4 each | 200px | Row 1 - Always 3 cards |
| Primary Charts (2x) | 6 each | 380px | Row 2 - Large & prominent |
| Secondary Charts (3x) | 4 each | 300px | Row 3 - Medium sized |
| Analysis Cards (3x) | 4 each | 300px | Row 4 - Medium sized |
| Timeline (Full Width) | 12 | 380px | Row 5 - Full span |

### **Tablet (8-column grid)**

| Component | Columns | Behavior |
|-----------|---------|----------|
| KPI Cards | 4, 4, 8 | 2 cards in row 1, 1 full-width |
| Primary Charts | 8 each | Full width, stacked |
| Secondary Charts | 4, 4, 8 | 2 per row, then full |
| Analysis Cards | 4, 4, 8 | 2 per row, then full |

### **Mobile (1-column grid)**

| Component | Columns | Behavior |
|-----------|---------|----------|
| All Cards | 1 | Full width, single column |
| All Charts | 1 | Full width, stacked vertically |

---

## 🎯 Layout Sections

### **Section 1: KPI Cards**
- **Row 1** - Desktop: 3 cards × 4 cols
- **Position:** Top, immediately under filters
- **Content:** 3 key metrics (Overall, Alerts, Processing Time)
- **Interaction:** Click to expand in modal
- **Height:** 200px (compact), fits well with header

### **Section 2: Primary Charts**
- **Row 2** - Desktop: 2 cards × 6 cols each
- **Position:** Mid-top prominence
- **Content:** Radar & Performance Bars (most detailed)
- **Interaction:** Click to expand in full modal
- **Height:** 380px (large, noticeable)

### **Section 3: Secondary Charts**
- **Row 3** - Desktop: 3 cards × 4 cols each
- **Position:** Mid-center
- **Content:** Heatmap, Trend, Category Progress
- **Interaction:** Click to view details
- **Height:** 300px (medium)

### **Section 4: Analysis Cards**
- **Row 4** - Desktop: 3 cards × 4 cols each
- **Position:** Mid-lower
- **Content:** Bottleneck, Timeline, Category Detail
- **Interaction:** Click to expand
- **Height:** 300px (medium)

### **Section 5: Timeline Full-Width**
- **Row 5** - Desktop: 1 card × 12 cols
- **Position:** Bottom emphasis
- **Content:** Processing Timeline & Analysis
- **Interaction:** Click to view full timeline
- **Height:** 380px (large)

---

## 🎨 Styling Consistency

### **Card Properties**
```css
/* All cards share */
background: white;
border-radius: 12px;
padding: 20px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
border: 1px solid #e5e7eb;

/* Hover effect */
transition: all 0.3s ease-in-out;
transform: translateY(-2px);
box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
border-color: #d1d5db;
```

### **Typography**
```
Title (h3): 14px, 600 weight, #374151, 0.5px letter-spacing
Subtitle: 12px, regular, #6b7280
```

### **Spacing**
```
Gap between cards: 20px (desktop), 16px (tablet), 12px (mobile)
Card padding: 20px (desktop), 16px (tablet), 12px (mobile)
Container padding: 20px (desktop), 16px (tablet), 12px (mobile)
```

---

## ✨ Visual Hierarchy

### **Prominence Levels**

1. **High (Top)** - KPI Cards
   - ✓ Immediately visible
   - ✓ 3 compact cards for quick scan
   - ✓ Color-coded for status

2. **Very High (Large)** - Primary Charts (Radar & Bars)
   - ✓ 6-column span each
   - ✓ 380px height
   - ✓ Most detailed information

3. **Medium** - Secondary Charts (Heatmap, Trend, Category)
   - ✓ 4-column span each
   - ✓ 300px height
   - ✓ Contextual details

4. **Medium** - Analysis Cards (Bottleneck, Timeline, Category)
   - ✓ 4-column span each
   - ✓ 300px height
   - ✓ Deep analysis

5. **Full-Width (Emphasis)** - Timeline
   - ✓ 12-column span
   - ✓ Bottom position
   - ✓ Comprehensive view

---

## 🔄 Animation & Transitions

### **Page Load**
```
All cards: slideIn animation (0.4s ease-out)
Staggered delays: 0.05s - 0.55s increments
Creates cascade effect
```

### **Hover**
```
Transform: -2px (up)
Shadow: 0 12px 32px (enhanced)
Duration: 0.3s ease-in-out
Border color: lighter shade
```

### **Modal Open**
```
Smooth fade + scale
Dialog: max-width 6xl, max-height 90vh
Content scrollable when needed
```

---

## 📊 Grid Classes Applied

### **Desktop Classes**
```css
.grid-kpi-overall { grid-column: span 4; }
.grid-kpi-critical { grid-column: span 4; }
.grid-kpi-time { grid-column: span 4; }

.grid-chart-primary-1 { grid-column: span 6; }
.grid-chart-primary-2 { grid-column: span 6; }

.grid-chart-secondary-1 { grid-column: span 4; }
.grid-chart-secondary-2 { grid-column: span 4; }
.grid-chart-secondary-3 { grid-column: span 4; }

.grid-bottleneck { grid-column: span 4; }
.grid-timeline { grid-column: span 4; }
.grid-category { grid-column: span 4; }

.grid-processing-time { grid-column: 1 / -1; }
```

---

## ✅ Benefits

1. **No Overlapping** - Each card has dedicated space
2. **Clear Organization** - Logical flow from top to bottom
3. **Visual Hierarchy** - Important content first
4. **Responsive** - Adapts to all screen sizes
5. **Performance** - Clean CSS grid, no messy positioning
6. **Accessibility** - Proper sizing, hover states, keyboard nav
7. **Scalability** - Easy to add/remove cards
8. **Beautiful** - Modern, clean, professional appearance

---

## 🚀 Implementation Files

- `bento-grid-unified.css` - Grid layout & styling
- `UnifiedDashboardLayout.tsx` - Component structure
- All 12 chart components - Integrated seamlessly

**Status:** ✅ **COMPLETE & DEPLOYED**
