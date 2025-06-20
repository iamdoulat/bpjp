// src/app/admin/election-vote/candidate-management/page.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, List, Users, Shield, Award, Edit, Trash2, ServerCrash, AlertCircle, Save, X, BookOpenCheck } from "lucide-react";
import {
  addCandidate,
  getCandidatesByPosition,
  updateCandidate,
  deleteCandidate,
  type ElectionCandidateData,
  type NewCandidateInput,
  type CandidatePosition,
  type UpdateCandidateInput,
} from "@/services/electionCandidateService";
import { getElectionControlSettings, updateElectionControlSettings, type ElectionControlSettings } from "@/services/electionControlService";
import ImageCropDialog from "@/components/ui/image-crop-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription as ShadCNDialogDescription, 
  DialogFooter,
  DialogHeader,
  DialogTitle as ShadCNDialogTitle, 
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as ShadCNAlertDialogContent,
  AlertDialogDescription as ShadCNAlertDialogDescription,
  AlertDialogFooter as ShadCNAlertDialogFooter,
  AlertDialogHeader as ShadCNAlertDialogHeader,
  AlertDialogTitle as ShadCNAlertDialogTitle,
} from "@/components/ui/alert-dialog";


const addCandidateFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters.").max(100),
  electionSymbol: z.string().min(2, "Symbol must be at least 2 characters.").max(50),
});
type AddCandidateFormValues = z.infer<typeof addCandidateFormSchema>;


const editCandidateFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters.").max(100).optional(),
  electionSymbol: z.string().min(2, "Symbol must be at least 2 characters.").max(50).optional(),
});
type EditCandidateFormValues = z.infer<typeof editCandidateFormSchema>;

const voteInstructionsFormSchema = z.object({
  instructions: z.string().max(5000, "Instructions cannot exceed 5000 characters.").optional().or(z.literal('')),
});
type VoteInstructionsFormValues = z.infer<typeof voteInstructionsFormSchema>;


interface CandidateFormProps {
  position: CandidatePosition;
  form: UseFormReturn<AddCandidateFormValues>; 
  onSubmit: (data: AddCandidateFormValues, position: CandidatePosition, imageFile?: File) => Promise<void>;
  isSubmitting: boolean;
  isLoadingCandidates: boolean;
}

const CandidateSectionForm: React.FC<CandidateFormProps> = ({
  position,
  form,
  onSubmit,
  isSubmitting,
  isLoadingCandidates,
}) => {
  const [imageToCropSrc, setImageToCropSrc] = React.useState<string | null>(null);
  const [croppedImageFile, setCroppedImageFile] = React.useState<File | null>(null);
  const [croppedImagePreview, setCroppedImagePreview] = React.useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
    const newCroppedFile = new File([croppedBlob], `candidate_image_${position}.png`, { type: "image/png" });
    setCroppedImageFile(newCroppedFile);
    setCroppedImagePreview(URL.createObjectURL(croppedBlob));
    setIsCropDialogOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearImagePreview = () => {
    setCroppedImageFile(null);
    setCroppedImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmitWithImage = (data: AddCandidateFormValues) => {
    onSubmit(data, position, croppedImageFile || undefined).then(() => {
        form.reset(); 
        clearImagePreview(); 
    }).catch(err => {
    });
  };


  return (
  <Card className="shadow-md mb-6">
    <CardHeader>
      <div className="flex items-center gap-2">
        {position === "President" ? <Shield className="h-5 w-5 text-green-600" /> : <Award className="h-5 w-5 text-green-600" />}
        <CardTitle className="text-lg">{position} Candidate Nomination</CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmitWithImage)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Candidate Name</FormLabel>
                <FormControl><Input placeholder="Full Name" {...field} disabled={isSubmitting || isLoadingCandidates} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="electionSymbol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Election Symbol</FormLabel>
                <FormControl><Input placeholder="e.g., Star, Book" {...field} disabled={isSubmitting || isLoadingCandidates} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Candidate Picture (1:1)</FormLabel>
            <FormControl>
              <Input
                type="file"
                accept="image/png, image/jpeg, image/gif"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                disabled={isSubmitting || isLoadingCandidates}
                ref={fileInputRef}
              />
            </FormControl>
            {croppedImagePreview && (
              <div className="mt-4 relative w-32 h-32 border rounded-md overflow-hidden">
                <Image src={croppedImagePreview} alt="Candidate preview" layout="fill" objectFit="cover" data-ai-hint="person portrait" />
                  <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-6 w-6 bg-black/30 text-white hover:bg-black/50" onClick={clearImagePreview} disabled={isSubmitting || isLoadingCandidates}>
                    <Trash2 className="h-3.5 w-3.5"/>
                  </Button>
              </div>
            )}
            <FormDescription>Upload a picture (150x150px recommended).</FormDescription>
          </FormItem>
          <Button type="submit" disabled={isSubmitting || isLoadingCandidates || !form.formState.isValid}>
            {(isSubmitting || isLoadingCandidates) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add {position} Candidate
          </Button>
        </form>
      </Form>
      {imageToCropSrc && (
        <ImageCropDialog
          isOpen={isCropDialogOpen}
          onClose={() => { setIsCropDialogOpen(false); setImageToCropSrc(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
          imageSrc={imageToCropSrc}
          onCropComplete={handleCropComplete}
          aspectRatio={1} targetWidth={150} targetHeight={150}
        />
      )}
    </CardContent>
  </Card>
)};

interface CandidateListProps {
  position: CandidatePosition;
  candidates: ElectionCandidateData[];
  isLoading: boolean;
  error: string | null;
  onEdit: (candidate: ElectionCandidateData) => void;
  onDelete: (candidate: ElectionCandidateData) => void;
  isProcessingAction: boolean; 
}

const CandidateSectionList: React.FC<CandidateListProps> = ({ position, candidates, isLoading, error, onEdit, onDelete, isProcessingAction }) => {
  const getInitials = (name?: string) => name ? name.substring(0, 2).toUpperCase() : "C";
  
  return (
  <Card className="shadow-md">
    <CardHeader>
        <div className="flex items-center gap-2">
         <List className="h-5 w-5 text-muted-foreground" />
         <CardTitle className="text-lg">{position} Candidates List</CardTitle>
        </div>
    </CardHeader>
    <CardContent>
      {isLoading && (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 border rounded-md">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
              <div className="flex gap-2"><Skeleton className="h-8 w-8 rounded-md" /><Skeleton className="h-8 w-8 rounded-md" /></div>
            </div>
          ))}
        </div>
      )}
      {error && !isLoading && (
        <Alert variant="destructive"><ServerCrash className="h-4 w-4" /><ShadCNAlertTitle>Error Loading Candidates</ShadCNAlertTitle><AlertDescription>{error}</AlertDescription></Alert>
      )}
      {!isLoading && !error && candidates.length === 0 && (
        <Alert><AlertCircle className="h-4 w-4" /><ShadCNAlertTitle>No Candidates</ShadCNAlertTitle><AlertDescription>No candidates nominated for {position} yet.</AlertDescription></Alert>
      )}
      {!isLoading && !error && candidates.length > 0 && (
        <ul className="space-y-3">
          {candidates.map(candidate => (
            <li key={candidate.id} className="flex items-center justify-between p-3 border rounded-md shadow-sm bg-card hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={candidate.imageUrl || `https://placehold.co/150x150.png?text=${getInitials(candidate.name)}`} alt={candidate.name} data-ai-hint="person portrait"/>
                  <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{candidate.name}</p>
                  <p className="text-xs text-muted-foreground">Symbol: {candidate.electionSymbol}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onEdit(candidate)} disabled={isProcessingAction}><Edit className="h-4 w-4" /></Button>
                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => onDelete(candidate)} disabled={isProcessingAction}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
)};


export default function CandidateManagementPage() {
  const { toast } = useToast();
  const [isSubmittingPresidentAdd, setIsSubmittingPresidentAdd] = React.useState(false);
  const [isSubmittingSecretaryAdd, setIsSubmittingSecretaryAdd] = React.useState(false);
  const [presidentCandidates, setPresidentCandidates] = React.useState<ElectionCandidateData[]>([]);
  const [secretaryCandidates, setSecretaryCandidates] = React.useState<ElectionCandidateData[]>([]);
  const [loadingPresidentList, setLoadingPresidentList] = React.useState(true);
  const [loadingSecretaryList, setLoadingSecretaryList] = React.useState(true);
  const [errorPresidentList, setErrorPresidentList] = React.useState<string | null>(null);
  const [errorSecretaryList, setErrorSecretaryList] = React.useState<string | null>(null);

  const [editingCandidate, setEditingCandidate] = React.useState<ElectionCandidateData | null>(null);
  const [isEditCandidateDialogOpen, setIsEditCandidateDialogOpen] = React.useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = React.useState(false);
  const [editDialogImageToCropSrc, setEditDialogImageToCropSrc] = React.useState<string | null>(null);
  const [isEditDialogCropOpen, setIsEditDialogCropOpen] = React.useState(false);
  const [editDialogCroppedImageFile, setEditDialogCroppedImageFile] = React.useState<File | null>(null);
  const [editDialogImagePreview, setEditDialogImagePreview] = React.useState<string | null>(null); 
  const [removeCurrentImageInEdit, setRemoveCurrentImageInEdit] = React.useState(false);
  const editDialogFileInputRef = React.useRef<HTMLInputElement>(null);

  const [candidateToDelete, setCandidateToDelete] = React.useState<ElectionCandidateData | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const [voteInstructions, setVoteInstructions] = React.useState("");
  const [isLoadingInstructions, setIsLoadingInstructions] = React.useState(true);
  const [isSubmittingInstructions, setIsSubmittingInstructions] = React.useState(false);


  const presidentAddForm = useForm<AddCandidateFormValues>({ resolver: zodResolver(addCandidateFormSchema), defaultValues: { name: "", electionSymbol: "" } });
  const secretaryAddForm = useForm<AddCandidateFormValues>({ resolver: zodResolver(addCandidateFormSchema), defaultValues: { name: "", electionSymbol: "" } });
  
  const editCandidateForm = useForm<EditCandidateFormValues>({
    resolver: zodResolver(editCandidateFormSchema),
    defaultValues: { name: "", electionSymbol: "" },
  });

  const instructionsForm = useForm<VoteInstructionsFormValues>({
    resolver: zodResolver(voteInstructionsFormSchema),
    defaultValues: { instructions: "" },
  });

  const fetchCandidates = React.useCallback(async (position: CandidatePosition) => {
    const setLoading = position === "President" ? setLoadingPresidentList : setLoadingSecretaryList;
    const setError = position === "President" ? setErrorPresidentList : setErrorSecretaryList;
    const setCandidates = position === "President" ? setPresidentCandidates : setSecretaryCandidates;
    
    setLoading(true);
    setError(null);
    try {
      const fetched = await getCandidatesByPosition(position);
      setCandidates(fetched);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : `Could not load ${position} candidates.`;
      setError(errorMessage);
      toast({ title: `Error Loading ${position} Candidates`, description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchCandidates("President");
    fetchCandidates("GeneralSecretary");

    async function fetchInstructions() {
      setIsLoadingInstructions(true);
      try {
        const settings = await getElectionControlSettings();
        instructionsForm.setValue("instructions", settings.voteInstructions || "");
        setVoteInstructions(settings.voteInstructions || "");
      } catch (e) {
        toast({ title: "Error Loading Instructions", description: (e as Error).message, variant: "destructive" });
      } finally {
        setIsLoadingInstructions(false);
      }
    }
    fetchInstructions();
  }, [fetchCandidates, instructionsForm, toast]);

  const onSubmitAddCandidate = async (data: AddCandidateFormValues, position: CandidatePosition, imageFile?: File) => {
    const setIsSubmitting = position === "President" ? setIsSubmittingPresidentAdd : setIsSubmittingSecretaryAdd;
    setIsSubmitting(true);
    try {
      const candidateInput: NewCandidateInput = { ...data, position, imageFile: imageFile || null };
      await addCandidate(candidateInput);
      toast({ title: "Candidate Added", description: `${data.name} has been added as a ${position} candidate.` });
      fetchCandidates(position); 
    } catch (e) {
      toast({ title: "Error Adding Candidate", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditDialog = (candidate: ElectionCandidateData) => {
    setEditingCandidate(candidate);
    editCandidateForm.reset({ name: candidate.name, electionSymbol: candidate.electionSymbol });
    setEditDialogImagePreview(candidate.imageUrl || null); 
    setEditDialogCroppedImageFile(null); 
    setRemoveCurrentImageInEdit(false);
    setIsEditCandidateDialogOpen(true);
  };

  const handleEditDialogFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditDialogImageToCropSrc(reader.result as string);
        setIsEditDialogCropOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditDialogCropComplete = (croppedBlob: Blob) => {
    const newCroppedFile = new File([croppedBlob], "edited_candidate_image.png", { type: "image/png" });
    setEditDialogCroppedImageFile(newCroppedFile);
    setEditDialogImagePreview(URL.createObjectURL(croppedBlob)); 
    setRemoveCurrentImageInEdit(false); 
    setIsEditDialogCropOpen(false);
    if (editDialogFileInputRef.current) editDialogFileInputRef.current.value = "";
  };
  
  const handleRemoveCurrentImageInEditDialog = () => {
    setRemoveCurrentImageInEdit(true);
    setEditDialogImagePreview(null); 
    setEditDialogCroppedImageFile(null); 
    if (editDialogFileInputRef.current) editDialogFileInputRef.current.value = "";
  };

  const onEditCandidateFormSubmit = async (data: EditCandidateFormValues) => {
    if (!editingCandidate) return;
    setIsSubmittingEdit(true);
    try {
      const updateData: UpdateCandidateInput = {};
      if (data.name && data.name !== editingCandidate.name) updateData.name = data.name;
      if (data.electionSymbol && data.electionSymbol !== editingCandidate.electionSymbol) updateData.electionSymbol = data.electionSymbol;

      await updateCandidate(
        editingCandidate.id,
        updateData,
        removeCurrentImageInEdit ? null : (editDialogCroppedImageFile || undefined), 
        editingCandidate.imagePath 
      );
      toast({ title: "Candidate Updated", description: `${data.name || editingCandidate.name}'s details updated.` });
      fetchCandidates(editingCandidate.position);
      setIsEditCandidateDialogOpen(false);
    } catch (e) {
      toast({ title: "Error Updating Candidate", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleOpenDeleteDialog = (candidate: ElectionCandidateData) => {
    setCandidateToDelete(candidate);
    setIsDeleteConfirmOpen(true);
  };

  const executeDeleteCandidate = async () => {
    if (!candidateToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCandidate(candidateToDelete.id);
      toast({ title: "Candidate Deleted", description: `${candidateToDelete.name} removed.` });
      fetchCandidates(candidateToDelete.position);
      setIsDeleteConfirmOpen(false);
    } catch (e) {
      toast({ title: "Error Deleting Candidate", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setCandidateToDelete(null);
    }
  };

  const onInstructionsSubmit = async (data: VoteInstructionsFormValues) => {
    setIsSubmittingInstructions(true);
    try {
      await updateElectionControlSettings({ voteInstructions: data.instructions || null });
      setVoteInstructions(data.instructions || "");
      toast({ title: "Instructions Saved", description: "Voting instructions have been updated." });
    } catch (e) {
      toast({ title: "Error Saving Instructions", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsSubmittingInstructions(false);
    }
  };


  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-8 overflow-auto pb-20 md:pb-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-headline font-semibold">Candidate Management</h1>
            <p className="text-muted-foreground text-sm">
              Add, view, and manage candidate nominations for elections.
            </p>
          </div>
        </div>

        <section>
          <CandidateSectionForm
            position="President"
            form={presidentAddForm}
            onSubmit={onSubmitAddCandidate}
            isSubmitting={isSubmittingPresidentAdd}
            isLoadingCandidates={loadingPresidentList}
          />
          <CandidateSectionList
            position="President"
            candidates={presidentCandidates}
            isLoading={loadingPresidentList}
            error={errorPresidentList}
            onEdit={handleOpenEditDialog}
            onDelete={handleOpenDeleteDialog}
            isProcessingAction={isSubmittingEdit || isDeleting}
          />
        </section>

        <section className="mt-10">
          <CandidateSectionForm
            position="GeneralSecretary"
            form={secretaryAddForm}
            onSubmit={onSubmitAddCandidate}
            isSubmitting={isSubmittingSecretaryAdd}
            isLoadingCandidates={loadingSecretaryList}
          />
          <CandidateSectionList
            position="GeneralSecretary"
            candidates={secretaryCandidates}
            isLoading={loadingSecretaryList}
            error={errorSecretaryList}
            onEdit={handleOpenEditDialog}
            onDelete={handleOpenDeleteDialog}
            isProcessingAction={isSubmittingEdit || isDeleting}
          />
        </section>

        {/* Vote Instructions Section */}
        <section className="mt-10">
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpenCheck className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg">Voting Instructions</CardTitle>
              </div>
              <CardDescription>
                Provide instructions or guidelines for voters. This text will appear on the public voting page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingInstructions ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <Form {...instructionsForm}>
                  <form onSubmit={instructionsForm.handleSubmit(onInstructionsSubmit)} className="space-y-6">
                    <FormField
                      control={instructionsForm.control}
                      name="instructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instructions Text</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter voting instructions here..."
                              className="resize-y min-h-[150px]"
                              {...field}
                              disabled={isSubmittingInstructions}
                            />
                          </FormControl>
                          <FormDescription>Max 5000 characters. This will be displayed on the public voting page.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isSubmittingInstructions || !instructionsForm.formState.isDirty}>
                      {isSubmittingInstructions && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Instructions
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </section>


        {editingCandidate && (
          <Dialog open={isEditCandidateDialogOpen} onOpenChange={(open) => {
            if (!open) setEditingCandidate(null); 
            setIsEditCandidateDialogOpen(open);
          }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <ShadCNDialogTitle>Edit Candidate: {editingCandidate.name}</ShadCNDialogTitle>
                <ShadCNDialogDescription>Update the details for this candidate.</ShadCNDialogDescription>
              </DialogHeader>
              <Form {...editCandidateForm}>
                <form onSubmit={editCandidateForm.handleSubmit(onEditCandidateFormSubmit)} className="space-y-4 py-2 pb-4">
                  <FormField control={editCandidateForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Candidate Name</FormLabel><FormControl><Input {...field} disabled={isSubmittingEdit} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={editCandidateForm.control} name="electionSymbol" render={({ field }) => (
                    <FormItem><FormLabel>Election Symbol</FormLabel><FormControl><Input {...field} disabled={isSubmittingEdit} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormItem>
                    <FormLabel>Candidate Picture (1:1)</FormLabel>
                    {(editDialogImagePreview || (!removeCurrentImageInEdit && editingCandidate.imageUrl)) && (
                      <div className="mt-2 mb-2 w-32 h-32 relative rounded-md overflow-hidden border">
                        <Image src={editDialogImagePreview || editingCandidate.imageUrl!} alt="Candidate preview" layout="fill" objectFit="cover" data-ai-hint="person portrait"/>
                      </div>
                    )}
                    {!editDialogImagePreview && removeCurrentImageInEdit && (
                        <p className="text-sm text-muted-foreground">Current image will be removed.</p>
                    )}
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/png, image/jpeg, image/gif"
                        onChange={handleEditDialogFileChange}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        disabled={isSubmittingEdit}
                        ref={editDialogFileInputRef}
                      />
                    </FormControl>
                    {editingCandidate.imageUrl && !editDialogCroppedImageFile && !removeCurrentImageInEdit && (
                        <Button type="button" variant="outline" size="sm" className="mt-1" onClick={handleRemoveCurrentImageInEditDialog} disabled={isSubmittingEdit}>
                            <X className="mr-1.5 h-3.5 w-3.5"/> Remove Current Image
                        </Button>
                    )}
                    <FormDescription>Upload a new picture (150x150px), or remove the current one.</FormDescription>
                  </FormItem>
                  <DialogFooter className="pt-4">
                    <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmittingEdit}>Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmittingEdit || (!editCandidateForm.formState.isDirty && !editDialogCroppedImageFile && !removeCurrentImageInEdit) || !editCandidateForm.formState.isValid}>
                      {isSubmittingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}

        {editDialogImageToCropSrc && (
          <ImageCropDialog
            isOpen={isEditDialogCropOpen}
            onClose={() => { setIsEditDialogCropOpen(false); setEditDialogImageToCropSrc(null); if (editDialogFileInputRef.current) editDialogFileInputRef.current.value = ""; }}
            imageSrc={editDialogImageToCropSrc}
            onCropComplete={handleEditDialogCropComplete}
            aspectRatio={1} targetWidth={150} targetHeight={150}
          />
        )}

        {candidateToDelete && (
          <AlertDialog open={isDeleteConfirmOpen} onOpenChange={(open) => { if(!open) setCandidateToDelete(null); setIsDeleteConfirmOpen(open);}}>
            <ShadCNAlertDialogContent>
              <ShadCNAlertDialogHeader>
                <ShadCNAlertDialogTitle>Confirm Deletion</ShadCNAlertDialogTitle>
                <ShadCNAlertDialogDescription>
                  Are you sure you want to delete candidate "{candidateToDelete.name}" for {candidateToDelete.position}?
                  Their image will also be removed. This action cannot be undone.
                </ShadCNAlertDialogDescription>
              </ShadCNAlertDialogHeader>
              <ShadCNAlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsDeleteConfirmOpen(false)} disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={executeDeleteCandidate} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                </AlertDialogAction>
              </ShadCNAlertDialogFooter>
            </ShadCNAlertDialogContent>
          </AlertDialog>
        )}

      </main>
    </AppShell>
  );
}
