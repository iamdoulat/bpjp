
// src/app/admin/settings/page.tsx
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Image from "next/image";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadCNCardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Settings, UploadCloud } from "lucide-react";
// import { saveOrganizationSettings, type OrganizationSettingsData } from "@/services/organizationSettingsService"; // To be created

const organizationSettingsSchema = z.object({
  organizationName: z.string().min(3, { message: "Organization name must be at least 3 characters." }),
  address: z.string().min(10, { message: "Address must be at least 10 characters." }),
  registrationNumber: z.string().optional().or(z.literal('')),
  committeePeriod: z.string().optional().or(z.literal('')), // Added committee period
  contactPersonName: z.string().min(3, { message: "Contact person name must be at least 3 characters." }),
  contactPersonCell: z.string().regex(/^$|^[+]?[0-9\s-()]{7,20}$/, { message: "Invalid contact person cell number." }).or(z.literal('')),
  contactEmail: z.string().email({ message: "Invalid contact email format." }),
  presidentName: z.string().min(3, { message: "President's name must be at least 3 characters." }),
  presidentImageFile: z.instanceof(File).optional(),
  secretaryName: z.string().min(3, { message: "General Secretary's name must be at least 3 characters." }),
  secretaryImageFile: z.instanceof(File).optional(),
});

type OrganizationSettingsFormValues = z.infer<typeof organizationSettingsSchema>;

// Placeholder data - in a real app, this would be fetched from Firestore
const defaultValues: OrganizationSettingsFormValues = {
  organizationName: "BPJP Placeholder Org",
  address: "123 Main Street, Anytown, AT 12345",
  registrationNumber: "REG12345XYZ",
  committeePeriod: "2024-2026", // Added placeholder
  contactPersonName: "John Doe",
  contactPersonCell: "+15551234567",
  contactEmail: "contact@bpjp.org",
  presidentName: "Alice Wonderland",
  secretaryName: "Bob The Builder",
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [presidentPreview, setPresidentPreview] = React.useState<string | null>(null);
  const [secretaryPreview, setSecretaryPreview] = React.useState<string | null>(null);

  const form = useForm<OrganizationSettingsFormValues>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues, // Load existing settings in useEffect in a real app
    mode: "onChange",
  });

  // React.useEffect(() => {
  //   async function loadSettings() {
  //     // const settings = await getOrganizationSettings(); // To be created
  //     // if (settings) {
  //     //   form.reset({
  //     //     ...settings,
  //     //     presidentImageFile: undefined, // Files are not part of fetched data
  //     //     secretaryImageFile: undefined,
  //     //   });
  //     //   if (settings.presidentImageURL) setPresidentPreview(settings.presidentImageURL);
  //     //   if (settings.secretaryImageURL) setSecretaryPreview(settings.secretaryImageURL);
  //     // }
  //   }
  //   loadSettings();
  // }, [form]);

  const handlePresidentImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("presidentImageFile", file);
      setPresidentPreview(URL.createObjectURL(file));
    } else {
      form.setValue("presidentImageFile", undefined);
      setPresidentPreview(null); // Or set to existing URL if fetched
    }
  };

  const handleSecretaryImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("secretaryImageFile", file);
      setSecretaryPreview(URL.createObjectURL(file));
    } else {
      form.setValue("secretaryImageFile", undefined);
      setSecretaryPreview(null); // Or set to existing URL if fetched
    }
  };

  async function onSubmit(data: OrganizationSettingsFormValues) {
    setIsSubmitting(true);
    console.log("Form data submitted (not saved yet):", data);
    // In a real app:
    // const settingsToSave: OrganizationSettingsData = { ...data };
    // delete settingsToSave.presidentImageFile; // Handled separately
    // delete settingsToSave.secretaryImageFile;
    // await saveOrganizationSettings(settingsToSave, data.presidentImageFile, data.secretaryImageFile);
    
    toast({
      title: "Settings Submitted (Placeholder)",
      description: "Organization settings have been submitted. (Saving not implemented yet)",
    });
    setIsSubmitting(false);
  }

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-headline font-semibold">Organization Settings</h1>
            <p className="text-muted-foreground text-sm">
              Manage your organization's public information.
            </p>
          </div>
        </div>

        <Card className="shadow-lg max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Configuration Details</CardTitle>
            <ShadCNCardDescription>
              Update the general information for your organization.
            </ShadCNCardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name (App Name)</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Organization's Official Name" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Full official address" className="resize-y min-h-[100px]" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="registrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 12345/AB/2024" {...field} value={field.value ?? ""} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="committeePeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Committee Period (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2024-2026 or Current Term" {...field} value={field.value ?? ""} disabled={isSubmitting} />
                      </FormControl>
                       <FormDescription>
                        Specify the current committee's term period.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPersonName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name of the contact person" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPersonCell"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person Cell</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+1 123 456 7890" {...field} value={field.value ?? ""} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email ID</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="official.contact@example.com" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* President Section */}
                <div className="space-y-4 p-4 border rounded-md">
                  <h3 className="text-lg font-medium">President Information</h3>
                  <FormField
                    control={form.control}
                    name="presidentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>President's Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name of the President" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>President's Picture</FormLabel>
                    {presidentPreview && (
                      <div className="mt-2 mb-2 w-32 h-32 relative">
                        <Image src={presidentPreview} alt="President preview" layout="fill" objectFit="cover" className="rounded-md border" data-ai-hint="person portrait"/>
                      </div>
                    )}
                    <FormControl>
                       <Input type="file" accept="image/png, image/jpeg, image/gif" onChange={handlePresidentImageChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isSubmitting}/>
                    </FormControl>
                    <FormDescription>Upload a picture of the President (PNG, JPG, GIF).</FormDescription>
                    <FormMessage>{form.formState.errors.presidentImageFile?.message}</FormMessage>
                  </FormItem>
                </div>

                {/* General Secretary Section */}
                 <div className="space-y-4 p-4 border rounded-md">
                  <h3 className="text-lg font-medium">General Secretary Information</h3>
                  <FormField
                    control={form.control}
                    name="secretaryName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>General Secretary's Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name of the General Secretary" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>General Secretary's Picture</FormLabel>
                     {secretaryPreview && (
                      <div className="mt-2 mb-2 w-32 h-32 relative">
                        <Image src={secretaryPreview} alt="Secretary preview" layout="fill" objectFit="cover" className="rounded-md border" data-ai-hint="person portrait"/>
                      </div>
                    )}
                    <FormControl>
                      <Input type="file" accept="image/png, image/jpeg, image/gif" onChange={handleSecretaryImageChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isSubmitting}/>
                    </FormControl>
                     <FormDescription>Upload a picture of the General Secretary (PNG, JPG, GIF).</FormDescription>
                    <FormMessage>{form.formState.errors.secretaryImageFile?.message}</FormMessage>
                  </FormItem>
                </div>

                <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting || !form.formState.isValid}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSubmitting ? "Saving..." : "Save Settings"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}

    
