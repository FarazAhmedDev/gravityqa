# 🚀 **API TESTING MODULE - Implementation Plan**

## 📋 **OVERVIEW**

Complete Postman-like API testing integrated into GravityQA!

---

## 🎯 **FEATURE SCOPE**

### **Core Features:**
1. ✅ **Request Builder** - HTTP methods, URL, headers, body
2. ✅ **Response Viewer** - Status, body, headers, time
3. ✅ **Validations** - Assertions on response
4. ✅ **Save Tests** - Reusable test cases
5. ✅ **History** - Execution tracking
6. ✅ **Collections** - Group tests

### **UI Components:**
1. **Sidebar Icon** - "API Testing"
2. **Main Screen** - Request builder + response
3. **Saved Tests Panel** - List of saved APIs
4. **Validation Builder** - No-code assertions
5. **History Panel** - Past executions

---

## 🏗️ **ARCHITECTURE**

### **Frontend:**
```
src/components/api/
├── ApiTesting.tsx          # Main screen
├── RequestBuilder.tsx      # URL, method, headers
├── RequestBody.tsx         # JSON/form data editor
├── ResponseViewer.tsx      # Status, body, headers
├── ValidationBuilder.tsx   # Assertion rules
├── SavedTests.tsx          # Test list
└── ExecutionHistory.tsx    # Run history
```

### **Backend:**
```
backend/api/api_testing.py  # API endpoints
backend/services/api/
├── request_executor.py     # HTTP client
├── validator.py            # Assertion engine
└── history.py              # Execution tracking
```

### **Database:**
```sql
api_tests:
  - id, name, method, url, headers, body
  - validations, created_at

api_executions:
  - id, test_id, status, response, time
  - passed, created_at
```

---

## 📐 **COMPONENT BREAKDOWN**

### **1. Sidebar Integration**
```tsx
// App.tsx
<Sidebar>
  <Icon name="🌐" label="Web Automation" />
  <Icon name="📱" label="Mobile Testing" />
  <Icon name="🔌" label="API Testing" /> ← NEW!
</Sidebar>
```

### **2. API Testing Screen**
```
┌─────────────────────────────────────────┐
│ 🔌 API Testing                          │
├─────────────────────────────────────────┤
│ [Saved Tests ▼] [+ New Request]        │
├───────────────────┬─────────────────────┤
│ REQUEST           │ RESPONSE            │
│                   │                     │
│ [POST ▼] URL      │ Status: 200 OK      │
│ Headers           │ Time: 245ms         │
│ Body             │                     │
│                   │ {                   │
│ Validations       │   "success": true   │
│ [+ Add Rule]      │ }                   │
│                   │                     │
│ [▶ Run] [💾 Save] │                     │
└───────────────────┴─────────────────────┘
```

---

## 🎨 **UI DESIGN**

### **Color Scheme:**
- **Primary:** #8b5cf6 (Purple - API theme)
- **Success:** #10b981 (Green)
- **Error:** #ef4444 (Red)
- **Info:** #3b82f6 (Blue)

### **HTTP Method Colors:**
- GET: #10b981 (Green)
- POST: #f59e0b (Orange)
- PUT: #3b82f6 (Blue)
- DELETE: #ef4444 (Red)
- PATCH: #8b5cf6 (Purple)

---

## 🔧 **IMPLEMENTATION PHASES**

### **PHASE 1: Core Request/Response** (2 hours)
- ✅ Sidebar icon
- ✅ Main screen layout
- ✅ Request builder (method, URL)
- ✅ Execute button
- ✅ Response viewer
- ✅ Backend executor

### **PHASE 2: Headers & Body** (1 hour)
- ✅ Headers editor
- ✅ Query params
- ✅ JSON body editor
- ✅ Form data support

### **PHASE 3: Validations** (1.5 hours)
- ✅ Validation builder UI
- ✅ Status code check
- ✅ Response time check
- ✅ JSON path checks
- ✅ Backend validator

### **PHASE 4: Save & History** (1 hour)
- ✅ Save test cases
- ✅ Load saved tests
- ✅ Execution history
- ✅ Pass/Fail tracking

### **PHASE 5: Collections** (30 mins)
- ✅ Group tests
- ✅ Folder structure
- ✅ Bulk run

---

## 📊 **DATA MODELS**

### **API Test:**
```typescript
interface ApiTest {
  id: string
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  headers: Record<string, string>
  queryParams: Record<string, string>
  body: string | object
  validations: Validation[]
  collectionId?: string
  createdAt: string
}
```

### **Validation:**
```typescript
interface Validation {
  type: 'status' | 'time' | 'json_path' | 'header'
  field?: string
  operator: '==' | '!=' | '<' | '>' | 'contains'
  value: any
}
```

### **Execution:**
```typescript
interface ApiExecution {
  id: string
  testId: string
  status: number
  responseBody: any
  responseHeaders: Record<string, string>
  responseTime: number
  passed: boolean
  failedValidations?: string[]
  timestamp: string
}
```

---

## 🚀 **QUICK START IMPLEMENTATION**

### **Step 1: Add to Sidebar**
```tsx
// src/App.tsx
const menuItems = [
  { icon: '🏠', label: 'Home' },
  { icon: '🌐', label: 'Web', route: '/web' },
  { icon: '📱', label: 'Mobile', route: '/mobile' },
  { icon: '🔌', label: 'API', route: '/api' }, // NEW!
]
```

### **Step 2: Create Route**
```tsx
// src/App.tsx
<Route path="/api" element={<ApiTesting />} />
```

### **Step 3: Build Components**
Start with minimal viable:
- Request form (URL, method)
- Execute button  
- Response display

### **Step 4: Backend API**
```python
# backend/api/api_testing.py
@router.post("/api/execute")
async def execute_request(request: ApiRequest):
    response = await http_client.request(
        request.method,
        request.url,
        headers=request.headers,
        json=request.body
    )
    return {
        "status": response.status,
        "body": response.json(),
        "headers": dict(response.headers),
        "time": response.elapsed.milliseconds
    }
```

---

## 🎯 **SUCCESS CRITERIA**

- [ ] Sidebar icon works
- [ ] Can create GET request
- [ ] Can execute and see response
- [ ] Can add headers
- [ ] Can send POST with JSON
- [ ] Can add validations
- [ ] Can save test
- [ ] Can re-run saved test
- [ ] History tracking works

---

## 📦 **DELIVERABLES**

1. **Frontend Components** (7 files)
2. **Backend APIs** (3 endpoints)
3. **Database Migration** (2 tables)
4. **Documentation**
5. **Test Suite**

**Estimated Time:** 6 hours total

---

## 🎊 **NEXT STEPS**

Ready to start implementation?

**I'll begin with:**
1. Sidebar icon
2. Basic API Testing screen
3. Request builder
4. Execute functionality

**Shall I proceed?** 🚀
