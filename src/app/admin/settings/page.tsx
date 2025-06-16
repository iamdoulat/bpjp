
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
import { Loader2, Save, Settings, AlertCircle } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import { getOrganizationSettings, saveOrganizationSettings, type OrganizationSettingsData } from "@/services/organizationSettingsService";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle as ShadCNAlertTitle, AlertDescription as ShadCNAlertDescription } from "@/components/ui/alert";
import ImageCropDialog from "@/components/ui/image-crop-dialog";


const organizationSettingsSchema = z.object({
  organizationName: z.string().min(3, { message: "Organization name must be at least 3 characters." }).max(100),
  address: z.string().min(10, { message: "Address must be at least 10 characters." }).max(250),
  registrationNumber: z.string().max(50).optional().or(z.literal('')),
  committeePeriod: z.string().max(50).optional().or(z.literal('')),
  contactPersonName: z.string().min(3, { message: "Contact person name must be at least 3 characters." }).max(100),
  contactPersonCell: z.string().regex(/^$|^[+]?[0-9\s-()]{7,20}$/, { message: "Invalid contact person cell number." }).optional().or(z.literal('')),
  contactEmail: z.string().email({ message: "Invalid contact email format." }).max(100),
  presidentName: z.string().min(3, { message: "President's name must be at least 3 characters." }).max(100),
  presidentMobileNumber: z.string().regex(/^$|^[+]?[0-9\s-()]{7,20}$/, { message: "Invalid president's mobile number." }).optional().or(z.literal('')),
  presidentImageFile: z.instanceof(File).optional(),
  secretaryName: z.string().min(3, { message: "General Secretary's name must be at least 3 characters." }).max(100),
  secretaryMobileNumber: z.string().regex(/^$|^[+]?[0-9\s-()]{7,20}$/, { message: "Invalid secretary's mobile number." }).optional().or(z.literal('')),
  secretaryImageFile: z.instanceof(File).optional(),
  appName: z.string().min(1, { message: "App Name cannot be empty." }).max(50),
  coverImageFile: z.instanceof(File).optional(),
});

type OrganizationSettingsFormValues = z.infer<typeof organizationSettingsSchema>;

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { appName, setAppNameState } = useAppContext();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // State for president image cropping
  const [presidentPreview, setPresidentPreview] = React.useState<string | null>(null);
  const [imageToCropSrcPresident, setImageToCropSrcPresident] = React.useState<string | null>(null);
  const [isPresidentCropDialogOpen, setIsPresidentCropDialogOpen] = React.useState(false);
  const presidentFileInputRef = React.useRef<HTMLInputElement>(null);

  // State for secretary image cropping
  const [secretaryPreview, setSecretaryPreview] = React.useState<string | null>(null);
  const [imageToCropSrcSecretary, setImageToCropSrcSecretary] = React.useState<string | null>(null);
  const [isSecretaryCropDialogOpen, setIsSecretaryCropDialogOpen] = React.useState(false);
  const secretaryFileInputRef = React.useRef<HTMLInputElement>(null);

  // State for cover image cropping
  const [coverPreview, setCoverPreview] = React.useState<string | null>(null);
  const [imageToCropSrcCover, setImageToCropSrcCover] = React.useState<string | null>(null);
  const [isCoverCropDialogOpen, setIsCoverCropDialogOpen] = React.useState(false);
  const coverFileInputRef = React.useRef<HTMLInputElement>(null);


  const form = useForm<OrganizationSettingsFormValues>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: {
      organizationName: "",
      address: "",
      registrationNumber: "",
      committeePeriod: "",
      contactPersonName: "",
      contactPersonCell: "",
      contactEmail: "",
      presidentName: "",
      presidentMobileNumber: "",
      secretaryName: "",
      secretaryMobileNumber: "",
      appName: appName,
      presidentImageFile: undefined,
      secretaryImageFile: undefined,
      coverImageFile: undefined,
    },
    mode: "onChange",
  });

  React.useEffect(() => {
    async function loadSettings() {
      setIsLoadingData(true);
      setError(null);
      try {
        const settings = await getOrganizationSettings();
        if (settings) {
          form.reset({
            organizationName: settings.organizationName,
            address: settings.address,
            registrationNumber: settings.registrationNumber || "",
            committeePeriod: settings.committeePeriod || "",
            contactPersonName: settings.contactPersonName,
            contactPersonCell: settings.contactPersonCell || "",
            contactEmail: settings.contactEmail,
            presidentName: settings.presidentName,
            presidentMobileNumber: settings.presidentMobileNumber || "",
            secretaryName: settings.secretaryName,
            secretaryMobileNumber: settings.secretaryMobileNumber || "",
            appName: settings.appName,
            presidentImageFile: undefined,
            secretaryImageFile: undefined,
            coverImageFile: undefined,
          });
          if (settings.presidentImageURL) setPresidentPreview(settings.presidentImageURL);
          if (settings.secretaryImageURL) setSecretaryPreview(settings.secretaryImageURL);
          if (settings.coverImageUrl) setCoverPreview(settings.coverImageUrl);
          if (settings.appName) setAppNameState(settings.appName);
        } else {
           form.reset({ ...form.formState.defaultValues, appName: appName });
        }
      } catch (e) {
        console.error("Failed to load organization settings:", e);
        setError(e instanceof Error ? e.message : "Could not load settings.");
        toast({ title: "Error Loading Settings", description: e instanceof Error ? e.message : "Could not load settings.", variant: "destructive" });
      } finally {
        setIsLoadingData(false);
      }
    }
    loadSettings();
  }, [form, setAppNameState, appName]);


  const handlePresidentFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCropSrcPresident(reader.result as string);
        setIsPresidentCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresidentCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], "president_image_cropped.png", { type: "image/png" });
    form.setValue("presidentImageFile", croppedFile, { shouldValidate: true, shouldDirty: true });
    setPresidentPreview(URL.createObjectURL(croppedBlob));
    setIsPresidentCropDialogOpen(false);
    if (presidentFileInputRef.current) presidentFileInputRef.current.value = "";
  };

  const handleSecretaryFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCropSrcSecretary(reader.result as string);
        setIsSecretaryCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSecretaryCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], "secretary_image_cropped.png", { type: "image/png" });
    form.setValue("secretaryImageFile", croppedFile, { shouldValidate: true, shouldDirty: true });
    setSecretaryPreview(URL.createObjectURL(croppedBlob));
    setIsSecretaryCropDialogOpen(false);
    if (secretaryFileInputRef.current) secretaryFileInputRef.current.value = "";
  };

  const handleCoverFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCropSrcCover(reader.result as string);
        setIsCoverCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], "cover_image_cropped.png", { type: "image/png" });
    form.setValue("coverImageFile", croppedFile, { shouldValidate: true, shouldDirty: true });
    setCoverPreview(URL.createObjectURL(croppedBlob));
    setIsCoverCropDialogOpen(false);
    if (coverFileInputRef.current) coverFileInputRef.current.value = "";
  };


  async function onSubmit(data: OrganizationSettingsFormValues) {
    setIsSubmitting(true);
    setError(null);
    try {
      const { presidentImageFile, secretaryImageFile, coverImageFile, ...settingsToSave } = data;
      await saveOrganizationSettings(settingsToSave, presidentImageFile, secretaryImageFile, coverImageFile);
      
      if (data.appName) {
        setAppNameState(data.appName);
      }
      toast({
        title: "Settings Saved!",
        description: "Organization settings have been successfully updated.",
      });
    } catch (e) {
      console.error("Failed to save settings:", e);
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(errorMessage);
      toast({
        title: "Error Saving Settings",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (isLoadingData) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <Card className="shadow-lg max-w-4xl mx-auto">
            <CardHeader>
              <Skeleton className="h-8 w-3/5" />
              <Skeleton className="h-4 w-4/5" />
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              {[...Array(12)].map((_, i) => ( // Increased skeleton items
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
               <Skeleton className="h-10 w-28 mt-4" />
            </CardContent>
          </Card>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-headline font-semibold">Organization Settings</h1>
            <p className="text-muted-foreground text-sm">
              Manage your organization's public information and app settings.
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4 max-w-4xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <ShadCNAlertTitle>Loading Error</ShadCNAlertTitle>
            <ShadCNAlertDescription>{error}</ShadCNAlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Configuration Details</CardTitle>
            <ShadCNCardDescription>
              Update the general information for your organization and application.
            </ShadCNCardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                 <FormField
                  control={form.control}
                  name="appName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Name (for Header)</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Application Name" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormDescription>This name will be displayed in the application header.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Organization's Official Name" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormDescription>Displayed on "About Us" and public areas.</FormDescription>
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
                        <Input placeholder="e.g., 2025-2026" {...field} value={field.value ?? ""} disabled={isSubmitting} />
                      </FormControl>
                      <FormDescription>The current committee's term period (e.g., 2025-2026).</FormDescription>
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
                        <Input placeholder="Full name" {...field} disabled={isSubmitting} />
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
                        <Input type="email" placeholder="contact@example.com" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cover Image Section */}
                <div className="space-y-4 p-4 border rounded-md">
                  <h3 className="text-lg font-medium">Cover Image (for About Us page)</h3>
                  <FormItem>
                    <FormLabel htmlFor="coverImageFile">Cover Picture</FormLabel>
                    {coverPreview && (
                      <div className="mt-2 mb-2 w-full aspect-[12/5] relative rounded-md overflow-hidden border">
                        <Image src={coverPreview} alt="Cover preview" layout="fill" objectFit="cover" data-ai-hint="organization banner"/>
                      </div>
                    )}
                    <FormControl>
                       <Input id="coverImageFile" type="file" accept="image/png, image/jpeg, image/gif" onChange={handleCoverFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isSubmitting} ref={coverFileInputRef} />
                    </FormControl>
                    <FormDescription>Upload a cover image for the About Us page banner (recommended 1200x500px).</FormDescription>
                    <FormMessage>{form.formState.errors.coverImageFile?.message}</FormMessage>
                  </FormItem>
                </div>


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
                          <Input placeholder="Full name" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="presidentMobileNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>President's Mobile Number (Optional)</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+1 123 456 7890" {...field} value={field.value ?? ""} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel htmlFor="presidentImageFile">President's Picture</FormLabel>
                    {presidentPreview && (
                      <div className="mt-2 mb-2 w-32 h-32 relative rounded-md overflow-hidden border">
                        <Image src={presidentPreview} alt="President preview" layout="fill" objectFit="cover" data-ai-hint="person portrait"/>
                      </div>
                    )}
                    <FormControl>
                       <Input id="presidentImageFile" type="file" accept="image/png, image/jpeg, image/gif" onChange={handlePresidentFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isSubmitting} ref={presidentFileInputRef}/>
                    </FormControl>
                    <FormDescription>Upload a picture (150x150 recommended).</FormDescription>
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
                          <Input placeholder="Full name" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="secretaryMobileNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>General Secretary's Mobile Number (Optional)</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+1 123 456 7890" {...field} value={field.value ?? ""} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel htmlFor="secretaryImageFile">General Secretary's Picture</FormLabel>
                     {secretaryPreview && (
                      <div className="mt-2 mb-2 w-32 h-32 relative rounded-md overflow-hidden border">
                        <Image src={secretaryPreview} alt="Secretary preview" layout="fill" objectFit="cover" data-ai-hint="person portrait"/>
                      </div>
                    )}
                    <FormControl>
                      <Input id="secretaryImageFile" type="file" accept="image/png, image/jpeg, image/gif" onChange={handleSecretaryFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isSubmitting} ref={secretaryFileInputRef}/>
                    </FormControl>
                     <FormDescription>Upload a picture (150x150 recommended).</FormDescription>
                    <FormMessage>{form.formState.errors.secretaryImageFile?.message}</FormMessage>
                  </FormItem>
                </div>

                <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting || isLoadingData || (!form.formState.isDirty && !form.watch('presidentImageFile') && !form.watch('secretaryImageFile') && !form.watch('coverImageFile')) || !form.formState.isValid}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSubmitting ? "Saving..." : "Save Settings"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* President Image Crop Dialog */}
        {imageToCropSrcPresident && (
          <ImageCropDialog
            isOpen={isPresidentCropDialogOpen}
            onClose={() => {
              setIsPresidentCropDialogOpen(false);
              setImageToCropSrcPresident(null);
              if (presidentFileInputRef.current) presidentFileInputRef.current.value = "";
            }}
            imageSrc={imageToCropSrcPresident}
            onCropComplete={handlePresidentCropComplete}
            aspectRatio={1} // 1:1 aspect ratio
            targetWidth={150}
            targetHeight={150}
          />
        )}

        {/* Secretary Image Crop Dialog */}
        {imageToCropSrcSecretary && (
          <ImageCropDialog
            isOpen={isSecretaryCropDialogOpen}
            onClose={() => {
              setIsSecretaryCropDialogOpen(false);
              setImageToCropSrcSecretary(null);
              if (secretaryFileInputRef.current) secretaryFileInputRef.current.value = "";
            }}
            imageSrc={imageToCropSrcSecretary}
            onCropComplete={handleSecretaryCropComplete}
            aspectRatio={1} // 1:1 aspect ratio
            targetWidth={150}
            targetHeight={150}
          />
        )}

        {/* Cover Image Crop Dialog */}
        {imageToCropSrcCover && (
          <ImageCropDialog
            isOpen={isCoverCropDialogOpen}
            onClose={() => {
              setIsCoverCropDialogOpen(false);
              setImageToCropSrcCover(null);
              if (coverFileInputRef.current) coverFileInputRef.current.value = "";
            }}
            imageSrc={imageToCropSrcCover}
            onCropComplete={handleCoverCropComplete}
            aspectRatio={1200 / 500} 
            targetWidth={1200}
            targetHeight={500}
          />
        )}

      </main>
    </AppShell>
  );
}

