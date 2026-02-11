# API Testing Checklist & Status Report

## ✅ Environment Variables Fixed

### Issue Identified:
React (Create React App) **requires** all custom environment variables to be prefixed with `REACT_APP_` to be accessible in the browser. Without this prefix, all variables would be `undefined` at runtime, causing API failures.

### Resolution:
All environment variables have been updated with the `REACT_APP_` prefix while maintaining the cleaner naming structure.

---

## 📋 API Endpoints Configuration

### Base URLs (from .env):
```
REACT_APP_IT_APP_BASE_URL=https://apin.neocloud.ai/
REACT_APP_APP6A_BASE_URL=https://apin.neocloud.ai/
REACT_APP_APP30A_BASE_URL=https://api30a.neocloud.ai/
REACT_APP_APP30B_BASE_URL=https://api30b.neocloud.ai/
REACT_APP_APP6E_BASE_URL=https://apin.neocloud.ai/
REACT_APP_CURO_BASE_URL=https://apin.neocloud.ai/curo
```

---

## 🔍 API Integration Points

### 1. **Authentication APIs** (`authService.ts`)
- ✅ Login API: `${REACT_APP_IT_APP_BASE_URL}ecloudbl/auth/token`
- ✅ Google OAuth: Uses `REACT_APP_GOOGLE_CLIENT_ID`
- **Methods:**
  - `login(userName, password)` - Standard login
  - `loginWithGoogle(credential)` - Google OAuth login
  - `logout()` - Clear auth tokens
  - `getToken()` - Retrieve stored token
  - `isAuthenticated()` - Check auth status

### 2. **Merchant APIs** (`merchantService.ts`)
All APIs use dynamic cluster-based base URLs via `getClusterBaseURL(clusterId)`:

#### Core Merchant Operations:
- ✅ `GET /curo/merchant/getMerchants` - Fetch all merchants
- ✅ `GET /curo/merchant/merchantId/{id}` - Get merchant by ID
- ✅ `PUT /curo/merchant/createAccount` - Create new merchant
- ✅ `PUT /merchants/{id}` - Update merchant
- ✅ `DELETE /curo/merchant/deleteMerchant` - Delete merchant
- ✅ `PATCH /merchants/{id}/status` - Update merchant status
- ✅ `GET /merchants/search` - Search merchants
- ✅ `GET /merchants/export` - Export merchants

#### Merchant Attributes:
- ✅ `POST /chimes/updateMerchantAttributes` - Update merchant attributes
- ✅ `GET /chimes/getMerchantAttributes` - Get merchant attributes

#### User Management:
- ✅ `GET /curo/merchant/getUsers` - Get all users for a merchant
- ✅ `POST /curo/merchant/createUser` - Create new user
- ✅ `PUT /curo/merchant/updateUser` - Update user
- ✅ `DELETE /curo/merchant/deleteUser` - Delete user

#### Cluster Operations:
- ✅ `GET /curo/cluster/getUsers` - Get cluster-wide users
- ✅ `GET /curo/cluster/getVisitors` - Get cluster-wide visitors

#### AI & Knowledge Base:
- ✅ `POST /model-service/promptlab/getPrompt` - Get prompts
- ✅ `POST /model-service/promptlab/savePrompt` - Save prompt
- ✅ `POST /model-service/promptlab/deletePrompt` - Delete prompt
- ✅ `POST /model-service/knowledgeBase/getKnowledgeBaseDetails` - Get knowledge bases
- ✅ `POST /model-service/knowledgeBase/saveKnowledgeBase` - Save knowledge base
- ✅ `POST /model-service/knowledgeBase/deleteKnowledgeBase` - Delete knowledge base

#### AI Agents & Artifacts:
- ✅ `POST /jelloBuilder/storyDialog/getAgents` - Get AI agents
- ✅ `POST /jelloBuilder/storyDialog/saveAgent` - Save AI agent
- ✅ `POST /jelloBuilder/storyDialog/deleteAgent` - Delete AI agent
- ✅ `POST /jelloBuilder/storyDialog/publish` - Publish Agentic AI
- ✅ `POST /jelloBuilder/storyDialog/getArtifacts` - Get AI artifacts

#### Visitor & Engagement:
- ✅ `GET /v6/webchnl/visitors` - Get web visitors
- ✅ `GET /webchnl/conversation` - Get chat history
- ✅ `POST /curo/merchant/getEngagements` - Get engagements
- ✅ `POST /curo/merchant/saveEngagement` - Save engagement
- ✅ `POST /curo/merchant/deleteEngagement` - Delete engagement

#### Channels & Departments:
- ✅ `GET /curo/merchant/getChannels` - Get channels
- ✅ `POST /curo/merchant/saveChannel` - Save channel
- ✅ `POST /curo/merchant/deleteChannel` - Delete channel
- ✅ `GET /curo/merchant/getDepartments` - Get departments
- ✅ `POST /curo/merchant/saveDepartment` - Save department
- ✅ `POST /curo/merchant/deleteDepartment` - Delete department

#### Bot Management:
- ✅ `GET /jelloBuilder/bot/getBots` - Get bots
- ✅ `GET /jelloBuilder/bot/getBotExecutionLogs` - Get bot execution logs

---

## 🧪 Testing Checklist

### Pre-Testing Requirements:
1. ✅ **Restart Development Server** - Environment variables require server restart
   ```bash
   # Stop current server (Ctrl+C)
   npm start
   ```

2. ✅ **Verify Environment Variables Load**
   - Open browser console
   - Check: `console.log(process.env.REACT_APP_IT_APP_BASE_URL)`
   - Should show: `https://apin.neocloud.ai/`

### Manual Testing Steps:

#### 1. **Authentication Flow**
- [ ] Navigate to login page
- [ ] Test username/password login
- [ ] Verify token is stored in localStorage
- [ ] Test Google OAuth login (if configured)
- [ ] Verify redirect to dashboard after login
- [ ] Test logout functionality

#### 2. **Dashboard Loading**
- [ ] Verify cluster selection screen appears
- [ ] Select a cluster (e.g., IT-APP)
- [ ] Verify dashboard stats load:
  - Total Merchants
  - Active/Inactive counts
  - User statistics
  - Visitor statistics
- [ ] Check browser console for API errors
- [ ] Verify "Live Fetching" indicator shows correctly
- [ ] Test Sync ON/OFF toggle
- [ ] Verify auto-refresh works (60s interval when ON)

#### 3. **Merchant Operations**
- [ ] Navigate to Merchants page
- [ ] Verify merchant list loads
- [ ] Test search functionality
- [ ] Test creating new merchant
- [ ] Test editing merchant details
- [ ] Test updating merchant status
- [ ] Test deleting merchant
- [ ] Verify merchant details modal

#### 4. **Multi-Cluster Testing**
- [ ] Switch to "Global Overview" mode
- [ ] Verify data aggregates from all clusters
- [ ] Test switching between cluster tabs
- [ ] Verify cluster-specific data loads correctly

#### 5. **AI Features**
- [ ] Test AI Agents card
- [ ] Test AI Artifacts card
- [ ] Test Knowledge Bases
- [ ] Test Prompt Lab
- [ ] Verify modal interactions

#### 6. **User Management**
- [ ] View users for a merchant
- [ ] Test creating new user
- [ ] Test updating user
- [ ] Test deleting user
- [ ] Verify online/offline status

#### 7. **Visitor & Analytics**
- [ ] Verify visitor data loads
- [ ] Check recent visitors table
- [ ] Test engagement data
- [ ] Verify analytics cards

---

## 🐛 Common Issues & Solutions

### Issue 1: Environment Variables Undefined
**Symptom:** API calls fail with undefined URLs
**Solution:** Ensure server was restarted after .env changes

### Issue 2: CORS Errors
**Symptom:** Browser console shows CORS policy errors
**Solution:** Backend must allow requests from localhost:3000

### Issue 3: 401 Unauthorized
**Symptom:** APIs return 401 after some time
**Solution:** Token expired - automatic logout should trigger

### Issue 4: No Data Displayed
**Symptom:** Dashboard shows empty or loading state
**Solution:** 
- Check network tab for failed requests
- Verify API endpoints are correct
- Check if backend is accessible

---

## 📊 Browser Console Checks

Open browser DevTools (F12) and check:

### 1. **Network Tab**
- Filter by XHR/Fetch
- Look for failed requests (red)
- Check request URLs are correct
- Verify response status codes

### 2. **Console Tab**
- Look for JavaScript errors
- Check for API error logs
- Verify environment variables

### 3. **Application Tab**
- Check localStorage for `auth_token`
- Verify token is present after login

---

## ✅ Code Quality Checks

All API integrations have:
- ✅ Proper error handling with try-catch
- ✅ Fallback values for environment variables
- ✅ Response data normalization
- ✅ Loading states
- ✅ 401 interceptor for session expiry
- ✅ Console logging for debugging
- ✅ TypeScript type safety

---

## 🚀 Next Steps

1. **Restart the development server** to load new environment variables
2. **Open the application** in your browser
3. **Follow the testing checklist** above
4. **Report any API failures** with:
   - Which API endpoint failed
   - Error message from console
   - Network tab screenshot
   - Expected vs actual behavior

---

## 📝 Notes

- All environment variables now use `REACT_APP_` prefix (required by CRA)
- Naming convention improved: `*_BASE_URL` instead of `*_API_URL`
- All fallback URLs are hardcoded for reliability
- Cluster-based routing implemented for multi-region support
- Auto-refresh interval: 60 seconds (when Sync is ON)
