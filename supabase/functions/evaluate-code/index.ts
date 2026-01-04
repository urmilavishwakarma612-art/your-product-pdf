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
      thinkingTime = 0,
      codingTime = 0,
      runCount = 0,
      pasteDetected = false,
      hintsUsed = 0,
      expectedTime = 600,
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
          code_quality_score: 0,
          interview_performance_score: 0,
          quality_score: 0,
          feedback: "No code submitted or code too short to evaluate.",
          interview_insight: "Write a complete solution before submitting.",
          suggestions: ["Write a complete solution before submitting."]
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate interview performance factors
    const runBeforeSubmit = runCount > 0;
    const totalTime = thinkingTime + codingTime;
    const thinkingRatio = totalTime > 0 ? (thinkingTime / totalTime) * 100 : 0;

    console.log(`Evaluating code for: ${questionTitle} (${difficulty}) - Run count: ${runCount}, Paste: ${pasteDetected}`);

    const prompt = `You are an expert DSA code reviewer AND interview coach. Analyze this code submission and provide a comprehensive two-level evaluation.

Question: ${questionTitle}
Difficulty: ${difficulty}
Pattern: ${patternName || "Not specified"}
Language: ${language}
Thinking Time: ${thinkingTime} seconds
Coding Time: ${codingTime} seconds
Total Time: ${totalTime} seconds
Expected Time: ${expectedTime} seconds
Run Before Submit: ${runBeforeSubmit}
Paste Detected: ${pasteDetected}
Hints Used: ${hintsUsed}

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
  "code_quality_score": <number 0-100>,
  "code_breakdown": {
    "correctness": <number 0-40 - does the logic solve the problem?>,
    "optimality": <number 0-25 - is it optimal approach?>,
    "clean_code": <number 0-20 - readability, naming, structure>,
    "edge_cases": <number 0-15 - handles edge cases?>
  },
  "interview_performance_score": <number 0-100>,
  "interview_breakdown": {
    "time_efficiency": <number 0-30 - based on time vs expected>,
    "run_discipline": <number 0-20 - ${runBeforeSubmit ? '20' : '5'} (tested before submitting?)>,
    "no_paste": <number 0-20 - ${pasteDetected ? '0' : '20'} (wrote code themselves?)>,
    "thinking_ratio": <number 0-15 - ideal is 15-30% thinking before coding>,
    "hint_penalty": <number 0-15 - ${15 - Math.min(15, hintsUsed * 5)} (deduct 5 per hint)>
  },
  "feedback": <string - 2-3 sentences of constructive feedback on CODE>,
  "interview_insight": <string - 1 sentence about interview behavior, e.g. "Your code is correct, but testing before submission would demonstrate better interview discipline.">,
  "suggestions": [<array of 2-3 specific improvement suggestions>]
}

IMPORTANT SCORING GUIDELINES:
- code_quality_score = sum of code_breakdown values
- interview_performance_score = sum of interview_breakdown values
- If paste was detected in interview mode, this is a red flag
- If no runs before submit, deduct from run_discipline
- Be constructive but honest about interview readiness`;

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
        code_quality_score: 30,
        code_breakdown: { correctness: 10, optimality: 5, clean_code: 10, edge_cases: 5 },
        interview_performance_score: 50,
        interview_breakdown: { 
          time_efficiency: 15, 
          run_discipline: runBeforeSubmit ? 20 : 5, 
          no_paste: pasteDetected ? 0 : 20, 
          thinking_ratio: 10, 
          hint_penalty: Math.max(0, 15 - hintsUsed * 5) 
        },
        feedback: "Code submitted. AI analysis encountered an issue, but your submission has been recorded.",
        interview_insight: "Testing before submission demonstrates better interview discipline.",
        suggestions: ["Try to optimize your solution", "Consider edge cases"]
      };
    }

    // Add timing and metadata to evaluation
    evaluation.thinking_time = thinkingTime || 0;
    evaluation.coding_time = codingTime || 0;
    evaluation.run_count = runCount;
    evaluation.paste_detected = pasteDetected;
    evaluation.run_before_submit = runBeforeSubmit;
    
    // Ensure backward compatibility with quality_score
    evaluation.quality_score = evaluation.code_quality_score || evaluation.quality_score || 50;

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
        code_quality_score: 0,
        interview_performance_score: 0,
        quality_score: 0,
        feedback: "An error occurred during evaluation.",
        interview_insight: "",
        suggestions: []
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});