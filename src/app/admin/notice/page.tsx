// src/app/admin/notice/page.tsx
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as ShadCNAlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as ShadCNAlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText as NoticeIcon, PlusCircle, Edit, Trash2, MoreHorizontal, AlertCircle, Save, X } from "lucide-react";
import {
  addNotice,
  getNotices,
  updateNotice,
  deleteNotice,
  type NoticeData,
} from "@/services/noticeService";
import { Timestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import ImageCropDialog from "@/components/ui/image-crop-dialog";


const noticeFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters.").max(150),
  content: z.string().min(10, "Content must be at least 10 characters.").max(5000),
  isActive: z.boolean().default(false),
  link: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  imageFile: z.instanceof(File).optional().nullable(),
  removeCurrentImage: z.boolean().default(false),
});

type NoticeFormValues = z.infer<typeof noticeFormSchema>;

function formatDisplayDateTime(date?: Timestamp): string {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date.toDate());
}

export default function ManageNoticePage() {
  const { toast } = useToast();
  const [notices, setNotices] = React.useState<NoticeData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingNotice, setEditingNotice] = React.useState<NoticeData | null>(null);
  const [noticeToDelete, setNoticeToDelete] = React.useState<NoticeData | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [imageToCropSrc, setImageToCropSrc] = React.useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<NoticeFormValues>({
    resolver: zodResolver(noticeFormSchema),
    defaultValues: {
      title: "",
      content: "",
      isActive: false,
      link: "",
      imageFile: null,
      removeCurrentImage: false,
    },
  });

  const fetchNotices = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedNotices = await getNotices();
      setNotices(fetchedNotices);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);
  
  const resetDialogState = () => {
    form.reset();
    setEditingNotice(null);
    setImageToCropSrc(null);
    setIsCropDialogOpen(false);
    setImagePreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };


  const handleOpenDialog = (notice: NoticeData | null) => {
    resetDialogState();
    setEditingNotice(notice);
    if (notice) {
      form.reset({
        title: notice.title,
        content: notice.content,
        isActive: notice.isActive,
        link: notice.link || "",
        imageFile: null,
        removeCurrentImage: false,
      });
      if (notice.imageUrl) {
        setImagePreview(notice.imageUrl);
      }
    } else {
       form.reset({
        title: "",
        content: "",
        isActive: true, // Default to active for new notices
        link: "",
        imageFile: null,
        removeCurrentImage: false,
       });
    }
    setIsDialogOpen(true);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("removeCurrentImage", false); // Unset remove flag if new file is chosen
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCropSrc(reader.result as string);
        setIsCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], "notice_image.png", { type: "image/png" });
    form.setValue("imageFile", croppedFile, { shouldValidate: true, shouldDirty: true });
    setImagePreview(URL.createObjectURL(croppedBlob));
    setIsCropDialogOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const handleRemoveImage = () => {
    setImagePreview(null);
    form.setValue("imageFile", null, { shouldDirty: true });
    form.setValue("removeCurrentImage", true, { shouldDirty: true });
    if(fileInputRef.current) fileInputRef.current.value = "";
  };


  const onSubmit = async (data: NoticeFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingNotice) {
        await updateNotice(editingNotice.id, data);
        toast({ title: "Notice Updated", description: "The notice has been successfully updated." });
      } else {
        await addNotice(data);
        toast({ title: "Notice Created", description: "The new notice has been added." });
      }
      setIsDialogOpen(false);
      fetchNotices();
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNotice = async () => {
    if (!noticeToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteNotice(noticeToDelete.id);
      toast({ title: "Notice Deleted", description: "The notice has been removed." });
      fetchNotices();
      setNoticeToDelete(null);
    } catch (e) {
      toast({ title: "Error Deleting Notice", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <NoticeIcon className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-headline font-semibold">Manage Notices</h1>
              <p className="text-muted-foreground text-sm">
                Create, update, and manage notices for the platform.
              </p>
            </div>
          </div>
          <Button onClick={() => handleOpenDialog(null)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Notice
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-md" />)}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <ShadCNAlertTitle>Error Fetching Notices</ShadCNAlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : notices.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <ShadCNAlertTitle>No Notices Found</ShadCNAlertTitle>
            <AlertDescription>There are no notices to display. Create one to get started.</AlertDescription>
          </Alert>
        ) : (
          <Card className="shadow-lg">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Status</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notices.map((notice) => (
                    <TableRow key={notice.id}>
                      <TableCell>
                        <Badge variant={notice.isActive ? "default" : "secondary"}>
                          {notice.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{notice.title}</TableCell>
                      <TableCell>{formatDisplayDateTime(notice.lastUpdated)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(notice)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setNoticeToDelete(notice)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={(open) => {if(!open) resetDialogState(); setIsDialogOpen(open)}}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingNotice ? "Edit Notice" : "Create New Notice"}</DialogTitle>
               <DialogDescription>
                Fill in the details for the notice. Active notices will be visible to users.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="content" render={({ field }) => (
                  <FormItem><FormLabel>Content</FormLabel><FormControl><Textarea className="min-h-[150px]" {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="link" render={({ field }) => (
                  <FormItem><FormLabel>Link (Optional)</FormLabel><FormControl><Input {...field} placeholder="https://example.com/details" disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                )} />

                <FormItem>
                  <FormLabel>Image (Optional)</FormLabel>
                   {imagePreview && (
                    <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                        <Image src={imagePreview} alt="Notice Preview" layout="fill" objectFit="contain" />
                        <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={handleRemoveImage}><X className="h-4 w-4" /></Button>
                    </div>
                  )}
                  <FormControl>
                    <Input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" disabled={isSubmitting}/>
                  </FormControl>
                  <FormMessage>{form.formState.errors.imageFile?.message as React.ReactNode}</FormMessage>
                </FormItem>

                <FormField control={form.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                       <CardDescription>If active, this notice may be displayed publicly.</CardDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting}/></FormControl>
                  </FormItem>
                )} />
                 <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingNotice ? "Save Changes" : "Create Notice"}
                    </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

         {imageToCropSrc && (
          <ImageCropDialog
            isOpen={isCropDialogOpen}
            onClose={() => { setIsCropDialogOpen(false); setImageToCropSrc(null); if(fileInputRef.current) fileInputRef.current.value = "";}}
            imageSrc={imageToCropSrc}
            onCropComplete={handleCropComplete}
            aspectRatio={16 / 9}
            targetWidth={800}
            targetHeight={450}
          />
        )}
        
        {noticeToDelete && (
          <AlertDialog open={!!noticeToDelete} onOpenChange={() => setNoticeToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <ShadCNAlertDialogTitle>Are you sure?</ShadCNAlertDialogTitle>
                <ShadCNAlertDialogDescription>
                  This action cannot be undone. This will permanently delete the notice "{noticeToDelete.title}".
                </ShadCNAlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteNotice} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </main>
    </AppShell>
  );
}
