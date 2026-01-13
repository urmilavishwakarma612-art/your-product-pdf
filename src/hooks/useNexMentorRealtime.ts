import { useState, useCallback, useRef, useEffect } from "react";
import {
  AudioRecorder,
  encodeAudioForAPI,
  playAudioData,
  clearAudioQueue,
  createAudioContext,
} from "@/utils/NexMentorAudio";

interface UseNexMentorRealtimeOptions {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onMentorSpeaking?: (isSpeaking: boolean) => void;
  onUserSpeaking?: (isSpeaking: boolean) => void;
  onError?: (error: string) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export const useNexMentorRealtime = (options: UseNexMentorRealtimeOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMentorSpeaking, setIsMentorSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [mentorTranscript, setMentorTranscript] = useState("");
  const [userTranscript, setUserTranscript] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const connect = useCallback(
    async (questionContext?: string) => {
      if (isConnected || isConnecting) return;

      setIsConnecting(true);
      console.log("[NexMentor] Connecting to realtime mentor...");

      try {
        // Request microphone permission
        await navigator.mediaDevices.getUserMedia({ audio: true });

        // Create audio context
        audioContextRef.current = createAudioContext();

        // Connect to our edge function
        const wsUrl = `wss://mqnoszjhlotxqdjgubqt.functions.supabase.co/nexmentor-realtime`;
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log("[NexMentor] WebSocket connected");
        };

        wsRef.current.onmessage = async (event) => {
          const data = JSON.parse(event.data);
          console.log("[NexMentor] Received:", data.type);

          switch (data.type) {
            case "connected":
              console.log("[NexMentor] Connected to OpenAI");
              setIsConnected(true);
              setIsConnecting(false);
              options.onConnected?.();

              // Send question context if provided
              if (questionContext) {
                wsRef.current?.send(
                  JSON.stringify({
                    type: "set_question_context",
                    context: questionContext,
                  })
                );
              }

              // Start recording after connection
              startRecording();
              break;

            case "session.updated":
              console.log("[NexMentor] Session configured");
              // Trigger initial greeting
              wsRef.current?.send(
                JSON.stringify({
                  type: "response.create",
                  response: {
                    modalities: ["text", "audio"],
                  },
                })
              );
              break;

            case "input_audio_buffer.speech_started":
              setIsUserSpeaking(true);
              options.onUserSpeaking?.(true);
              // Clear any playing audio when user starts speaking
              clearAudioQueue();
              break;

            case "input_audio_buffer.speech_stopped":
              setIsUserSpeaking(false);
              options.onUserSpeaking?.(false);
              break;

            case "conversation.item.input_audio_transcription.completed":
              if (data.transcript) {
                setUserTranscript(data.transcript);
              }
              break;

            case "response.audio.delta":
              if (data.delta && audioContextRef.current) {
                const binaryString = atob(data.delta);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                setIsMentorSpeaking(true);
                options.onMentorSpeaking?.(true);
                await playAudioData(audioContextRef.current, bytes);
              }
              break;

            case "response.audio.done":
              setIsMentorSpeaking(false);
              options.onMentorSpeaking?.(false);
              break;

            case "response.audio_transcript.delta":
              if (data.delta) {
                setMentorTranscript((prev) => prev + data.delta);
                options.onTranscript?.(data.delta, false);
              }
              break;

            case "response.audio_transcript.done":
              if (data.transcript) {
                options.onTranscript?.(data.transcript, true);
              }
              break;

            case "response.done":
              // Reset mentor transcript for next response
              setMentorTranscript("");
              break;

            case "error":
              console.error("[NexMentor] Error:", data);
              options.onError?.(data.error?.message || "An error occurred");
              break;

            case "disconnected":
              handleDisconnect();
              break;
          }
        };

        wsRef.current.onerror = (error) => {
          console.error("[NexMentor] WebSocket error:", error);
          options.onError?.("Connection error");
          setIsConnecting(false);
        };

        wsRef.current.onclose = () => {
          console.log("[NexMentor] WebSocket closed");
          handleDisconnect();
        };
      } catch (error) {
        console.error("[NexMentor] Connection error:", error);
        options.onError?.(error instanceof Error ? error.message : "Failed to connect");
        setIsConnecting(false);
      }
    },
    [isConnected, isConnecting, options]
  );

  const startRecording = useCallback(() => {
    if (recorderRef.current) return;

    recorderRef.current = new AudioRecorder((audioData) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const encodedAudio = encodeAudioForAPI(audioData);
        wsRef.current.send(
          JSON.stringify({
            type: "input_audio_buffer.append",
            audio: encodedAudio,
          })
        );
      }
    });

    recorderRef.current.start().catch((error) => {
      console.error("[NexMentor] Failed to start recording:", error);
      options.onError?.("Failed to access microphone");
    });
  }, [options]);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setIsConnecting(false);
    setIsMentorSpeaking(false);
    setIsUserSpeaking(false);
    options.onDisconnected?.();
  }, [options]);

  const disconnect = useCallback(() => {
    console.log("[NexMentor] Disconnecting...");

    // Stop recording
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Clear audio queue
    clearAudioQueue();

    handleDisconnect();
  }, [handleDisconnect]);

  const sendTextMessage = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text,
              },
            ],
          },
        })
      );

      wsRef.current.send(
        JSON.stringify({
          type: "response.create",
        })
      );
    }
  }, []);

  const updateQuestionContext = useCallback((context: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "set_question_context",
          context,
        })
      );
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    isMentorSpeaking,
    isUserSpeaking,
    mentorTranscript,
    userTranscript,
    connect,
    disconnect,
    sendTextMessage,
    updateQuestionContext,
  };
};
