
// src/app/admin/settings/page.tsx
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Settings, AlertCircle, Users, PlusCircle, Edit, Trash2 } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import { getOrganizationSettings, saveOrganizationSettings, type OrganizationSettingsData } from "@/services/organizationSettingsService";
import {
  addAdvisoryBoardMember,
  getAdvisoryBoardMembers,
  updateAdvisoryBoardMember,
  deleteAdvisoryBoardMember,
  type AdvisoryBoardMemberData,
  type NewAdvisoryBoardMemberInput,
  type UpdateAdvisoryBoardMemberInput
} from "@/services/advisoryBoardService";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle as ShadCNAlertTitle, AlertDescription as ShadCNAlertDescription } from "@/components/ui/alert";
import ImageCropDialog from "@/components/ui/image-crop-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as ShadCNAlertDialogContentUI,
  AlertDialogDescription as ShadCNAlertDialogDescriptionUI,
  AlertDialogFooter as ShadCNAlertDialogFooterUI,
  AlertDialogHeader as ShadCNAlertDialogHeaderUI,
  AlertDialogTitle as ShadCNAlertDialogTitleUI,
} from "@/components/ui/alert-dialog";

const organizationSettingsSchema = z.object({
  organizationName: z.string().min(3, { message: "Organization name must be at least 3 characters." }).max(100),
  address: z.string().min(10, { message: "Address must be at least 10 characters." }).max(250),
  registrationNumber: z.string().max(50).optional().or(z.literal('')),
  establishedYear: z.string().regex(/^\d{4}$/, { message: "Must be a 4-digit year." }).optional().or(z.literal('')),
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

const advisoryMemberSchema = z.object({
  name: z.string().min(2, "Member name is required.").max(100),
  title: z.string().min(2, "Member title is required.").max(100),
  imageFile: z.instanceof(File).optional().nullable(),
});
type AdvisoryMemberFormValues = z.infer<typeof advisoryMemberSchema>;


export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { appName, setAppNameState } = useAppContext();
  const [isSubmittingOrgSettings, setIsSubmittingOrgSettings] = React.useState(false);
  const [isLoadingOrgData, setIsLoadingOrgData] = React.useState(true);
  const [orgError, setOrgError] = React.useState<string | null>(null);

  const [presidentPreview, setPresidentPreview] = React.useState<string | null>(null);
  const [imageToCropSrcPresident, setImageToCropSrcPresident] = React.useState<string | null>(null);
  const [isPresidentCropDialogOpen, setIsPresidentCropDialogOpen] = React.useState(false);
  const presidentFileInputRef = React.useRef<HTMLInputElement>(null);

  const [secretaryPreview, setSecretaryPreview] = React.useState<string | null>(null);
  const [imageToCropSrcSecretary, setImageToCropSrcSecretary] = React.useState<string | null>(null);
  const [isSecretaryCropDialogOpen, setIsSecretaryCropDialogOpen] = React.useState(false);
  const secretaryFileInputRef = React.useRef<HTMLInputElement>(null);

  const [coverPreview, setCoverPreview] = React.useState<string | null>(null);
  const [imageToCropSrcCover, setImageToCropSrcCover] = React.useState<string | null>(null);
  const [isCoverCropDialogOpen, setIsCoverCropDialogOpen] = React.useState(false);
  const coverFileInputRef = React.useRef<HTMLInputElement>(null);

  // Advisory Board State
  const [advisoryMembers, setAdvisoryMembers] = React.useState<AdvisoryBoardMemberData[]>([]);
  const [isLoadingAdvisoryMembers, setIsLoadingAdvisoryMembers] = React.useState(true);
  const [isSubmittingAdvisoryMember, setIsSubmittingAdvisoryMember] = React.useState(false); // Combined for add/edit
  const [editingAdvisoryMember, setEditingAdvisoryMember] = React.useState<AdvisoryBoardMemberData | null>(null);
  const [isAdvisoryMemberFormDialogOpen, setIsAdvisoryMemberFormDialogOpen] = React.useState(false);
  const [advisoryMemberFormType, setAdvisoryMemberFormType] = React.useState<'add' | 'edit'>('add');
  const [advisoryMemberToDelete, setAdvisoryMemberToDelete] = React.useState<AdvisoryBoardMemberData | null>(null);
  const [isDeletingAdvisoryMember, setIsDeletingAdvisoryMember] = React.useState(false);
  
  const advisoryMemberImageFileInputRef = React.useRef<HTMLInputElement>(null);
  const [advisoryMemberImagePreview, setAdvisoryMemberImagePreview] = React.useState<string | null>(null);
  const [imageToCropSrcAdvisory, setImageToCropSrcAdvisory] = React.useState<string | null>(null);
  const [isAdvisoryCropDialogOpen, setIsAdvisoryCropDialogOpen] = React.useState(false);
  const [advisoryImageFileToSubmit, setAdvisoryImageFileToSubmit] = React.useState<File | null | undefined>(undefined);


  const orgForm = useForm<OrganizationSettingsFormValues>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: { /* will be set in useEffect */ },
    mode: "onChange",
  });

  const advisoryMemberForm = useForm<AdvisoryMemberFormValues>({
    resolver: zodResolver(advisoryMemberSchema),
    defaultValues: { name: "", title: "", imageFile: undefined },
  });


  const fetchAdvisoryData = React.useCallback(async () => {
    setIsLoadingAdvisoryMembers(true);
    try {
      const members = await getAdvisoryBoardMembers();
      setAdvisoryMembers(members);
    } catch (e) {
      toast({ title: "Error Loading Advisory Board", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingAdvisoryMembers(false);
    }
  }, [toast]);

  React.useEffect(() => {
    async function loadSettings() {
      setIsLoadingOrgData(true);
      setOrgError(null);
      try {
        const settings = await getOrganizationSettings();
        if (settings) {
          orgForm.reset({
            organizationName: settings.organizationName,
            address: settings.address,
            registrationNumber: settings.registrationNumber || "",
            establishedYear: settings.establishedYear || "",
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
           orgForm.reset({ ...orgForm.formState.defaultValues, appName: appName });
        }
      } catch (e) {
        setOrgError((e as Error).message);
        toast({ title: "Error Loading Settings", description: (e as Error).message, variant: "destructive" });
      } finally {
        setIsLoadingOrgData(false);
      }
    }
    loadSettings();
    fetchAdvisoryData();
  }, [orgForm, setAppNameState, appName, fetchAdvisoryData, toast]);

  const onOrgSubmit = async (data: OrganizationSettingsFormValues) => {
    setIsSubmittingOrgSettings(true);
    setOrgError(null);
    try {
      const { presidentImageFile, secretaryImageFile, coverImageFile, ...settingsToSave } = data;
      await saveOrganizationSettings(settingsToSave, presidentImageFile, secretaryImageFile, coverImageFile);
      if (data.appName) setAppNameState(data.appName);
      toast({ title: "Settings Saved!", description: "Organization settings have been successfully updated." });
    } catch (e) {
      setOrgError((e as Error).message);
      toast({ title: "Error Saving Settings", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsSubmittingOrgSettings(false);
    }
  };

  // Advisory Image Handling
  const handleAdvisoryFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCropSrcAdvisory(reader.result as string);
        setIsAdvisoryCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdvisoryCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], `advisory_member_cropped.png`, { type: "image/png" });
    setAdvisoryImageFileToSubmit(croppedFile); // Store the file to be submitted for service call
    advisoryMemberForm.setValue("imageFile", croppedFile, { shouldValidate: true, shouldDirty: true });
    setAdvisoryMemberImagePreview(URL.createObjectURL(croppedBlob));
    setIsAdvisoryCropDialogOpen(false);
    if (advisoryMemberImageFileInputRef.current) advisoryMemberImageFileInputRef.current.value = "";
  };
  
  const handleRemoveAdvisoryMemberImage = () => {
    setAdvisoryImageFileToSubmit(null); // Explicitly null to signal removal
    advisoryMemberForm.setValue("imageFile", null);
    setAdvisoryMemberImagePreview(null);
    if (advisoryMemberImageFileInputRef.current) advisoryMemberImageFileInputRef.current.value = "";
  };

  const openAdvisoryMemberFormDialog = (type: 'add' | 'edit', member?: AdvisoryBoardMemberData) => {
    setAdvisoryMemberFormType(type);
    if (type === 'add') {
      advisoryMemberForm.reset({ name: "", title: "", imageFile: undefined });
      setEditingAdvisoryMember(null);
      setAdvisoryMemberImagePreview(null);
    } else if (member) {
      advisoryMemberForm.reset({ name: member.name, title: member.title, imageFile: undefined });
      setEditingAdvisoryMember(member);
      setAdvisoryMemberImagePreview(member.imageUrl || null);
    }
    setAdvisoryImageFileToSubmit(undefined); // Reset for both forms
    setIsAdvisoryMemberFormDialogOpen(true);
  };


  const onAdvisoryMemberFormSubmit = async (data: AdvisoryMemberFormValues) => {
    setIsSubmittingAdvisoryMember(true);
    try {
      if (advisoryMemberFormType === 'add') {
        await addAdvisoryBoardMember({ name: data.name, title: data.title }, advisoryImageFileToSubmit as File | undefined);
        toast({ title: "Member Added", description: `${data.name} has been added.` });
      } else if (editingAdvisoryMember) {
        await updateAdvisoryBoardMember(editingAdvisoryMember.id, { name: data.name, title: data.title }, advisoryImageFileToSubmit);
        toast({ title: "Member Updated", description: `${data.name}'s details updated.` });
      }
      setIsAdvisoryMemberFormDialogOpen(false);
      fetchAdvisoryData();
    } catch (e) {
      toast({ title: `Error ${advisoryMemberFormType === 'add' ? 'Adding' : 'Updating'} Member`, description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsSubmittingAdvisoryMember(false);
    }
  };

  // Delete Advisory Member
  const confirmDeleteAdvisoryMember = (member: AdvisoryBoardMemberData) => {
    setAdvisoryMemberToDelete(member);
  };

  const handleDeleteAdvisoryMember = async () => {
    if (!advisoryMemberToDelete) return;
    setIsDeletingAdvisoryMember(true);
    try {
      await deleteAdvisoryBoardMember(advisoryMemberToDelete.id);
      toast({ title: "Member Deleted", description: `${advisoryMemberToDelete.name} has been removed.` });
      setAdvisoryMemberToDelete(null);
      fetchAdvisoryData();
    } catch (e) {
      toast({ title: "Error Deleting Member", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsDeletingAdvisoryMember(false);
    }
  };

  const handlePresidentFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setImageToCropSrcPresident(reader.result as string); setIsPresidentCropDialogOpen(true); };
      reader.readAsDataURL(file);
    }
  };
  const handlePresidentCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], "president_image_cropped.png", { type: "image/png" });
    orgForm.setValue("presidentImageFile", croppedFile, { shouldValidate: true, shouldDirty: true });
    setPresidentPreview(URL.createObjectURL(croppedBlob));
    setIsPresidentCropDialogOpen(false);
    if (presidentFileInputRef.current) presidentFileInputRef.current.value = "";
  };
  const handleSecretaryFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setImageToCropSrcSecretary(reader.result as string); setIsSecretaryCropDialogOpen(true); };
      reader.readAsDataURL(file);
    }
  };
  const handleSecretaryCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], "secretary_image_cropped.png", { type: "image/png" });
    orgForm.setValue("secretaryImageFile", croppedFile, { shouldValidate: true, shouldDirty: true });
    setSecretaryPreview(URL.createObjectURL(croppedBlob));
    setIsSecretaryCropDialogOpen(false);
    if (secretaryFileInputRef.current) secretaryFileInputRef.current.value = "";
  };
  const handleCoverFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setImageToCropSrcCover(reader.result as string); setIsCoverCropDialogOpen(true); };
      reader.readAsDataURL(file);
    }
  };
  const handleCoverCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], "cover_image_cropped.png", { type: "image/png" });
    orgForm.setValue("coverImageFile", croppedFile, { shouldValidate: true, shouldDirty: true });
    setCoverPreview(URL.createObjectURL(croppedBlob));
    setIsCoverCropDialogOpen(false);
    if (coverFileInputRef.current) coverFileInputRef.current.value = "";
  };


  if (isLoadingOrgData) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <Card className="shadow-lg max-w-4xl mx-auto">
            <CardHeader><Skeleton className="h-8 w-3/5" /><Skeleton className="h-4 w-4/5" /></CardHeader>
            <CardContent className="space-y-8 pt-6">{[...Array(13)].map((_, i) => (<div key={i} className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>))}<Skeleton className="h-10 w-28 mt-4" /></CardContent>
          </Card>
           <Card className="shadow-lg max-w-4xl mx-auto mt-8">
            <CardHeader><Skeleton className="h-7 w-1/2" /><Skeleton className="h-4 w-3/4" /></CardHeader>
            <CardContent><Skeleton className="h-24 w-full" /><Skeleton className="h-10 w-32 mt-4" /></CardContent>
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
          <div><h1 className="text-2xl font-headline font-semibold">Organization Settings</h1><p className="text-muted-foreground text-sm">Manage your organization's public information and app settings.</p></div>
        </div>

        {orgError && (<Alert variant="destructive" className="mb-4 max-w-4xl mx-auto"><AlertCircle className="h-4 w-4" /><ShadCNAlertTitle>Loading Error</ShadCNAlertTitle><ShadCNAlertDescription>{orgError}</ShadCNAlertDescription></Alert>)}

        <Card className="shadow-lg max-w-4xl mx-auto">
          <CardHeader><CardTitle>Configuration Details</CardTitle><ShadCNCardDescription>Update the general information for your organization and application.</ShadCNCardDescription></CardHeader>
          <CardContent>
            <Form {...orgForm}>
              <form onSubmit={orgForm.handleSubmit(onOrgSubmit)} className="space-y-8">
                {/* Organization Settings Fields ... */}
                <FormField control={orgForm.control} name="appName" render={({ field }) => (<FormItem><FormLabel>Application Name (for Header)</FormLabel><FormControl><Input placeholder="Your Application Name" {...field} disabled={isSubmittingOrgSettings} /></FormControl><FormDescription>This name will be displayed in the application header.</FormDescription><FormMessage /></FormItem>)}/>
                <FormField control={orgForm.control} name="organizationName" render={({ field }) => (<FormItem><FormLabel>Organization Name</FormLabel><FormControl><Input placeholder="Your Organization's Official Name" {...field} disabled={isSubmittingOrgSettings} /></FormControl><FormDescription>Displayed on "About Us" and public areas.</FormDescription><FormMessage /></FormItem>)}/>
                <FormField control={orgForm.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="Full official address" className="resize-y min-h-[100px]" {...field} disabled={isSubmittingOrgSettings} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={orgForm.control} name="registrationNumber" render={({ field }) => (<FormItem><FormLabel>Registration Number (Optional)</FormLabel><FormControl><Input placeholder="e.g., 12345/AB/2024" {...field} value={field.value ?? ""} disabled={isSubmittingOrgSettings} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={orgForm.control} name="establishedYear" render={({ field }) => (<FormItem><FormLabel>Established Year (Optional)</FormLabel><FormControl><Input type="text" placeholder="e.g., 2010" {...field} value={field.value ?? ""} disabled={isSubmittingOrgSettings} maxLength={4} /></FormControl><FormDescription>The year the organization was established (4 digits).</FormDescription><FormMessage /></FormItem>)}/>
                <FormField control={orgForm.control} name="committeePeriod" render={({ field }) => (<FormItem><FormLabel>Committee Period (Optional)</FormLabel><FormControl><Input placeholder="e.g., 2025-2026" {...field} value={field.value ?? ""} disabled={isSubmittingOrgSettings} /></FormControl><FormDescription>The current committee's term period (e.g., 2025-2026).</FormDescription><FormMessage /></FormItem>)}/>
                <FormField control={orgForm.control} name="contactPersonName" render={({ field }) => (<FormItem><FormLabel>Contact Person Name</FormLabel><FormControl><Input placeholder="Full name" {...field} disabled={isSubmittingOrgSettings} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={orgForm.control} name="contactPersonCell" render={({ field }) => (<FormItem><FormLabel>Contact Person Cell</FormLabel><FormControl><Input type="tel" placeholder="+1 123 456 7890" {...field} value={field.value ?? ""} disabled={isSubmittingOrgSettings} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={orgForm.control} name="contactEmail" render={({ field }) => (<FormItem><FormLabel>Contact Email ID</FormLabel><FormControl><Input type="email" placeholder="contact@example.com" {...field} disabled={isSubmittingOrgSettings} /></FormControl><FormMessage /></FormItem>)}/>
                <div className="space-y-4 p-4 border rounded-md"><h3 className="text-lg font-medium">Cover Image (for About Us page)</h3><FormField control={orgForm.control} name="coverImageFile" render={() => (<FormItem><FormLabel htmlFor="coverImageFile">Cover Picture</FormLabel>{coverPreview && (<div className="mt-2 mb-2 w-full aspect-[12/5] relative rounded-md overflow-hidden border"><Image src={coverPreview} alt="Cover preview" layout="fill" objectFit="cover" data-ai-hint="organization banner"/></div>)}<FormControl><Input id="coverImageFile" type="file" accept="image/png, image/jpeg, image/gif" onChange={handleCoverFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isSubmittingOrgSettings} ref={coverFileInputRef} /></FormControl><FormDescription>Upload a cover image for the About Us page banner (recommended 1200x500px).</FormDescription><FormMessage>{orgForm.formState.errors.coverImageFile?.message as React.ReactNode}</FormMessage></FormItem>)}/></div>
                <div className="space-y-4 p-4 border rounded-md"><h3 className="text-lg font-medium">President Information</h3><FormField control={orgForm.control} name="presidentName" render={({ field }) => (<FormItem><FormLabel>President's Name</FormLabel><FormControl><Input placeholder="Full name" {...field} disabled={isSubmittingOrgSettings} /></FormControl><FormMessage /></FormItem>)}/><FormField control={orgForm.control} name="presidentMobileNumber" render={({ field }) => (<FormItem><FormLabel>President's Mobile Number (Optional)</FormLabel><FormControl><Input type="tel" placeholder="+1 123 456 7890" {...field} value={field.value ?? ""} disabled={isSubmittingOrgSettings} /></FormControl><FormMessage /></FormItem>)}/><FormField control={orgForm.control} name="presidentImageFile" render={() => (<FormItem><FormLabel htmlFor="presidentImageFile">President's Picture</FormLabel>{presidentPreview && (<div className="mt-2 mb-2 w-32 h-32 relative rounded-md overflow-hidden border"><Image src={presidentPreview} alt="President preview" layout="fill" objectFit="cover" data-ai-hint="person portrait"/></div>)}<FormControl><Input id="presidentImageFile" type="file" accept="image/png, image/jpeg, image/gif" onChange={handlePresidentFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isSubmittingOrgSettings} ref={presidentFileInputRef}/></FormControl><FormDescription>Upload a picture (150x150 recommended).</FormDescription><FormMessage>{orgForm.formState.errors.presidentImageFile?.message as React.ReactNode}</FormMessage></FormItem>)}/></div>
                <div className="space-y-4 p-4 border rounded-md"><h3 className="text-lg font-medium">General Secretary Information</h3><FormField control={orgForm.control} name="secretaryName" render={({ field }) => (<FormItem><FormLabel>General Secretary's Name</FormLabel><FormControl><Input placeholder="Full name" {...field} disabled={isSubmittingOrgSettings} /></FormControl><FormMessage /></FormItem>)}/><FormField control={orgForm.control} name="secretaryMobileNumber" render={({ field }) => (<FormItem><FormLabel>General Secretary's Mobile Number (Optional)</FormLabel><FormControl><Input type="tel" placeholder="+1 123 456 7890" {...field} value={field.value ?? ""} disabled={isSubmittingOrgSettings} /></FormControl><FormMessage /></FormItem>)}/><FormField control={orgForm.control} name="secretaryImageFile" render={() => (<FormItem><FormLabel htmlFor="secretaryImageFile">General Secretary's Picture</FormLabel>{secretaryPreview && (<div className="mt-2 mb-2 w-32 h-32 relative rounded-md overflow-hidden border"><Image src={secretaryPreview} alt="Secretary preview" layout="fill" objectFit="cover" data-ai-hint="person portrait"/></div>)}<FormControl><Input id="secretaryImageFile" type="file" accept="image/png, image/jpeg, image/gif" onChange={handleSecretaryFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isSubmittingOrgSettings} ref={secretaryFileInputRef}/></FormControl><FormDescription>Upload a picture (150x150 recommended).</FormDescription><FormMessage>{orgForm.formState.errors.secretaryImageFile?.message as React.ReactNode}</FormMessage></FormItem>)}/></div>
                
                <Button type="submit" className="w-full md:w-auto" disabled={isSubmittingOrgSettings || isLoadingOrgData || (!orgForm.formState.isDirty && !orgForm.watch('presidentImageFile') && !orgForm.watch('secretaryImageFile') && !orgForm.watch('coverImageFile')) || !orgForm.formState.isValid}>
                  {isSubmittingOrgSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSubmittingOrgSettings ? "Saving Settings..." : "Save All Organization Settings"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Advisory Board Configuration Section */}
        <Card className="shadow-lg max-w-4xl mx-auto mt-8">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl">Advisory Board Configuration</CardTitle>
                        <ShadCNCardDescription>Manage the members of your organization's advisory board.</ShadCNCardDescription>
                    </div>
                    <Button onClick={() => openAdvisoryMemberFormDialog('add')} size="sm">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Member
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoadingAdvisoryMembers ? (
                  <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
                ) : advisoryMembers.length === 0 ? (
                  <Alert><AlertCircle className="h-4 w-4"/><ShadCNAlertTitle>No Members</ShadCNAlertTitle><AlertDescription>No advisory board members added yet.</AlertDescription></Alert>
                ) : (
                  <ul className="space-y-3">
                    {advisoryMembers.map(member => (
                      <li key={member.id} className="flex items-center justify-between p-3 border rounded-md bg-card hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10"><AvatarImage src={member.imageUrl || `https://placehold.co/40x40.png?text=${member.name.charAt(0)}`} alt={member.name} data-ai-hint="person portrait"/><AvatarFallback>{member.name.charAt(0)}</AvatarFallback></Avatar>
                          <div><p className="font-medium text-sm">{member.name}</p><p className="text-xs text-muted-foreground">{member.title}</p></div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openAdvisoryMemberFormDialog('edit', member)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => confirmDeleteAdvisoryMember(member)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
            </CardContent>
        </Card>


        {/* Crop Dialogs for Org Settings */}
        {imageToCropSrcPresident && (<ImageCropDialog isOpen={isPresidentCropDialogOpen} onClose={() => {setIsPresidentCropDialogOpen(false); setImageToCropSrcPresident(null); if (presidentFileInputRef.current) presidentFileInputRef.current.value = "";}} imageSrc={imageToCropSrcPresident} onCropComplete={handlePresidentCropComplete} aspectRatio={1} targetWidth={150} targetHeight={150}/>)}
        {imageToCropSrcSecretary && (<ImageCropDialog isOpen={isSecretaryCropDialogOpen} onClose={() => {setIsSecretaryCropDialogOpen(false); setImageToCropSrcSecretary(null); if (secretaryFileInputRef.current) secretaryFileInputRef.current.value = "";}} imageSrc={imageToCropSrcSecretary} onCropComplete={handleSecretaryCropComplete} aspectRatio={1} targetWidth={150} targetHeight={150}/>)}
        {imageToCropSrcCover && (<ImageCropDialog isOpen={isCoverCropDialogOpen} onClose={() => {setIsCoverCropDialogOpen(false); setImageToCropSrcCover(null); if (coverFileInputRef.current) coverFileInputRef.current.value = "";}} imageSrc={imageToCropSrcCover} onCropComplete={handleCoverCropComplete} aspectRatio={1200 / 500} targetWidth={1200} targetHeight={500}/>)}

        {/* Advisory Member Add/Edit Dialog */}
        <Dialog open={isAdvisoryMemberFormDialogOpen} onOpenChange={(open) => { if (!open) { setEditingAdvisoryMember(null); setAdvisoryImageFileToSubmit(undefined); } setIsAdvisoryMemberFormDialogOpen(open); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{advisoryMemberFormType === 'add' ? 'Add New' : 'Edit'} Advisory Member</DialogTitle></DialogHeader>
            <Form {...advisoryMemberForm}>
              <form onSubmit={advisoryMemberForm.handleSubmit(onAdvisoryMemberFormSubmit)} className="space-y-4 py-2">
                <FormField control={advisoryMemberForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} disabled={isSubmittingAdvisoryMember} placeholder="Full name"/></FormControl><FormMessage /></FormItem>)} />
                <FormField control={advisoryMemberForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} disabled={isSubmittingAdvisoryMember} placeholder="e.g., Chief Strategic Advisor"/></FormControl><FormMessage /></FormItem>)} />
                <FormField
                    control={advisoryMemberForm.control}
                    name="imageFile"
                    render={() => ( // field prop is not used directly by custom Input
                      <FormItem>
                        <FormLabel htmlFor="advisoryMemberImageFile">Member Picture</FormLabel>
                        {advisoryMemberImagePreview && (<div className="mt-2 mb-2 w-24 h-24 relative rounded-md overflow-hidden border"><Image src={advisoryMemberImagePreview} alt="Member preview" layout="fill" objectFit="cover" data-ai-hint="person portrait"/></div>)}
                        <FormControl><Input id="advisoryMemberImageFile" type="file" accept="image/png, image/jpeg, image/gif" onChange={handleAdvisoryFileChange} className="block w-full text-sm" disabled={isSubmittingAdvisoryMember} ref={advisoryMemberImageFileInputRef}/></FormControl>
                        <FormDescription>Upload a picture (150x150px, 1:1 aspect ratio recommended).</FormDescription>
                        {advisoryMemberImagePreview && advisoryMemberFormType === 'edit' && editingAdvisoryMember?.imageUrl && (
                            <Button type="button" variant="link" size="sm" className="text-destructive p-0 h-auto mt-1" onClick={handleRemoveAdvisoryMemberImage} disabled={isSubmittingAdvisoryMember}>Remove current image</Button>
                        )}
                        <FormMessage>{advisoryMemberForm.formState.errors.imageFile?.message as React.ReactNode}</FormMessage>
                      </FormItem>
                    )}
                  />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {setIsAdvisoryMemberFormDialogOpen(false); setEditingAdvisoryMember(null); setAdvisoryImageFileToSubmit(undefined);}} disabled={isSubmittingAdvisoryMember}>Cancel</Button>
                  <Button type="submit" disabled={isSubmittingAdvisoryMember || !advisoryMemberForm.formState.isValid || (!advisoryMemberForm.formState.isDirty && advisoryImageFileToSubmit === undefined) }>
                    {isSubmittingAdvisoryMember ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />} {advisoryMemberFormType === 'add' ? 'Add' : 'Update'} Member
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>


        {/* Crop Dialog for Advisory Board Member Image */}
        {imageToCropSrcAdvisory && (
          <ImageCropDialog
            isOpen={isAdvisoryCropDialogOpen}
            onClose={() => {
              setIsAdvisoryCropDialogOpen(false);
              setImageToCropSrcAdvisory(null);
              if (advisoryMemberImageFileInputRef.current) advisoryMemberImageFileInputRef.current.value = "";
            }}
            imageSrc={imageToCropSrcAdvisory}
            onCropComplete={handleAdvisoryCropComplete}
            aspectRatio={1} targetWidth={150} targetHeight={150}
          />
        )}
        
        {/* Delete Advisory Member Confirmation */}
        {advisoryMemberToDelete && (
          <AlertDialog open={!!advisoryMemberToDelete} onOpenChange={(open) => !open && setAdvisoryMemberToDelete(null)}>
            <ShadCNAlertDialogContentUI>
              <ShadCNAlertDialogHeaderUI><ShadCNAlertDialogTitleUI>Delete Advisory Member?</ShadCNAlertDialogTitleUI></ShadCNAlertDialogHeaderUI>
              <ShadCNAlertDialogDescriptionUI>Are you sure you want to delete {advisoryMemberToDelete.name}? This action cannot be undone and will remove their image.</ShadCNAlertDialogDescriptionUI>
              <ShadCNAlertDialogFooterUI>
                <AlertDialogCancel onClick={() => setAdvisoryMemberToDelete(null)} disabled={isDeletingAdvisoryMember}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAdvisoryMember} className="bg-destructive hover:bg-destructive/90" disabled={isDeletingAdvisoryMember}>
                  {isDeletingAdvisoryMember && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                </AlertDialogAction>
              </ShadCNAlertDialogFooterUI>
            </ShadCNAlertDialogContentUI>
          </AlertDialog>
        )}

      </main>
    </AppShell>
  );
}
