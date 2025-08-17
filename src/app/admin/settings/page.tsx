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
import { Loader2, Save, Settings, AlertCircle, Users, PlusCircle, Edit2, Trash2, UploadCloud, X } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import { getOrganizationSettings, saveOrganizationSettings, type OrganizationSettingsData } from "@/services/organizationSettingsService";
import { getAdvisoryBoardMembers, addAdvisoryBoardMember, updateAdvisoryBoardMember, deleteAdvisoryBoardMember, type AdvisoryBoardMemberData, type NewAdvisoryBoardMemberInput, type UpdateAdvisoryBoardMemberInput } from "@/services/advisoryBoardService";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle as ShadCNAlertTitle, AlertDescription as ShadCNAlertDescription } from "@/components/ui/alert";
import ImageCropDialog from "@/components/ui/image-crop-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  presidentImageFile: z.instanceof(File).optional().nullable(),
  secretaryName: z.string().min(3, { message: "General Secretary's name must be at least 3 characters." }).max(100),
  secretaryMobileNumber: z.string().regex(/^$|^[+]?[0-9\s-()]{7,20}$/, { message: "Invalid secretary's mobile number." }).optional().or(z.literal('')),
  secretaryImageFile: z.instanceof(File).optional().nullable(),
  appName: z.string().min(1, { message: "App Name cannot be empty." }).max(50),
  coverImageFile: z.instanceof(File).optional().nullable(),
});
type OrganizationSettingsFormValues = z.infer<typeof organizationSettingsSchema>;

const advisoryMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  title: z.string().min(2, "Title must be at least 2 characters.").max(100),
  imageFile: z.instanceof(File).optional().nullable(),
});
type AdvisoryMemberFormValues = z.infer<typeof advisoryMemberSchema>;


export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { appName, setAppNameState } = useAppContext();
  const [isSubmittingOrgSettings, setIsSubmittingOrgSettings] = React.useState(false);
  const [isLoadingData, setIsLoadingData] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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
  const [advisoryBoardMembers, setAdvisoryBoardMembers] = React.useState<AdvisoryBoardMemberData[]>([]);
  const [isLoadingAdvisory, setIsLoadingAdvisory] = React.useState(true);
  const [isAddingAdvisoryMember, setIsAddingAdvisoryMember] = React.useState(false);
  const [currentAdvisoryMemberToEdit, setCurrentAdvisoryMemberToEdit] = React.useState<AdvisoryBoardMemberData | null>(null);
  const [isEditAdvisoryDialogOpen, setIsEditAdvisoryDialogOpen] = React.useState(false);
  const [isDeletingAdvisoryMember, setIsDeletingAdvisoryMember] = React.useState(false);
  const [advisoryMemberToDelete, setAdvisoryMemberToDelete] = React.useState<AdvisoryBoardMemberData | null>(null);
  
  const [imageToCropSrcAdvisory, setImageToCropSrcAdvisory] = React.useState<string | null>(null);
  const [isAdvisoryCropDialogOpen, setIsAdvisoryCropDialogOpen] = React.useState(false);
  const [advisoryImageTargetField, setAdvisoryImageTargetField] = React.useState<'add' | 'edit'>('add');
  const [advisoryMemberImagePreview, setAdvisoryMemberImagePreview] = React.useState<string | null>(null);
  const advisoryImageFileInputRef = React.useRef<HTMLInputElement>(null);
  const editAdvisoryImageFileInputRef = React.useRef<HTMLInputElement>(null);


  const orgSettingsForm = useForm<OrganizationSettingsFormValues>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: { appName: appName },
    mode: "onChange",
  });

  const addAdvisoryMemberForm = useForm<AdvisoryMemberFormValues>({
    resolver: zodResolver(advisoryMemberSchema),
    defaultValues: { name: "", title: "", imageFile: null },
  });

  const editAdvisoryMemberForm = useForm<AdvisoryMemberFormValues>({
    resolver: zodResolver(advisoryMemberSchema),
    defaultValues: { name: "", title: "", imageFile: null },
  });
  
  const fetchAdvisoryBoardData = React.useCallback(async () => {
    setIsLoadingAdvisory(true);
    try {
      const members = await getAdvisoryBoardMembers();
      setAdvisoryBoardMembers(members);
    } catch (e) {
      toast({ title: "Error Loading Advisory Board", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingAdvisory(false);
    }
  }, [toast]);


  React.useEffect(() => {
    async function loadAllSettings() {
      setIsLoadingData(true);
      setError(null);
      try {
        const settings = await getOrganizationSettings();
        if (settings) {
          orgSettingsForm.reset({
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
          });
          if (settings.presidentImageURL) setPresidentPreview(settings.presidentImageURL);
          if (settings.secretaryImageURL) setSecretaryPreview(settings.secretaryImageURL);
          if (settings.coverImageUrl) setCoverPreview(settings.coverImageUrl);
          if (settings.appName) setAppNameState(settings.appName);
        } else {
           orgSettingsForm.reset({ ...orgSettingsForm.formState.defaultValues, appName: appName });
        }
        await fetchAdvisoryBoardData();
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Could not load settings.";
        setError(errorMessage);
        toast({ title: "Error Loading Settings", description: errorMessage, variant: "destructive" });
      } finally {
        setIsLoadingData(false);
      }
    }
    loadAllSettings();
  }, [orgSettingsForm, setAppNameState, appName, toast, fetchAdvisoryBoardData]);

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
    const croppedFile = new File([croppedBlob], "president_image.png", { type: "image/png" });
    orgSettingsForm.setValue("presidentImageFile", croppedFile, { shouldValidate: true, shouldDirty: true });
    setPresidentPreview(URL.createObjectURL(croppedBlob));
    setIsPresidentCropDialogOpen(false);
    if (presidentFileInputRef.current) {
      presidentFileInputRef.current.value = "";
    }
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
    const croppedFile = new File([croppedBlob], "secretary_image.png", { type: "image/png" });
    orgSettingsForm.setValue("secretaryImageFile", croppedFile, { shouldValidate: true, shouldDirty: true });
    setSecretaryPreview(URL.createObjectURL(croppedBlob));
    setIsSecretaryCropDialogOpen(false);
    if (secretaryFileInputRef.current) {
      secretaryFileInputRef.current.value = "";
    }
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
    const croppedFile = new File([croppedBlob], "cover_image.png", { type: "image/png" });
    orgSettingsForm.setValue("coverImageFile", croppedFile, { shouldValidate: true, shouldDirty: true });
    setCoverPreview(URL.createObjectURL(croppedBlob));
    setIsCoverCropDialogOpen(false);
    if (coverFileInputRef.current) {
      coverFileInputRef.current.value = "";
    }
  };

  async function onOrgSettingsSubmit(data: OrganizationSettingsFormValues) {
    setIsSubmittingOrgSettings(true);
    setError(null);
    try {
      const { presidentImageFile, secretaryImageFile, coverImageFile, ...settingsToSave } = data;
      await saveOrganizationSettings(settingsToSave, 
        presidentImageFile === undefined ? undefined : presidentImageFile, // Pass undefined if not changed
        secretaryImageFile === undefined ? undefined : secretaryImageFile,
        coverImageFile === undefined ? undefined : coverImageFile
      );
      if (data.appName) {
        setAppNameState(data.appName);
      }
      toast({ title: "Settings Saved!", description: "Organization settings have been successfully updated." });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(errorMessage);
      toast({ title: "Error Saving Settings", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmittingOrgSettings(false);
    }
  }
  
  // Advisory Member Image Handling
  const handleAdvisoryFileChange = (event: React.ChangeEvent<HTMLInputElement>, target: 'add' | 'edit') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCropSrcAdvisory(reader.result as string);
        setAdvisoryImageTargetField(target);
        setIsAdvisoryCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdvisoryCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], "advisory_member_image.png", { type: "image/png" });
    if (advisoryImageTargetField === 'add') {
      addAdvisoryMemberForm.setValue("imageFile", croppedFile, { shouldValidate: true, shouldDirty: true });
    } else if (advisoryImageTargetField === 'edit') {
      editAdvisoryMemberForm.setValue("imageFile", croppedFile, { shouldValidate: true, shouldDirty: true });
    }
    setAdvisoryMemberImagePreview(URL.createObjectURL(croppedBlob)); // For immediate UI update in form/dialog
    setIsAdvisoryCropDialogOpen(false);
    setImageToCropSrcAdvisory(null);
    if (advisoryImageTargetField === 'add' && advisoryImageFileInputRef.current) {
        advisoryImageFileInputRef.current.value = "";
    }
    if (advisoryImageTargetField === 'edit' && editAdvisoryImageFileInputRef.current) {
        editAdvisoryImageFileInputRef.current.value = "";
    }
  };
  
  const onAddAdvisoryMemberSubmit = async (data: AdvisoryMemberFormValues) => {
    setIsAddingAdvisoryMember(true);
    try {
      await addAdvisoryBoardMember({ name: data.name, title: data.title }, data.imageFile || undefined);
      toast({ title: "Advisory Member Added", description: `${data.name} has been added.` });
      addAdvisoryMemberForm.reset({ name: "", title: "", imageFile: null });
      setAdvisoryMemberImagePreview(null);
      fetchAdvisoryBoardData(); // Refresh list
    } catch (e) {
      toast({ title: "Error Adding Member", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsAddingAdvisoryMember(false);
    }
  };

  const openEditAdvisoryMemberDialog = (member: AdvisoryBoardMemberData) => {
    setCurrentAdvisoryMemberToEdit(member);
    editAdvisoryMemberForm.reset({ name: member.name, title: member.title, imageFile: undefined });
    setAdvisoryMemberImagePreview(member.imageUrl || null);
    setIsEditAdvisoryDialogOpen(true);
  };

  const onEditAdvisoryMemberSubmit = async (data: AdvisoryMemberFormValues) => {
    if (!currentAdvisoryMemberToEdit) return;
    setIsSubmittingOrgSettings(true); // Use general submitting state for edit dialog
    try {
      await updateAdvisoryBoardMember(currentAdvisoryMemberToEdit.id, 
        { name: data.name, title: data.title }, 
        data.imageFile // If imageFile is undefined, it means "keep existing". If null, it means "remove".
      );
      toast({ title: "Advisory Member Updated", description: `${data.name}'s details updated.` });
      setIsEditAdvisoryDialogOpen(false);
      setCurrentAdvisoryMemberToEdit(null);
      fetchAdvisoryBoardData();
    } catch (e) {
      toast({ title: "Error Updating Member", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsSubmittingOrgSettings(false);
    }
  };
  
  const handleRemoveAdvisoryImageEdit = () => {
    editAdvisoryMemberForm.setValue("imageFile", null, {shouldDirty: true}); // Signal removal
    setAdvisoryMemberImagePreview(null); // Clear preview
  };


  const confirmDeleteAdvisoryMember = (member: AdvisoryBoardMemberData) => {
    setAdvisoryMemberToDelete(member);
  };

  const executeDeleteAdvisoryMember = async () => {
    if (!advisoryMemberToDelete) return;
    setIsDeletingAdvisoryMember(true);
    try {
      await deleteAdvisoryBoardMember(advisoryMemberToDelete.id);
      toast({ title: "Advisory Member Deleted", description: `${advisoryMemberToDelete.name} removed.` });
      fetchAdvisoryBoardData();
      setAdvisoryMemberToDelete(null);
    } catch (e) {
      toast({ title: "Error Deleting Member", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsDeletingAdvisoryMember(false);
    }
  };

  const getInitials = (name?: string | null): string => {
    if (!name) return "AM";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[parts.length -1]) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };


  if (isLoadingData) { /* ... existing skeleton ... */ }

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        {/* ... Organization Settings Header and Form ... */}
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
            <Form {...orgSettingsForm}>
              <form onSubmit={orgSettingsForm.handleSubmit(onOrgSettingsSubmit)} className="space-y-8">
                 {/* ... All OrganizationSettingsFormFields ... */}
                 <FormField control={orgSettingsForm.control} name="appName" render={({ field }) => (<FormItem><FormLabel>Application Name (for Header)</FormLabel><FormControl><Input placeholder="Your Application Name" {...field} disabled={isSubmittingOrgSettings} /></FormControl><FormDescription>This name will be displayed in the application header.</FormDescription><FormMessage /></FormItem>)}/>
                <FormField control={orgSettingsForm.control} name="organizationName" render={({ field }) => (<FormItem><FormLabel>Organization Name</FormLabel><FormControl><Input placeholder="Your Organization's Official Name" {...field} disabled={isSubmittingOrgSettings} /></FormControl><FormDescription>Displayed on "About Us" and public areas.</FormDescription><FormMessage /></FormItem>)}/>
                <FormField control={orgSettingsForm.control} name="address" render={({ field }) => (<FormItem><FormLabel>Address</FormLabel><FormControl><Textarea placeholder="Full official address" className="resize-y min-h-[100px]" {...field} disabled={isSubmittingOrgSettings} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={orgSettingsForm.control} name="registrationNumber" render={({ field }) => (<FormItem><FormLabel>Registration Number (Optional)</FormLabel><FormControl><Input placeholder="e.g., 12345/AB/2024" {...field} value={field.value ?? ""} disabled={isSubmittingOrgSettings} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={orgSettingsForm.control} name="establishedYear" render={({ field }) => (<FormItem><FormLabel>Established Year (Optional)</FormLabel><FormControl><Input type="text" placeholder="e.g., 2010" {...field} value={field.value ?? ""} disabled={isSubmittingOrgSettings} maxLength={4} /></FormControl><FormDescription>The year the organization was established (4 digits).</FormDescription><FormMessage /></FormItem>)}/>
                <FormField control={orgSettingsForm.control} name="committeePeriod" render={({ field }) => (<FormItem><FormLabel>Committee Period (Optional)</FormLabel><FormControl><Input placeholder="e.g., 2025-2026" {...field} value={field.value ?? ""} disabled={isSubmittingOrgSettings} /></FormControl><FormDescription>The current committee's term period (e.g., 2025-2026).</FormDescription><FormMessage /></FormItem>)}/>
                <FormField control={orgSettingsForm.control} name="contactPersonName" render={({ field }) => (<FormItem><FormLabel>Contact Person Name</FormLabel><FormControl><Input placeholder="Full name" {...field} disabled={isSubmittingOrgSettings} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={orgSettingsForm.control} name="contactPersonCell" render={({ field }) => (<FormItem><FormLabel>Contact Person Cell</FormLabel><FormControl><Input type="tel" placeholder="+1 123 456 7890" {...field} value={field.value ?? ""} disabled={isSubmittingOrgSettings} /></FormControl><FormMessage /></FormItem>)}/>
                <FormField control={orgSettingsForm.control} name="contactEmail" render={({ field }) => (<FormItem><FormLabel>Contact Email ID</FormLabel><FormControl><Input type="email" placeholder="contact@example.com" {...field} disabled={isSubmittingOrgSettings} /></FormControl><FormMessage /></FormItem>)}/>
                
                {/* Cover Image Section */}
                <div className="space-y-4 p-4 border rounded-md"><h3 className="text-lg font-medium">Cover Image (for About Us page)</h3>
                  <FormField control={orgSettingsForm.control} name="coverImageFile" render={() => (
                    <FormItem>
                      <FormLabel htmlFor="coverImageFile">Cover Picture</FormLabel>
                      {coverPreview && (<div className="mt-2 mb-2 w-full aspect-[12/5] relative rounded-md overflow-hidden border"><Image src={coverPreview} alt="Cover preview" layout="fill" objectFit="cover" data-ai-hint="organization banner"/></div>)}
                      <FormControl><Input id="coverImageFile" type="file" accept="image/png, image/jpeg, image/gif" onChange={handleCoverFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isSubmittingOrgSettings} ref={coverFileInputRef} /></FormControl>
                      <FormDescription>Upload a cover image for the About Us page banner (recommended 1200x500px).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>

                {/* President Section */}
                <div className="space-y-4 p-4 border rounded-md"><h3 className="text-lg font-medium">President Information</h3>
                  <FormField control={orgSettingsForm.control} name="presidentName" render={({ field }) => (<FormItem><FormLabel>President's Name</FormLabel><FormControl><Input placeholder="Full name" {...field} disabled={isSubmittingOrgSettings} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={orgSettingsForm.control} name="presidentMobileNumber" render={({ field }) => (<FormItem><FormLabel>President's Mobile Number (Optional)</FormLabel><FormControl><Input type="tel" placeholder="+1 123 456 7890" {...field} value={field.value ?? ""} disabled={isSubmittingOrgSettings} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={orgSettingsForm.control} name="presidentImageFile" render={() => (
                    <FormItem>
                      <FormLabel htmlFor="presidentImageFile">President's Picture</FormLabel>
                      {presidentPreview && (<div className="mt-2 mb-2 w-32 h-32 relative rounded-md overflow-hidden border"><Image src={presidentPreview} alt="President preview" layout="fill" objectFit="cover" data-ai-hint="person portrait"/></div>)}
                      <FormControl><Input id="presidentImageFile" type="file" accept="image/png, image/jpeg, image/gif" onChange={handlePresidentFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isSubmittingOrgSettings} ref={presidentFileInputRef}/></FormControl>
                      <FormDescription>Upload a picture (150x150 recommended).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>

                {/* General Secretary Section */}
                 <div className="space-y-4 p-4 border rounded-md"><h3 className="text-lg font-medium">General Secretary Information</h3>
                  <FormField control={orgSettingsForm.control} name="secretaryName" render={({ field }) => (<FormItem><FormLabel>General Secretary's Name</FormLabel><FormControl><Input placeholder="Full name" {...field} disabled={isSubmittingOrgSettings} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={orgSettingsForm.control} name="secretaryMobileNumber" render={({ field }) => (<FormItem><FormLabel>General Secretary's Mobile Number (Optional)</FormLabel><FormControl><Input type="tel" placeholder="+1 123 456 7890" {...field} value={field.value ?? ""} disabled={isSubmittingOrgSettings} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={orgSettingsForm.control} name="secretaryImageFile" render={() => (
                    <FormItem>
                      <FormLabel htmlFor="secretaryImageFile">General Secretary's Picture</FormLabel>
                       {secretaryPreview && (<div className="mt-2 mb-2 w-32 h-32 relative rounded-md overflow-hidden border"><Image src={secretaryPreview} alt="Secretary preview" layout="fill" objectFit="cover" data-ai-hint="person portrait"/></div>)}
                      <FormControl><Input id="secretaryImageFile" type="file" accept="image/png, image/jpeg, image/gif" onChange={handleSecretaryFileChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isSubmittingOrgSettings} ref={secretaryFileInputRef}/></FormControl>
                       <FormDescription>Upload a picture (150x150 recommended).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
                
                <Button type="submit" className="w-full md:w-auto" disabled={isSubmittingOrgSettings || isLoadingData || (!orgSettingsForm.formState.isDirty && !orgSettingsForm.watch('presidentImageFile') && !orgSettingsForm.watch('secretaryImageFile') && !orgSettingsForm.watch('coverImageFile')) || !orgSettingsForm.formState.isValid}>
                  {isSubmittingOrgSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSubmittingOrgSettings ? "Saving..." : "Save Settings"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Advisory Board Configuration Section */}
        <Card className="shadow-lg max-w-4xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Advisory Board Configuration</CardTitle>
            <ShadCNCardDescription>
              Manage the members of your organization's advisory board.
            </ShadCNCardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add New Advisory Member Form */}
            <Card className="p-4 sm:p-6 bg-muted/20 border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center"><PlusCircle className="mr-2 h-5 w-5 text-primary"/> Add New Advisory Member</h3>
              <Form {...addAdvisoryMemberForm}>
                <form onSubmit={addAdvisoryMemberForm.handleSubmit(onAddAdvisoryMemberSubmit)} className="space-y-4"> 
                  <FormField control={addAdvisoryMemberForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Member Name</FormLabel><FormControl><Input placeholder="Full name" {...field} disabled={isAddingAdvisoryMember} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={addAdvisoryMemberForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Member Title</FormLabel><FormControl><Input placeholder="e.g., Chief Strategic Advisor" {...field} disabled={isAddingAdvisoryMember} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={addAdvisoryMemberForm.control} name="imageFile" render={() => (
                    <FormItem>
                      <FormLabel htmlFor="advisoryImageFileAdd">Member Picture</FormLabel>
                      {advisoryMemberImagePreview && advisoryImageTargetField === 'add' && (<div className="mt-2 mb-2 w-24 h-24 relative rounded-md overflow-hidden border"><Image src={advisoryMemberImagePreview} alt="Member preview" layout="fill" objectFit="cover" data-ai-hint="person portrait"/></div>)}
                      <FormControl><Input id="advisoryImageFileAdd" type="file" accept="image/png, image/jpeg, image/gif" onChange={(e) => handleAdvisoryFileChange(e, 'add')} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isAddingAdvisoryMember} ref={advisoryImageFileInputRef}/></FormControl>
                      <FormDescription>Upload a picture (150x150 recommended, 1:1 aspect ratio).</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <Button type="submit" disabled={isAddingAdvisoryMember || !addAdvisoryMemberForm.formState.isValid}>
                    {isAddingAdvisoryMember ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    Add Member
                  </Button>
                </form>
              </Form>
            </Card>

            {/* Current Advisory Board Members List */}
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/>Current Advisory Board Members</h3>
              {isLoadingAdvisory ? (
                <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : advisoryBoardMembers.length === 0 ? (
                <Alert><AlertCircle className="h-4 w-4"/><ShadCNAlertTitle>No Members</ShadCNAlertTitle><ShadCNAlertDescription>No advisory board members added yet.</ShadCNAlertDescription></Alert>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead>Picture</TableHead><TableHead>Name</TableHead><TableHead>Title</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {advisoryBoardMembers.map(member => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <Avatar className="h-10 w-10"><AvatarImage src={member.imageUrl || `https://placehold.co/40x40.png?text=${getInitials(member.name)}`} alt={member.name} data-ai-hint="person portrait"/><AvatarFallback>{getInitials(member.name)}</AvatarFallback></Avatar>
                          </TableCell>
                          <TableCell className="font-medium">{member.name}</TableCell>
                          <TableCell>{member.title}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEditAdvisoryMemberDialog(member)} disabled={isDeletingAdvisoryMember}><Edit2 className="h-4 w-4"/></Button>
                            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => confirmDeleteAdvisoryMember(member)} disabled={isDeletingAdvisoryMember}><Trash2 className="h-4 w-4"/></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Accordion Section */}
        <Card className="shadow-lg max-w-4xl mx-auto mt-8 text-center">
          <CardHeader className="text-center">
            <CardTitle>PREVIOUS COMMITTEE</CardTitle>
            <ShadCNCardDescription>
            Period - 2018-2026
            </ShadCNCardDescription>
          </CardHeader>
          <CardContent>
            <Accordion
              type="single"
              collapsible
              className="w-full"
              defaultValue="item-1"
            >
              <AccordionItem value="item-1">
                <AccordionTrigger>2025-2026</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    {/* President Profile */}
                    <div className="flex flex-col items-center text-center p-4 bg-muted/20 rounded-lg border">
                      <div className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-2 border-primary/40">
                        <Image src="https://placehold.co/150x150.png" alt="President 2025-2026" layout="fill" objectFit="cover" data-ai-hint="person portrait" />
                      </div>
                      <h4 className="text-lg font-semibold">মোহাম্মদ আবদুল্লাহ বিন হক</h4>
                      <p className="text-muted-foreground">President</p>
                    </div>
                    {/* Secretary Profile */}
                    <div className="flex flex-col items-center text-center p-4 bg-muted/20 rounded-lg border">
                      <div className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-2 border-primary/40">
                        <Image src="https://placehold.co/150x150.png" alt="General Secretary 2025-2026" layout="fill" objectFit="cover" data-ai-hint="person portrait" />
                      </div>
                      <h4 className="text-lg font-semibold">মোহাম্মদ আবু বকর সিদ্দিক</h4>
                      <p className="text-muted-foreground">General Secretary</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>2023-2024</AccordionTrigger>
                <AccordionContent>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    {/* President Profile */}
                    <div className="flex flex-col items-center text-center p-4 bg-muted/20 rounded-lg border">
                      <div className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-2 border-primary/40">
                        <Image src="https://placehold.co/150x150.png" alt="President 2023-2024" layout="fill" objectFit="cover" data-ai-hint="person portrait" />
                      </div>
                      <h4 className="text-lg font-semibold">মোঃ জহির চৌধুরী</h4>
                      <p className="text-muted-foreground">President</p>
                    </div>
                    {/* Secretary Profile */}
                    <div className="flex flex-col items-center text-center p-4 bg-muted/20 rounded-lg border">
                      <div className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-2 border-primary/40">
                        <Image src="https://placehold.co/150x150.png" alt="General Secretary 2023-2024" layout="fill" objectFit="cover" data-ai-hint="person portrait" />
                      </div>
                      <h4 className="text-lg font-semibold">আবু বক্কর</h4>
                      <p className="text-muted-foreground">General Secretary</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>2021-2022</AccordionTrigger>
                <AccordionContent>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    {/* President Profile */}
                    <div className="flex flex-col items-center text-center p-4 bg-muted/20 rounded-lg border">
                      <div className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-2 border-primary/40">
                        <Image src="https://placehold.co/150x150.png" alt="President 2021-2022" layout="fill" objectFit="cover" data-ai-hint="person portrait" />
                      </div>
                      <h4 className="text-lg font-semibold">মোঃ জহির চৌধুরী </h4>
                      <p className="text-muted-foreground">President</p>
                    </div>
                    {/* Secretary Profile */}
                    <div className="flex flex-col items-center text-center p-4 bg-muted/20 rounded-lg border">
                      <div className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-2 border-primary/40">
                        <Image src="https://placehold.co/150x150.png" alt="General Secretary 2021-2022" layout="fill" objectFit="cover" data-ai-hint="person portrait" />
                      </div>
                      <h4 className="text-lg font-semibold">নুর ইমরান ইমু তালুকদার</h4>
                      <p className="text-muted-foreground">General Secretary</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>2019-2020</AccordionTrigger>
                <AccordionContent>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    {/* President Profile */}
                    <div className="flex flex-col items-center text-center p-4 bg-muted/20 rounded-lg border">
                      <div className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-2 border-primary/40">
                        <Image src="https://placehold.co/150x150.png" alt="President 2019-2020" layout="fill" objectFit="cover" data-ai-hint="person portrait" />
                      </div>
                      <h4 className="text-lg font-semibold">মোঃ লোকমান হোসেন</h4>
                      <p className="text-muted-foreground">President</p>
                    </div>
                    {/* Secretary Profile */}
                    <div className="flex flex-col items-center text-center p-4 bg-muted/20 rounded-lg border">
                      <div className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-2 border-primary/40">
                        <Image src="https://placehold.co/150x150.png" alt="General Secretary 2019-2020" layout="fill" objectFit="cover" data-ai-hint="person portrait" />
                      </div>
                      <h4 className="text-lg font-semibold">নুর ইমরান ইমু তালুকদার</h4>
                      <p className="text-muted-foreground">General Secretary</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Edit Advisory Member Dialog */}
        {currentAdvisoryMemberToEdit && (
          <Dialog open={isEditAdvisoryDialogOpen} onOpenChange={(open) => {setIsEditAdvisoryDialogOpen(open); if (!open) { setAdvisoryMemberImagePreview(null); editAdvisoryMemberForm.reset(); setCurrentAdvisoryMemberToEdit(null);}}}>
            <DialogContent>
              <DialogHeader><DialogTitle>Edit Advisory Member: {currentAdvisoryMemberToEdit.name}</DialogTitle></DialogHeader>
              <Form {...editAdvisoryMemberForm}>
                <form onSubmit={editAdvisoryMemberForm.handleSubmit(onEditAdvisoryMemberSubmit)} className="space-y-4 py-2 pb-4">
                  <FormField control={editAdvisoryMemberForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Member Name</FormLabel><FormControl><Input {...field} disabled={isSubmittingOrgSettings} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={editAdvisoryMemberForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Member Title</FormLabel><FormControl><Input {...field} disabled={isSubmittingOrgSettings} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={editAdvisoryMemberForm.control} name="imageFile" render={() => (
                    <FormItem>
                      <FormLabel htmlFor="advisoryImageFileEdit">Member Picture</FormLabel>
                      {advisoryMemberImagePreview && (<div className="mt-2 mb-2 w-24 h-24 relative rounded-md overflow-hidden border"><Image src={advisoryMemberImagePreview} alt="Member preview" layout="fill" objectFit="cover" data-ai-hint="person portrait"/></div>)}
                      <FormControl><Input id="advisoryImageFileEdit" type="file" accept="image/png, image/jpeg, image/gif" onChange={(e) => handleAdvisoryFileChange(e, 'edit')} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" ref={editAdvisoryImageFileInputRef}/></FormControl>
                      <FormDescription>Upload new (150x150px) or <Button type="button" variant="link" size="sm" className="p-0 h-auto" onClick={handleRemoveAdvisoryImageEdit} disabled={!advisoryMemberImagePreview}>remove current</Button>.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmittingOrgSettings}>Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmittingOrgSettings || !editAdvisoryMemberForm.formState.isDirty || !editAdvisoryMemberForm.formState.isValid}>
                      {isSubmittingOrgSettings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Changes
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Advisory Member Confirmation Dialog */}
        {advisoryMemberToDelete && (
            <Dialog open={!!advisoryMemberToDelete} onOpenChange={(open) => !open && setAdvisoryMemberToDelete(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Confirm Deletion</DialogTitle><DialogDescription>Are you sure you want to delete advisory board member "{advisoryMemberToDelete.name}"? This action cannot be undone.</DialogDescription></DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAdvisoryMemberToDelete(null)} disabled={isDeletingAdvisoryMember}>Cancel</Button>
                        <Button variant="destructive" onClick={executeDeleteAdvisoryMember} disabled={isDeletingAdvisoryMember}>
                            {isDeletingAdvisoryMember && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
        
        {/* Image Crop Dialogs */}
        {imageToCropSrcPresident && ( <ImageCropDialog isOpen={isPresidentCropDialogOpen} onClose={() => { setIsPresidentCropDialogOpen(false); setImageToCropSrcPresident(null); if (presidentFileInputRef.current) presidentFileInputRef.current.value = ""; }} imageSrc={imageToCropSrcPresident} onCropComplete={handlePresidentCropComplete} aspectRatio={1} targetWidth={150} targetHeight={150}/>)}
        {imageToCropSrcSecretary && ( <ImageCropDialog isOpen={isSecretaryCropDialogOpen} onClose={() => { setIsSecretaryCropDialogOpen(false); setImageToCropSrcSecretary(null); if (secretaryFileInputRef.current) secretaryFileInputRef.current.value = ""; }} imageSrc={imageToCropSrcSecretary} onCropComplete={handleSecretaryCropComplete} aspectRatio={1} targetWidth={150} targetHeight={150}/>)}
        {imageToCropSrcCover && ( <ImageCropDialog isOpen={isCoverCropDialogOpen} onClose={() => { setIsCoverCropDialogOpen(false); setImageToCropSrcCover(null); if (coverFileInputRef.current) coverFileInputRef.current.value = ""; }} imageSrc={imageToCropSrcCover} onCropComplete={handleCoverCropComplete} aspectRatio={1200 / 500} targetWidth={1200} targetHeight={500}/>)}
        {imageToCropSrcAdvisory && ( <ImageCropDialog isOpen={isAdvisoryCropDialogOpen} onClose={() => { setIsAdvisoryCropDialogOpen(false); setImageToCropSrcAdvisory(null); if (advisoryImageFileInputRef.current) advisoryImageFileInputRef.current.value = ""; if (editAdvisoryImageFileInputRef.current) editAdvisoryImageFileInputRef.current.value = ""; }} imageSrc={imageToCropSrcAdvisory} onCropComplete={handleAdvisoryCropComplete} aspectRatio={1} targetWidth={150} targetHeight={150}/>)}
      </main>
    </AppShell>
  );
}
