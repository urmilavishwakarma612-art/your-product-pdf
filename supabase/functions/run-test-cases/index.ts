import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization required', passed: 0, total: 0, results: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: 'Invalid session', passed: 0, total: 0, results: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Test cases requested by user:', claimsData.user.id);

    const { 
      code, 
      language, 
      questionTitle, 
      difficulty,
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!code || code.trim().length < 10) {
      return new Response(JSON.stringify({
        passed: 0,
        total: 0,
        results: [],
        error: "No code to test"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Running test cases for: ${questionTitle}`);

    const prompt = `You are a DSA testing engine. Generate test cases and simulate running the code against them.

Question: ${questionTitle}
Difficulty: ${difficulty}
Language: ${language}

Submitted Code:
\`\`\`${language}
${code}
\`\`\`

Generate 4-5 test cases (mix of basic, edge, and stress cases) and simulate what the code would output for each.
Analyze the code logic carefully to determine if it would pass each test case.

Respond with ONLY a valid JSON object:

{
  "passed": <number of test cases that would pass>,
  "total": <total number of test cases>,
  "results": [
    {
      "name": "Test Case 1 - Basic",
      "type": "basic",
      "input": "<sample input>",
      "expected": "<expected output>",
      "actual": "<what the code would output based on its logic>",
      "passed": <boolean>
    },
    {
      "name": "Test Case 2 - Edge Case",
      "type": "edge",
      "input": "<edge case input>",
      "expected": "<expected output>",
      "actual": "<what the code would output>",
      "passed": <boolean>
    }
  ]
}

Be realistic about what the code would actually produce based on its logic. Include:
- 2 basic test cases
- 2 edge cases (empty input, single element, large numbers, etc.)
- 1 stress test if applicable`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are a code testing engine. Analyze code and generate realistic test case results. Always respond with valid JSON only." 
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded", passed: 0, total: 0, results: [] }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Failed to run test cases");
    }

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content || "";
    
    // Clean up response
    aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log("Test case results:", aiResponse);

    let testResults;
    try {
      testResults = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error("Failed to parse test results:", parseError);
      testResults = {
        passed: 0,
        total: 3,
        results: [
          { name: "Test Case 1", type: "basic", input: "sample", expected: "output", actual: "error", passed: false },
          { name: "Test Case 2", type: "edge", input: "empty", expected: "output", actual: "error", passed: false },
          { name: "Test Case 3", type: "edge", input: "large", expected: "output", actual: "error", passed: false },
        ]
      };
    }

    return new Response(JSON.stringify(testResults), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("run-test-cases error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      passed: 0,
      total: 0,
      results: []
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
