
"use client"

import * as React from "react"
import Image from 'next/image';
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadCNCardDescription } from "@/components/ui/card"
import { getCampaignById, updateCampaign, type CampaignUpdateData, type CampaignData } from '@/services/campaignService';
import { Loader2, AlertCircle, UploadCloud } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert"
import { uploadImageToStorage, deleteImageFromStorage } from "@/lib/firebase";
import ImageCropDialog from "@/components/ui/image-crop-dialog";

const editCampaignFormSchema = z.object({
  campaignTitle: z.string().min(5, {
    message: "Campaign title must be at least 5 characters.",
  }).max(100, { message: "Campaign title must be at most 100 characters."}),
  description: z.string().min(20, {
    message: "Description must be at least 20 characters.",
  }).max(5000, { message: "Description must be at most 5000 characters."}),
  goalAmount: z.preprocess(
    (val) => Number(String(val).replace(/[^0-9.-]+/g, "")),
    z.number().min(1, { message: "Goal amount must be at least $1." })
  ),
  startDate: z.date({
    required_error: "A start date is required.",
  }),
  endDate: z.date({
    required_error: "An end date is required.",
  }),
  campaignImageFile: z.instanceof(File).optional(), // For storing new cropped file
  organizerName: z.string().max(100, { message: "Organizer name must be at most 100 characters."}).optional().or(z.literal('')),
  initialStatus: z.enum(["draft", "upcoming", "active", "completed"]),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

type EditCampaignFormValues = z.infer<typeof editCampaignFormSchema>

export default function EditCampaignPage() {
  const { toast } = useToast()
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = React.useState<CampaignData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const [imageToCropSrc, setImageToCropSrc] = React.useState<string | null>(null);
  const [croppedImagePreview, setCroppedImagePreview] = React.useState<string | null>(null); // For new image
  const [currentImagePreview, setCurrentImagePreview] = React.useState<string | null>(null); // For existing image
  const [isCropDialogOpen, setIsCropDialogOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<EditCampaignFormValues>({
    resolver: zodResolver(editCampaignFormSchema),
    mode: "onChange",
  });

  React.useEffect(() => {
    if (campaignId) {
      async function fetchCampaign() {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedCampaign = await getCampaignById(campaignId);
          if (fetchedCampaign) {
            setCampaign(fetchedCampaign);
            form.reset({
              campaignTitle: fetchedCampaign.campaignTitle,
              description: fetchedCampaign.description,
              goalAmount: fetchedCampaign.goalAmount,
              startDate: new Date(fetchedCampaign.startDate as Date),
              endDate: new Date(fetchedCampaign.endDate as Date),
              campaignImageFile: undefined, // Initialize as undefined
              organizerName: fetchedCampaign.organizerName || "",
              initialStatus: fetchedCampaign.initialStatus,
            });
            setCurrentImagePreview(fetchedCampaign.campaignImageUrl || null);
          } else {
            setError("Campaign not found.");
          }
        } catch (e) {
          console.error("Failed to fetch campaign:", e);
          setError(e instanceof Error ? e.message : "An unknown error occurred while fetching campaign data.");
        } finally {
          setIsLoading(false);
        }
      }
      fetchCampaign();
    }
  }, [campaignId, form]);

  const watchedStartDate = form.watch("startDate");
  const watchedEndDate = form.watch("endDate");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCropSrc(reader.result as string);
        setIsCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], "updated_campaign_image.png", { type: "image/png" });
    form.setValue("campaignImageFile", croppedFile, { shouldValidate: true, shouldDirty: true });
    setCroppedImagePreview(URL.createObjectURL(croppedBlob)); // Preview for newly cropped image
    setCurrentImagePreview(null); // Hide old image preview if new one is cropped
    setIsCropDialogOpen(false);
     if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  async function onSubmit(data: EditCampaignFormValues) {
    if (!campaignId || !campaign) return;
    setIsSubmitting(true);
    let uploadedImageUrl = campaign.campaignImageUrl; // Default to existing image URL

    try {
      if (data.campaignImageFile) { // If a new file was selected and cropped
        // Delete old image if it exists and is different from placeholder
        if (campaign.campaignImageUrl && !campaign.campaignImageUrl.includes('placehold.co')) {
          await deleteImageFromStorage(campaign.campaignImageUrl);
        }
        // Upload new image
        const timestamp = new Date().getTime();
        const uniqueFileName = `campaign_image_${campaignId}_${timestamp}_${data.campaignImageFile.name}`;
        uploadedImageUrl = await uploadImageToStorage(data.campaignImageFile, `campaign_images/${uniqueFileName}`);
      }

      const campaignInput: CampaignUpdateData = {
        campaignTitle: data.campaignTitle,
        description: data.description,
        goalAmount: data.goalAmount,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        campaignImageUrl: uploadedImageUrl || "", // Ensure it's a string
        organizerName: data.organizerName,
        initialStatus: data.initialStatus,
      };
      await updateCampaign(campaignId, campaignInput);
      toast({
        title: "Campaign Updated!",
        description: `Campaign "${data.campaignTitle}" has been successfully updated.`,
        variant: "default",
      });
      router.push("/admin/campaigns");
    } catch (error) {
      console.error("Failed to update campaign:", error);
      let errorMessage = "An unexpected error occurred.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Error Updating Campaign",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
          <div>
            <Card className="shadow-lg">
              <CardHeader>
                <Skeleton className="h-8 w-3/5" />
                <Skeleton className="h-4 w-4/5" />
              </CardHeader>
              <CardContent className="space-y-8">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                ))}
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
          </div>
        </main>
      </AppShell>
    );
  }

  if (error && !campaign) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <ShadCNAlertTitle>Error</ShadCNAlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </main>
      </AppShell>
    );
  }
  
  if (!campaign) {
    return (
         <AppShell>
            <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
             <p>Campaign not found or could not be loaded.</p>
            </main>
         </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        <div> 
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Edit Campaign: {campaign.campaignTitle}</CardTitle>
              <ShadCNCardDescription>
                Modify the details of your campaign.
              </ShadCNCardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="campaignTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Title</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., Support Local Animal Shelter" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormDescription>
                          A catchy and descriptive title for your campaign.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us more about your campaign, its goals, and impact..."
                            className="resize-y min-h-[100px]"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a detailed explanation of the campaign.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="goalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Goal Amount ($)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="1000" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} disabled={isSubmitting} />
                        </FormControl>
                        <FormDescription>
                          The target amount you aim to raise.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                          placeholder="Select campaign start date"
                           disabled={(date) => {
                            if (isSubmitting) return true;
                            if (watchedEndDate && date > watchedEndDate) return true;
                            return false;
                          }}
                        />
                        <FormDescription>
                          When the campaign will officially start.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                          placeholder="Select campaign end date"
                          disabled={(date) => {
                            if (isSubmitting) return true;
                            if (watchedStartDate && date < watchedStartDate) return true;
                            return false;
                          }}
                        />
                        <FormDescription>
                          When the campaign will officially end.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormItem>
                    <FormLabel>Campaign Image</FormLabel>
                    <div className="space-y-2">
                      {(croppedImagePreview || currentImagePreview) && (
                        <div className="mt-2 relative w-full aspect-[3/2] max-w-md mx-auto border rounded-md overflow-hidden">
                          <Image 
                            src={croppedImagePreview || currentImagePreview || "https://placehold.co/600x400.png"} 
                            alt="Campaign image preview" 
                            layout="fill" 
                            objectFit="contain"
                            data-ai-hint="campaign event" />
                        </div>
                      )}
                      <FormControl>
                        <Input 
                          type="file" 
                          accept="image/png, image/jpeg, image/gif" 
                          onChange={handleFileChange}
                          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                          disabled={isSubmitting}
                          ref={fileInputRef}
                        />
                      </FormControl>
                    </div>
                    <FormDescription>
                      Upload or change the image for your campaign (aspect ratio 3:2, e.g., 600x400px recommended).
                    </FormDescription>
                    <FormMessage>{form.formState.errors.campaignImageFile?.message}</FormMessage>
                  </FormItem>

                  <FormField
                    control={form.control}
                    name="organizerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organizer Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Organization or Name" {...field} value={field.value ?? ""} disabled={isSubmitting}/>
                        </FormControl>
                        <FormDescription>
                          Name of the individual or group running the campaign.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="initialStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Set the campaign status.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting || !form.formState.isDirty || !form.formState.isValid || isLoading}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        {imageToCropSrc && (
          <ImageCropDialog
            isOpen={isCropDialogOpen}
            onClose={() => {
              setIsCropDialogOpen(false);
              setImageToCropSrc(null); 
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            imageSrc={imageToCropSrc}
            onCropComplete={handleCropComplete}
            aspectRatio={600 / 400}
            targetWidth={600}
            targetHeight={400}
          />
        )}
      </main>
    </AppShell>
  )
}
