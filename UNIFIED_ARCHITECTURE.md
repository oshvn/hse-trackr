# 🏗️ Kiến Trúc Hệ Thống Thống Nhất - Unified Requirements

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ADMIN DASHBOARD                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│  │   Settings      │  │  CẤU HÀI UNIFIED │  │  AI Config   │   │
│  │  (Admin Page)   │  │   TAB (NEW) ✨   │  │   (Legacy)   │   │
│  └─────────────────┘  └──────────────────┘  └──────────────┘   │
│           │                    │                      │          │
│           └────────────────────┼──────────────────────┘          │
│                                │                                  │
│            ┌───────────────────▼────────────────────┐            │
│            │  UnifiedRequirementConfig Component    │            │
│            ├────────────────────────────────────────┤            │
│            │                                        │            │
│            │  Features:                             │            │
│            │  ✅ Load 4 tables in parallel         │            │
│            │  ✅ Expandable cards per doc_type    │            │
│            │  ✅ Inline checklist editor          │            │
│            │  ✅ Inline contractor requirements   │            │
│            │  ✅ Add new doc_type form            │            │
│            │  ✅ Auto-save on toggle/click        │            │
│            │  ✅ Initialize checklist from DB    │            │
│            │                                        │            │
│            └────────────────┬──────────────────────┘            │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                   ┌──────────┴──────────┐
                   │                     │
        ┌──────────▼────────┐  ┌────────▼──────────┐
        │  Supabase Client  │  │  React Hooks      │
        │  (supabase-js)    │  │  - useState       │
        └─────────┬─────────┘  │  - useEffect      │
                  │            │  - useCallback    │
        ┌─────────▼──────────────▼────────────┐
        │     Database Layer (Supabase)        │
        ├──────────────────────────────────────┤
        │                                      │
        │  ┌────────────────────────────────┐ │
        │  │  document_types                │ │
        │  ├────────────────────────────────┤ │
        │  │ id, name, category             │ │
        │  │ document_name, is_critical     │ │
        │  └────────────────────────────────┘ │
        │                                      │
        │  ┌────────────────────────────────┐ │
        │  │  checklist_requirements        │ │
        │  ├────────────────────────────────┤ │
        │  │ id, doc_type_id (FK)           │ │
        │  │ checklist_item_id              │ │
        │  │ checklist_label                │ │
        │  │ is_required ← TOGGLE HERE      │ │
        │  │ position                       │ │
        │  └────────────────────────────────┘ │
        │                                      │
        │  ┌────────────────────────────────┐ │
        │  │  contractor_requirements       │ │
        │  ├────────────────────────────────┤ │
        │  │ id, doc_type_id (FK)           │ │
        │  │ contractor_id (FK)             │ │
        │  │ required_count ← SET HERE      │ │
        │  │ planned_due_date ← SET HERE    │ │
        │  └────────────────────────────────┘ │
        │                                      │
        │  ┌────────────────────────────────┐ │
        │  │  contractors                   │ │
        │  ├────────────────────────────────┤ │
        │  │ id, name, ...                  │ │
        │  └────────────────────────────────┘ │
        │                                      │
        └──────────────────────────────────────┘
```

---

## 🔄 Data Flow

### **Scenario 1: Admin Expands Doc Type**

```
┌─ Admin clicks on "1.1.1.1 Construction Manager" ─────────────┐
│                                                                 │
│  1. UI: Toggle expand                                          │
│  2. Component: Call getRequirementsForDocType(docTypeId)       │
│  3. State: checklistRequirements already loaded                │
│  4. UI: Render checklist items + contractor grid              │
│                                                                 │
│  Result: Instant expand (no extra queries)                    │
└─────────────────────────────────────────────────────────────────┘
```

### **Scenario 2: Admin Toggles Checklist Item**

```
┌─ Admin clicks toggle on "ID Card" (is_required) ──────────────┐
│                                                                 │
│  1. UI: Toggle switch (on/off)                                │
│  2. Component: handleToggleChecklistRequired()                │
│  3. Supabase: UPDATE checklist_requirements SET               │
│     is_required = !current WHERE id = item.id                │
│  4. Success: Update local state + toast                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────┐           │
│  │  Network Request:                               │           │
│  │  PUT /rest/v1/checklist_requirements?id=xxx     │           │
│  │  PATCH: { is_required: false }                  │           │
│  │                                                  │           │
│  │  Response: { id, doc_type_id, is_required...} │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  Result: Auto-save (no click Save needed)                     │
│  UX: Badge updates immediately                               │
└─────────────────────────────────────────────────────────────────┘
```

### **Scenario 3: Admin Sets Contractor Requirement**

```
┌─ Admin enters 5 for "Nhà Thầu A" + date 2025-12-31 ──────────┐
│                                                                 │
│  1. UI: Input fields + click "Lưu"                            │
│  2. Component: handleSaveContractorRequirement()              │
│  3. Validation: Check required_count > 0                      │
│  4. Supabase: UPSERT contractor_requirements                  │
│     (doc_type_id, contractor_id, required_count, due_date)   │
│  5. Success: Reload data + toast                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────┐           │
│  │  Network Request:                               │           │
│  │  POST /rest/v1/contractor_requirements          │           │
│  │  UPSERT: {                                      │           │
│  │    doc_type_id: "xxx",                          │           │
│  │    contractor_id: "yyy",                        │           │
│  │    required_count: 5,                           │           │
│  │    planned_due_date: "2025-12-31"               │           │
│  │  }                                              │           │
│  │  onConflict: "doc_type_id,contractor_id"        │           │
│  │                                                  │           │
│  │  Response: { id, created/updated } │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  Result: Data saved to DB                                    │
│  Contractors will see updated requirements                   │
└─────────────────────────────────────────────────────────────────┘
```

### **Scenario 4: Contractor Views Submission Requirements**

```
┌─ Contractor: "Nộp hồ sơ mới" → Select "1.1.1.1 CM" ─────────┐
│                                                                │
│  1. Frontend: Get selectedCategory.docTypeId                 │
│  2. Query DB:                                                │
│     SELECT * FROM checklist_requirements                     │
│     WHERE doc_type_id = xxx AND is_required = true          │
│  3. UI: Show only REQUIRED items in checklist                │
│                                                                │
│  Admin Setup (Unified Component):                           │
│    doc_type_id: abc-123                                      │
│    ├─ Item 1: is_required = true   ✅ SHOW                   │
│    ├─ Item 2: is_required = true   ✅ SHOW                   │
│    ├─ Item 3: is_required = false  ❌ HIDE                   │
│    └─ Item 4: is_required = true   ✅ SHOW                   │
│                                                                │
│  Result: Contractor sees exactly 3 items (1,2,4)            │
│  They don't see optional item 3                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Load Sequence

### **Initial Load (On Mount)**

```
UnifiedRequirementConfig.mount()
  │
  ├─ setLoading(true)
  │
  ├─ Promise.all([
  │    ├─ supabase.from('document_types').select(*)
  │    ├─ supabase.from('contractors').select(*)
  │    ├─ supabase.from('checklist_requirements').select(*)
  │    └─ supabase.from('contractor_requirements').select(*)
  │  ])
  │
  ├─ Parallel load: 4 requests (fast!)
  │
  ├─ setDocTypes(...), setContractors(...), etc.
  │
  └─ setLoading(false) → UI renders

Total time: ~500ms (1 round trip + parallel queries)
```

### **vs Old Way (3 Tabs)**

```
Tab 1: Load document_types    (~150ms)
Tab 2: Load contractor_requirements  (~150ms)
Tab 3: Load checklist_requirements   (~150ms)

If user opens Tab 1, then Tab 2, then Tab 3:
Total = 150 + 150 + 150 = 450ms (sequential)
+ Context switching overhead
+ Mental load

If user opens all 3 tabs simultaneously:
Total = max(150, 150, 150) = 150ms (parallel)
But 3x components to maintain!
```

**New Way: Better of both worlds** ✨

---

## 🧠 State Management

```typescript
// Main state variables
const [docTypes, setDocTypes] = useState<DocTypeRow[]>
const [contractors, setContractors] = useState<ContractorRow[]>
const [checklistRequirements, setChecklistRequirements] = useState<...>
const [contractorRequirements, setContractorRequirements] = useState<...>

// UI state
const [expandedDocTypeId, setExpandedDocTypeId] = useState<string | null>
const [savingDocTypeId, setSavingDocTypeId] = useState<string | null>

// Computed values
const getRequirementsForDocType = useCallback((docTypeId) => {
  return checklistRequirements.filter(req => req.doc_type_id === docTypeId)
}, [checklistRequirements])

const getContractorRequirementsForDocType = useCallback((docTypeId) => {
  const map = new Map()
  contractorRequirements
    .filter(req => req.doc_type_id === docTypeId)
    .forEach(req => map.set(req.contractor_id, req))
  return map
}, [contractorRequirements])
```

**Benefits:**
- ✅ Single source of truth
- ✅ Memoized computations
- ✅ Easy to trace data flow
- ✅ Predictable updates

---

## 🔐 Security & RLS

### **Policies on checklist_requirements**

```sql
-- Read: Everyone can read (used by contractors)
CREATE POLICY "allow_admin_select_checklist_requirements"
  ON checklist_requirements FOR SELECT USING (true);

-- Write: Only through admin UI (Unified Component)
CREATE POLICY "allow_admin_insert_checklist_requirements"
  ON checklist_requirements FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_admin_update_checklist_requirements"
  ON checklist_requirements FOR UPDATE USING (true);
```

### **Policies on contractor_requirements**

```sql
-- Read: Contractors can see their own requirements
-- (Next phase implementation)

-- Write: Only admin through UI
CREATE POLICY "allow_admin_upsert_contractor_requirements"
  ON contractor_requirements FOR INSERT/UPDATE
  USING (true);
```

**Current:** All policies allow access (RLS disabled temporarily)
**Future:** Implement row-level security per user role

---

## 🎯 Integration Touchpoints

### **1. Admin Settings (Parent)**
```typescript
// pages/admin/settings.tsx
<Tabs defaultValue="unified-config">
  <TabsList>
    <TabsTrigger value="unified-config">Cấu Hình Yêu Cầu (Mới) ✨</TabsTrigger>
    <TabsTrigger value="doc-types">Loại tài liệu (Cũ)</TabsTrigger>
    <TabsTrigger value="requirements">Yêu cầu NCC (Cũ)</TabsTrigger>
  </TabsList>
  
  <TabsContent value="unified-config">
    <UnifiedRequirementConfig />  ← HERE
  </TabsContent>
</Tabs>
```

### **2. Contractor Submission Flow**
```typescript
// components/submissions/DocumentChecklistStep.tsx
const loadChecklistRequirements = async () => {
  const { data: checklistItems } = supabase
    .from('checklist_requirements')
    .select('*')
    .eq('doc_type_id', selectedCategory.id)
    .eq('is_required', true)  // ← Only bắt buộc

  // Admin's unified config determines what shows here!
}
```

### **3. Validation Logic**
```typescript
// When contractor submits
const requiredItems = checklist.filter(i => i.is_required)
if (selectedItems.length < requiredItems.length) {
  throw new Error("Missing required items")
}

const { data: contractorReq } = supabase
  .from('contractor_requirements')
  .select('required_count')
  .eq('doc_type_id', docTypeId)
  .eq('contractor_id', currentContractor)

if (selectedItems.length < contractorReq.required_count) {
  throw new Error(`Need at least ${contractorReq.required_count} items`)
}
```

---

## 📊 Query Optimization

### **Parallel Loads**
```sql
-- All 4 executed in parallel (Promise.all)
1. SELECT * FROM document_types ORDER BY created_at
2. SELECT id, name FROM contractors ORDER BY name  
3. SELECT * FROM checklist_requirements ORDER BY doc_type_id, position
4. SELECT * FROM contractor_requirements
```

**Time: ~300-500ms (all parallel)**

vs Sequential: ~1200ms (4 x 300ms each)

### **Client-Side Filtering**
```typescript
// No additional queries needed!
const checklistItems = getRequirementsForDocType(selectedDocTypeId)
  // Already in state, just filter locally

const contractorReqs = getContractorRequirementsForDocType(selectedDocTypeId)
  // Already in state, just filter locally
```

**Benefit:** Instant expand without extra queries

---

## 🎪 Component Hierarchy

```
settings.tsx (Admin page)
  │
  └─ Tabs
      │
      ├─ TabsTrigger "unified-config" (default)
      │
      ├─ TabsContent
      │  │
      │  └─ UnifiedRequirementConfig ✨ (NEW)
      │      │
      │      ├─ Card (Header + Guide)
      │      │
      │      ├─ ScrollArea
      │      │  │
      │      │  └─ Map docTypes → Card
      │      │      │
      │      │      ├─ CardHeader (expand/collapse)
      │      │      │
      │      │      └─ CardContent (when expanded)
      │      │          ├─ Checklist Items Section
      │      │          │  ├─ Button "Khởi tạo"
      │      │          │  └─ Switch per item
      │      │          │
      │      │          └─ Contractor Requirements Section
      │      │              └─ Grid of contractor cards
      │      │
      │      └─ Card (Add new doc type form)
      │
      ├─ TabsTrigger "doc-types" (legacy)
      │
      ├─ TabsContent
      │  └─ Old doc-types table component
      │
      └─ ... other tabs
```

---

## ✅ Validation & Error Handling

```typescript
// Form validation
if (!newDocType.name.trim() || !newDocType.category?.trim()) {
  toast({ title: "Thiếu thông tin", variant: "destructive" })
  return
}

// DB constraints
try {
  const { error } = await supabase.from(...).insert(...)
  if (error) throw error
} catch (error) {
  toast({ title: "Lỗi", description: error.message, variant: "destructive" })
}

// Network handling
setLoading(true)
  │
  ├─ Try all 4 queries
  │
  ├─ If any fails → Catch + toast error
  │
  └─ Finally → setLoading(false)
```

---

## 🎬 Summary

**Unified Architecture = Single Component that:**
- ✅ Loads all related data in parallel
- ✅ Displays hierarchical structure (expandable cards)
- ✅ Allows inline editing (toggle + inputs)
- ✅ Auto-saves to database
- ✅ Guides admin through 5-step process
- ✅ Integrates seamlessly with contractor flow
- ✅ Maintains data consistency
- ✅ Provides clear error handling

**Result:** Simple, fast, reliable admin experience 🚀
