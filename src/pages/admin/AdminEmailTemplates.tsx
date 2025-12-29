import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { 
  Mail, 
  Save, 
  Eye,
  Palette,
  Type,
  Link,
  FileText,
  Crown,
  XCircle,
  Clock,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface EmailTemplate {
  id: string;
  type: string;
  subject: string;
  heading: string;
  body_text: string;
  cta_text: string;
  cta_url: string;
  primary_color: string;
  logo_url: string | null;
  footer_text: string | null;
  created_at: string;
  updated_at: string;
}

const templateIcons: Record<string, typeof Crown> = {
  granted: Crown,
  revoked: XCircle,
  expiring: Clock,
};

const templateLabels: Record<string, string> = {
  granted: "Pro Access Granted",
  revoked: "Pro Access Revoked",
  expiring: "Subscription Expiring",
};

const templateDescriptions: Record<string, string> = {
  granted: "Sent when admin grants Pro access to a user",
  revoked: "Sent when admin revokes Pro access from a user",
  expiring: "Sent automatically when subscription is about to expire",
};

const AdminEmailTemplates = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("granted");
  const [showPreview, setShowPreview] = useState(false);
  const [editedTemplates, setEditedTemplates] = useState<Record<string, Partial<EmailTemplate>>>({});

  const { data: templates, isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("type");
      
      if (error) throw error;
      return data as EmailTemplate[];
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<EmailTemplate> }) => {
      const { error } = await supabase
        .from("email_templates")
        .update(updates)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Template saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save template: " + error.message);
    },
  });

  const getTemplate = (type: string): EmailTemplate | undefined => {
    return templates?.find(t => t.type === type);
  };

  const getEditedValue = (type: string, field: keyof EmailTemplate): string => {
    const edited = editedTemplates[type]?.[field];
    if (edited !== undefined) return edited as string;
    const template = getTemplate(type);
    return (template?.[field] as string) || "";
  };

  const handleFieldChange = (type: string, field: keyof EmailTemplate, value: string) => {
    setEditedTemplates(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const handleSave = (type: string) => {
    const template = getTemplate(type);
    if (!template) return;
    
    const updates = editedTemplates[type];
    if (!updates || Object.keys(updates).length === 0) {
      toast.info("No changes to save");
      return;
    }

    updateTemplateMutation.mutate({ id: template.id, updates });
    setEditedTemplates(prev => {
      const newState = { ...prev };
      delete newState[type];
      return newState;
    });
  };

  const handleReset = (type: string) => {
    setEditedTemplates(prev => {
      const newState = { ...prev };
      delete newState[type];
      return newState;
    });
    toast.info("Changes reset");
  };

  const hasChanges = (type: string): boolean => {
    return !!editedTemplates[type] && Object.keys(editedTemplates[type]).length > 0;
  };

  const renderPreviewEmail = (type: string) => {
    const primaryColor = getEditedValue(type, "primary_color");
    const heading = getEditedValue(type, "heading");
    const bodyText = getEditedValue(type, "body_text");
    const ctaText = getEditedValue(type, "cta_text");
    const footerText = getEditedValue(type, "footer_text");

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #0f0f0f;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="font-size: 48px; margin-bottom: 16px;">${type === 'granted' ? '🎉' : type === 'revoked' ? '📋' : '⏰'}</div>
              <h1 style="color: ${primaryColor}; margin: 0; font-size: 24px; font-weight: bold;">${heading}</h1>
            </div>
            
            <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hey {{username}},
            </p>
            
            <p style="color: #e0e0e0; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              ${bodyText}
            </p>
            
            <div style="text-align: center; margin-top: 32px;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, ${primaryColor} 0%, #ea580c 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                ${ctaText} →
              </a>
            </div>
          </div>
          
          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 24px;">
            © ${new Date().getFullYear()} Nexalgotrix. ${footerText || ''}
          </p>
        </div>
      </body>
      </html>
    `;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Email Templates</h1>
        <p className="text-muted-foreground">Customize notification emails sent to users</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          {Object.entries(templateLabels).map(([type, label]) => {
            const Icon = templateIcons[type];
            return (
              <TabsTrigger key={type} value={type} className="gap-2">
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.keys(templateLabels).map((type) => (
          <TabsContent key={type} value={type} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-6 lg:grid-cols-2"
            >
              {/* Editor */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    {templateLabels[type]}
                  </CardTitle>
                  <CardDescription>{templateDescriptions[type]}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Subject */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Subject
                    </Label>
                    <Input
                      value={getEditedValue(type, "subject")}
                      onChange={(e) => handleFieldChange(type, "subject", e.target.value)}
                      placeholder="Email subject line..."
                    />
                  </div>

                  {/* Heading */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Heading
                    </Label>
                    <Input
                      value={getEditedValue(type, "heading")}
                      onChange={(e) => handleFieldChange(type, "heading", e.target.value)}
                      placeholder="Main heading text..."
                    />
                  </div>

                  {/* Body Text */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Body Text
                    </Label>
                    <Textarea
                      value={getEditedValue(type, "body_text")}
                      onChange={(e) => handleFieldChange(type, "body_text", e.target.value)}
                      placeholder="Main email content..."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {"{{username}}"} to insert the user's name
                    </p>
                  </div>

                  {/* CTA Button */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Link className="w-4 h-4" />
                        Button Text
                      </Label>
                      <Input
                        value={getEditedValue(type, "cta_text")}
                        onChange={(e) => handleFieldChange(type, "cta_text", e.target.value)}
                        placeholder="Call to action..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Link className="w-4 h-4" />
                        Button URL
                      </Label>
                      <Input
                        value={getEditedValue(type, "cta_url")}
                        onChange={(e) => handleFieldChange(type, "cta_url", e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  {/* Branding */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Primary Color
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={getEditedValue(type, "primary_color")}
                          onChange={(e) => handleFieldChange(type, "primary_color", e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={getEditedValue(type, "primary_color")}
                          onChange={(e) => handleFieldChange(type, "primary_color", e.target.value)}
                          placeholder="#f59e0b"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Footer Text</Label>
                      <Input
                        value={getEditedValue(type, "footer_text")}
                        onChange={(e) => handleFieldChange(type, "footer_text", e.target.value)}
                        placeholder="Footer message..."
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={() => handleSave(type)}
                      disabled={!hasChanges(type) || updateTemplateMutation.isPending}
                      className="flex-1"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateTemplateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowPreview(true)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    {hasChanges(type) && (
                      <Button
                        variant="ghost"
                        onClick={() => handleReset(type)}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Live Preview Card */}
              <Card className="glass-card overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Eye className="w-4 h-4 text-primary" />
                    Live Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="bg-[#0f0f0f] rounded-b-lg overflow-hidden">
                    <iframe
                      srcDoc={renderPreviewEmail(type)}
                      className="w-full h-[500px] border-0"
                      title="Email Preview"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Full Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email Preview: {templateLabels[activeTab]}
            </DialogTitle>
          </DialogHeader>
          <div className="bg-[#0f0f0f] rounded-lg overflow-hidden">
            <iframe
              srcDoc={renderPreviewEmail(activeTab)}
              className="w-full h-[600px] border-0"
              title="Email Preview"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEmailTemplates;
