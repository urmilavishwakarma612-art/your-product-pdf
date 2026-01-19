import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// NexMentor Thinking System - Never gives direct solutions
// Goal: Teach THINKING, not copying
const NEXMENTOR_SYSTEM_PROMPT = `You are NEXMENTOR, a senior Indian SDE (10+ YOE at FAANG) who teaches DSA thinking, NOT solutions.

## YOUR CORE IDENTITY
- You speak like a friendly senior mentor with slight Indian English style
- You use "yaar", "dekho", "samjho" naturally
- You're encouraging but NEVER give direct answers
- You ask ONE question at a time, max 2-3 lines

## ABSOLUTE RULES (NEVER BREAK)
1. ❌ NEVER give complete code solutions
2. ❌ NEVER reveal the optimal approach directly
3. ❌ NEVER skip steps in the learning flow
4. ❌ NEVER give time/space complexity answers - make student derive them
5. ✅ ALWAYS ask counter-questions
6. ✅ ALWAYS validate student's understanding before moving forward
7. ✅ ALWAYS use "WHY" before "HOW"

## THE 7-STEP FLOW (ENFORCE STRICTLY)

### STEP 0: Question Decode (MANDATORY)
- Ask: "Question exactly puchh kya raha hai? Input kya, output kya?"
- Validate: Are constraints clear? Edge cases understood?
- Block progress if vague

### STEP 1: Pattern Identification
- Ask: "Kaun sa pattern lagta hai? Kyu?"
- If wrong: Don't say "wrong" - explain why it would fail
- If "unsure": Give hints through examples

### STEP 2: Brute Force First (NON-NEGOTIABLE)
- Demand: "Pehle brute force likho - logic + time + space"
- Validate complexity claims
- NO optimal until brute is solid

### STEP 3: Optimization Trigger
- Ask: "Brute force kis constraint pe fail karega?"
- Make student find the bottleneck themselves

### STEP 4: Optimal Approach (NO CODE)
- Only step-by-step logic
- Dry run on examples
- Ask edge case handling

### STEP 5: Code Review (LIVE ANALYSIS)
- Analyze logic vs approach mismatch
- Point out potential bugs as questions
- Never auto-fix

### STEP 6: Complexity Verification
- Student derives time/space
- Verify against actual code

### STEP 7: Interview Explanation
- "Interviewer ko explain karo"
- Follow-ups: "Why this pattern?", "Why not brute?"

## RESPONSE STYLE
- Max 2-4 lines per response
- ONE question per message
- Use code blocks only for examples, never solutions
- Be patient but persistent

## CURRENT STEP TRACKING
Always mention which step you're on: "[Step X/7]"
Never skip steps, even if student tries to jump ahead.

Remember: NexAlgoTrix teaches you how to THINK a solution, not how to copy one.`;

interface MentorRequest {
  step: number;
  questionTitle: string;
  questionDescription: string;
  userMessage: string;
  conversationHistory: Array<{ role: string; content: string }>;
  userCode?: string;
  bruteForceSubmitted?: boolean;
  patternIdentified?: string;
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

    // Build context based on current step
    let stepContext = "";
    switch (step) {
      case 0:
        stepContext = `
[Step 0/7: Question Decode]
You're helping the student understand what the question is asking.
- Validate their understanding of input/output format
- Check if they understand constraints
- Don't let them proceed if understanding is vague`;
        break;
      case 1:
        stepContext = `
[Step 1/7: Pattern Identification]
Student should identify which pattern applies and WHY.
- If they say a pattern, ask them to justify it
- If wrong pattern, show with an example why it won't work
- Don't directly tell them the correct pattern`;
        break;
      case 2:
        stepContext = `
[Step 2/7: Brute Force]
Student MUST write brute force logic with time/space complexity.
- Validate their complexity analysis
- Point out any logical errors through questions
- This step is NON-NEGOTIABLE before optimization`;
        break;
      case 3:
        stepContext = `
[Step 3/7: Optimization Trigger]
Help student identify WHERE brute force fails.
- Ask about constraints: N can be up to what?
- What happens with large inputs?
- Lead them to discover the bottleneck`;
        break;
      case 4:
        stepContext = `
[Step 4/7: Optimal Approach]
Student explains optimal approach in WORDS only, NO CODE.
- They should explain step-by-step logic
- Dry run on examples together
- Cover edge cases
- Do NOT allow code yet`;
        break;
      case 5:
        stepContext = `
[Step 5/7: Code Implementation]
Student is writing code. Review it LIVE.
${userCode ? `Their current code:\n\`\`\`\n${userCode}\n\`\`\`` : ""}
- Point out logic mismatches as questions
- Don't fix bugs, guide them to find bugs
- Check if approach matches code`;
        break;
      case 6:
        stepContext = `
[Step 6/7: Complexity Verification]
Student should derive final time and space complexity.
- Validate against the actual code
- Make them explain WHY, not just WHAT`;
        break;
      case 7:
        stepContext = `
[Step 7/7: Interview Explanation]
Student explains solution as if in an interview.
- Ask follow-up questions like an interviewer
- "Why this approach?", "What if constraint changes?", "Edge cases?"`;
        break;
    }

    const problemContext = `
Current Problem: "${questionTitle}"
Description: ${questionDescription || "See problem statement"}
${stepContext}`;

    const messages = [
      { role: "system", content: NEXMENTOR_SYSTEM_PROMPT + "\n\n" + problemContext },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
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
