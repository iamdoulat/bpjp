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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, List, Users, Shield, Award, Edit, Trash2, UploadCloud, ServerCrash, AlertCircle } from "lucide-react";
import { addCandidate, getCandidatesByPosition, type ElectionCandidateData, type NewCandidateInput, type CandidatePosition } from "@/services/electionCandidateService";
import ImageCropDialog from "@/components/ui/image-crop-dialog";
import { Timestamp } from "firebase/firestore";

const candidateFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters.").max(100),
  electionSymbol: z.string().min(2, "Symbol must be at least 2 characters.").max(50),
  imageFile: z.instanceof(File).optional().nullable(),
});
type CandidateFormValues = z.infer<typeof candidateFormSchema>;

interface CandidateFormProps {
  position: CandidatePosition;
  form: UseFormReturn<CandidateFormValues>;
  onSubmit: (data: CandidateFormValues, position: CandidatePosition) => Promise<void>;
  isSubmitting: boolean;
  croppedImagePreview: string | null;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  clearImagePreview: () => void;
}

const CandidateSectionForm: React.FC<CandidateFormProps> = ({
  position,
  form,
  onSubmit,
  isSubmitting,
  croppedImagePreview,
  handleFileChange,
  fileInputRef,
  clearImagePreview,
}) => (
  <Card className="shadow-md mb-6">
    <CardHeader>
      <div className="flex items-center gap-2">
        {position === "President" ? <Shield className="h-5 w-5 text-primary" /> : <Award className="h-5 w-5 text-primary" />}
        <CardTitle className="text-lg">{position} Candidate Nomination</CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => onSubmit(data, position))} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Candidate Name</FormLabel>
                <FormControl><Input placeholder="Full Name" {...field} disabled={isSubmitting} /></FormControl>
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
                <FormControl><Input placeholder="e.g., Star, Book" {...field} disabled={isSubmitting} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="imageFile"
            render={() => ( // field is not directly used here, custom handler
              <FormItem>
                <FormLabel>Candidate Picture (1:1)</FormLabel>
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
                  <div className="mt-4 relative w-32 h-32 border rounded-md overflow-hidden">
                    <Image src={croppedImagePreview} alt="Candidate preview" layout="fill" objectFit="cover" data-ai-hint="person portrait" />
                     <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-6 w-6 bg-black/30 text-white hover:bg-black/50" onClick={clearImagePreview} disabled={isSubmitting}>
                        <Trash2 className="h-3.5 w-3.5"/>
                     </Button>
                  </div>
                )}
                <FormDescription>Upload a picture (150x150px recommended).</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add {position} Candidate
          </Button>
        </form>
      </Form>
    </CardContent>
  </Card>
);

interface CandidateListProps {
  position: CandidatePosition;
  candidates: ElectionCandidateData[];
  isLoading: boolean;
  error: string | null;
  onEdit: (candidate: ElectionCandidateData) => void;
  onDelete: (candidate: ElectionCandidateData) => void;
}

const CandidateSectionList: React.FC<CandidateListProps> = ({ position, candidates, isLoading, error, onEdit, onDelete }) => {
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
                  <AvatarImage src={candidate.imageUrl || `https://placehold.co/150x150.png?text=${getInitials(candidate.name)}`} alt={candidate.name} data-ai-hint="person portrait" />
                  <AvatarFallback>{getInitials(candidate.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{candidate.name}</p>
                  <p className="text-xs text-muted-foreground">Symbol: {candidate.electionSymbol}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onEdit(candidate)}><Edit className="h-4 w-4" /></Button>
                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => onDelete(candidate)}><Trash2 className="h-4 w-4" /></Button>
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
  const [isSubmittingPresident, setIsSubmittingPresident] = React.useState(false);
  const [isSubmittingSecretary, setIsSubmittingSecretary] = React.useState(false);
  const [presidentCandidates, setPresidentCandidates] = React.useState<ElectionCandidateData[]>([]);
  const [secretaryCandidates, setSecretaryCandidates] = React.useState<ElectionCandidateData[]>([]);
  const [loadingPresident, setLoadingPresident] = React.useState(true);
  const [loadingSecretary, setLoadingSecretary] = React.useState(true);
  const [errorPresident, setErrorPresident] = React.useState<string | null>(null);
  const [errorSecretary, setErrorSecretary] = React.useState<string | null>(null);

  const [imageToCropSrc, setImageToCropSrc] = React.useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = React.useState(false);
  const [currentCroppedImagePreview, setCurrentCroppedImagePreview] = React.useState<string | null>(null);
  const [activeForm, setActiveForm] = React.useState<UseFormReturn<CandidateFormValues> | null>(null);
  
  const presidentFileInputRef = React.useRef<HTMLInputElement>(null);
  const secretaryFileInputRef = React.useRef<HTMLInputElement>(null);

  const presidentForm = useForm<CandidateFormValues>({ resolver: zodResolver(candidateFormSchema), defaultValues: { name: "", electionSymbol: "", imageFile: null } });
  const secretaryForm = useForm<CandidateFormValues>({ resolver: zodResolver(candidateFormSchema), defaultValues: { name: "", electionSymbol: "", imageFile: null } });

  const fetchCandidates = React.useCallback(async (position: CandidatePosition) => {
    const setLoading = position === "President" ? setLoadingPresident : setLoadingSecretary;
    const setError = position === "President" ? setErrorPresident : setErrorSecretary;
    const setCandidates = position === "President" ? setPresidentCandidates : setSecretaryCandidates;
    
    setLoading(true);
    setError(null);
    try {
      const fetched = await getCandidatesByPosition(position);
      setCandidates(fetched);
    } catch (e) {
      setError(e instanceof Error ? e.message : `Could not load ${position} candidates.`);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCandidates("President");
    fetchCandidates("GeneralSecretary");
  }, [fetchCandidates]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, formInstance: UseFormReturn<CandidateFormValues>) => {
    const file = event.target.files?.[0];
    if (file) {
      setActiveForm(formInstance); // Set which form is active for cropping
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCropSrc(reader.result as string);
        setIsCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleCropComplete = (croppedBlob: Blob) => {
    if (activeForm) {
      const croppedFile = new File([croppedBlob], "candidate_image.png", { type: "image/png" });
      activeForm.setValue("imageFile", croppedFile, { shouldValidate: true, shouldDirty: true });
      setCurrentCroppedImagePreview(URL.createObjectURL(croppedBlob));
    }
    setIsCropDialogOpen(false);
    // Reset the correct file input
    if (activeForm === presidentForm && presidentFileInputRef.current) presidentFileInputRef.current.value = "";
    if (activeForm === secretaryForm && secretaryFileInputRef.current) secretaryFileInputRef.current.value = "";
    setImageToCropSrc(null); // Clear source after crop
  };
  
  const clearImagePreview = (formInstance: UseFormReturn<CandidateFormValues>) => {
      formInstance.setValue("imageFile", null, {shouldValidate: true, shouldDirty: true});
      setCurrentCroppedImagePreview(null); // Clear preview specific to this form
      if (formInstance === presidentForm && presidentFileInputRef.current) presidentFileInputRef.current.value = "";
      if (formInstance === secretaryForm && secretaryFileInputRef.current) secretaryFileInputRef.current.value = "";
  };

  const onSubmitCandidate = async (data: CandidateFormValues, position: CandidatePosition) => {
    const setIsSubmitting = position === "President" ? setIsSubmittingPresident : setIsSubmittingSecretary;
    const formInstance = position === "President" ? presidentForm : secretaryForm;
    const fileInputRefInstance = position === "President" ? presidentFileInputRef : secretaryFileInputRef;

    setIsSubmitting(true);
    try {
      const candidateInput: NewCandidateInput = {
        name: data.name,
        electionSymbol: data.electionSymbol,
        position: position,
        imageFile: data.imageFile,
      };
      await addCandidate(candidateInput);
      toast({ title: "Candidate Added", description: `${data.name} has been added as a ${position} candidate.` });
      formInstance.reset();
      setCurrentCroppedImagePreview(null); // Clear preview
      if (fileInputRefInstance.current) fileInputRefInstance.current.value = "";
      fetchCandidates(position);
    } catch (e) {
      toast({ title: "Error Adding Candidate", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCandidate = (candidate: ElectionCandidateData) => {
    // Placeholder for edit functionality
    toast({ title: "Edit Candidate", description: `Edit functionality for ${candidate.name} to be implemented.` });
  };

  const handleDeleteCandidate = (candidate: ElectionCandidateData) => {
    // Placeholder for delete functionality
    toast({ title: "Delete Candidate", description: `Delete functionality for ${candidate.name} to be implemented.` });
  };

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-8 overflow-auto pb-20 md:pb-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-headline font-semibold">Candidate Management</h1>
            <p className="text-muted-foreground text-sm">
              Add, view, and manage candidate nominations for elections.
            </p>
          </div>
        </div>

        {/* President Candidates Section */}
        <section>
          <CandidateSectionForm
            position="President"
            form={presidentForm}
            onSubmit={onSubmitCandidate}
            isSubmitting={isSubmittingPresident}
            croppedImagePreview={activeForm === presidentForm ? currentCroppedImagePreview : null}
            handleFileChange={(e) => handleFileChange(e, presidentForm)}
            fileInputRef={presidentFileInputRef}
            clearImagePreview={() => clearImagePreview(presidentForm)}
          />
          <CandidateSectionList
            position="President"
            candidates={presidentCandidates}
            isLoading={loadingPresident}
            error={errorPresident}
            onEdit={handleEditCandidate}
            onDelete={handleDeleteCandidate}
          />
        </section>

        {/* General Secretary Candidates Section */}
        <section className="mt-10">
          <CandidateSectionForm
            position="GeneralSecretary"
            form={secretaryForm}
            onSubmit={onSubmitCandidate}
            isSubmitting={isSubmittingSecretary}
            croppedImagePreview={activeForm === secretaryForm ? currentCroppedImagePreview : null}
            handleFileChange={(e) => handleFileChange(e, secretaryForm)}
            fileInputRef={secretaryFileInputRef}
            clearImagePreview={() => clearImagePreview(secretaryForm)}
          />
          <CandidateSectionList
            position="GeneralSecretary"
            candidates={secretaryCandidates}
            isLoading={loadingSecretary}
            error={errorSecretary}
            onEdit={handleEditCandidate}
            onDelete={handleDeleteCandidate}
          />
        </section>

        {imageToCropSrc && (
          <ImageCropDialog
            isOpen={isCropDialogOpen}
            onClose={() => {
              setIsCropDialogOpen(false);
              setImageToCropSrc(null);
              if (activeForm === presidentForm && presidentFileInputRef.current) presidentFileInputRef.current.value = "";
              if (activeForm === secretaryForm && secretaryFileInputRef.current) secretaryFileInputRef.current.value = "";
              setActiveForm(null);
            }}
            imageSrc={imageToCropSrc}
            onCropComplete={handleCropComplete}
            aspectRatio={1} // 1:1 for profile pictures
            targetWidth={150}
            targetHeight={150}
          />
        )}
      </main>
    </AppShell>
  );
}
