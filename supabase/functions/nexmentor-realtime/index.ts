import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// NEXMENTOR - Senior Indian SDE Mentor System Prompt
const NEXMENTOR_SYSTEM_PROMPT = `You are NEXMENTOR — a senior Indian software engineer and mentor at NexAlgoTrix.

Your voice and personality:
- You speak like a friendly senior developer from India
- Use occasional Hindi words naturally (like "Dekho", "Accha", "Theek hai", "Samjhe?", "Suno")
- Warm, patient, but also challenging when needed
- Sound like someone who has cracked interviews at Google, Amazon, Microsoft

Your core responsibility:
- Listen to the user's thinking process
- Ask cross-questions to deepen understanding
- Ask follow-up questions to clarify logic
- Guide the user to clarity through Socratic questioning
- Evaluate reasoning like a real interviewer would

STRICT RULES:
1. Never give the full solution or final code
2. Never dump theory without a reason
3. Never answer immediately with explanations
4. Always ask at least ONE question before giving hints
5. Make the user explain their thinking in their own words
6. Keep responses SHORT (2-4 sentences max for voice)

Mentor personality:
- Calm, confident, senior engineer vibe
- Supportive but not soft
- Challenges weak reasoning politely
- Uses phrases like "Accha, interesting approach. But tell me..."
- "Dekho, think about this edge case..."
- "Theek hai, but what if the input is empty?"

You are NOT here to solve problems.
You are here to train thinkers and build confidence for real interviews.`;

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Check for WebSocket upgrade
  const upgrade = req.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket upgrade", { status: 426 });
  }

  const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);

  let openAISocket: WebSocket | null = null;
  let questionContext = "";

  clientSocket.onopen = () => {
    console.log("[NexMentor] Client connected");

    // Connect to OpenAI Realtime API
    openAISocket = new WebSocket(
      "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
      ["realtime", `openai-insecure-api-key.${OPENAI_API_KEY}`, "openai-beta.realtime-v1"]
    );

    openAISocket.onopen = () => {
      console.log("[NexMentor] Connected to OpenAI Realtime API");
      clientSocket.send(JSON.stringify({ type: "connected" }));
    };

    openAISocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("[NexMentor] OpenAI event:", data.type);

      // Forward relevant events to client
      if (
        data.type === "session.created" ||
        data.type === "session.updated" ||
        data.type === "response.audio.delta" ||
        data.type === "response.audio.done" ||
        data.type === "response.audio_transcript.delta" ||
        data.type === "response.audio_transcript.done" ||
        data.type === "input_audio_buffer.speech_started" ||
        data.type === "input_audio_buffer.speech_stopped" ||
        data.type === "response.created" ||
        data.type === "response.done" ||
        data.type === "conversation.item.input_audio_transcription.completed" ||
        data.type === "error"
      ) {
        clientSocket.send(JSON.stringify(data));
      }

      // Configure session after creation
      if (data.type === "session.created") {
        console.log("[NexMentor] Configuring session with Indian mentor voice");
        const sessionUpdate = {
          type: "session.update",
          session: {
            modalities: ["text", "audio"],
            instructions: NEXMENTOR_SYSTEM_PROMPT + (questionContext ? `\n\nCURRENT PROBLEM:\n${questionContext}` : ""),
            voice: "ash", // Male voice that sounds more natural for Indian accent
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            input_audio_transcription: {
              model: "whisper-1",
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 800,
            },
            temperature: 0.8,
            max_response_output_tokens: 150, // Keep responses short for voice
          },
        };
        openAISocket!.send(JSON.stringify(sessionUpdate));
      }
    };

    openAISocket.onerror = (error) => {
      console.error("[NexMentor] OpenAI WebSocket error:", error);
      clientSocket.send(JSON.stringify({ type: "error", message: "Connection error" }));
    };

    openAISocket.onclose = (event) => {
      console.log("[NexMentor] OpenAI connection closed:", event.code, event.reason);
      clientSocket.send(JSON.stringify({ type: "disconnected" }));
    };
  };

  clientSocket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log("[NexMentor] Client message:", data.type);

    // Handle question context update
    if (data.type === "set_question_context") {
      questionContext = data.context;
      console.log("[NexMentor] Question context set:", questionContext.substring(0, 100));

      // Update session with new context if connected
      if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
        const sessionUpdate = {
          type: "session.update",
          session: {
            instructions: NEXMENTOR_SYSTEM_PROMPT + `\n\nCURRENT PROBLEM:\n${questionContext}`,
          },
        };
        openAISocket.send(JSON.stringify(sessionUpdate));
      }
      return;
    }

    // Forward audio and other events to OpenAI
    if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
      openAISocket.send(event.data);
    }
  };

  clientSocket.onerror = (error) => {
    console.error("[NexMentor] Client WebSocket error:", error);
  };

  clientSocket.onclose = () => {
    console.log("[NexMentor] Client disconnected");
    if (openAISocket) {
      openAISocket.close();
    }
  };

  return response;
});
