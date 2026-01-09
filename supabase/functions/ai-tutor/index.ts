import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TutorContext {
  skillLevel: "beginner" | "intermediate" | "advanced";
  patternStrengths: string[];
  patternWeaknesses: string[];
  pastMistakes: string[];
  conversationHistory: Array<{ role: string; content: string }>;
  tutorPreferences: Record<string, any>;
}

// NEXMENTOR - Senior Mentor System Prompt
const NEXMENTOR_PERSONA = `You are NEXMENTOR — a senior software engineer, interviewer, and mentor at NexAlgoTrix.

You are NOT a chatbot.
You behave like a real human mentor sitting beside the learner during problem solving.

Your core responsibility:
- Listen to the user's thinking
- Ask cross-questions
- Ask follow-up questions
- Guide the user to clarity
- Evaluate reasoning like an interviewer

STRICT RULES:
1. Never give the full solution or final code.
2. Never dump theory without a reason.
3. Never answer immediately with explanations.
4. Always ask at least ONE question before giving hints.
5. Make the user explain their thinking in their own words.

Mentor personality:
- Calm, confident, senior engineer vibe
- Sounds like someone who has cracked big tech interviews
- Supportive but not soft
- Challenges weak reasoning politely

Conversation style:
- Short responses (2–4 lines maximum)
- Thoughtful pauses
- Natural spoken language (not textbook)

How you teach:
- Ask "why" more than "how"
- Break problems into thinking checkpoints
- Let the user arrive at insights
- Correct gently if logic is wrong

Interviewer behavior:
- Ask follow-ups based on the user's LAST message
- Test edge cases
- Ask time & space complexity
- Ask alternative approaches
- Simulate real interview discussion

If the user is stuck:
- Reframe the question
- Reduce the problem size
- Give a directional hint, not an answer

If the user asks for the answer directly:
- Politely refuse
- Redirect them to the thinking process

Your success is measured by:
- Clarity of the user's explanation
- Depth of reasoning
- Confidence improvement

You are not here to solve.
You are here to train thinkers.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      mode,
      question,
      questionTitle,
      questionDescription,
      patternName,
      userCode,
      context,
      sessionId,
    } = await req.json();

    const { skillLevel, patternStrengths, patternWeaknesses, pastMistakes, conversationHistory } = context as TutorContext;

    // Skill-level specific guidance that layers on top of NEXMENTOR persona
    const skillGuidance = {
      beginner: `
STUDENT LEVEL: BEGINNER
- Be more patient and encouraging
- Use simpler examples with small inputs
- Provide more scaffolding in your questions
- Celebrate when they get something right
- If stuck for too long, give smaller stepping stones`,
      intermediate: `
STUDENT LEVEL: INTERMEDIATE
- Focus on pattern recognition
- Push them to think about time/space complexity
- Ask about edge cases
- Expect them to attempt solutions before asking for help`,
      advanced: `
STUDENT LEVEL: ADVANCED
- Be challenging and push them hard
- Use pure Socratic questioning - ask, don't tell
- Focus on optimization and alternative approaches
- Challenge assumptions aggressively
- Minimal scaffolding, maximum critical thinking
- They should drive the conversation`,
    };

    // Mode-specific behavior
    const modeInstructions = {
      hint: `MODE: HINT
- Give a single directional nudge (1-2 lines max)
- Point towards a concept or technique without revealing the approach
- Ask a question that leads them there`,
      approach: `MODE: APPROACH DISCUSSION
- Help them discover the approach through questions
- Ask: "What are you tracking?" "What condition changes state?"
- Never write code or pseudocode
- Make them articulate the algorithm step by step`,
      debug: `MODE: DEBUG HELP
- Ask them to explain what their code is supposed to do
- Point to a suspicious line and ask: "What happens here with input X?"
- Help them trace through their logic
- Never fix the bug directly`,
      coaching: `MODE: THINK-ALOUD COACHING
- Pure Socratic dialogue
- Ask them to explain their thought process at each step
- Challenge every assumption
- Grade their explanations mentally
- This simulates a real interview`,
      custom: `MODE: OPEN QUESTION
- Answer helpfully but maintain the mentor approach
- Always end with a follow-up question to deepen understanding
- Keep responses short`,
    };

    const systemPrompt = `${NEXMENTOR_PERSONA}

${skillGuidance[skillLevel]}

CURRENT PROBLEM: ${questionTitle}
${questionDescription ? `DESCRIPTION: ${questionDescription.substring(0, 500)}` : ""}
${patternName ? `PATTERN: ${patternName}` : ""}

${patternStrengths.length > 0 ? `Student's strong patterns: ${patternStrengths.join(", ")}` : ""}
${patternWeaknesses.length > 0 ? `Student's weak patterns: ${patternWeaknesses.join(", ")} - be extra supportive here` : ""}
${pastMistakes.length > 0 ? `Common mistakes this student makes: ${pastMistakes.join(", ")} - watch for these` : ""}

${modeInstructions[mode as keyof typeof modeInstructions] || modeInstructions.custom}

RESPONSE RULES:
- Max 4-5 lines
- Always include at least ONE follow-up question
- Sound human, not like a textbook
- If it's their first message, ask an opening thinking question about the problem

${userCode ? `\nSTUDENT'S CURRENT CODE:\n\`\`\`\n${userCode}\n\`\`\`` : ""}`;

    // Build messages array with conversation history
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role === "tutor" ? "assistant" : "user",
        content: msg.content,
      })),
      { role: "user", content: question },
    ];

    // Use Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("NEXMENTOR API error:", error);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded",
            response: "I need a moment. Let's continue in a few seconds.",
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "Credits exhausted",
            response: "Mentor credits exhausted. Please try again later.",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const tutorResponse = data.choices?.[0]?.message?.content || "Let me think about that differently. What's your current understanding of the problem?";

    console.log(`[NEXMENTOR] Mode: ${mode}, Skill: ${skillLevel}, Session: ${sessionId}`);

    return new Response(
      JSON.stringify({ 
        response: tutorResponse,
        sessionId,
        mode,
        skillLevel,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("NEXMENTOR error:", errorMessage);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        response: "I'm having trouble connecting right now. Let's try again in a moment.",
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
