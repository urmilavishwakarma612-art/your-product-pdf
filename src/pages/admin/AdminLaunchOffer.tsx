import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Clock, Save, Loader2, Calendar, Type, FileText, ToggleLeft } from "lucide-react";
import { format } from "date-fns";

interface LaunchOffer {
  id: string;
  title: string;
  description: string | null;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminLaunchOffer() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    end_date: string;
    is_active: boolean;
  } | null>(null);

  const { data: offer, isLoading } = useQuery({
    queryKey: ["launch-offer-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("launch_offer_settings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      return data as LaunchOffer | null;
    },
  });

  // Initialize form when data loads
  if (offer && !formData) {
    const endDate = new Date(offer.end_date);
    setFormData({
      title: offer.title,
      description: offer.description || "",
      end_date: format(endDate, "yyyy-MM-dd'T'HH:mm"),
      is_active: offer.is_active,
    });
  }

  const updateMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; end_date: string; is_active: boolean }) => {
      if (!offer) {
        // Create new offer
        const { error } = await supabase
          .from("launch_offer_settings")
          .insert({
            title: data.title,
            description: data.description || null,
            end_date: new Date(data.end_date).toISOString(),
            is_active: data.is_active,
          });
        if (error) throw error;
      } else {
        // Update existing
        const { error } = await supabase
          .from("launch_offer_settings")
          .update({
            title: data.title,
            description: data.description || null,
            end_date: new Date(data.end_date).toISOString(),
            is_active: data.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", offer.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["launch-offer-admin"] });
      queryClient.invalidateQueries({ queryKey: ["launch-offer"] });
      toast.success("Launch offer settings saved!");
    },
    onError: (error) => {
      toast.error("Failed to save: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Initialize with defaults if no offer exists
  if (!formData && !offer) {
    const defaultEndDate = new Date();
    defaultEndDate.setDate(defaultEndDate.getDate() + 7);
    setFormData({
      title: "Launch Offer Ends In",
      description: "Special launch pricing - Limited time offer!",
      end_date: format(defaultEndDate, "yyyy-MM-dd'T'HH:mm"),
      is_active: true,
    });
  }

  if (!formData) return null;

  const timeRemaining = new Date(formData.end_date).getTime() - Date.now();
  const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Launch Offer Settings</h1>
        <p className="text-muted-foreground">Manage the countdown timer and offer details on the pricing page</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Offer Configuration
            </CardTitle>
            <CardDescription>
              Configure the launch offer countdown timer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Title
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Launch Offer Ends In"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description (optional)
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Special launch pricing - 50% off all plans!"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  End Date & Time
                </Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active" className="flex items-center gap-2">
                    <ToggleLeft className="w-4 h-4" />
                    Active
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Show countdown on pricing page
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              How the countdown will appear on the pricing page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`glass-card p-4 sm:p-5 border-primary/30 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 ${!formData.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-xs sm:text-sm font-semibold text-primary">{formData.title}</span>
              </div>
              {formData.description && (
                <p className="text-xs text-muted-foreground text-center mb-3">{formData.description}</p>
              )}
              <div className="flex items-center justify-center gap-2">
                {[
                  { value: daysRemaining > 0 ? daysRemaining : 0, label: "Days" },
                  { value: hoursRemaining > 0 ? hoursRemaining : 0, label: "Hours" },
                  { value: 0, label: "Mins" },
                  { value: 0, label: "Secs" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center">
                      <span className="text-lg font-bold gradient-text">
                        {item.value.toString().padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {!formData.is_active && (
              <p className="text-center text-sm text-warning mt-4">
                ⚠️ This offer is currently inactive
              </p>
            )}

            {timeRemaining < 0 && formData.is_active && (
              <p className="text-center text-sm text-destructive mt-4">
                ⚠️ This offer has expired
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
