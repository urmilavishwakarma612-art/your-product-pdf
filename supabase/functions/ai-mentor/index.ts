import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user's JWT and get user info
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`AI Mentor request from user: ${user.id}`);

    const { mode, questionTitle, questionDescription, customQuestion } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`AI Mentor request - Mode: ${mode}, Question: ${questionTitle}`);

    let systemPrompt = `You are an expert coding mentor helping students solve LeetCode-style algorithm problems. 
The current problem is: "${questionTitle}"
${questionDescription ? `Description: ${questionDescription}` : ""}

Be encouraging, clear, and educational. Use code examples in Python or JavaScript when helpful.`;

    let userPrompt = "";

    switch (mode) {
      case "hint":
        userPrompt = `Give me a subtle hint to help me start thinking about this problem. 
Don't reveal the solution - just nudge me in the right direction. 
Keep it brief (2-3 sentences).`;
        break;
      case "approach":
        userPrompt = `Explain the high-level approach to solve this problem.
- What data structures should I consider?
- What pattern or technique applies here?
- Walk me through the thought process step by step.
Don't write the actual code yet.`;
        break;
      case "brute_force":
        userPrompt = `Show me the brute force solution for this problem.
- Explain why this approach works
- Provide the code implementation
- Analyze the time and space complexity
- Explain why this might not be optimal`;
        break;
      case "solution":
        userPrompt = `Provide the optimal solution for this problem.
- Explain the intuition and approach
- Provide clean, well-commented code
- Analyze time and space complexity
- Mention any edge cases to consider`;
        break;
      case "custom":
        userPrompt = customQuestion || "Help me understand this problem better.";
        break;
      default:
        userPrompt = "Help me understand this problem.";
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("Error response:", errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI Mentor error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
