import { useState, useCallback, useRef } from "react";
import Editor from "@monaco-editor/react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Send, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface NexMentorCodeEditorProps {
  language: string;
  onLanguageChange: (lang: string) => void;
  code: string;
  onCodeChange: (code: string) => void;
  onRunCode?: () => void;
  onSubmitCode?: () => void;
  isRunning?: boolean;
  isSubmitting?: boolean;
  accuracy?: number;
  streak?: number;
  xpEarned?: number;
}

const LANGUAGE_CONFIG: Record<string, { monacoLang: string; template: string }> = {
  python: {
    monacoLang: "python",
    template: `class Solution:
    def twoSum(self, numbers: List[int], target: int) -> List[int]:
        # Implement the solution here
        
        return []  # Placeholder return`,
  },
  javascript: {
    monacoLang: "javascript",
    template: `class Solution {
    twoSum(numbers, target) {
        // Implement the solution here
        
        return [];  // Placeholder return
    }
}`,
  },
  java: {
    monacoLang: "java",
    template: `class Solution {
    public int[] twoSum(int[] numbers, int target) {
        // Implement the solution here
        
        return new int[]{};  // Placeholder return
    }
}`,
  },
  cpp: {
    monacoLang: "cpp",
    template: `class Solution {
public:
    vector<int> twoSum(vector<int>& numbers, int target) {
        // Implement the solution here
        
        return {};  // Placeholder return
    }
};`,
  },
};

const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

export function NexMentorCodeEditor({
  language,
  onLanguageChange,
  code,
  onCodeChange,
  onRunCode,
  onSubmitCode,
  isRunning = false,
  isSubmitting = false,
  accuracy = 80,
  streak = 15,
  xpEarned = 230,
}: NexMentorCodeEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Custom theme for NexMentor
    monaco.editor.defineTheme("nexmentor-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A737D", fontStyle: "italic" },
        { token: "keyword", foreground: "C792EA" },
        { token: "string", foreground: "C3E88D" },
        { token: "number", foreground: "F78C6C" },
        { token: "function", foreground: "82AAFF" },
        { token: "class", foreground: "FFCB6B" },
      ],
      colors: {
        "editor.background": "#0D1117",
        "editor.foreground": "#C9D1D9",
        "editorLineNumber.foreground": "#484F58",
        "editorLineNumber.activeForeground": "#8B949E",
        "editor.lineHighlightBackground": "#161B22",
        "editor.selectionBackground": "#264F7844",
        "editorCursor.foreground": "#58A6FF",
      },
    });

    monaco.editor.setTheme("nexmentor-dark");
  };

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      onCodeChange(value || "");
    },
    [onCodeChange]
  );

  const handleLanguageChange = (newLang: string) => {
    onLanguageChange(newLang);
    onCodeChange(LANGUAGE_CONFIG[newLang]?.template || "");
  };

  const handleReset = () => {
    onCodeChange(LANGUAGE_CONFIG[language]?.template || "");
    toast.info("Code reset to template");
  };

  return (
    <div className="flex flex-col h-full bg-[#0D1117]">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-[#161B22]">
        <div className="flex items-center gap-3">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[120px] h-8 bg-[#21262D] border-border/50 text-sm">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
            onClick={handleReset}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Right side icon - matches the reference "T" icon */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-muted-foreground/50">T</span>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={LANGUAGE_CONFIG[language]?.monacoLang || "python"}
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: "on",
            padding: { top: 16 },
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: "on",
            bracketPairColorization: { enabled: true },
            folding: true,
            renderLineHighlight: "all",
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontLigatures: true,
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-[#0D1117]">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          }
        />
      </div>

      {/* Bottom toolbar with icons */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border/30 bg-[#161B22]">
        {/* Left icons */}
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
          <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
          </button>
          <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"/>
            </svg>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 bg-[#21262D] border-border/50 hover:bg-[#30363D]"
            onClick={onRunCode}
            disabled={isRunning}
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2 fill-current" />
            )}
            Run Code
          </Button>
          <Button
            size="sm"
            className="h-8 bg-primary hover:bg-primary/90"
            onClick={onSubmitCode}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Submit
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-center gap-4 px-4 py-2 border-t border-border/30 bg-[#0D1117] text-sm text-muted-foreground">
        <span>{accuracy}% accuracy</span>
        <span className="text-border">|</span>
        <span>Streak: {streak}</span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          {xpEarned} XP Earned
        </span>
      </div>
    </div>
  );
}

export { LANGUAGE_CONFIG };
