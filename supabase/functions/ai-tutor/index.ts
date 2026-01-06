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

    // Build adaptive system prompt based on skill level
    const skillGuidance = {
      beginner: `
You are a patient, encouraging tutor for a BEGINNER student.
- Use simple, clear language
- Break down concepts step by step
- Provide explicit examples with small inputs
- Offer scaffolding and structure
- Celebrate small wins
- Never assume prior knowledge`,
      intermediate: `
You are a supportive tutor for an INTERMEDIATE student.
- Focus on pattern recognition
- Ask guiding questions to help them discover solutions
- Point out connections to similar problems
- Discuss time/space complexity
- Encourage them to consider edge cases
- Be moderately Socratic`,
      advanced: `
You are a challenging tutor for an ADVANCED student.
- Use Socratic questioning - ask, don't tell
- Focus on optimization and edge cases
- Discuss tradeoffs and alternative approaches
- Challenge assumptions
- Minimal hand-holding, maximum critical thinking
- Expect them to drive the conversation`,
    };

    const modeInstructions = {
      hint: "Give a SUBTLE hint that points them in the right direction WITHOUT revealing the solution. One or two sentences maximum.",
      approach: "Help them understand the general approach and thought process, but don't write code. Guide them to discover it.",
      debug: "Help diagnose issues in their code. Point out potential problems and ask questions to help them find bugs.",
      coaching: "Engage in Socratic dialogue. Ask thoughtful questions to help them think through the problem. Award their explanations.",
      custom: "Answer their question helpfully while maintaining the teaching approach appropriate for their skill level.",
    };

    const systemPrompt = `${skillGuidance[skillLevel]}

CURRENT PROBLEM: ${questionTitle}
${questionDescription ? `DESCRIPTION: ${questionDescription.substring(0, 500)}` : ""}
${patternName ? `PATTERN: ${patternName}` : ""}

${patternStrengths.length > 0 ? `Student's strong patterns: ${patternStrengths.join(", ")}` : ""}
${patternWeaknesses.length > 0 ? `Student's weak patterns: ${patternWeaknesses.join(", ")} - be extra supportive here` : ""}
${pastMistakes.length > 0 ? `Common mistakes this student makes: ${pastMistakes.join(", ")} - watch for these` : ""}

MODE: ${mode}
${modeInstructions[mode as keyof typeof modeInstructions]}

CRITICAL RULES:
1. NEVER give the full solution or complete code
2. Always guide, never solve for them
3. If they ask for the answer directly, redirect to thinking process
4. Keep responses concise (under 150 words for hints, 250 for approaches)
5. Use encouraging language
6. If they're clearly stuck, offer smaller stepping stones
7. Reference their code context if provided

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
    const response = await fetch("https://api.anthropic.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AI API error:", error);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const tutorResponse = data.choices?.[0]?.message?.content || "I'm having trouble thinking right now. Please try again.";

    console.log(`[AI Tutor] Mode: ${mode}, Skill: ${skillLevel}, Session: ${sessionId}`);

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
    console.error("AI Tutor error:", errorMessage);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        response: "I'm having trouble connecting right now. Please try again in a moment.",
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
