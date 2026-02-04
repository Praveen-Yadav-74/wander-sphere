# Mobile Deployment Guide

## Backend Optimizations Complete ✅

The following optimizations have been applied:

1. **Budget Expense Endpoint Optimized** - Reduced API response time by using
   parallel queries
2. **Database Indexes Created** - Migration script ready at
   `backend/migrations/add_budget_indexes.sql`
3. **Profile Images Fixed** - Explicitly set to null by default (no random
   assignments)

## Next Steps: Deploy to Mobile

### Apply Database Indexes (IMPORTANT)

Before testing on mobile, apply the performance indexes:

```bash
cd backend
node migrations/apply_budget_indexes.js
```

**OR** manually run the SQL in your Supabase dashboard:

- Open Supabase project → SQL Editor
- Run the contents of `backend/migrations/add_budget_indexes.sql`

### Build & Deploy to Android

```bash
# Open Android Studio
npx cap open android
```

In Android Studio:

1. Wait for Gradle sync to complete
2. Click "Run" button (green triangle) or press Shift+F10
3. Select your connected device or emulator
4. Test budget transaction speed

### Build & Deploy to iOS

```bash
# Open Xcode
npx cap open ios
```

In Xcode:

1. Wait for project to load
2. Select your device/simulator from the scheme menu
3. Click "Run" button (▶) or press Cmd+R
4. Test budget transaction speed

## Testing Checklist

- [ ] Budget expense adds instantly (< 2 seconds)
- [ ] UI updates immediately after transaction
- [ ] New user profile shows no image (not a random one)
- [ ] Profile image upload works correctly
- [ ] Backend responds quickly even on slower mobile connections

## Troubleshooting

**If build fails:**

- Ensure Node modules are up to date: `npm install`
- Clear Capacitor cache: `npx cap sync --force`
- Rebuild: `npm run build && npx cap sync`

**If app crashes on mobile:**

- Check browser console in Android Studio (Logcat) or Xcode (Console)
- Verify backend URL is accessible from mobile device
- Check CORS settings in backend
