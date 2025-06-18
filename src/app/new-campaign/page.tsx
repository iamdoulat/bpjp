
"use client"

import * as React from "react"
import Image from 'next/image';
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
import { addCampaign, type NewCampaignInputData } from '@/services/campaignService';
import { Loader2, UploadCloud } from "lucide-react"
import { uploadImageToStorage } from "@/lib/firebase";
import ImageCropDialog from "@/components/ui/image-crop-dialog";

const newCampaignFormSchema = z.object({
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
  campaignImageFile: z.instanceof(File).optional(), // For storing the cropped file
  organizerName: z.string().max(100, { message: "Organizer name must be at most 100 characters."}).optional().or(z.literal('')),
  initialStatus: z.enum(["draft", "upcoming", "active"]),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

type NewCampaignFormValues = z.infer<typeof newCampaignFormSchema>

const defaultValues: Omit<NewCampaignFormValues, 'startDate' | 'endDate'> & { startDate?: Date; endDate?: Date } = {
  campaignTitle: "",
  description: "",
  goalAmount: 1000,
  startDate: undefined,
  endDate: undefined,
  campaignImageFile: undefined,
  organizerName: "",
  initialStatus: "draft",
}

export default function NewCampaignPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [imageToCropSrc, setImageToCropSrc] = React.useState<string | null>(null);
  const [croppedImagePreview, setCroppedImagePreview] = React.useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);


  const form = useForm<NewCampaignFormValues>({
    resolver: zodResolver(newCampaignFormSchema),
    defaultValues,
    mode: "onChange",
  })

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
    const croppedFile = new File([croppedBlob], "cropped_campaign_image.png", { type: "image/png" });
    form.setValue("campaignImageFile", croppedFile, { shouldValidate: true, shouldDirty: true });
    setCroppedImagePreview(URL.createObjectURL(croppedBlob));
    setIsCropDialogOpen(false); // Close dialog after crop
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
  };

  async function onSubmit(data: NewCampaignFormValues) {
    setIsSubmitting(true);
    let uploadedImageUrl: string | undefined = undefined;

    try {
      if (data.campaignImageFile) {
        const timestamp = new Date().getTime();
        // Ensure the filename is somewhat unique and clean, though Storage path uniqueness matters more
        const safeFileName = data.campaignImageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueFileName = `campaign_image_${timestamp}_${safeFileName}`;
        uploadedImageUrl = await uploadImageToStorage(data.campaignImageFile, `campaign_images/${uniqueFileName}`);
      }

      const campaignInput: NewCampaignInputData = {
        campaignTitle: data.campaignTitle,
        description: data.description,
        goalAmount: data.goalAmount,
        startDate: new Date(data.startDate as Date),
        endDate: new Date(data.endDate as Date),
        organizerName: data.organizerName,
        initialStatus: data.initialStatus,
        campaignImageUrl: uploadedImageUrl, // Use the uploaded image URL
      };
      const campaignId = await addCampaign(campaignInput);
      toast({
        title: "Campaign Created!",
        description: `Campaign "${data.campaignTitle}" (ID: ${campaignId}) has been successfully saved.`,
        variant: "default",
      });
      form.reset(defaultValues);
      setCroppedImagePreview(null); 
    } catch (error) {
      console.error("Failed to save campaign:", error);
      let errorMessage = "An unexpected error occurred while creating the campaign.";
      if (error instanceof Error) {
        if (error.message.includes("storage/unauthorized") || error.message.includes("Firebase Storage permission denied")) {
          errorMessage = "Failed to upload campaign image due to Firebase Storage permission issues. Please ensure your Firebase Storage security rules allow writes to the 'campaign_images/' path for authorized users (e.g., admins).";
        } else if (error.message.includes("Missing or insufficient permissions")) {
           errorMessage = "Failed to save campaign data due to Firestore permission issues. Please check your Firestore security rules for the 'campaigns' collection.";
        }
        else {
          errorMessage = error.message;
        }
      }
      toast({
        title: "Error Creating Campaign",
        description: errorMessage,
        variant: "destructive",
        duration: 9000, // Longer duration for important error messages
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        <div> 
          <Card className="shadow-lg max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-headline">Create New Campaign</CardTitle>
              <ShadCNCardDescription>
                Fill in the details to launch a new donation campaign.
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
                            const today = new Date();
                            today.setHours(0,0,0,0);
                            if (date < today) return true;
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
                            const today = new Date();
                            today.setHours(0,0,0,0);
                            if (!watchedStartDate && date < today) return true;
                            if (watchedStartDate && (date < watchedStartDate || date < today)) return true;
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
                    <FormLabel>Campaign Image (Optional)</FormLabel>
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
                    {croppedImagePreview && (
                      <div className="mt-4 relative w-full aspect-[3/2] max-w-md mx-auto border rounded-md overflow-hidden">
                        <Image src={croppedImagePreview} alt="Cropped campaign preview" layout="fill" objectFit="contain" data-ai-hint="campaign event" />
                      </div>
                    )}
                    <FormDescription>
                      Upload an image for your campaign (aspect ratio 3:2, e.g., 600x400px recommended).
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
                        <FormLabel>Initial Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select initial status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="upcoming">Upcoming</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Set the initial status. 'Draft' keeps it hidden, 'Upcoming' shows it as planned, 'Active' makes it live.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting || !form.formState.isValid}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? "Creating..." : "Create Campaign"}
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
              setImageToCropSrc(null); // Clear src if dialog is closed without cropping
               if (fileInputRef.current) {
                fileInputRef.current.value = ""; // Reset file input
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
