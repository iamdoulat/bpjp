// src/components/landing/Footer.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useAppContext } from "@/contexts/AppContext";
import { Facebook, Mail, Phone, MapPin, Loader2, Send } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { addFeedback, type NewFeedbackInput } from "@/services/feedbackService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const feedbackFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  mobileNumber: z.string().regex(/^[+]?[0-9\s-()]{7,20}$/, "Invalid mobile number format."),
  message: z.string().min(10, "Message must be at least 10 characters.").max(2000),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

export function Footer() {
  const { organizationSettings, appName } = useAppContext();
  const currentYear = new Date().getFullYear();
  const appLogoUrl = process.env.NEXT_PUBLIC_APP_LOGO_URL;
  const { toast } = useToast();

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: { name: "", mobileNumber: "", message: "" },
  });

  const { isSubmitting } = form.formState;

  const onSubmit: SubmitHandler<FeedbackFormValues> = async (data) => {
    try {
      await addFeedback(data);
      toast({
        title: "Feedback Sent!",
        description: "Thank you for your valuable feedback.",
      });
      form.reset();
    } catch (error) {
      console.error("Failed to send feedback:", error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Could not send feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <footer className="bg-header-background text-foreground border-t">
      <div className="container py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          {/* Organization Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {appLogoUrl && (
                <Image
                  src={appLogoUrl}
                  alt={`${appName} Logo`}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded"
                  data-ai-hint="logo company"
                />
              )}
              <h3 className="text-lg font-semibold text-black dark:text-foreground">
                {organizationSettings?.organizationName || "Our Organization"}
              </h3>
            </div>
            <div className="text-sm text-black dark:text-muted-foreground flex items-start gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-600 text-white flex-shrink-0">
                <MapPin className="h-4 w-4" />
              </div>
              <span>
                {organizationSettings?.address || "Community Address, City, Country"}
                <br />
                রেজিঃ নং- {organizationSettings?.registrationNumber || "N/A"},
                স্থাপিত: {organizationSettings?.establishedYear || "N/A"} ইংরেজি
              </span>
            </div>
            <div className="flex items-center gap-3 text-black dark:text-muted-foreground text-sm">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-600 text-white">
                    <Phone className="h-4 w-4" />
                </div>
                <span>{organizationSettings?.contactPersonCell || "Not Available"}</span>
            </div>
            <div className="flex items-center gap-3 text-black dark:text-muted-foreground text-sm">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-600 text-white">
                    <Mail className="h-4 w-4" />
                </div>
                <span>{organizationSettings?.contactEmail || "contact@example.com"}</span>
            </div>
             <div className="flex items-center space-x-4 pt-2">
              <a
                href="https://www.facebook.com/groups/bpkt2018"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                aria-label="Facebook Group"
              >
                <Facebook className="h-6 w-6" />
                <span className="sr-only">Facebook Group</span>
              </a>
              <a
                href="https://www.facebook.com/bpjkp"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                aria-label="Facebook Page"
              >
                <Facebook className="h-6 w-6" />
                <span className="sr-only">Facebook Page</span>
              </a>
            </div>
          </div>

          {/* Spacer */}
          <div></div>

          {/* Feedback Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black dark:text-foreground">
              অভিযোগ এবং পরামর্শ
            </h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Name" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="mobileNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Mobile Number with country code" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea placeholder="Your message..." {...field} disabled={isSubmitting} className="resize-y min-h-[100px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send Message
                </Button>
              </form>
            </Form>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-black dark:text-muted-foreground">
          <p>
            &copy; {currentYear} {organizationSettings?.organizationName}. All rights reserved.
          </p>
          <p className="mt-1">
            Designed and Developed by{" "}
            <a
              href="https://vcard.mddoulat.com/iamdoulat"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-black dark:text-foreground hover:text-primary"
            >
              Doulat
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
