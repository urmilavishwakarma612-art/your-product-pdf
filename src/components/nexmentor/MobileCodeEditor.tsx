import { useState } from "react";
import { motion } from "framer-motion";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Lock, 
  Play, 
  Upload, 
  Copy, 
  Check, 
  Loader2,
  CheckCircle,
  Brain,
  Target,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const LANGUAGE_CONFIG: Record<string, { monacoLang: string; template: string }> = {
  python: {
    monacoLang: "python",
    template: `# Write your solution here\n\ndef solution():\n    pass`,
  },
  javascript: {
    monacoLang: "javascript",
    template: `// Write your solution here\n\nfunction solution() {\n    \n}`,
  },
  java: {
    monacoLang: "java",
    template: `// Write your solution here\n\nclass Solution {\n    public void solve() {\n        \n    }\n}`,
  },
  cpp: {
    monacoLang: "cpp",
    template: `// Write your solution here\n\nclass Solution {\npublic:\n    void solve() {\n        \n    }\n};`,
  },
};

const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

const STEPS = [
  { id: 1, name: "Decode", icon: Brain },
  { id: 2, name: "Brute", icon: Target },
  { id: 3, name: "Optimal", icon: Zap },
];

interface MobileCodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  currentStep: number;
  isRunning: boolean;
  isSubmitting: boolean;
  onRun: () => void;
  onSubmit: () => void;
  editorRef: React.MutableRefObject<any>;
  monacoRef: React.MutableRefObject<any>;
}

export function MobileCodeEditor({
  code,
  onCodeChange,
  language,
  onLanguageChange,
  currentStep,
  isRunning,
  isSubmitting,
  onRun,
  onSubmit,
  editorRef,
  monacoRef,
}: MobileCodeEditorProps) {
  const [codeCopied, setCodeCopied] = useState(false);
  const isLocked = currentStep < 4;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
    toast.success("Code copied!");
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] relative">
      {/* Lock Overlay for Steps 1-3 */}
      {isLocked && (
        <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-800/95 p-5 rounded-xl border border-slate-700 text-center w-full max-w-xs"
          >
            <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-7 h-7 text-amber-500" />
            </div>
            <h3 className="text-white font-bold text-base mb-2">Editor Locked</h3>
            <p className="text-slate-300 text-xs mb-4">
              Complete thinking flow (Steps 1-3) in Chat to unlock coding.
            </p>
            <div className="space-y-2">
              {STEPS.map((step) => (
                <div 
                  key={step.id}
                  className={cn(
                    "flex items-center gap-2 text-xs px-3 py-2 rounded-lg",
                    step.id < currentStep ? "bg-emerald-500/20 text-emerald-400" :
                    step.id === currentStep ? "bg-primary/20 text-primary" :
                    "bg-slate-700/50 text-slate-400"
                  )}
                >
                  {step.id < currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                  <span>Step {step.id}: {step.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Editor Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-[#252526] flex-shrink-0">
        <Select value={language} onValueChange={onLanguageChange} disabled={isLocked}>
          <SelectTrigger className="w-[100px] h-8 text-xs bg-transparent border-border/50 text-white">
            <SelectValue />
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
          className="h-7 text-xs text-white hover:bg-white/10"
          onClick={handleCopy}
          disabled={isLocked}
        >
          {codeCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </Button>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={LANGUAGE_CONFIG[language]?.monacoLang || "python"}
          value={code}
          onChange={(value) => onCodeChange(value || "")}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;
          }}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: "on",
            padding: { top: 12 },
            readOnly: isLocked,
            folding: false,
            glyphMargin: false,
            lineDecorationsWidth: 4,
            lineNumbersMinChars: 3,
          }}
        />
      </div>

      {/* Action Buttons for Step 4 */}
      {!isLocked && (
        <div className="p-3 bg-[#252526] border-t border-border/30 flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 bg-transparent border-border/50 text-white hover:bg-white/10 text-xs h-10"
            onClick={onRun}
            disabled={isRunning}
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-1.5" />
            )}
            Run
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-10"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-1.5" />
            )}
            Submit
          </Button>
        </div>
      )}
    </div>
  );
}
