import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Plus, X, Trash2 } from "lucide-react";

interface WorkExperience {
  company: string;
  role: string;
  duration: string;
  techStack: string[];
  type: "internship" | "fulltime" | "parttime" | "freelance";
}

interface WorkExperienceSectionProps {
  form: UseFormReturn<any>;
}

const experienceTypes = [
  { value: "internship", label: "Internship" },
  { value: "fulltime", label: "Full-time" },
  { value: "parttime", label: "Part-time" },
  { value: "freelance", label: "Freelance" },
];

export function WorkExperienceSection({ form }: WorkExperienceSectionProps) {
  const [newTech, setNewTech] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentExperience, setCurrentExperience] = useState<Partial<WorkExperience>>({
    company: "",
    role: "",
    duration: "",
    techStack: [],
    type: "internship",
  });

  const experiences: WorkExperience[] = form.watch("work_experience") || [];

  const addTechStack = () => {
    if (newTech.trim() && !currentExperience.techStack?.includes(newTech.trim())) {
      setCurrentExperience({
        ...currentExperience,
        techStack: [...(currentExperience.techStack || []), newTech.trim()],
      });
      setNewTech("");
    }
  };

  const removeTechStack = (tech: string) => {
    setCurrentExperience({
      ...currentExperience,
      techStack: currentExperience.techStack?.filter((t) => t !== tech) || [],
    });
  };

  const saveExperience = () => {
    if (!currentExperience.company || !currentExperience.role) return;

    const newExperiences = [...experiences];
    const exp = currentExperience as WorkExperience;
    
    if (editingIndex !== null) {
      newExperiences[editingIndex] = exp;
    } else {
      newExperiences.push(exp);
    }
    
    form.setValue("work_experience", newExperiences, { shouldDirty: true });
    resetForm();
  };

  const editExperience = (index: number) => {
    setCurrentExperience(experiences[index]);
    setEditingIndex(index);
  };

  const deleteExperience = (index: number) => {
    const newExperiences = experiences.filter((_, i) => i !== index);
    form.setValue("work_experience", newExperiences, { shouldDirty: true });
  };

  const resetForm = () => {
    setCurrentExperience({
      company: "",
      role: "",
      duration: "",
      techStack: [],
      type: "internship",
    });
    setEditingIndex(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Work Experience</CardTitle>
            <CardDescription>Internships, jobs, roles, tech stack</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing experiences */}
        {experiences.length > 0 && (
          <div className="space-y-3">
            {experiences.map((exp, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border bg-muted/30 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{exp.role}</h4>
                    <p className="text-sm text-muted-foreground">
                      {exp.company} • {exp.duration}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {exp.type}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => editExperience(index)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteExperience(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {exp.techStack && exp.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {exp.techStack.map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit form */}
        <div className="p-4 rounded-lg border border-dashed space-y-4">
          <h4 className="text-sm font-medium">
            {editingIndex !== null ? "Edit Experience" : "Add Experience"}
          </h4>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company</Label>
              <Input
                placeholder="Google"
                value={currentExperience.company || ""}
                onChange={(e) =>
                  setCurrentExperience({ ...currentExperience, company: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input
                placeholder="Software Engineer Intern"
                value={currentExperience.role || ""}
                onChange={(e) =>
                  setCurrentExperience({ ...currentExperience, role: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration</Label>
              <Input
                placeholder="June 2024 - August 2024"
                value={currentExperience.duration || ""}
                onChange={(e) =>
                  setCurrentExperience({ ...currentExperience, duration: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={currentExperience.type || "internship"}
                onValueChange={(val) =>
                  setCurrentExperience({
                    ...currentExperience,
                    type: val as WorkExperience["type"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {experienceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tech Stack</Label>
            <div className="flex gap-2">
              <Input
                placeholder="React, Node.js, etc."
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTechStack();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addTechStack}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {currentExperience.techStack && currentExperience.techStack.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {currentExperience.techStack.map((tech) => (
                  <Badge key={tech} variant="secondary" className="gap-1">
                    {tech}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeTechStack(tech)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={saveExperience}
              disabled={!currentExperience.company || !currentExperience.role}
            >
              {editingIndex !== null ? "Update" : "Add"} Experience
            </Button>
            {editingIndex !== null && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

