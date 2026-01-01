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
import { Loader2, Save } from "lucide-react";

interface CodeEditorProps {
  questionId: string;
  language: string;
  onLanguageChange: (lang: string) => void;
  code: string;
  onCodeChange: (code: string) => void;
  onFirstKeystroke: () => void;
  hasStartedTyping: boolean;
  disabled?: boolean;
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

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
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
