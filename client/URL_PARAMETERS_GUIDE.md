# URL Parameters Implementation Guide

## 🎯 **URL Structure**

The app now supports URL parameters for deep linking and state persistence:

```
Base URL: http://localhost:3000/

# Provider Selection URLs:
/?source=spotify                           # Source selected, choose destination
/?source=spotify&destination=youtube       # Both selected, ready to proceed
/?source=apple-music&destination=youtube   # Apple Music → YouTube
/?source=spotify&destination=apple-music   # Spotify → Apple Music

# Connection URLs:
/connect?source=spotify&destination=youtube
```

## 🚀 **Features Implemented**

### **1. Deep Linking**
Users can now:
- **Bookmark selections**: `/?source=spotify&destination=youtube`
- **Share provider combinations**: Send URLs to others
- **Direct access**: Skip selection steps with pre-filled URLs

### **2. Browser Navigation**
- ✅ **Back/Forward buttons work properly**
- ✅ **URL updates as providers are selected**
- ✅ **State persists on page refresh**
- ✅ **Invalid combinations handled gracefully**

### **3. Smart URL Handling**

#### **Validation & Fallbacks:**
```typescript
// Invalid provider → Falls back to default
/?source=invalid-provider     → /?source=spotify

// Same provider → Prevents selection
/?source=spotify&destination=spotify → Invalid, shows destination selection

// Invalid capability → Filters correctly
/?source=youtube              → Invalid (YouTube can't import), falls back to spotify
```

#### **URL State Sync:**
- **Step 1**: `/?source=spotify` - Source selected, destination step shown
- **Step 2**: `/?source=spotify&destination=youtube` - Complete selection shown
- **Back**: `/?source=spotify` - Destination parameter removed

## 📝 **Example Use Cases**

### **Direct Provider Links:**
```html
<!-- Spotify to YouTube preset -->
<a href="/?source=spotify&destination=youtube">Spotify → YouTube</a>

<!-- Apple Music to YouTube preset -->
<a href="/?source=apple-music&destination=youtube">Apple Music → YouTube</a>

<!-- Source pre-selected -->
<a href="/?source=spotify">Import from Spotify</a>
```

### **Bookmarking:**
Users can bookmark their favorite migration combinations and return directly to them.

### **Sharing:**
```
"Hey, try this migration setup: 
https://yourapp.com/?source=apple-music&destination=youtube"
```

## 🔧 **Implementation Details**

### **URL Parameter Handling:**
```typescript
// Read initial state from URL
const getInitialSourceProvider = () => {
  const urlSource = searchParams.get('source');
  const validProvider = DEFAULT_PROVIDERS.find(p => 
    p.id === urlSource && p.capabilities.import
  );
  return validProvider ? urlSource! : 'spotify';
};

// Update URL on selection
const updateUrlParams = (newSource?: string, newDestination?: string) => {
  const params = new URLSearchParams(searchParams.toString());
  if (newSource) params.set('source', newSource);
  if (newDestination) params.set('destination', newDestination);
  
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  router.replace(newUrl, { scroll: false });
};
```

### **Browser Navigation Sync:**
```typescript
// Sync component state with URL changes
useEffect(() => {
  const urlSource = searchParams.get('source');
  const urlDestination = searchParams.get('destination');
  
  // Validate providers and update state
  // Handle browser back/forward navigation
}, [searchParams, sourceProvider, destinationProvider, selectionStep]);
```

## ✅ **Testing Scenarios**

### **1. Direct URL Access:**
- Navigate to `/?source=spotify&destination=youtube`
- Should show complete selection with migration summary

### **2. Partial URL Access:**
- Navigate to `/?source=spotify`
- Should show destination provider selection

### **3. Invalid URL Handling:**
- Navigate to `/?source=invalid&destination=youtube`
- Should fallback to valid default source

### **4. Browser Navigation:**
- Select providers → Check URL updates
- Use browser back button → State should sync
- Refresh page → Selection should persist

### **5. Connection Flow:**
- Complete selection → Click proceed
- Should navigate to `/connect?source=spotify&destination=youtube`
- Back button should preserve parameters

## 🎉 **Benefits**

### **User Experience:**
- **No lost selections** on refresh
- **Shareable configurations**
- **Proper browser navigation**
- **Direct access to provider combinations**

### **Developer Experience:**
- **RESTful URL structure**
- **Easy deep linking integration**
- **Debug-friendly URLs**
- **Bookmarkable states**

### **Business Value:**
- **Improved conversion** (users don't lose progress)
- **Viral sharing** (users can share provider combinations)
- **Better analytics** (track popular provider combinations)
- **Customer support** (users can share their exact setup)

## 🔮 **Future Enhancements**

### **Possible Extensions:**
```
# Additional parameters
/?source=spotify&destination=youtube&playlists=favorites,workout
/?source=spotify&destination=youtube&migrate=all
/?source=spotify&destination=youtube&format=preview

# Route-based approach
/migrate/spotify/to/youtube
/connect/spotify-and-youtube
```

The URL parameter system is now fully functional and provides a much better user experience with proper state management and navigation!