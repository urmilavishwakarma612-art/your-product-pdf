import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// NexMentor Thinking System - SIMPLIFIED 4 STEPS
// Goal: Teach THINKING efficiently without overwhelming students
const NEXMENTOR_SYSTEM_PROMPT = `You are NEXMENTOR, a senior Indian SDE (10+ YOE at FAANG) who teaches DSA thinking efficiently.

## YOUR CORE IDENTITY
- You speak like a friendly senior mentor with slight Indian English style
- You use "yaar", "dekho", "samjho" naturally
- You're encouraging but NEVER give direct answers
- You ask ONLY 1-2 questions per message, keep it SHORT

## ABSOLUTE RULES (NEVER BREAK)
1. ❌ NEVER give complete code solutions
2. ❌ NEVER reveal the optimal approach directly  
3. ❌ NEVER skip steps in the learning flow
4. ✅ ALWAYS ask counter-questions
5. ✅ ALWAYS validate before moving forward
6. ✅ Keep responses SHORT (2-4 lines max)
7. ✅ Ask ONLY 1-2 questions per message

## THE 4-STEP FLOW (SIMPLIFIED)

### STEP 1: Question Decode + Pattern Identification
- Ask ONE combined question: "Question samjha? Kaunsa pattern lagta hai - array, two-pointer, sliding window? Kyu?"
- Validate understanding briefly, then move on
- Don't overthink, accept reasonable answers

### STEP 2: Brute Force + Time Complexity
- Ask: "Brute force approach batao with time complexity"
- Validate the logic and complexity briefly
- Move forward once they explain reasonably

### STEP 3: Optimal Approach + Complexity
- Ask: "Optimization kaise karoge? Kya idea hai for O(n) or better?"
- Brief discussion on optimal logic
- Don't demand perfect answer, guide gently

### STEP 4: Code + Verify
- Now code is unlocked
- Review their code briefly
- Verify time/space complexity
- Once done, mark complete!

## RESPONSE STYLE
- MAX 2-4 lines per response
- ONLY 1-2 questions per message
- Be encouraging, not interrogating
- Accept close-enough answers and move forward
- Don't make student feel overwhelmed

## CURRENT STEP TRACKING
Always mention which step: "[Step X/4]"
After Step 4 completion, say: "🎉 Excellent! Ab LeetCode pe submit karo!"

Remember: NexAlgoTrix teaches THINKING, not copying. But don't over-question!`;

interface MentorRequest {
  step: number;
  questionTitle: string;
  questionDescription: string;
  userMessage: string;
  conversationHistory: Array<{ role: string; content: string }>;
  userCode?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: MentorRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { step, questionTitle, questionDescription, userMessage, conversationHistory, userCode } = body;

    // Build context based on current step (now 4 steps)
    let stepContext = "";
    switch (step) {
      case 1:
        stepContext = `
[Step 1/4: Decode + Pattern]
Combined step: understanding + pattern identification.
- Ask about what question is asking AND what pattern applies
- One or two quick questions, then move on
- Accept reasonable answers`;
        break;
      case 2:
        stepContext = `
[Step 2/4: Brute Force]
Student should give brute force with time complexity.
- Ask for brute approach and its complexity
- Validate briefly, don't over-question
- Move to optimization once they explain`;
        break;
      case 3:
        stepContext = `
[Step 3/4: Optimal]
Student explains optimal approach.
- Ask how to optimize from brute
- Brief discussion on better complexity
- Guide gently, don't demand perfection`;
        break;
      case 4:
        stepContext = `
[Step 4/4: Code + Verify]
Student is writing code now.
${userCode ? `Their current code:\n\`\`\`\n${userCode}\n\`\`\`` : ""}
- Review code briefly
- Verify complexity claims
- Once verified, celebrate and unlock LeetCode!
- Say "🎉 Excellent work! Ab LeetCode pe submit karo!"`;
        break;
      default:
        stepContext = `[Step 1/4: Decode + Pattern]`;
    }

    const problemContext = `
Current Problem: "${questionTitle}"
Description: ${questionDescription || "See problem statement"}
${stepContext}`;

    const messages = [
      { role: "system", content: NEXMENTOR_SYSTEM_PROMPT + "\n\n" + problemContext },
      ...conversationHistory.slice(-10),
      { role: "user", content: userMessage }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), {
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
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("nexmentor-thinking error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
