# 📋 Phase 1 Implementation Checklist - Chart Optimization

**Ngày**: 29/10/2025  
**Phiên bản**: Dashboard v2.0 Phase 1  
**Trạng thái**: 📋 **READY TO IMPLEMENT**

---

## 🎯 Phase 1 Overview

**Mục tiêu**: Enhance 3 core charts để phù hợp với admin quản lý 3 nhà thầu

**Timeline**: 2-3 ngày  
**Priority**: High  
**Impact**: High  

---

## 📊 Task 1: Enhanced RadarChart

### **1.1 Dynamic Contractor Names**
- [ ] **Update RadarChart interface**
  - [ ] Thêm `contractors: ContractorMetrics[]` prop
  - [ ] Loại bỏ hard-coded "Contractor A/B/C"
  - [ ] Sử dụng `contractor.name` từ data

- [ ] **Update radarData transformation**
  - [ ] Dynamic contractor names từ `contractors.map(c => c.name)`
  - [ ] Handle case khi có ít hơn 3 contractors
  - [ ] Handle case khi có nhiều hơn 3 contractors

- [ ] **Update chart rendering**
  - [ ] Dynamic Radar components cho mỗi contractor
  - [ ] Dynamic colors cho mỗi contractor
  - [ ] Update legend với real names

**Files to modify:**
- `src/components/dashboard/RadarChart.tsx`
- `src/pages/dashboard.tsx` (data passing)

**Estimated time**: 2 hours

### **1.2 Configurable Metrics**
- [ ] **Add metrics configuration**
  - [ ] Thêm `selectedMetrics` prop với default values
  - [ ] Tạo `metricLabels` mapping
  - [ ] Add metric selector UI (optional)

- [ ] **Update radarData structure**
  - [ ] Dynamic dimensions dựa trên `selectedMetrics`
  - [ ] Handle missing metrics gracefully
  - [ ] Maintain backward compatibility

- [ ] **Add metric configuration UI**
  - [ ] Metric selector buttons
  - [ ] Toggle metrics on/off
  - [ ] Save preferences (localStorage)

**Files to modify:**
- `src/components/dashboard/RadarChart.tsx`
- `src/components/dashboard/RadarChart.tsx` (UI)

**Estimated time**: 3 hours

### **1.3 Trend Indicators**
- [ ] **Add trend data structure**
  - [ ] Thêm `previousValues` vào contractor data
  - [ ] Calculate trend direction (up/down/same)
  - [ ] Add trend icons (↗️↘️→)

- [ ] **Update tooltip**
  - [ ] Show current value + trend indicator
  - [ ] Show percentage change
  - [ ] Color code trends (green/red/gray)

- [ ] **Add trend visualization**
  - [ ] Small trend arrows trên chart
  - [ ] Trend summary trong header
  - [ ] Hover effects cho trends

**Files to modify:**
- `src/hooks/useDashboardData.ts` (add trend data)
- `src/components/dashboard/RadarChart.tsx`

**Estimated time**: 2 hours

### **1.4 Drill-down Capability**
- [ ] **Add click handlers**
  - [ ] `onContractorClick` prop
  - [ ] Pass contractor data to parent
  - [ ] Handle click events

- [ ] **Add contractor detail modal**
  - [ ] Create `ContractorDetailModal` component
  - [ ] Show detailed metrics
  - [ ] Show historical data
  - [ ] Add action buttons

- [ ] **Update dashboard integration**
  - [ ] Handle modal state
  - [ ] Pass contractor data
  - [ ] Add modal to dashboard

**Files to modify:**
- `src/components/dashboard/RadarChart.tsx`
- `src/components/modals/ContractorDetailModal.tsx` (new)
- `src/pages/dashboard.tsx`

**Estimated time**: 4 hours

---

## 📊 Task 2: Enhanced BarChart

### **2.1 Multiple Metrics**
- [ ] **Update BarChart interface**
  - [ ] Thêm `metrics` prop với default ['completion']
  - [ ] Support multiple metrics: completion, quality, compliance
  - [ ] Add metric labels mapping

- [ ] **Update chart data structure**
  - [ ] Transform data cho multiple metrics
  - [ ] Handle different metric scales
  - [ ] Add metric-specific colors

- [ ] **Update chart rendering**
  - [ ] Multiple Bar components
  - [ ] Stacked or grouped bars
  - [ ] Dynamic legend
  - [ ] Metric-specific tooltips

**Files to modify:**
- `src/components/dashboard/BarChartComparison.tsx`
- `src/pages/dashboard.tsx`

**Estimated time**: 3 hours

### **2.2 Deadline Indicators**
- [ ] **Add deadline data**
  - [ ] Thêm `deadlines` prop
  - [ ] Calculate days until deadline
  - [ ] Add deadline status (on-time, overdue, critical)

- [ ] **Add deadline visualization**
  - [ ] Reference lines cho target values
  - [ ] Color coding cho deadline status
  - [ ] Deadline indicators trên bars

- [ ] **Update tooltip**
  - [ ] Show deadline information
  - [ ] Show days remaining/overdue
  - [ ] Add deadline warnings

**Files to modify:**
- `src/components/dashboard/BarChartComparison.tsx`
- `src/hooks/useDashboardData.ts`

**Estimated time**: 2 hours

### **2.3 Trend Information**
- [ ] **Add trend data**
  - [ ] Previous period data
  - [ ] Calculate trend direction
  - [ ] Add trend indicators

- [ ] **Update chart display**
  - [ ] Trend arrows trên bars
  - [ ] Trend summary trong header
  - [ ] Hover effects cho trends

**Files to modify:**
- `src/components/dashboard/BarChartComparison.tsx`

**Estimated time**: 1 hour

---

## 📊 Task 3: Contractor-specific CategoryProgress

### **3.1 Contractor Tabs**
- [ ] **Add contractor tabs**
  - [ ] Tab navigation UI
  - [ ] Active tab state
  - [ ] Tab switching logic

- [ ] **Update data structure**
  - [ ] Contractor-specific category data
  - [ ] Handle tab switching
  - [ ] Maintain state

- [ ] **Add tab styling**
  - [ ] Active/inactive tab styles
  - [ ] Hover effects
  - [ ] Responsive design

**Files to modify:**
- `src/components/dashboard/CategoryProgress.tsx`
- `src/hooks/useDashboardData.ts`

**Estimated time**: 3 hours

### **3.2 Critical Document Highlighting**
- [ ] **Add critical document logic**
  - [ ] Define critical document criteria
  - [ ] Add critical status to data
  - [ ] Calculate criticality score

- [ ] **Add visual indicators**
  - [ ] Critical document badges
  - [ ] Color coding cho critical items
  - [ ] Priority indicators

- [ ] **Update progress bars**
  - [ ] Highlight critical segments
  - [ ] Add critical document counts
  - [ ] Show critical percentage

**Files to modify:**
- `src/components/dashboard/CategoryProgress.tsx`
- `src/hooks/useDashboardData.ts`

**Estimated time**: 2 hours

### **3.3 Deadline Indicators**
- [ ] **Add deadline data**
  - [ ] Document deadline information
  - [ ] Calculate days until deadline
  - [ ] Add deadline status

- [ ] **Add deadline visualization**
  - [ ] Deadline indicators
  - [ ] Color coding cho deadlines
  - [ ] Deadline warnings

**Files to modify:**
- `src/components/dashboard/CategoryProgress.tsx`

**Estimated time**: 1 hour

---

## 🔧 Implementation Steps

### **Step 1: Data Structure Updates**
1. [ ] Update `useDashboardData.ts` với trend data
2. [ ] Add contractor-specific category data
3. [ ] Add deadline information
4. [ ] Test data structure changes

### **Step 2: RadarChart Enhancements**
1. [ ] Implement dynamic contractor names
2. [ ] Add configurable metrics
3. [ ] Add trend indicators
4. [ ] Add drill-down capability
5. [ ] Test RadarChart functionality

### **Step 3: BarChart Enhancements**
1. [ ] Implement multiple metrics
2. [ ] Add deadline indicators
3. [ ] Add trend information
4. [ ] Test BarChart functionality

### **Step 4: CategoryProgress Enhancements**
1. [ ] Implement contractor tabs
2. [ ] Add critical document highlighting
3. [ ] Add deadline indicators
4. [ ] Test CategoryProgress functionality

### **Step 5: Integration & Testing**
1. [ ] Update dashboard.tsx với new props
2. [ ] Test all chart interactions
3. [ ] Test responsive behavior
4. [ ] Test performance
5. [ ] Fix any bugs

---

## 📋 Testing Checklist

### **Functional Testing**
- [ ] All charts render correctly
- [ ] Dynamic contractor names work
- [ ] Metric configuration works
- [ ] Trend indicators display correctly
- [ ] Drill-down functionality works
- [ ] Multiple metrics display correctly
- [ ] Deadline indicators show correctly
- [ ] Contractor tabs work
- [ ] Critical highlighting works

### **Responsive Testing**
- [ ] Charts work on mobile (375px)
- [ ] Charts work on tablet (768px)
- [ ] Charts work on desktop (1024px+)
- [ ] Charts work on large desktop (1920px)
- [ ] Tabs work on all screen sizes
- [ ] Tooltips work on all screen sizes

### **Performance Testing**
- [ ] Charts load quickly
- [ ] No memory leaks
- [ ] Smooth animations
- [ ] No console errors
- [ ] Good user experience

### **Data Testing**
- [ ] Handle empty data gracefully
- [ ] Handle missing contractors
- [ ] Handle missing metrics
- [ ] Handle invalid data
- [ ] Data updates correctly

---

## 🎯 Success Criteria

### **Must Have (MVP)**
- [ ] Dynamic contractor names thay vì hard-coded
- [ ] Multiple metrics trong BarChart
- [ ] Contractor tabs trong CategoryProgress
- [ ] All charts render without errors
- [ ] Responsive trên all screen sizes

### **Should Have**
- [ ] Trend indicators
- [ ] Deadline indicators
- [ ] Critical document highlighting
- [ ] Drill-down capability
- [ ] Configurable metrics

### **Nice to Have**
- [ ] Advanced filtering
- [ ] Export capabilities
- [ ] Real-time updates
- [ ] Advanced animations

---

## 📊 Estimated Timeline

| Task | Estimated Time | Dependencies |
|------|----------------|--------------|
| Data Structure Updates | 2 hours | None |
| RadarChart Enhancements | 11 hours | Data Structure |
| BarChart Enhancements | 6 hours | Data Structure |
| CategoryProgress Enhancements | 6 hours | Data Structure |
| Integration & Testing | 4 hours | All above |
| **Total** | **29 hours** | **~3-4 days** |

---

## 🚀 Ready to Start?

**Next Action**: Begin với Task 1.1 - Dynamic Contractor Names

**First File**: `src/components/dashboard/RadarChart.tsx`

**First Change**: Update interface và data transformation

Bạn có muốn tôi bắt đầu implement Task 1.1 không? 🚀
