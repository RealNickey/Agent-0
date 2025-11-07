# Clerk JWT Template Setup for Supabase

## ⚠️ REQUIRED CONFIGURATION

The errors you're seeing are because **Clerk JWT template is not configured**. This is required for Supabase Row Level Security (RLS) to work with Clerk authentication.

## Error Messages You're Seeing

```
Error: Database error: No suitable key or wrong key type
Supabase query error: {}
```

These occur because `getToken({ template: "supabase" })` returns `null` when the template doesn't exist.

---

## 🔧 How to Fix (5 minutes)

### Step 1: Go to Clerk Dashboard
Visit: https://dashboard.clerk.com

### Step 2: Navigate to JWT Templates
- In the left sidebar, find **Configure** section
- Click **JWT Templates**

### Step 3: Create Supabase Template
1. Click **"+ New template"** button
2. You'll see template options - select **"Supabase"**
3. Name it: **`supabase`** (exactly this name - lowercase)
4. Click **"Apply Changes"** or **"Save"**

### Step 4: Get Your Supabase JWT Secret
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `gxkarytdhtsarqbjceco`
3. Go to **Settings** → **API**
4. Copy the **JWT Secret** (under "JWT Settings")

### Step 5: Add JWT Secret to Clerk Template
1. Back in Clerk Dashboard, edit your "supabase" JWT template
2. Find the **Signing Key** section
3. Paste your Supabase JWT Secret
4. Click **Save**

### Step 6: Refresh Your App
1. Go back to your app: http://localhost:3000/test-supabase
2. Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
3. Sign in again if needed

---

## ✅ How to Verify It Works

After configuration, you should see:

1. **No more console errors** about "No suitable key"
2. **User data loads** in the test page
3. **Tests pass** when you click "Run Tests"

If you still see a warning:
```
⚠️ Clerk JWT template 'supabase' not found. Using anonymous client.
```

Then the template name is incorrect or not saved. Make sure it's exactly `supabase` (lowercase).

---

## 🔍 What This Does

- **Without JWT Template**: Clerk can't generate Supabase-compatible tokens → RLS policies block access → Errors
- **With JWT Template**: Clerk generates valid JWT tokens → Supabase verifies them → RLS policies allow user-specific data access

---

## 📚 Additional Resources

- [Clerk JWT Templates Docs](https://clerk.com/docs/backend-requests/making/jwt-templates)
- [Supabase + Clerk Integration](https://supabase.com/docs/guides/auth/social-login/auth-clerk)
- [Our Integration Guide](./CLERK_SUPABASE_INTEGRATION.md)

---

## 🆘 Still Having Issues?

If errors persist after setup:

1. **Check template name**: Must be exactly `supabase` (lowercase)
2. **Check JWT secret**: Must match your Supabase project's JWT secret
3. **Clear browser cache**: Hard refresh with `Ctrl + Shift + R`
4. **Check environment variables**: Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
5. **Restart dev server**: `npm run dev`

If you're still stuck, the app will now show a helpful warning message explaining exactly what's missing.
