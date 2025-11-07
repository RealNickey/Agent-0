"use client";

import { useSupabase, useSupabaseUser } from "@/lib/supabase/use-supabase";
import { useEffect, useState } from "react";

export default function TestSupabasePage() {
  const { supabase, isAuthenticated, isLoading, userId } = useSupabase();
  const { supabaseUser, isLoading: userLoading, error } = useSupabaseUser();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTests = async () => {
    setTestResults([]);
    addResult("🧪 Starting Supabase + Clerk integration tests...");

    // Test 1: Check authentication
    if (!isAuthenticated) {
      addResult("❌ Not authenticated - Please sign in first");
      return;
    }
    addResult("✅ User is authenticated");
    addResult(`   Clerk User ID: ${userId}`);

    // Test 2: Check Supabase user record
    if (!supabaseUser) {
      addResult("❌ Supabase user record not found");
      return;
    }
    addResult("✅ Supabase user record exists");
    addResult(`   Database User ID: ${supabaseUser.id}`);
    addResult(`   Email: ${supabaseUser.email}`);

    if (!supabase) {
      addResult("❌ Supabase client not initialized");
      return;
    }

    // Test 3: Try to fetch conversations (should work even if empty)
    try {
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .limit(5);

      if (convError) throw convError;
      
      addResult(`✅ Can query conversations table`);
      addResult(`   Found ${conversations?.length || 0} conversations`);
    } catch (err: any) {
      addResult(`❌ Failed to query conversations: ${err.message}`);
    }

    // Test 4: Try to create a test conversation
    try {
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          user_id: supabaseUser.id,
          title: `Test Conversation - ${new Date().toLocaleTimeString()}`,
          metadata: { test: true }
        })
        .select()
        .single();

      if (createError) throw createError;

      addResult(`✅ Created test conversation`);
      addResult(`   Conversation ID: ${newConv.id}`);

      // Test 5: Add a test message
      const { data: newMsg, error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: newConv.id,
          role: 'user',
          content: 'This is a test message from the integration test page',
        })
        .select()
        .single();

      if (msgError) throw msgError;

      addResult(`✅ Created test message`);
      addResult(`   Message ID: ${newMsg.id}`);

      // Test 6: Fetch the conversation with messages
      const { data: convWithMsgs, error: fetchError } = await supabase
        .from('conversations')
        .select('*, messages(*)')
        .eq('id', newConv.id)
        .single();

      if (fetchError) throw fetchError;

      addResult(`✅ Can query conversations with messages`);
      addResult(`   Messages count: ${convWithMsgs.messages?.length || 0}`);

    } catch (err: any) {
      addResult(`❌ Failed to create test data: ${err.message}`);
    }

    // Test 7: Test favorites
    try {
      const { data: fav, error: favError } = await supabase
        .from('favorites')
        .insert({
          user_id: supabaseUser.id,
          movie_id: Math.floor(Math.random() * 10000), // Random movie ID to avoid conflicts
          movie_title: 'Test Movie',
          movie_poster: '/test.jpg'
        })
        .select()
        .single();

      if (favError && favError.code !== '23505') throw favError; // Ignore duplicate errors

      if (!favError) {
        addResult(`✅ Can add to favorites`);
        addResult(`   Favorite ID: ${fav.id}`);
      } else {
        addResult(`✅ Favorites table accessible (duplicate prevented)`);
      }
    } catch (err: any) {
      addResult(`❌ Failed favorites test: ${err.message}`);
    }

    addResult("🎉 Tests complete!");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Supabase + Clerk Integration Test</h1>

        {/* Authentication Status */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Clerk Auth:</span>
              <span className={isAuthenticated ? "text-green-500" : "text-red-500"}>
                {isLoading ? "Loading..." : isAuthenticated ? "✅ Signed In" : "❌ Not Signed In"}
              </span>
            </div>
            {isAuthenticated && (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Clerk User ID:</span>
                  <span className="text-muted-foreground font-mono text-sm">{userId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Supabase User:</span>
                  <span className={supabaseUser ? "text-green-500" : "text-yellow-500"}>
                    {userLoading ? "Loading..." : supabaseUser ? "✅ Synced" : "⚠️ Not Found"}
                  </span>
                </div>
                {supabaseUser && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Database User ID:</span>
                      <span className="text-muted-foreground font-mono text-sm">{supabaseUser.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Email:</span>
                      <span className="text-muted-foreground">{supabaseUser.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Name:</span>
                      <span className="text-muted-foreground">{supabaseUser.name}</span>
                    </div>
                  </>
                )}
              </>
            )}
            {error && (
              <div className="text-red-500 text-sm">
                Error: {error.message}
              </div>
            )}
          </div>
        </div>

        {/* Test Runner */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Run Integration Tests</h2>
          <button
            onClick={runTests}
            disabled={!isAuthenticated || isLoading || userLoading}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || userLoading ? "Loading..." : "Run Tests"}
          </button>
          {!isAuthenticated && (
            <p className="text-sm text-muted-foreground mt-2">
              Please sign in to run tests
            </p>
          )}
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="bg-muted rounded-lg p-4 font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
              {testResults.map((result, i) => (
                <div key={i} className="text-foreground">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-muted border border-border rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Testing Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Make sure you're signed in with Clerk</li>
            <li>Click "Run Tests" button above</li>
            <li>Check the test results for any errors</li>
            <li>All tests should show ✅ if integration is working correctly</li>
          </ol>
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
              ⚠️ Important: Make sure you have configured the Clerk JWT template named "supabase"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
