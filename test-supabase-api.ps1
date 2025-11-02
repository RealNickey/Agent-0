# Supabase Database API Test Script
# Run this after starting the dev server with: npm run dev

Write-Host "=== Supabase Database API Tests ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Test 1: Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/db/health" -Method Get
    Write-Host "✓ Health Check: $($health.status)" -ForegroundColor Green
    Write-Host "  Database: $($health.database)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Create User
Write-Host "2. Testing Create User..." -ForegroundColor Yellow
try {
    $createUserBody = @{
        clerk_user_id = "test_user_$(Get-Random)"
        email = "test@example.com"
        name = "Test User"
        preferences = @{
            theme = "dark"
            notifications = $true
        }
    } | ConvertTo-Json

    $user = Invoke-RestMethod -Uri "$baseUrl/api/db/users" -Method Post -Body $createUserBody -ContentType "application/json"
    $userId = $user.user.id
    $clerkUserId = $user.user.clerk_user_id
    Write-Host "✓ User Created: $($user.user.name) (ID: $userId)" -ForegroundColor Green
} catch {
    Write-Host "✗ Create User Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}
Write-Host ""

# Test 3: Get User
Write-Host "3. Testing Get User..." -ForegroundColor Yellow
try {
    $getUser = Invoke-RestMethod -Uri "$baseUrl/api/db/users?clerk_user_id=$clerkUserId" -Method Get
    Write-Host "✓ User Retrieved: $($getUser.user.email)" -ForegroundColor Green
} catch {
    Write-Host "✗ Get User Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Create Conversation
Write-Host "4. Testing Create Conversation..." -ForegroundColor Yellow
try {
    $createConvBody = @{
        user_id = $userId
        title = "Test Conversation - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        metadata = @{
            source = "test_script"
        }
    } | ConvertTo-Json

    $conversation = Invoke-RestMethod -Uri "$baseUrl/api/db/conversations" -Method Post -Body $createConvBody -ContentType "application/json"
    $conversationId = $conversation.conversation.id
    Write-Host "✓ Conversation Created: $($conversation.conversation.title)" -ForegroundColor Green
} catch {
    Write-Host "✗ Create Conversation Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Create Messages
Write-Host "5. Testing Create Messages..." -ForegroundColor Yellow
try {
    # User message
    $userMsgBody = @{
        conversation_id = $conversationId
        role = "user"
        content = "Hello, AI! Can you help me find a movie?"
    } | ConvertTo-Json

    $userMsg = Invoke-RestMethod -Uri "$baseUrl/api/db/messages" -Method Post -Body $userMsgBody -ContentType "application/json"
    Write-Host "✓ User Message Created" -ForegroundColor Green

    # Assistant message
    $assistantMsgBody = @{
        conversation_id = $conversationId
        role = "assistant"
        content = "Of course! I'd be happy to help you find a movie. What kind of movies do you enjoy?"
    } | ConvertTo-Json

    $assistantMsg = Invoke-RestMethod -Uri "$baseUrl/api/db/messages" -Method Post -Body $assistantMsgBody -ContentType "application/json"
    Write-Host "✓ Assistant Message Created" -ForegroundColor Green
} catch {
    Write-Host "✗ Create Messages Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Get Messages
Write-Host "6. Testing Get Messages..." -ForegroundColor Yellow
try {
    $messages = Invoke-RestMethod -Uri "$baseUrl/api/db/messages?conversation_id=$conversationId" -Method Get
    Write-Host "✓ Retrieved $($messages.messages.Count) messages" -ForegroundColor Green
} catch {
    Write-Host "✗ Get Messages Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7: Add to Favorites
Write-Host "7. Testing Add to Favorites..." -ForegroundColor Yellow
try {
    $favBody = @{
        user_id = $userId
        movie_id = 550
        movie_title = "Fight Club"
        movie_poster = "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"
        metadata = @{
            added_via = "test_script"
        }
    } | ConvertTo-Json

    $favorite = Invoke-RestMethod -Uri "$baseUrl/api/db/favorites" -Method Post -Body $favBody -ContentType "application/json"
    Write-Host "✓ Added to Favorites: $($favorite.favorite.movie_title)" -ForegroundColor Green
} catch {
    Write-Host "✗ Add to Favorites Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 8: Add to Watchlist
Write-Host "8. Testing Add to Watchlist..." -ForegroundColor Yellow
try {
    $watchlistBody = @{
        user_id = $userId
        movie_id = 680
        movie_title = "Pulp Fiction"
        movie_poster = "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg"
        metadata = @{
            added_via = "test_script"
        }
    } | ConvertTo-Json

    $watchlist = Invoke-RestMethod -Uri "$baseUrl/api/db/watchlist" -Method Post -Body $watchlistBody -ContentType "application/json"
    $watchlistId = $watchlist.watchlist.id
    Write-Host "✓ Added to Watchlist: $($watchlist.watchlist.movie_title)" -ForegroundColor Green
} catch {
    Write-Host "✗ Add to Watchlist Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 9: Mark as Watched
Write-Host "9. Testing Mark as Watched..." -ForegroundColor Yellow
try {
    $updateWatchlistBody = @{
        id = $watchlistId
        watched = $true
    } | ConvertTo-Json

    $updated = Invoke-RestMethod -Uri "$baseUrl/api/db/watchlist" -Method Patch -Body $updateWatchlistBody -ContentType "application/json"
    Write-Host "✓ Marked as Watched: $($updated.watchlist.movie_title)" -ForegroundColor Green
} catch {
    Write-Host "✗ Mark as Watched Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 10: Get User Data Summary
Write-Host "10. Testing Get User Data Summary..." -ForegroundColor Yellow
try {
    $conversations = Invoke-RestMethod -Uri "$baseUrl/api/db/conversations?user_id=$userId" -Method Get
    $favorites = Invoke-RestMethod -Uri "$baseUrl/api/db/favorites?user_id=$userId" -Method Get
    $watchlist = Invoke-RestMethod -Uri "$baseUrl/api/db/watchlist?user_id=$userId" -Method Get
    
    Write-Host "✓ User Data Summary:" -ForegroundColor Green
    Write-Host "  - Conversations: $($conversations.conversations.Count)" -ForegroundColor Gray
    Write-Host "  - Favorites: $($favorites.favorites.Count)" -ForegroundColor Gray
    Write-Host "  - Watchlist: $($watchlist.watchlist.Count)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Get User Data Summary Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== All Tests Completed ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test User ID: $userId" -ForegroundColor Gray
Write-Host "Clerk User ID: $clerkUserId" -ForegroundColor Gray
Write-Host ""
Write-Host "Note: You can clean up test data manually via Supabase dashboard" -ForegroundColor Yellow
