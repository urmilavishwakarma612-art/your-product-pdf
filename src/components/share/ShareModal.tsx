import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ShareCard } from "./ShareCard";
import { Linkedin, Twitter, Copy, Download, Check, MessageCircle } from "lucide-react";
import { toast } from "sonner";

type ShareType = "level" | "streak" | "interview" | "pattern" | "badge";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ShareType;
  title: string;
  subtitle?: string;
  value?: string | number;
  userName?: string;
  icon?: string;
}

export const ShareModal = ({
  open,
  onOpenChange,
  type,
  title,
  subtitle,
  value,
  userName,
  icon,
}: ShareModalProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const defaultMessages: Record<ShareType, string> = {
    level: `Just reached ${title} on NexAlgoTrix! 🎯\n\nFocused on interview-style DSA thinking, not just solving problems.\n\n#DSA #CodingInterview #NexAlgoTrix`,
    streak: `Maintained a ${value}-day practice streak on NexAlgoTrix! 🔥\n\nConsistency is key to mastering DSA.\n\n#DSA #100DaysOfCode #NexAlgoTrix`,
    interview: `Completed ${title} on NexAlgoTrix! 💼\n\nPracticing interview-style problem solving.\n\n#CodingInterview #DSA #NexAlgoTrix`,
    pattern: `Mastered the ${title} pattern on NexAlgoTrix! ⭐\n\nPattern-based learning is the key to interview success.\n\n#DSA #Algorithms #NexAlgoTrix`,
    badge: `Earned the "${title}" badge on NexAlgoTrix! 🏆\n\n${subtitle || ""}\n\n#DSA #Achievement #NexAlgoTrix`,
  };

  const [message, setMessage] = useState(defaultMessages[type]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied to clipboard!");
  };

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(message);
    toast.success("Message copied to clipboard!");
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(window.location.origin);
    const text = encodeURIComponent(message);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(message);
    const url = encodeURIComponent(window.location.origin);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${message}\n\n${window.location.origin}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;

    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
      });
      
      const link = document.createElement("a");
      link.download = `nexalgotrix-${type}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast.success("Image downloaded!");
    } catch (error) {
      console.error("Failed to download image:", error);
      toast.error("Failed to download image. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Your Achievement</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Card */}
          <div className="flex justify-center overflow-hidden rounded-xl">
            <div className="scale-[0.85] origin-center">
              <ShareCard
                ref={cardRef}
                type={type}
                title={title}
                subtitle={subtitle}
                value={value}
                userName={userName}
                icon={icon}
              />
            </div>
          </div>

          {/* Editable Message */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Share Message
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleShareLinkedIn}
            >
              <Linkedin className="w-4 h-4 text-[#0A66C2]" />
              LinkedIn
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleShareTwitter}
            >
              <Twitter className="w-4 h-4" />
              X (Twitter)
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleShareWhatsApp}
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              Copy Link
            </Button>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleCopyText}
            >
              <Copy className="w-4 h-4" />
              Copy Text
            </Button>
            <Button
              className="flex-1 gap-2 btn-primary-glow"
              onClick={handleDownloadImage}
            >
              <Download className="w-4 h-4" />
              Download Image
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
