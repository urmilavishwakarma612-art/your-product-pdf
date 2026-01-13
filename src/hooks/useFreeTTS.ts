import { useState, useCallback, useRef, useEffect } from "react";

interface UseFreeTTSOptions {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onMentorSpeaking?: (isSpeaking: boolean) => void;
  onUserSpeaking?: (isSpeaking: boolean) => void;
  onError?: (error: string) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Free Indian TTS voice selection
const getIndianVoice = (): SpeechSynthesisVoice | null => {
  const voices = window.speechSynthesis.getVoices();
  
  // Priority: Indian English voices
  const indianVoice = voices.find(
    (v) =>
      v.lang.includes("en-IN") ||
      v.name.toLowerCase().includes("india") ||
      v.name.toLowerCase().includes("ravi")
  );
  
  if (indianVoice) return indianVoice;
  
  // Fallback: Any English voice
  return voices.find((v) => v.lang.startsWith("en")) || voices[0] || null;
};

export const useFreeTTS = (options: UseFreeTTSOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMentorSpeaking, setIsMentorSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [mentorTranscript, setMentorTranscript] = useState("");
  const [userTranscript, setUserTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const recognitionRef = useRef<any>(null);
  const questionContextRef = useRef<string>("");
  const isMutedRef = useRef(false);

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      options.onError?.("Speech recognition not supported in this browser");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN"; // Indian English

    recognition.onstart = () => {
      setIsUserSpeaking(true);
      options.onUserSpeaking?.(true);
    };

    recognition.onend = () => {
      setIsUserSpeaking(false);
      options.onUserSpeaking?.(false);
      
      // Auto-restart if still listening
      if (isListening && isConnected) {
        try {
          recognition.start();
        } catch (e) {
          console.log("Recognition restart failed");
        }
      }
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        setUserTranscript(interimTranscript);
        options.onTranscript?.(interimTranscript, false);
      }

      if (finalTranscript) {
        setUserTranscript(finalTranscript);
        options.onTranscript?.(finalTranscript, true);
        
        // Send to AI and get response
        handleUserMessage(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech" && event.error !== "aborted") {
        options.onError?.(`Speech recognition error: ${event.error}`);
      }
    };

    return recognition;
  }, [options, isListening, isConnected]);

  // Text-to-Speech for mentor response
  const speak = useCallback((text: string) => {
    if (isMutedRef.current) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getIndianVoice();
    
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setIsMentorSpeaking(true);
      options.onMentorSpeaking?.(true);
    };

    utterance.onend = () => {
      setIsMentorSpeaking(false);
      options.onMentorSpeaking?.(false);
    };

    utterance.onerror = () => {
      setIsMentorSpeaking(false);
      options.onMentorSpeaking?.(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [options]);

  // AI mentor response using Supabase edge function
  const handleUserMessage = useCallback(async (userText: string) => {
    if (!userText.trim()) return;

    // Stop listening while processing
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const newMessages: Message[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: `You are NEXMENTOR — a senior Indian software engineer and mentor.

Your voice and personality:
- You speak like a friendly senior developer from India
- Use occasional Hindi words naturally (like "Dekho", "Accha", "Theek hai", "Samjhe?", "Suno")
- Warm, patient, but also challenging when needed

STRICT RULES:
1. Keep responses SHORT (2-4 sentences max for voice)
2. Never give the full solution or final code
3. Always ask at least ONE question before giving hints
4. Make the user explain their thinking

${questionContextRef.current ? `\nCURRENT PROBLEM:\n${questionContextRef.current}` : ""}`,
              },
              ...newMessages.slice(-10).map((m) => ({
                role: m.role,
                content: m.content,
              })),
            ],
          }),
        }
      );

      const data = await response.json();
      const mentorResponse = data.response || data.content || "Accha, tell me more about your approach.";

      setMentorTranscript(mentorResponse);
      setMessages([...newMessages, { role: "assistant", content: mentorResponse }]);

      // Speak the response
      speak(mentorResponse);

      // Resume listening after speaking
      setTimeout(() => {
        if (isConnected && recognitionRef.current) {
          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch (e) {
            console.log("Failed to restart listening");
          }
        }
      }, 1000);
    } catch (error) {
      console.error("AI response error:", error);
      options.onError?.("Failed to get mentor response");
      
      // Resume listening
      if (isConnected && recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.log("Failed to restart listening");
        }
      }
    }
  }, [messages, speak, isConnected, options]);

  // Connect to voice session
  const connect = useCallback(async (questionContext?: string) => {
    if (isConnected || isConnecting) return;

    setIsConnecting(true);
    questionContextRef.current = questionContext || "";

    try {
      // Initialize speech recognition
      const recognition = initRecognition();
      if (!recognition) {
        throw new Error("Speech recognition not available");
      }
      recognitionRef.current = recognition;

      // Load voices
      await new Promise<void>((resolve) => {
        if (window.speechSynthesis.getVoices().length > 0) {
          resolve();
        } else {
          window.speechSynthesis.onvoiceschanged = () => resolve();
          setTimeout(resolve, 1000);
        }
      });

      setIsConnected(true);
      setIsConnecting(false);
      options.onConnected?.();

      // Start with a greeting
      const greeting = "Namaste! Main NexMentor hoon. Dekho, let's practice together. Tell me, what's your approach for this problem? Think out loud, I'll guide you.";
      setMentorTranscript(greeting);
      setMessages([{ role: "assistant", content: greeting }]);
      speak(greeting);

      // Start listening after greeting
      setTimeout(() => {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch (e) {
            console.log("Failed to start listening");
          }
        }
      }, 4000);
    } catch (error) {
      console.error("Connection error:", error);
      options.onError?.(error instanceof Error ? error.message : "Failed to connect");
      setIsConnecting(false);
    }
  }, [isConnected, isConnecting, initRecognition, speak, options]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    window.speechSynthesis.cancel();
    
    setIsConnected(false);
    setIsListening(false);
    setIsMentorSpeaking(false);
    setIsUserSpeaking(false);
    setMessages([]);
    setMentorTranscript("");
    setUserTranscript("");
    
    options.onDisconnected?.();
  }, [options]);

  // Send text message (for typing)
  const sendTextMessage = useCallback((text: string) => {
    handleUserMessage(text);
  }, [handleUserMessage]);

  // Update question context
  const updateQuestionContext = useCallback((context: string) => {
    questionContextRef.current = context;
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    isMutedRef.current = !isMutedRef.current;
    if (isMutedRef.current) {
      window.speechSynthesis.cancel();
    }
    return isMutedRef.current;
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
    messages,
    connect,
    disconnect,
    sendTextMessage,
    updateQuestionContext,
    toggleMute,
    isListening,
  };
};
