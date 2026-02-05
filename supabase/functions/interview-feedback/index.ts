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
    const totalTime = results.reduce((sum: number, r: any) => sum + (r.time_spent || 0), 0);
    const avgTimePerQuestion = totalTime / totalQuestions;
    const totalHintsUsed = results.reduce((sum: number, r: any) => sum + (r.hints_used || 0), 0);
    
    // Calculate difficulty distribution
    const easyQuestions = results.filter((r: any) => r.difficulty === 'easy');
    const mediumQuestions = results.filter((r: any) => r.difficulty === 'medium');
    const hardQuestions = results.filter((r: any) => r.difficulty === 'hard');
    
    const easySolved = easyQuestions.filter((r: any) => r.is_solved).length;
    const mediumSolved = mediumQuestions.filter((r: any) => r.is_solved).length;
    const hardSolved = hardQuestions.filter((r: any) => r.is_solved).length;
    
    // Time analysis per difficulty
    const avgTimeEasy = easyQuestions.length > 0 ? easyQuestions.reduce((sum: number, r: any) => sum + (r.time_spent || 0), 0) / easyQuestions.length : 0;
    const avgTimeMedium = mediumQuestions.length > 0 ? mediumQuestions.reduce((sum: number, r: any) => sum + (r.time_spent || 0), 0) / mediumQuestions.length : 0;
    const avgTimeHard = hardQuestions.length > 0 ? hardQuestions.reduce((sum: number, r: any) => sum + (r.time_spent || 0), 0) / hardQuestions.length : 0;
    
    // Hints analysis
    const hintsOnSolved = results.filter((r: any) => r.is_solved).reduce((sum: number, r: any) => sum + (r.hints_used || 0), 0);
    const hintsOnUnsolved = results.filter((r: any) => !r.is_solved && !r.skipped).reduce((sum: number, r: any) => sum + (r.hints_used || 0), 0);
    
    // Code analysis (if available)
    const hasCodeSubmissions = results.some((r: any) => r.submitted_code);
    
    // Benchmark times (in seconds) - typical expectations
    const benchmarks = {
      easy: { optimal: 300, acceptable: 600 },     // 5-10 min
      medium: { optimal: 600, acceptable: 1200 },  // 10-20 min
      hard: { optimal: 1200, acceptable: 2400 }    // 20-40 min
    };

    const prompt = `You are a SENIOR DSA Interview Mentor with 10+ years of experience at FAANG companies. Analyze this interview performance like a real senior engineer would - be honest, specific, and actionable.

## SESSION OVERVIEW
- Type: ${sessionData.session_type}
- Time Limit: ${Math.floor(sessionData.time_limit / 60)} minutes total
- Questions: ${totalQuestions} attempted
- Success Rate: ${solvedCount}/${totalQuestions} (${Math.round((solvedCount/totalQuestions)*100)}%)
- Skipped: ${skippedCount}
- Total Time Spent: ${Math.round(totalTime/60)} minutes
- Average Time/Question: ${Math.round(avgTimePerQuestion/60)} min ${Math.round(avgTimePerQuestion%60)} sec

## DIFFICULTY BREAKDOWN
- Easy: ${easySolved}/${easyQuestions.length} solved (Avg time: ${Math.round(avgTimeEasy/60)}m ${Math.round(avgTimeEasy%60)}s) [Benchmark: ${benchmarks.easy.optimal/60}-${benchmarks.easy.acceptable/60} min]
- Medium: ${mediumSolved}/${mediumQuestions.length} solved (Avg time: ${Math.round(avgTimeMedium/60)}m ${Math.round(avgTimeMedium%60)}s) [Benchmark: ${benchmarks.medium.optimal/60}-${benchmarks.medium.acceptable/60} min]
- Hard: ${hardSolved}/${hardQuestions.length} solved (Avg time: ${Math.round(avgTimeHard/60)}m ${Math.round(avgTimeHard%60)}s) [Benchmark: ${benchmarks.hard.optimal/60}-${benchmarks.hard.acceptable/60} min]

## HINT USAGE ANALYSIS
- Total Hints: ${totalHintsUsed}
- Hints on Solved: ${hintsOnSolved}
- Hints on Unsolved: ${hintsOnUnsolved}
- Dependency Score: ${totalHintsUsed > 0 ? ((hintsOnSolved / totalHintsUsed) * 100).toFixed(0) : 0}% effective use

## DETAILED QUESTION ANALYSIS
${results.map((r: any, i: number) => {
  const timeMin = Math.floor(r.time_spent / 60);
  const timeSec = r.time_spent % 60;
  const benchmark = benchmarks[r.difficulty as keyof typeof benchmarks] || benchmarks.medium;
  const timeStatus = r.time_spent <= benchmark.optimal ? '✅ Excellent' : r.time_spent <= benchmark.acceptable ? '⚡ Good' : '⚠️ Slow';
  return `${i + 1}. "${r.question_title}" [${r.difficulty.toUpperCase()}]
   - Status: ${r.is_solved ? '✅ SOLVED' : r.skipped ? '⏭️ SKIPPED' : '❌ ATTEMPTED'}
   - Time: ${timeMin}m ${timeSec}s ${timeStatus}
   - Hints: ${r.hints_used} ${r.hints_used > 2 ? '(High dependency)' : r.hints_used > 0 ? '(Moderate)' : '(Independent)'}
   ${r.submitted_code ? `- Code submitted: Yes` : ''}`;
}).join('\n')}

## YOUR ANALYSIS TASK
Provide a STRUCTURED feedback report with these EXACT sections (use the headers exactly):

### 📊 PERFORMANCE VERDICT
Give a 2-3 sentence honest assessment. Rate as: STRONG HIRE / HIRE / BORDERLINE / NEEDS IMPROVEMENT. Be specific about what drove this rating.

### ⏱️ TIME MANAGEMENT ANALYSIS
- Compare their times to industry benchmarks
- Identify if they're rushing or taking too long
- Note any concerning patterns (e.g., easy problems taking too long)

### 💡 PROBLEM-SOLVING PATTERNS
- What patterns did they handle well?
- What types of problems need work?
- Are they recognizing patterns quickly or struggling?

### 🔧 TECHNICAL GAPS IDENTIFIED
Be specific about what concepts/patterns they need to study:
- List 2-3 specific algorithm patterns or data structures to review
- Mention if hint usage suggests knowledge gaps vs. confidence issues

### 📈 IMPROVEMENT ROADMAP
Provide a concrete 1-week action plan:
- Day 1-2: [specific focus area]
- Day 3-4: [specific focus area]  
- Day 5-7: [specific practice recommendation]

### 🎯 NEXT SESSION RECOMMENDATIONS
- What difficulty mix should they attempt next?
- Which specific patterns to focus on?
- Suggested time targets for each difficulty

Be HONEST and SPECIFIC. Vague feedback doesn't help anyone grow. If they did poorly, say so constructively. If they did well, acknowledge it but still push for improvement.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a SENIOR DSA Interview Mentor from Google/Meta with 10+ years of experience. You give honest, detailed, actionable feedback that actually helps engineers improve. You don't sugarcoat but you're encouraging. Use the exact section headers provided." },
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
