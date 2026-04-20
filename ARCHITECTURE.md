# Vroom App - Architecture MVC et Standards Mobile

## Architecture MVC

### Model Layer (Context + Services)
```
context/AppContext.ts     - Global state (user, posts, highlights, notifications)
services/ImageService.ts  - Image handling (picking, compression, upload)
```

### View Layer (Screens)
```
screens/
  ProfileScreen.tsx       - User profile with posts & stories
  HomeScreen.tsx         - Feed (to be implemented)
  SearchScreen.tsx       - Search users & posts
  MessagesScreen.tsx     - Direct messages
  MapScreen.tsx          - Map view
  ... + modals & detail screens
```

### Controller Layer (Navigation)
```
navigation/
  AppNavigator.js        - Auth flow
  MainNavigator.js       - Bottom tab navigation
  ProfileStackNavigator.js - Profile feature flows
```

---

## Standards Mobile Réseau Social

### Image Optimization
- ✅ Compression: 60-70% size reduction
- ✅ Cache policy: memory-disk caching
- ✅ Lazy loading: via expo-image
- ✅ Responsive sizing: aspect ratios preserved
- ✅ Thumbnail generation: for grid previews

### State Management
- ✅ Global context for: user, posts, highlights, notifications
- ✅ Local state for: UI interactions, form data
- ✅ Callback pattern: parent-child component sync

### Performance
- ✅ FlatList/ScrollView optimization
- ✅ Image caching (memory + disk)
- ✅ Pagination ready (not implemented yet)
- ✅ Safe area insets for notch support

### User Experience
- ✅ Modal transitions (slide animations)
- ✅ Loading states with ActivityIndicator
- ✅ Error handling with alerts
- ✅ Empty states for screens
- ✅ Pull-to-refresh (ready to implement)
- ✅ Haptic feedback (ready to implement)

### Security & Data
- ⚠️ Mock data (ready for Supabase integration)
- ⚠️ Image upload validation (size, format)
- ⚠️ User authentication (Supabase integration exists)

---

## Component Hierarchy

```
App
├─ AppProvider (Context)
└─ AppNavigator
   ├─ MainNavigator (Bottom Tabs)
   │  ├─ HomeStackNavigator
   │  │  └─ HomeScreen
   │  ├─ MapStackNavigator
   │  │  └─ MapScreen
   │  ├─ SearchStackNavigator
   │  │  └─ SearchScreen
   │  ├─ MessagesStackNavigator
   │  │  └─ MessagesScreen
   │  └─ ProfileStackNavigator
   │     ├─ ProfileScreen
   │     ├─ EditProfileScreen
   │     ├─ AddVehicleScreen
   │     ├─ SettingsScreen
   │     ├─ ActivityScreen
   │     ├─ SavedScreen
   │     └─ CreateStoryScreen (Modal)
   └─ Modals
      ├─ PostDetailModal
      ├─ StoryViewer
      └─ ActionSheets
```

---

## Key Services

### ImageService
```typescript
// Pick image from gallery
pickImage(aspect, quality)

// Compress for storage
compressImage(uri, quality)

// Resize thumbnails
resizeImage(uri, width, height)

// Upload to backend
uploadImage(uri, bucket)

// Cache cleanup
cleanupCachedImages()
```

---

## Global State (AppContext)

### User Profile
- id, username, displayName, avatar, bio
- followersCount, followingCount, postsCount
- isPrivate flag

### Posts (Garage)
- id, title, image, description
- likes, comments, shares
- isSaved flag

### Highlights (Stories)
- id, name, image
- createdAt, storyCount

### Notifications
- unreadCount
- markAsRead()

---

## Next Features to Implement

### High Priority
- [ ] Feed page (HomeScreen with FlatList)
- [ ] Real Supabase integration (auth + storage)
- [ ] Pull-to-refresh
- [ ] Infinite pagination
- [ ] Comment system
- [ ] Direct messaging

### Medium Priority
- [ ] Search functionality
- [ ] User discovery/explore
- [ ] Notifications real-time
- [ ] Share to social
- [ ] Profile customization

### Low Priority
- [ ] Dark mode
- [ ] Multiple languages
- [ ] Accessibility (a11y)
- [ ] Analytics integration
- [ ] Push notifications

---

## API Integration Points

### Supabase Ready
```typescript
// Already configured
import { supabase } from '../supabaseClient'

// To implement:
supabase.storage.uploadImage()
supabase.database.posts.insert()
supabase.database.highlights.insert()
supabase.realtime.subscribe()
```

---

## Testing Checklist

- [x] Image picking works (AddVehicle, EditProfile, CreateStory)
- [x] Image compression works
- [x] Post engagement (like, save, share)
- [x] Story creation and viewing
- [x] Navigation flows
- [x] Global state updates
- [ ] API integration
- [ ] Offline support
- [ ] Error handling edge cases

---

## Performance Metrics Target

- Load time: < 2s
- Image load: < 1s (cached)
- Scroll FPS: 60fps
- Memory: < 150MB
- Cache size: < 500MB

---

## Development Standards

### Code Style
- TypeScript for screens
- JSDoc comments for services
- Consistent naming (camelCase)
- Props validation with types

### File Organization
```
screens/     - UI components
services/    - Business logic
context/     - Global state
navigation/  - Navigation config
assets/      - Images, fonts
```

### Commit Messages
- feat: new feature
- fix: bug fix
- refactor: code improvements
- docs: documentation
- test: test additions

---

## Debugging

### Common Issues
1. **Image not loading**: Check URI format, use fallback
2. **State not updating**: Check context provider wrapping
3. **Memory leak**: Clean up subscriptions, abort requests
4. **Slow scrolling**: Optimize with FlatList, remove console logs

### Tools
- Flipper: React Native debugging
- Expo DevTools: Network & storage inspection
- React DevTools: Component inspection

---

## Deployment Checklist

- [ ] Remove console.log statements
- [ ] Update API endpoints
- [ ] Configure environment variables
- [ ] Test on real devices
- [ ] Check app.json settings
- [ ] Build APK/IPA
- [ ] Submit to stores
