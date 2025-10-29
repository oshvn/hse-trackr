# 📐 Technical Specification - Dashboard v2.0
**Version:** 2.0  
**Date:** 2025-10-29  
**Target:** Developer Implementation Guide

---

## 🎯 Overview

Executive dashboard for monitoring 3 contractors' document submission & approval process with **improved decision-making flow** and **modal drill-down system**.

---

## 🏗️ Architecture

```
src/
├── components/
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx          # Main container
│   │   ├── AlertBanner.tsx              # 🆕 Critical alerts banner
│   │   ├── KpiSection.tsx               # 3 KPI cards + ranking
│   │   ├── RadarChart.tsx               # Contractor comparison
│   │   ├── AIActionsPanel.tsx           # 🆕 Grouped actions
│   │   ├── BarChartComparison.tsx       # 🆕 Replace heatmap
│   │   ├── CategoryProgress.tsx         # Doc type progress
│   │   ├── MiniTimeline.tsx             # 🆕 30-day overview
│   │   └── GanttTimeline.tsx            # Full timeline (collapsible)
│   │
│   ├── modals/
│   │   ├── ModalContainer.tsx           # Shared modal wrapper
│   │   ├── RadarDetailModal.tsx         # Contractor details
│   │   ├── AlertsModal.tsx              # Red cards list
│   │   ├── ActionsModal.tsx             # AI actions detail
│   │   ├── CategoryModal.tsx            # Doc category breakdown
│   │   └── TimelineModal.tsx            # Full Gantt view
│   │
│   └── shared/
│       ├── Button.tsx
│       ├── Badge.tsx
│       ├── Card.tsx
│       └── Tooltip.tsx
│
├── hooks/
│   ├── useDashboardData.ts             # Data fetching
│   ├── useModal.ts                     # Modal state management
│   └── useFilters.ts                   # Filter sync across components
│
├── types/
│   └── dashboard.types.ts              # TypeScript interfaces
│
└── utils/
    ├── calculations.ts                 # KPI calculations
    └── formatters.ts                   # Date/number formatters
```

---

## 📱 Component Specifications

### **1. AlertBanner Component** 🆕

**Location:** Top of page (sticky on scroll)  
**Priority:** P0 (Critical)

#### Props Interface
```typescript
interface AlertBannerProps {
  criticalCount: number;
  blockingCount: number;
  overdueDocs: number;
  missingDocs: number;
  onViewAll: () => void;
  onTakeAction: () => void;
}
```

#### Visual Specs
```css
.alert-banner {
  position: sticky;
  top: 0;
  z-index: 100;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-left: 6px solid #dc2626;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
}

.alert-icon {
  width: 32px;
  height: 32px;
  color: #dc2626;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

#### Behavior
- **Always visible** when criticalCount > 0
- **Auto-hide** when criticalCount === 0 (smooth slide-up animation)
- **Click "View All"** → Opens `AlertsModal`
- **Click "Take Action"** → Opens `ActionsModal` filtered to urgent

---

### **2. KpiSection Component** 🔄

**Layout:** 3 cards + 1 ranking card (span 4 cols each on desktop)

#### Props Interface
```typescript
interface KpiSectionProps {
  overall: {
    value: number;
    trend: number;
    trendDirection: 'up' | 'down';
  };
  processingTime: {
    avgDays: number;
    prepDays: number;
    approvalDays: number;
  };
  contractors: Array<{
    id: string;
    name: string;
    score: number;
    rank: number;
    status: 'excellent' | 'good' | 'needs-attention';
  }>;
  onCardClick: (cardType: string) => void;
}
```

#### Desktop Layout
```
┌───────────┬───────────┬───────────┬───────────┐
│ Overall   │ Processing│ Ranking   │           │
│ 75% ↑     │ 8.5 days  │ 1. A 92%  │ (empty)   │
│           │           │ 2. C 78%  │           │
│           │           │ 3. B 65%⚠️│           │
└───────────┴───────────┴───────────┴───────────┘
```

#### Ranking Card Logic
```typescript
// Auto-sort by score descending
const sortedContractors = contractors.sort((a, b) => b.score - a.score);

// Assign rank
sortedContractors.forEach((c, idx) => {
  c.rank = idx + 1;
  c.status = c.score >= 80 ? 'excellent' 
            : c.score >= 60 ? 'good' 
            : 'needs-attention';
});
```

#### Click Behavior
- **Overall Card** → Opens `CategoryModal` (breakdown by doc type)
- **Processing Time** → Opens `TimelineModal` (Gantt view)
- **Ranking Card** → Opens `RadarDetailModal` (comparison details)

---

### **3. AIActionsPanel Component** 🆕

**Priority:** P0 (Critical for decision-making)

#### Props Interface
```typescript
interface AIActionsPanelProps {
  actions: Array<{
    id: string;
    title: string;
    description: string;
    urgency: 'urgent' | 'this-week' | 'planned';
    contractor: string;
    docCount?: number;
    actionType: 'email' | 'meeting' | 'support' | 'escalate';
    dueDate?: Date;
  }>;
  onActionClick: (actionId: string) => void;
  onExecute: (actionId: string) => void;
}
```

#### Visual Structure
```tsx
<div className="ai-actions-panel">
  {/* Grouped by urgency */}
  <section className="urgent-group">
    <h3>🚨 Urgent ({urgentCount})</h3>
    {urgentActions.map(action => (
      <ActionCard 
        action={action}
        variant="urgent"
        showExecuteButton
      />
    ))}
  </section>

  <section className="this-week-group">
    <h3>⏰ This Week ({weekCount})</h3>
    {weekActions.map(action => (
      <ActionCard action={action} variant="this-week" />
    ))}
  </section>

  <section className="planned-group" collapsed>
    <h3>📋 Planned ({plannedCount})</h3>
    {/* Collapsed by default */}
  </section>
</div>
```

#### Action Card States
```css
/* Urgent - Red accent */
.action-card.urgent {
  border-left: 4px solid #dc2626;
  background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
}

/* This Week - Orange accent */
.action-card.this-week {
  border-left: 4px solid #f59e0b;
  background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
}

/* Planned - Blue accent */
.action-card.planned {
  border-left: 4px solid #3b82f6;
  background: #f9fafb;
}
```

#### Click Behavior
- **Click card** → Opens `ActionsModal` with action details
- **Click "Execute" button** → Shows confirmation dialog → Executes action
- **Hover** → Shows tooltip with full description

---

### **4. BarChartComparison Component** 🆕

**Replaces:** ContractorHeatmap  
**Reason:** Easier to compare contractors at a glance

#### Props Interface
```typescript
interface BarChartComparisonProps {
  contractors: Array<{
    id: string;
    name: string;
    categories: Array<{
      name: string;
      completion: number;
      total: number;
      approved: number;
    }>;
  }>;
  sortBy: 'contractor' | 'category';
  onBarClick: (contractor: string, category: string) => void;
}
```

#### Visual Layout
```
Contractor A  ████████░░ 80%
Contractor B  ████░░░░░░ 45%  ← Low, highlighted red
Contractor C  ███████░░░ 72%

Categories:
Safety        ████████░░ 75%
Quality       █████████░ 85%
Environment   ██████░░░░ 60%
Construction  ████████░░ 78%
```

#### Color Logic
```typescript
const getBarColor = (completion: number) => {
  if (completion >= 80) return '#10b981'; // Green
  if (completion >= 60) return '#f59e0b'; // Yellow
  return '#ef4444'; // Red
};
```

#### Click Behavior
- **Click bar** → Opens `CategoryModal` filtered to that contractor + category
- **Hover** → Shows tooltip: "Contractor A - Safety: 12/15 docs (80%)"

---

### **5. MiniTimeline Component** 🆕

**Location:** Secondary charts row  
**Purpose:** 30-day progress overview

#### Props Interface
```typescript
interface MiniTimelineProps {
  contractors: Array<{
    id: string;
    name: string;
    color: string;
    dataPoints: Array<{
      date: Date;
      completion: number;
      expected: number;
    }>;
  }>;
  onExpand: () => void;
}
```

#### Visual Design
```
┌─────────────────────────────────┐
│ Last 30 Days Progress           │
├─────────────────────────────────┤
│     │                           │
│ 100%│         ──── Expected     │
│     │       ╱                   │
│  75%│     ╱  ───── Actual       │
│     │   ╱  ╱                    │
│  50%│ ╱  ╱                      │
│     │╱ ╱                        │
│   0%└────────────────────────── │
│     30d    15d    Today         │
└─────────────────────────────────┘
```

#### Click Behavior
- **Click anywhere** → Opens `TimelineModal` (full Gantt)
- **Hover data point** → Shows date + completion %

---

## 🎭 Modal System

### **Modal Container Specs**

```typescript
interface ModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

#### Size Mapping
```css
.modal-sm  { max-width: 500px; }
.modal-md  { max-width: 768px; }
.modal-lg  { max-width: 1024px; }
.modal-xl  { max-width: 1280px; }
.modal-fullscreen { width: 95vw; height: 95vh; }
```

#### Animation
```css
@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-content {
  animation: modalFadeIn 0.2s ease-out;
}
```

---

### **Modal 1: AlertsModal**

**Trigger:** Click Alert Banner "View All"  
**Size:** lg (1024px)

#### Content Structure
```tsx
<ModalContainer title="🚨 Critical Alerts" size="lg">
  <Tabs>
    <Tab label="Blocking (3)" variant="critical">
      <AlertList 
        alerts={blockingAlerts}
        groupBy="contractor"
        showImpact
      />
    </Tab>
    
    <Tab label="Overdue (7)">
      <AlertList 
        alerts={overdueAlerts}
        groupBy="dueDate"
        showDaysOverdue
      />
    </Tab>
    
    <Tab label="Missing (5)">
      <AlertList 
        alerts={missingAlerts}
        groupBy="category"
        showRequiredBy
      />
    </Tab>
  </Tabs>

  <ModalFooter>
    <Button variant="primary" onClick={handleBulkEmail}>
      📧 Email All Contractors
    </Button>
    <Button variant="secondary" onClick={handleExport}>
      📥 Export List
    </Button>
  </ModalFooter>
</ModalContainer>
```

#### Alert Item Structure
```tsx
<div className="alert-item blocking">
  <div className="alert-header">
    <Badge variant="critical">BLOCKING</Badge>
    <span className="contractor-name">Contractor B</span>
  </div>
  
  <div className="alert-body">
    <h4>Safety Plan - Excavation Method</h4>
    <p className="impact">
      ⚠️ Impact: Cannot start foundation work
    </p>
    <p className="deadline">
      Required by: Nov 5, 2025 (7 days overdue)
    </p>
  </div>
  
  <div className="alert-actions">
    <Button size="sm" onClick={handleSendReminder}>
      Send Reminder
    </Button>
    <Button size="sm" variant="secondary" onClick={handleViewDoc}>
      View Details
    </Button>
  </div>
</div>
```

---

### **Modal 2: RadarDetailModal**

**Trigger:** Click Radar Chart or Ranking Card  
**Size:** xl (1280px)

#### Content Structure
```tsx
<ModalContainer title="Contractor Performance Details" size="xl">
  <ContractorSelector 
    contractors={contractors}
    selected={selectedContractors}
    onSelectionChange={handleSelectionChange}
    maxSelection={3}
  />

  <div className="modal-body-grid">
    {/* Left: Radar Chart */}
    <div className="chart-section">
      <RadarChart 
        data={selectedContractors}
        interactive
        showLabels
      />
      <Legend 
        items={contractors}
        showScores
      />
    </div>

    {/* Right: Metrics Table */}
    <div className="metrics-section">
      <MetricsTable>
        <thead>
          <tr>
            <th>Metric</th>
            {selectedContractors.map(c => (
              <th key={c.id}>{c.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Completion Rate</td>
            <td className="score-high">92%</td>
            <td className="score-low">65%</td>
            <td className="score-medium">78%</td>
          </tr>
          <tr>
            <td>On-time Delivery</td>
            <td className="score-high">88%</td>
            <td className="score-medium">72%</td>
            <td className="score-high">85%</td>
          </tr>
          {/* ... more metrics */}
        </tbody>
      </MetricsTable>
    </div>
  </div>

  {/* Drill-down section */}
  <Accordion title="Detailed Breakdown by Category">
    <CategoryBreakdownTable 
      contractor={selectedContractors[0]}
      expandable
    />
  </Accordion>

  <ModalFooter>
    <Button onClick={handleExportReport}>
      📊 Export Report
    </Button>
    <Button variant="secondary" onClick={handleCompare}>
      Compare All 3
    </Button>
  </ModalFooter>
</ModalContainer>
```

---

### **Modal 3: ActionsModal**

**Trigger:** Click AI Action Card  
**Size:** md (768px)

#### Content Structure
```tsx
<ModalContainer title="Action Details" size="md">
  <ActionDetail>
    <header>
      <Badge variant={action.urgency}>
        {action.urgency === 'urgent' ? '🚨 URGENT' : '⏰ THIS WEEK'}
      </Badge>
      <h2>{action.title}</h2>
    </header>

    <section className="action-context">
      <InfoRow label="Contractor" value={action.contractor} />
      <InfoRow label="Related Docs" value={action.docCount} />
      <InfoRow label="Due Date" value={formatDate(action.dueDate)} />
      <InfoRow label="Impact" value={action.impact} highlight />
    </section>

    <section className="action-description">
      <h3>Recommended Action</h3>
      <p>{action.description}</p>
    </section>

    <section className="action-email-preview">
      <h3>📧 Email Preview</h3>
      <EmailTemplate 
        to={action.contractor}
        subject={action.emailSubject}
        body={action.emailBody}
        editable
      />
    </section>

    <section className="action-documents">
      <h3>📎 Related Documents ({action.docs.length})</h3>
      <DocumentList 
        documents={action.docs}
        showStatus
        showDeadline
      />
    </section>
  </ActionDetail>

  <ModalFooter>
    <Button 
      variant="primary" 
      onClick={handleExecute}
      disabled={isExecuting}
    >
      {isExecuting ? 'Sending...' : '✉️ Send Email Now'}
    </Button>
    <Button 
      variant="secondary" 
      onClick={handleSchedule}
    >
      📅 Schedule for Later
    </Button>
    <Button 
      variant="ghost" 
      onClick={handleDismiss}
    >
      Dismiss
    </Button>
  </ModalFooter>
</ModalContainer>
```

---

### **Modal 4: CategoryModal**

**Trigger:** Click Category Progress Chart or Bar Chart  
**Size:** lg (1024px)

#### Content Structure
```tsx
<ModalContainer title="Category Details: Safety Plans" size="lg">
  <Tabs>
    <Tab label="Overview">
      <CategoryOverview>
        <ProgressRing 
          value={75} 
          total={100}
          size="large"
          label="75% Complete"
        />
        <StatsGrid>
          <Stat label="Approved" value={12} color="green" />
          <Stat label="Pending" value={3} color="yellow" />
          <Stat label="Missing" value={1} color="red" />
          <Stat label="Overdue" value={2} color="red" />
        </StatsGrid>
      </CategoryOverview>
    </Tab>

    <Tab label="By Contractor">
      <ContractorBreakdown>
        {contractors.map(contractor => (
          <ContractorSection key={contractor.id}>
            <header>
              <h3>{contractor.name}</h3>
              <ProgressBar 
                value={contractor.categoryCompletion}
                variant={getVariantByScore(contractor.categoryCompletion)}
              />
            </header>
            
            <DocumentList 
              documents={contractor.documents}
              category="Safety"
              showStatus
              expandable
            />
          </ContractorSection>
        ))}
      </ContractorBreakdown>
    </Tab>

    <Tab label="Timeline">
      <CategoryTimeline 
        category="Safety"
        events={timelineEvents}
        showMilestones
      />
    </Tab>
  </Tabs>

  <ModalFooter>
    <Button onClick={handleSendReminders}>
      Send Reminders for Missing Docs
    </Button>
    <Button variant="secondary" onClick={handleExport}>
      Export Category Report
    </Button>
  </ModalFooter>
</ModalContainer>
```

---

### **Modal 5: TimelineModal**

**Trigger:** Click Mini Timeline or Gantt Chart  
**Size:** fullscreen (95vw × 95vh)

#### Content Structure
```tsx
<ModalContainer title="Full Project Timeline" size="fullscreen">
  <TimelineControls>
    <DateRangePicker 
      value={dateRange}
      onChange={handleDateChange}
    />
    <ViewToggle 
      options={['Day', 'Week', 'Month']}
      value={timelineView}
      onChange={setTimelineView}
    />
    <FilterGroup>
      <ContractorFilter />
      <StatusFilter />
      <CategoryFilter />
    </FilterGroup>
  </TimelineControls>

  <GanttChart
    contractors={contractors}
    view={timelineView}
    dateRange={dateRange}
    interactive
    editable={false}
    onTaskClick={handleTaskClick}
    onDateHover={handleDateHover}
  >
    {/* Gantt bars with milestones */}
    {contractors.map(contractor => (
      <GanttRow key={contractor.id}>
        <RowHeader>{contractor.name}</RowHeader>
        <TaskBars>
          <TaskBar 
            phase="submission"
            start={contractor.submissionStart}
            end={contractor.submissionEnd}
            progress={contractor.submissionProgress}
          />
          <TaskBar 
            phase="review"
            start={contractor.reviewStart}
            end={contractor.reviewEnd}
            progress={contractor.reviewProgress}
          />
          <TaskBar 
            phase="approval"
            start={contractor.approvalStart}
            end={contractor.approvalEnd}
            progress={contractor.approvalProgress}
          />
        </TaskBars>
      </GanttRow>
    ))}
  </GanttChart>

  <TimelineLegend>
    <LegendItem color="#3b82f6" label="Submission Phase" />
    <LegendItem color="#f59e0b" label="Review Phase" />
    <LegendItem color="#10b981" label="Approval Phase" />
    <LegendItem color="#ef4444" label="Overdue" />
  </TimelineLegend>

  <ModalFooter>
    <Button onClick={handleExportTimeline}>
      📥 Export Timeline (PDF)
    </Button>
    <Button variant="secondary" onClick={handlePrintView}>
      🖨️ Print View
    </Button>
  </ModalFooter>
</ModalContainer>
```

---

## 🎨 Design Tokens

```typescript
// colors.ts
export const colors = {
  // Contractor colors (consistent across all charts)
  contractor: {
    A: '#3b82f6', // Blue
    B: '#10b981', // Green
    C: '#f59e0b', // Orange
  },

  // Status colors
  status: {
    approved: '#10b981',
    pending: '#f59e0b',
    missing: '#ef4444',
    overdue: '#dc2626',
  },

  // Alert levels
  alert: {
    critical: '#dc2626',
    warning: '#f59e0b',
    info: '#3b82f6',
  },

  // Performance scores
  performance: {
    high: '#10b981',    // >80%
    medium: '#f59e0b',  // 50-80%
    low: '#ef4444',     // <50%
  },

  // UI colors
  ui: {
    background: '#ffffff',
    surface: '#f9fafb',
    border: '#e5e7eb',
    text: {
      primary: '#1f2937',
      secondary: '#6b7280',
      muted: '#9ca3af',
    },
  },
};

// spacing.ts
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
  xxxl: '48px',
};

// typography.ts
export const typography = {
  h1: {
    fontSize: '32px',
    fontWeight: 700,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: '24px',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  h3: {
    fontSize: '18px',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  body: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  small: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: 1.4,
  },
  caption: {
    fontSize: '11px',
    fontWeight: 500,
    lineHeight: 1.3,
  },
};

// breakpoints.ts
export const breakpoints = {
  mobile: '0px',
  tablet: '768px',
  desktop: '1200px',
  wide: '1920px',
};
```

---

## 📊 Data Flow

### **Data Fetching Strategy**

```typescript
// hooks/useDashboardData.ts
export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Parallel fetch all data
        const [
          contractors,
          alerts,
          actions,
          timeline
        ] = await Promise.all([
          api.getContractors(),
          api.getAlerts(),
          api.getAIActions(),
          api.getTimeline(),
        ]);

        // Calculate derived metrics
        const kpis = calculateKPIs(contractors);
        const rankings = calculateRankings(contractors);

        setData({
          contractors,
          alerts,
          actions,
          timeline,
          kpis,
          rankings,
        });
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
}
```

### **Filter Synchronization**

```typescript
// hooks/useFilters.ts
export function useFilters() {
  const [filters, setFilters] = useState<Filters>({
    contractors: [],
    categories: [],
    dateRange: { start: null, end: null },
    status: [],
  });

  // Sync filters across all components
  const updateFilter = useCallback((key: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  return { filters, updateFilter };
}
```

---

## 🔗 API Contract

### **Endpoint 1: Get Dashboard Data**

```typescript
GET /api/v1/dashboard

Response:
{
  contractors: [
    {
      id: "contractor-a",
      name: "Contractor A",
      score: 92,
      rank: 1,
      metrics: {
        completionRate: 92,
        onTimeDelivery: 88,
        qualityScore: 95,
        complianceScore: 90,
        responseTime: 89
      },
      categories: [
        {
          name: "Safety",
          total: 15,
          approved: 12,
          pending: 2,
          missing: 1,
          completion: 80
        },
        // ... more categories
      ],
      timeline: {
        submissionStart: "2025-09-01",
        submissionEnd: "2025-09-30",
        submissionProgress: 100,
        reviewStart: "2025-10-01",
        reviewEnd: "2025-10-15",
        reviewProgress: 75,
        approvalStart: "2025-10-16",
        approvalEnd: "2025-10-31",
        approvalProgress: 50
      }
    },
    // ... more contractors
  ],
  alerts: {
    critical: [
      {
        id: "alert-1",
        contractor: "contractor-b",
        documentName: "Safety Plan - Excavation",
        category: "Safety",
        severity: "blocking",
        impact: "Cannot start foundation work",
        daysOverdue: 7,
        deadline: "2025-11-05",
        status: "missing"
      },
      // ... more alerts
    ],
    overdue: [...],
    missing: [...]
  },
  aiActions: [
    {
      id: "action-1",
      title: "Send deadline reminder",
      description: "Email Contractor B about 5 overdue documents",
      urgency: "urgent",
      contractor: "contractor-b",
      actionType: "email",
      docCount: 5,
      dueDate: "2025-10-30",
      emailTemplate: {
        subject: "Urgent: 5 documents overdue",
        body: "..."
      },
      relatedDocs: [...]
    },
    // ... more actions
  ],
  kpis: {
    overallCompletion: 75,
    trend: 5,
    trendDirection: "up",
    processingTime: {
      avgDays: 8.5,
      prepDays: 5,
      approvalDays: 3.5
    },
    criticalCount: 12,
    blockingCount: 3,
    overdueCount: 7,
    missingCount: 5
  },
  lastUpdated: "2025-10-29T10:30:00Z"
}
```

### **Endpoint 2: Execute AI Action**

```typescript
POST /api/v1/actions/:actionId/execute

Request Body:
{
  actionId: "action-1",
  scheduledFor?: "2025-10-30T09:00:00Z", // Optional
  customMessage?: "..." // Optional override
}

Response:
{
  success: true,
  message: "Email sent successfully",
  executedAt: "2025-10-29T10:35:00Z",
  recipients: ["contractor-b@example.com"],
  affectedDocuments: [...],
  nextAction: {
    id: "action-2",
    title: "Follow-up in 2 days",
    scheduledFor: "2025-10-31T09:00:00Z"
  }
}
```

### **Endpoint 3: Get Modal Data**

```typescript
GET /api/v1/dashboard/modal/:type

Params:
- type: 'alerts' | 'radar' | 'actions' | 'category' | 'timeline'
- filters: URLSearchParams

Examples:
GET /api/v1/dashboard/modal/alerts?severity=critical
GET /api/v1/dashboard/modal/category?category=safety&contractor=contractor-b
GET /api/v1/dashboard/modal/timeline?start=2025-09-01&end=2025-11-30

Response: (Depends on type, see modal specs above)
```

---

## 🎯 User Stories

### **Story 1: Manager identifies problem contractor**
```
AS A manager
I WANT TO quickly identify which contractor is underperforming
SO THAT I can take immediate action

Acceptance Criteria:
✅ Dashboard loads in <3 seconds
✅ Ranking card shows contractors sorted by score
✅ Low-scoring contractors highlighted in red
✅ Click ranking card → Radar modal opens
✅ Radar modal shows detailed metrics comparison
✅ Can drill down to specific category issues
```

### **Story 2: Manager handles critical alerts**
```
AS A manager
I WANT TO see and act on blocking documents immediately
SO THAT construction can start on time

Acceptance Criteria:
✅ Alert banner visible when critical count > 0
✅ Banner shows blocking count prominently
✅ Click "View All" → Alerts modal opens
✅ Alerts grouped by severity (Blocking first)
✅ Can send reminder email with 1 click
✅ Can bulk-email all contractors
```

### **Story 3: Manager executes AI recommendation**
```
AS A manager
I WANT TO follow AI-recommended actions
SO THAT I can resolve bottlenecks efficiently

Acceptance Criteria:
✅ AI Actions panel shows grouped by urgency
✅ Urgent actions appear first (red accent)
✅ Click action → Modal shows full context
✅ Email preview is editable
✅ Can execute immediately or schedule
✅ Success confirmation appears after execution
```

### **Story 4: Manager reviews category progress**
```
AS A manager
I WANT TO see progress by document category
SO THAT I know which types are lagging

Acceptance Criteria:
✅ Category Progress chart shows all doc types
✅ Each category shows approved/pending/missing split
✅ Click category → Modal opens with contractor breakdown
✅ Can filter by contractor within modal
✅ Can export category report
```

### **Story 5: Manager checks timeline**
```
AS A manager
I WANT TO see full project timeline
SO THAT I can identify delays and plan ahead

Acceptance Criteria:
✅ Mini Timeline shows 30-day overview
✅ Expected vs Actual lines visible
✅ Click timeline → Full Gantt modal opens
✅ Gantt shows all 3 phases (Submission/Review/Approval)
✅ Can filter by contractor, status, category
✅ Can export timeline as PDF
```

---

## 🧪 Testing Requirements

### **Unit Tests**

```typescript
// Example: AlertBanner.test.tsx
describe('AlertBanner', () => {
  it('renders when critical count > 0', () => {
    const { getByText } = render(
      <AlertBanner criticalCount={12} blockingCount={3} />
    );
    expect(getByText('12')).toBeInTheDocument();
  });

  it('hides when critical count = 0', () => {
    const { container } = render(
      <AlertBanner criticalCount={0} blockingCount={0} />
    );
    expect(container.firstChild).toHaveClass('hidden');
  });

  it('opens modal on View All click', () => {
    const onViewAll = jest.fn();
    const { getByText } = render(
      <AlertBanner 
        criticalCount={12} 
        onViewAll={onViewAll} 
      />
    );
    fireEvent.click(getByText('View All'));
    expect(onViewAll).toHaveBeenCalled();
  });
});
```

### **Integration Tests**

```typescript
// Example: Dashboard flow test
describe('Dashboard Integration', () => {
  it('completes full drill-down flow', async () => {
    // 1. Load dashboard
    const { getByText, getByRole } = render(<Dashboard />);
    await waitFor(() => {
      expect(getByText('Overall Completion')).toBeInTheDocument();
    });

    // 2. Click ranking card
    fireEvent.click(getByText('Ranking'));
    await waitFor(() => {
      expect(getByRole('dialog')).toBeInTheDocument();
    });

    // 3. Verify modal content
    expect(getByText('Contractor Performance Details')).toBeInTheDocument();

    // 4. Click contractor in modal
    fireEvent.click(getByText('Contractor B'));

    // 5. Verify drill-down panel opens
    expect(getByText('Detailed Breakdown')).toBeInTheDocument();
  });
});
```

### **E2E Tests (Playwright)**

```typescript
// tests/dashboard.spec.ts
test('manager can execute AI action', async ({ page }) => {
  // Navigate to dashboard
  await page.goto('/dashboard');

  // Wait for data load
  await page.waitForSelector('.ai-actions-panel');

  // Click first urgent action
  await page.click('.action-card.urgent:first-child');

  // Modal opens
  await expect(page.locator('role=dialog')).toBeVisible();

  // Execute action
  await page.click('button:has-text("Send Email Now")');

  // Confirmation appears
  await expect(page.locator('.toast-success')).toContainText('Email sent');

  // Action moves to "Sent" section
  await expect(page.locator('.sent-actions')).toContainText('action-1');
});
```

### **Performance Tests**

```typescript
// tests/performance.spec.ts
describe('Performance', () => {
  it('dashboard loads in <3s', async () => {
    const start = performance.now();
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText('Overall Completion')).toBeInTheDocument();
    });
    const end = performance.now();
    expect(end - start).toBeLessThan(3000);
  });

  it('modal opens in <500ms', async () => {
    const { getByText } = render(<Dashboard />);
    const start = performance.now();
    fireEvent.click(getByText('View All'));
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    const end = performance.now();
    expect(end - start).toBeLessThan(500);
  });
});
```

---

## 📱 Responsive Behavior

### **Desktop (≥1200px)**
```css
.dashboard-layout {
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
  padding: 24px;
}

.alert-banner { padding: 16px 24px; }
.kpi-card { grid-column: span 3; }
.radar-chart { grid-column: span 6; }
.ai-actions { grid-column: span 6; }
.bar-chart { grid-column: span 4; }
```

### **Tablet (768px - 1199px)**
```css
.dashboard-layout {
  grid-template-columns: repeat(8, 1fr);
  gap: 16px;
  padding: 20px;
}

.alert-banner { padding: 12px 20px; font-size: 14px; }
.kpi-card:nth-child(1), 
.kpi-card:nth-child(2) { grid-column: span 4; }
.kpi-card:nth-child(3) { grid-column: span 8; }
.radar-chart { grid-column: span 8; height: 320px; }
.ai-actions { grid-column: span 8; height: 280px; }
.bar-chart { grid-column: span 4; }
```

### **Mobile (<768px)**
```css
.dashboard-layout {
  grid-template-columns: 1fr;
  gap: 12px;
  padding: 16px;
}

.alert-banner {
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}

.kpi-card,
.radar-chart,
.ai-actions,
.bar-chart { 
  grid-column: span 1; 
}

/* Hide non-critical charts */
.mini-timeline,
.gantt-chart { 
  display: none; 
}

/* Show "View More" button */
.view-more-charts {
  display: block;
}
```

---

## 🎨 Accessibility Requirements

### **ARIA Labels**

```tsx
<AlertBanner 
  role="alert" 
  aria-live="assertive"
  aria-label={`${criticalCount} critical alerts`}
>
  <div aria-label="Critical alerts count">{criticalCount}</div>
</AlertBanner>

<Button 
  onClick={handleExecute}
  aria-label="Execute action: Send email to Contractor B"
  aria-describedby="action-description"
>
  Send Email
</Button>

<Modal
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Contractor Performance Details</h2>
</Modal>
```

### **Keyboard Navigation**

```typescript
// All interactive elements must be keyboard accessible
const handleKeyDown = (e: KeyboardEvent) => {
  switch(e.key) {
    case 'Enter':
    case ' ':
      handleClick();
      break;
    case 'Escape':
      handleClose();
      break;
    case 'Tab':
      // Focus trap in modal
      trapFocus(e);
      break;
  }
};
```

### **Color Contrast**

```css
/* All text must meet WCAG AA standards (4.5:1 ratio) */

/* ✅ Good contrast */
.text-on-white { 
  color: #1f2937; /* 13.9:1 ratio */
}

.text-on-red-bg {
  color: #ffffff; /* 4.8:1 ratio on #dc2626 */
}

/* ❌ Bad contrast - AVOID */
.text-on-yellow-bg {
  color: #ffffff; /* Only 1.8:1 ratio on #f59e0b */
}
```

### **Screen Reader Support**

```tsx
// Announce dynamic changes
<div 
  role="status" 
  aria-live="polite"
  aria-atomic="true"
>
  {completionRate}% complete
</div>

// Hide decorative elements
<svg aria-hidden="true">
  <path d="..." />
</svg>

// Provide text alternatives
<Chart 
  data={data}
  aria-label="Bar chart showing contractor completion rates"
/>
```

---

## 🚀 Performance Optimization

### **Code Splitting**

```typescript
// Lazy load modals (only load when opened)
const AlertsModal = lazy(() => import('./modals/AlertsModal'));
const RadarDetailModal = lazy(() => import('./modals/RadarDetailModal'));

// Lazy load charts
const RadarChart = lazy(() => import('./charts/RadarChart'));
const GanttChart = lazy(() => import('./charts/GanttChart'));
```

### **Memoization**

```typescript
// Memoize expensive calculations
const rankings = useMemo(() => {
  return calculateRankings(contractors);
}, [contractors]);

// Memoize chart data transformations
const radarData = useMemo(() => {
  return transformForRadar(contractors);
}, [contractors]);

// Memoize filter functions
const filteredData = useMemo(() => {
  return applyFilters(data, filters);
}, [data, filters]);
```

### **Virtualization**

```typescript
// Use virtualization for long lists in modals
import { FixedSizeList as List } from 'react-window';

<List
  height={400}
  itemCount={alerts.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <AlertItem 
      alert={alerts[index]} 
      style={style}
    />
  )}
</List>
```

### **Caching Strategy**

```typescript
// Cache dashboard data (5 min TTL)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

// Use React Query
const { data, isLoading } = useQuery(
  ['dashboard', filters],
  () => fetchDashboardData(filters),
  { staleTime: 5 * 60 * 1000 }
);
```

---

## 🔒 Security Considerations

### **Input Validation**

```typescript
// Validate API responses
import { z } from 'zod';

const ContractorSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  score: z.number().min(0).max(100),
  // ... more fields
});

const DashboardDataSchema = z.object({
  contractors: z.array(ContractorSchema),
  alerts: z.array(AlertSchema),
  // ... more fields
});

// Use in API calls
const rawData = await fetch('/api/dashboard');
const data = DashboardDataSchema.parse(rawData);
```

### **XSS Prevention**

```typescript
// Always sanitize user-generated content
import DOMPurify from 'dompurify';

const sanitizedDescription = DOMPurify.sanitize(action.description);

// Use dangerouslySetInnerHTML only when necessary
<div dangerouslySetInnerHTML={{ __html: sanitizedDescription }} />
```

### **CSRF Protection**

```typescript
// Include CSRF token in all POST requests
const executeAction = async (actionId: string) => {
  const csrfToken = getCookie('csrf_token');
  
  const response = await fetch(`/api/actions/${actionId}/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({ actionId }),
  });
  
  return response.json();
};
```

---

## 📦 Deployment Checklist

### **Pre-deployment**
- [ ] All unit tests pass (>90% coverage)
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Performance benchmarks met (<3s load time)
- [ ] Accessibility audit (WCAG AA compliance)
- [ ] Browser compatibility tested (Chrome, Firefox, Safari, Edge)
- [ ] Mobile devices tested (iOS, Android)
- [ ] Security audit completed
- [ ] API endpoints documented
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Empty states designed
- [ ] Error states designed

### **Deployment**
- [ ] Build production bundle
- [ ] Run bundle size analysis (<500KB initial load)
- [ ] Configure CDN for static assets
- [ ] Set up monitoring (Sentry, DataDog, etc.)
- [ ] Configure analytics (Google Analytics, Mixpanel, etc.)
- [ ] Deploy to staging environment
- [ ] Run smoke tests on staging
- [ ] Deploy to production
- [ ] Monitor error rates for 24 hours

### **Post-deployment**
- [ ] Verify dashboard loads correctly
- [ ] Test modal interactions
- [ ] Test AI action execution
- [ ] Verify data updates in real-time
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Create release notes
- [ ] Update documentation

---

## 🛠️ Development Tools

### **Recommended Stack**

```json
{
  "frontend": {
    "framework": "React 18+",
    "language": "TypeScript 5+",
    "styling": "Tailwind CSS 3+",
    "charts": "Recharts or D3.js",
    "state": "Zustand or React Query",
    "forms": "React Hook Form",
    "validation": "Zod"
  },
  "testing": {
    "unit": "Vitest or Jest",
    "integration": "React Testing Library",
    "e2e": "Playwright",
    "performance": "Lighthouse CI"
  },
  "devtools": {
    "linter": "ESLint",
    "formatter": "Prettier",
    "bundler": "Vite",
    "git-hooks": "Husky"
  }
}
```

### **VS Code Extensions**
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- ESLint
- Prettier
- TypeScript Error Translator

---

## 📚 Additional Resources

### **Design Files**
- Figma: [Link to design file]
- Style Guide: [Link to style guide]
- Icon Library: Lucide React

### **API Documentation**
- Swagger: [Link to API docs]
- Postman Collection: [Link to collection]

### **Project Management**
- Jira Board: [Link to board]
- Confluence: [Link to documentation]

---

## ✅ Definition of Done

A feature is considered complete when:

1. ✅ Code is written and follows style guide
2. ✅ Unit tests written and passing (>90% coverage)
3. ✅ Integration tests passing
4. ✅ E2E tests passing
5. ✅ Accessibility requirements met (WCAG AA)
6. ✅ Performance benchmarks met
7. ✅ Code reviewed and approved
8. ✅ Documentation updated
9. ✅ Deployed to staging
10. ✅ QA tested and approved
11. ✅ Product owner approved
12. ✅ Deployed to production
13. ✅ Monitoring shows no errors

---

## 🎯 Success Metrics

### **Technical Metrics**
- Initial load time: <3 seconds
- Time to Interactive: <4 seconds
- First Contentful Paint: <1.5 seconds
- Bundle size: <500KB (gzipped)
- API response time: <500ms
- Error rate: <0.1%

### **User Metrics**
- Time to identify problem contractor: <5 seconds
- Time to execute AI action: <10 seconds
- Modal open time: <500ms
- User satisfaction: >4.5/5 stars
- Task completion rate: >95%

### **Business Metrics**
- Dashboard adoption rate: >80% of managers
- Average daily active users: >50
- Actions executed per day: >20
- Time saved per manager: >2 hours/week

---

**END OF TECHNICAL SPECIFICATION**

*Last updated: 2025-10-29*  
*Version: 2.0*  
*Contact: [Your team contact]*