import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, Github, Linkedin, Twitter, Instagram, Code, Globe } from "lucide-react";

interface SocialLinksSectionProps {
  form: UseFormReturn<any>;
}

export function SocialLinksSection({ form }: SocialLinksSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Social & Professional</CardTitle>
            <CardDescription>LinkedIn, GitHub, Twitter, portfolio</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="linkedin_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4" /> LinkedIn
                </FormLabel>
                <FormControl>
                  <Input placeholder="https://linkedin.com/in/username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="github_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Github className="w-4 h-4" /> GitHub
                </FormLabel>
                <FormControl>
                  <Input placeholder="https://github.com/username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="twitter_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Twitter className="w-4 h-4" /> Twitter / X
                </FormLabel>
                <FormControl>
                  <Input placeholder="https://twitter.com/username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="instagram_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Instagram className="w-4 h-4" /> Instagram
                </FormLabel>
                <FormControl>
                  <Input placeholder="https://instagram.com/username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="leetcode_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Code className="w-4 h-4" /> LeetCode
                </FormLabel>
                <FormControl>
                  <Input placeholder="https://leetcode.com/username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="portfolio_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Portfolio
                </FormLabel>
                <FormControl>
                  <Input placeholder="https://yourportfolio.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
