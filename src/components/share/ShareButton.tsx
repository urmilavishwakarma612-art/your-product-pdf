import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareModal } from "./ShareModal";

type ShareType = "level" | "streak" | "interview" | "pattern" | "badge";

interface ShareButtonProps {
  type: ShareType;
  title: string;
  subtitle?: string;
  value?: string | number;
  userName?: string;
  icon?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const ShareButton = ({
  type,
  title,
  subtitle,
  value,
  userName,
  icon,
  variant = "outline",
  size = "sm",
  className = "",
}: ShareButtonProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={`gap-1.5 ${className}`}
        onClick={() => setOpen(true)}
      >
        <Share2 className="w-4 h-4" />
        Share
      </Button>

      <ShareModal
        open={open}
        onOpenChange={setOpen}
        type={type}
        title={title}
        subtitle={subtitle}
        value={value}
        userName={userName}
        icon={icon}
      />
    </>
  );
};
