import { useState, useEffect, useCallback, useRef } from "react";
import Editor from "@monaco-editor/react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Shield } from "lucide-react";
import { toast } from "sonner";

interface CodeEditorProps {
  questionId: string;
  language: string;
  onLanguageChange: (lang: string) => void;
  code: string;
  onCodeChange: (code: string) => void;
  onFirstKeystroke: () => void;
  hasStartedTyping: boolean;
  disabled?: boolean;
  isInterviewMode?: boolean;
  onPasteAttempt?: () => void;
}

const LANGUAGE_CONFIG: Record<string, { monacoLang: string; template: string }> = {
  python: {
    monacoLang: "python",
    template: `# Write your solution here
def solution():
    pass
`,
  },
  java: {
    monacoLang: "java",
    template: `// Write your solution here
class Solution {
    public void solve() {
        
    }
}
`,
  },
  cpp: {
    monacoLang: "cpp",
    template: `// Write your solution here
#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    void solve() {
        
    }
};
`,
  },
  javascript: {
    monacoLang: "javascript",
    template: `// Write your solution here
function solution() {
    
}
`,
  },
};

const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "javascript", label: "JavaScript" },
];

export function CodeEditor({
  questionId,
  language,
  onLanguageChange,
  code,
  onCodeChange,
  onFirstKeystroke,
  hasStartedTyping,
  disabled = false,
  isInterviewMode = true,
  onPasteAttempt,
}: CodeEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const editorRef = useRef<any>(null);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (code && code !== LANGUAGE_CONFIG[language]?.template) {
        setIsSaving(true);
        setTimeout(() => {
          setLastSaved(new Date());
          setIsSaving(false);
        }, 500);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [code, language]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Intercept paste in interview mode
    if (isInterviewMode) {
      editor.onKeyDown((e: any) => {
        // Check for Ctrl+V or Cmd+V
        const isPaste = (e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyV;
        if (isPaste) {
          e.preventDefault();
          e.stopPropagation();
          toast.warning("Paste disabled in Interview Mode", {
            description: "Write your code from scratch to simulate real interview conditions.",
            icon: <Shield className="w-4 h-4" />,
          });
          onPasteAttempt?.();
        }
      });

      // Also intercept context menu paste
      editor.addAction({
        id: 'prevent-paste',
        label: 'Paste (Disabled)',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV],
        run: () => {
          toast.warning("Paste disabled in Interview Mode");
          onPasteAttempt?.();
        }
      });
    }
  };

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      const newCode = value || "";
      
      // Detect first keystroke
      if (!hasStartedTyping && newCode !== LANGUAGE_CONFIG[language]?.template) {
        onFirstKeystroke();
      }
      
      onCodeChange(newCode);
    },
    [hasStartedTyping, language, onFirstKeystroke, onCodeChange]
  );

  const handleLanguageChange = (newLang: string) => {
    onLanguageChange(newLang);
    // Set template for new language
    onCodeChange(LANGUAGE_CONFIG[newLang]?.template || "");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <Select value={language} onValueChange={handleLanguageChange} disabled={disabled}>
            <SelectTrigger className="w-[140px] h-8">
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
          
          {hasStartedTyping && (
            <Badge variant="secondary" className="text-xs">
              Coding...
            </Badge>
          )}

          {isInterviewMode && (
            <Badge variant="outline" className="text-xs text-amber-500 border-amber-500/30">
              <Shield className="w-3 h-3 mr-1" />
              Interview Mode
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isSaving ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1"
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </motion.div>
          ) : lastSaved ? (
            <div className="flex items-center gap-1">
              <Save className="w-3 h-3" />
              Saved
            </div>
          ) : null}
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
            readOnly: disabled,
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: "on",
            bracketPairColorization: { enabled: true },
            folding: true,
            renderLineHighlight: "all",
          }}
          loading={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          }
        />
      </div>
    </div>
  );
}

export { LANGUAGE_CONFIG };