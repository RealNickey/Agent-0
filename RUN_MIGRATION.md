# 🚀 How to Run Database Migration

## The Problem
You're seeing: `Error: Database error: Could not find the table 'public.users' in the schema cache`

This means the database tables haven't been created yet. The migration SQL file exists locally but hasn't been applied to your Supabase database.

---

## ✅ Solution: Run Migration via Supabase Dashboard (2 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/gxkarytdhtsarqbjceco
2. In the left sidebar, click **"SQL Editor"**

### Step 2: Copy the Migration SQL
Open this file: `supabase/migrations/20250102_initial_schema.sql`

Copy ALL the contents (211 lines)

### Step 3: Paste and Run
1. In the SQL Editor, click **"New Query"**
2. Paste the entire migration SQL
3. Click **"Run"** button (or press `Ctrl + Enter`)

### Step 4: Verify Tables Were Created
You should see success messages for:
- ✅ UUID extension enabled
- ✅ 5 tables created (users, conversations, messages, favorites, watchlist)
- ✅ Indexes created
- ✅ RLS policies enabled

To verify, click **"Table Editor"** in the left sidebar. You should see all 5 tables.

---

## 🔄 Alternative: Install Supabase CLI

If you prefer using CLI:

```powershell
# Install Supabase CLI
scoop install supabase

# OR using npm
npm install -g supabase

# Link to your project
supabase link --project-ref gxkarytdhtsarqbjceco

# Run migrations
supabase db push
```

---

## ✅ After Migration

1. Refresh your app: http://localhost:3000/test-supabase
2. The error should be gone
3. User data should load properly
4. Tests should pass

---

## 🆘 Troubleshooting

**If you see "permission denied"**:
- Make sure you're logged into the correct Supabase account
- Check that you have admin access to the project

**If tables already exist**:
- The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times
- If you need to start fresh, drop all tables first in SQL Editor:
  ```sql
  DROP TABLE IF EXISTS messages CASCADE;
  DROP TABLE IF EXISTS conversations CASCADE;
  DROP TABLE IF EXISTS favorites CASCADE;
  DROP TABLE IF EXISTS watchlist CASCADE;
  DROP TABLE IF EXISTS users CASCADE;
  ```

**If RLS policies fail**:
- This might happen if you're re-running. Drop policies first:
  ```sql
  DROP POLICY IF EXISTS "Users can view their own profile" ON users;
  -- (repeat for all policies)
  ```
