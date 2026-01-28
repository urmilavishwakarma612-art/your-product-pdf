import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Award, Sparkles } from "lucide-react";

interface ProfileCompletionCardProps {
  profile: {
    full_name?: string | null;
    username?: string | null;
    email?: string | null;
    mobile?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    college?: string | null;
    degree?: string | null;
    cgpa?: number | null;
    graduation_year?: number | null;
    work_experience?: unknown;
    linkedin_url?: string | null;
    github_url?: string | null;
  } | null;
}

const sections = [
  {
    name: "Basic Info",
    fields: ["full_name", "username", "email", "mobile", "avatar_url"],
    icon: "👤",
  },
  {
    name: "Academic",
    fields: ["college", "degree", "graduation_year"],
    icon: "🎓",
  },
  {
    name: "Experience",
    fields: ["work_experience"],
    icon: "💼",
  },
  {
    name: "Social Links",
    fields: ["linkedin_url", "github_url"],
    icon: "🔗",
  },
];

export function ProfileCompletionCard({ profile }: ProfileCompletionCardProps) {
  const { completionPercentage, completedSections, totalSections, benefits } = useMemo(() => {
    if (!profile) {
      return { completionPercentage: 0, completedSections: 0, totalSections: sections.length, benefits: [] };
    }

    let completed = 0;
    const sectionStatus = sections.map((section) => {
      const filledFields = section.fields.filter((field) => {
        const value = profile[field as keyof typeof profile];
        if (field === "work_experience" && Array.isArray(value)) return value.length > 0;
        return value !== null && value !== undefined && value !== "";
      });
      const isComplete = filledFields.length >= Math.ceil(section.fields.length * 0.6);
      if (isComplete) completed++;
      return isComplete;
    });

    const percentage = Math.round((completed / sections.length) * 100);
    
    const benefits = [];
    if (percentage >= 100) benefits.push("🎉 Profile Complete!");
    else if (percentage >= 75) benefits.push("Almost there!");
    else if (percentage >= 50) benefits.push("Good progress!");

    return {
      completionPercentage: percentage,
      completedSections: completed,
      totalSections: sections.length,
      benefits,
      sectionStatus,
    };
  }, [profile]);

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Profile Completion
          </CardTitle>
          <Badge
            variant={completionPercentage === 100 ? "default" : "secondary"}
            className={completionPercentage === 100 ? "bg-green-500" : ""}
          >
            {completionPercentage}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={completionPercentage} className="h-2" />
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {sections.map((section, index) => {
            const isComplete = profile ? (() => {
              const filledFields = section.fields.filter((field) => {
                const value = profile[field as keyof typeof profile];
                if (field === "work_experience" && Array.isArray(value)) return value.length > 0;
                return value !== null && value !== undefined && value !== "";
              });
              return filledFields.length >= Math.ceil(section.fields.length * 0.6);
            })() : false;

            return (
              <div
                key={section.name}
                className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                  isComplete ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-muted/50"
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                )}
                <span className="truncate">{section.icon} {section.name}</span>
              </div>
            );
          })}
        </div>

        {completionPercentage < 100 && (
          <p className="text-xs text-muted-foreground">
            Complete your profile to unlock personalized AI guidance, accurate certificates, and placement features.
          </p>
        )}

        {completionPercentage === 100 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
            <Award className="w-5 h-5" />
            <span className="text-sm font-medium">
              Congratulations! Your profile is complete. 🎉
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
