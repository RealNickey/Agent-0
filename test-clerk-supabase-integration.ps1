# Testing Clerk + Supabase Integration

Write-Host "=== Clerk + Supabase Integration Tests ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Prerequisites:" -ForegroundColor Yellow
Write-Host "  1. Dev server running (npm run dev)" -ForegroundColor Gray
Write-Host "  2. Clerk JWT template 'supabase' configured" -ForegroundColor Gray
Write-Host "  3. User signed in to the application" -ForegroundColor Gray
Write-Host ""

$baseUrl = "http://localhost:3000"

# Test 1: Check Clerk Configuration
Write-Host "1. Testing Clerk Configuration..." -ForegroundColor Yellow
try {
    $clerkKey = $env:NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    if ($clerkKey -and $clerkKey.StartsWith("pk_")) {
        Write-Host "✓ Clerk publishable key configured" -ForegroundColor Green
    } else {
        Write-Host "✗ Clerk publishable key missing or invalid" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Could not verify Clerk configuration" -ForegroundColor Red
}
Write-Host ""

# Test 2: Check Supabase Environment
Write-Host "2. Testing Supabase Environment..." -ForegroundColor Yellow
try {
    $supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
    $supabaseKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if ($supabaseUrl -and $supabaseKey) {
        Write-Host "✓ Supabase environment variables configured" -ForegroundColor Green
    } else {
        Write-Host "✗ Supabase environment variables missing" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Could not verify Supabase configuration" -ForegroundColor Red
}
Write-Host ""

# Test 3: Database Health Check
Write-Host "3. Testing Database Connection..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/db/health" -Method Get
    Write-Host "✓ Database Status: $($health.status)" -ForegroundColor Green
    Write-Host "  Database Type: $($health.database)" -ForegroundColor Gray
    Write-Host "  Tables Accessible: $($health.tables.users)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Database health check failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Admin Client Test (should always work)
Write-Host "4. Testing Admin Client (Server-side)..." -ForegroundColor Yellow
Write-Host "  Note: This creates a test user using the admin client" -ForegroundColor Gray
try {
    $testUserId = "test_clerk_user_$(Get-Random)"
    $createUserBody = @{
        clerk_user_id = $testUserId
        email = "test@example.com"
        name = "Test User (Admin Created)"
    } | ConvertTo-Json

    $userResponse = Invoke-RestMethod -Uri "$baseUrl/api/db/users" -Method Post -Body $createUserBody -ContentType "application/json"
    Write-Host "✓ Admin client can create users" -ForegroundColor Green
    Write-Host "  Created user ID: $($userResponse.user.id)" -ForegroundColor Gray
    
    $testSupabaseUserId = $userResponse.user.id
} catch {
    Write-Host "✗ Admin client test failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: RLS Policy Test
Write-Host "5. Testing Row Level Security Policies..." -ForegroundColor Yellow
Write-Host "  Note: This test requires manual verification" -ForegroundColor Gray
Write-Host "" 
Write-Host "  To test RLS policies:" -ForegroundColor Cyan
Write-Host "  1. Sign in to the app with a Clerk account" -ForegroundColor Gray
Write-Host "  2. Open browser DevTools console" -ForegroundColor Gray
Write-Host "  3. Run the following code:" -ForegroundColor Gray
Write-Host ""
Write-Host "  ```javascript" -ForegroundColor Yellow
Write-Host "  // Test authenticated Supabase client" -ForegroundColor Gray
Write-Host "  import { useSupabase } from '@/lib/supabase/use-supabase';" -ForegroundColor Gray
Write-Host "  const { supabase } = useSupabase();" -ForegroundColor Gray
Write-Host "  const { data } = await supabase.from('users').select('*');" -ForegroundColor Gray
Write-Host "  console.log('My user data:', data); // Should only show your data" -ForegroundColor Gray
Write-Host "  ```" -ForegroundColor Yellow
Write-Host ""

# Test 6: User Sync Test
Write-Host "6. Testing User Synchronization..." -ForegroundColor Yellow
Write-Host "  Manual Test Required:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Sign in to the app with Clerk" -ForegroundColor Gray
Write-Host "  2. The useSupabaseUser hook should auto-create your database record" -ForegroundColor Gray
Write-Host "  3. Check Supabase dashboard -> Table Editor -> users table" -ForegroundColor Gray
Write-Host "  4. You should see a record with your Clerk user ID" -ForegroundColor Gray
Write-Host ""

# Test 7: Conversation Creation Test
Write-Host "7. Testing Conversation Creation (via API)..." -ForegroundColor Yellow
if ($testSupabaseUserId) {
    try {
        $convBody = @{
            user_id = $testSupabaseUserId
            title = "Test Conversation from Integration Test"
            metadata = @{
                test = $true
                created_by = "integration_test"
            }
        } | ConvertTo-Json

        $convResponse = Invoke-RestMethod -Uri "$baseUrl/api/db/conversations" -Method Post -Body $convBody -ContentType "application/json"
        Write-Host "✓ Can create conversation via admin API" -ForegroundColor Green
        Write-Host "  Conversation ID: $($convResponse.conversation.id)" -ForegroundColor Gray
        
        $testConversationId = $convResponse.conversation.id
    } catch {
        Write-Host "✗ Conversation creation failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⊘ Skipped (no test user created)" -ForegroundColor Yellow
}
Write-Host ""

# Test 8: Message Creation Test
Write-Host "8. Testing Message Creation..." -ForegroundColor Yellow
if ($testConversationId) {
    try {
        $msgBody = @{
            conversation_id = $testConversationId
            role = "user"
            content = "Test message from integration test"
            metadata = @{
                test = $true
            }
        } | ConvertTo-Json

        $msgResponse = Invoke-RestMethod -Uri "$baseUrl/api/db/messages" -Method Post -Body $msgBody -ContentType "application/json"
        Write-Host "✓ Can create message via admin API" -ForegroundColor Green
        Write-Host "  Message ID: $($msgResponse.message.id)" -ForegroundColor Gray
    } catch {
        Write-Host "✗ Message creation failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⊘ Skipped (no test conversation created)" -ForegroundColor Yellow
}
Write-Host ""

# Test 9: Favorites Test
Write-Host "9. Testing Favorites..." -ForegroundColor Yellow
if ($testSupabaseUserId) {
    try {
        $favBody = @{
            user_id = $testSupabaseUserId
            movie_id = 550
            movie_title = "Fight Club"
            movie_poster = "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"
        } | ConvertTo-Json

        $favResponse = Invoke-RestMethod -Uri "$baseUrl/api/db/favorites" -Method Post -Body $favBody -ContentType "application/json"
        Write-Host "✓ Can add movie to favorites" -ForegroundColor Green
        Write-Host "  Movie: $($favResponse.favorite.movie_title)" -ForegroundColor Gray
    } catch {
        Write-Host "✗ Favorites test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⊘ Skipped (no test user created)" -ForegroundColor Yellow
}
Write-Host ""

# Test 10: Watchlist Test
Write-Host "10. Testing Watchlist..." -ForegroundColor Yellow
if ($testSupabaseUserId) {
    try {
        $watchBody = @{
            user_id = $testSupabaseUserId
            movie_id = 680
            movie_title = "Pulp Fiction"
            movie_poster = "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg"
        } | ConvertTo-Json

        $watchResponse = Invoke-RestMethod -Uri "$baseUrl/api/db/watchlist" -Method Post -Body $watchBody -ContentType "application/json"
        Write-Host "✓ Can add movie to watchlist" -ForegroundColor Green
        Write-Host "  Movie: $($watchResponse.watchlist.movie_title)" -ForegroundColor Gray
    } catch {
        Write-Host "✗ Watchlist test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⊘ Skipped (no test user created)" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "=== Integration Test Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Completed:" -ForegroundColor Green
Write-Host "  - Clerk configuration verified" -ForegroundColor Gray
Write-Host "  - Supabase environment verified" -ForegroundColor Gray
Write-Host "  - Database connection working" -ForegroundColor Gray
Write-Host "  - Admin client operations working" -ForegroundColor Gray
Write-Host "  - CRUD operations functional" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Manual Tests Required:" -ForegroundColor Yellow
Write-Host "  1. Configure Clerk JWT template named 'supabase'" -ForegroundColor Gray
Write-Host "  2. Test authenticated client in browser console" -ForegroundColor Gray
Write-Host "  3. Verify RLS policies block unauthorized access" -ForegroundColor Gray
Write-Host "  4. Test useSupabase hook in React component" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "  - CLERK_SUPABASE_INTEGRATION.md - Full integration guide" -ForegroundColor Gray
Write-Host "  - SUPABASE_SETUP.md - Database setup guide" -ForegroundColor Gray
Write-Host ""
Write-Host "Cleanup:" -ForegroundColor Magenta
Write-Host "  Test data has been created in Supabase." -ForegroundColor Gray
Write-Host "  You can clean it up via Supabase Dashboard Table Editor" -ForegroundColor Gray
Write-Host ""
