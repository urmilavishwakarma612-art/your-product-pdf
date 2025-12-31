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
    const { sessionData, results } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const totalQuestions = results.length;
    const solvedCount = results.filter((r: any) => r.is_solved).length;
    const skippedCount = results.filter((r: any) => r.skipped).length;
    const avgTimePerQuestion = results.reduce((sum: number, r: any) => sum + (r.time_spent || 0), 0) / totalQuestions;
    const totalHintsUsed = results.reduce((sum: number, r: any) => sum + (r.hints_used || 0), 0);

    const prompt = `You are a DSA interview coach. Analyze this mock interview performance and provide actionable feedback.

Session Details:
- Type: ${sessionData.session_type}
- Time Limit: ${Math.floor(sessionData.time_limit / 60)} minutes
- Questions Attempted: ${totalQuestions}
- Solved: ${solvedCount}/${totalQuestions}
- Skipped: ${skippedCount}
- Average Time per Question: ${Math.round(avgTimePerQuestion)} seconds
- Total Hints Used: ${totalHintsUsed}

Question Results:
${results.map((r: any, i: number) => `${i + 1}. ${r.question_title} (${r.difficulty}) - ${r.is_solved ? 'Solved' : r.skipped ? 'Skipped' : 'Not Solved'} in ${r.time_spent}s, ${r.hints_used} hints`).join('\n')}

Provide:
1. Overall Performance Summary (2-3 sentences)
2. Strengths (2-3 bullet points)
3. Areas for Improvement (2-3 bullet points)
4. Specific Recommendations for Next Practice (2-3 actionable tips)

Keep the feedback encouraging but honest. Format with markdown.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert DSA interview coach providing constructive feedback." },
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
      throw new Error("Failed to get AI feedback");
    }

    const data = await response.json();
    const feedback = data.choices?.[0]?.message?.content || "Unable to generate feedback.";

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("interview-feedback error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
