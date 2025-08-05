# Debug Steps for Internal Server Error

## 🔍 **Debugging the Internal Server Error**

### **Step 1: Check Server Logs**
```bash
# In your terminal, start the dev server and watch for errors
npm run dev

# Look for error messages in the console output
# Check for any uncaught exceptions or runtime errors
```

### **Step 2: Test Different URLs**
Try these URLs one by one to isolate the issue:

```bash
# 1. Base URL (should work)
http://localhost:3000/

# 2. Simple source parameter
http://localhost:3000/?source=spotify

# 3. Both parameters
http://localhost:3000/?source=spotify&destination=youtube

# 4. Invalid parameters (should fallback gracefully)
http://localhost:3000/?source=invalid&destination=invalid
```

### **Step 3: Check Browser Console**
1. Open browser DevTools (F12)
2. Check Console tab for JavaScript errors
3. Check Network tab for failed requests
4. Look for any React hydration errors

### **Step 4: Temporary Fixes Applied**

I've made these changes to prevent common issues:

#### **Fixed Infinite Re-render Loop:**
```typescript
// Before: Could cause infinite loops
}, [searchParams, sourceProvider, destinationProvider, selectionStep]);

// After: Only depends on URL changes
}, [searchParams]);
```

#### **Added Client-Side Check:**
```typescript
const updateUrlParams = (newSource?: string, newDestination?: string) => {
  // Prevent server-side execution
  if (typeof window === 'undefined') return;
  // ... rest of function
};
```

### **Step 5: Fallback Component**

If the issue persists, here's a minimal version to test:

```typescript
// Add this to page.tsx temporarily for debugging
if (status === 'loading') {
  return <div>Loading...</div>;
}

if (status === 'error') {
  return <div>Authentication Error</div>;
}
```

### **Step 6: Common Issues & Solutions**

#### **1. Authentication Issues:**
- Check if `.env.local` has all required environment variables
- Verify NextAuth configuration is correct

#### **2. Database Issues:**
- Check if Prisma database is accessible
- Verify database schema is up to date

#### **3. Provider Configuration:**
- Ensure DEFAULT_PROVIDERS array is valid
- Check for any missing imports

#### **4. URL Parameter Issues:**
- Invalid provider IDs in URL
- Missing searchParams handling

### **Step 7: Emergency Rollback**

If needed, you can temporarily revert to the old system:

```typescript
// Comment out URL parameter logic temporarily
// const [sourceProvider, setSourceProvider] = useState<string>(getInitialSourceProvider)
const [sourceProvider, setSourceProvider] = useState<string>('spotify')
const [destinationProvider, setDestinationProvider] = useState<string>('youtube')
const [selectionStep, setSelectionStep] = useState<'source' | 'destination' | 'complete'>('source')
```

### **Step 8: Check Build**
```bash
# Test if build works
npm run build

# If build fails, check the specific error messages
# TypeScript errors, ESLint errors, etc.
```

## 🚨 **Most Likely Causes**

1. **React Hydration Mismatch** - Server-rendered content doesn't match client
2. **URL Parameter Validation** - Invalid provider combinations
3. **Authentication State** - NextAuth session issues
4. **Database Connection** - Prisma/database connectivity

## 📋 **What to Check Next**

1. **Server Terminal Output** - Look for specific error messages
2. **Browser Console Errors** - JavaScript runtime errors
3. **Network Tab** - Failed API requests
4. **Page Source** - Check if HTML is being generated correctly

Let me know what specific error messages you see and I can provide more targeted solutions!