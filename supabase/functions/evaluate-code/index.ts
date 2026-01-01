import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      code, 
      language, 
      questionTitle, 
      difficulty, 
      patternName,
      thinkingTime,
      codingTime 
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!code || code.trim().length < 10) {
      return new Response(JSON.stringify({
        evaluation: {
          is_correct: false,
          approach_used: "unknown",
          pattern_detected: null,
          complexity_analysis: { time: "N/A", space: "N/A" },
          thinking_time: thinkingTime || 0,
          coding_time: codingTime || 0,
          quality_score: 0,
          feedback: "No code submitted or code too short to evaluate.",
          suggestions: ["Write a complete solution before submitting."]
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Evaluating code for: ${questionTitle} (${difficulty})`);

    const prompt = `You are an expert DSA code reviewer. Analyze this code submission and provide a structured evaluation.

Question: ${questionTitle}
Difficulty: ${difficulty}
Pattern: ${patternName || "Not specified"}
Language: ${language}
Thinking Time: ${thinkingTime} seconds
Coding Time: ${codingTime} seconds

Submitted Code:
\`\`\`${language}
${code}
\`\`\`

Evaluate the code and respond with ONLY a valid JSON object (no markdown, no explanation outside JSON):

{
  "is_correct": <boolean - true if the code would likely solve the problem correctly>,
  "approach_used": <"optimal" | "suboptimal" | "brute_force" | "unknown">,
  "pattern_detected": <string or null - what DSA pattern was used>,
  "complexity_analysis": {
    "time": <string - e.g. "O(n)", "O(n^2)">,
    "space": <string - e.g. "O(1)", "O(n)">,
    "optimal_time": <string - what the optimal time complexity should be>,
    "optimal_space": <string - what the optimal space complexity should be>
  },
  "quality_score": <number 0-100 based on correctness, efficiency, code quality>,
  "feedback": <string - 2-3 sentences of constructive feedback>,
  "suggestions": [<array of 2-3 specific improvement suggestions>]
}

Be fair but constructive. Consider:
- Code correctness and logic
- Time/space complexity vs optimal
- Code readability and style
- Edge case handling
- DSA pattern recognition`;

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
            content: "You are an expert DSA code reviewer. Always respond with valid JSON only." 
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to evaluate code");
    }

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content || "";
    
    // Clean up response - remove markdown code blocks if present
    aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log("AI Response:", aiResponse);

    let evaluation;
    try {
      evaluation = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      evaluation = {
        is_correct: false,
        approach_used: "unknown",
        pattern_detected: patternName || null,
        complexity_analysis: { time: "N/A", space: "N/A" },
        thinking_time: thinkingTime || 0,
        coding_time: codingTime || 0,
        quality_score: 30,
        feedback: "Code submitted. AI analysis encountered an issue, but your submission has been recorded.",
        suggestions: ["Try to optimize your solution", "Consider edge cases"]
      };
    }

    // Add timing data to evaluation
    evaluation.thinking_time = thinkingTime || 0;
    evaluation.coding_time = codingTime || 0;

    return new Response(JSON.stringify({ evaluation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("evaluate-code error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      evaluation: {
        is_correct: false,
        approach_used: "unknown",
        pattern_detected: null,
        complexity_analysis: { time: "N/A", space: "N/A" },
        thinking_time: 0,
        coding_time: 0,
        quality_score: 0,
        feedback: "An error occurred during evaluation.",
        suggestions: []
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
