
// src/app/admin/members/page.tsx
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadCNCardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, AlertCircle, Users, PlusCircle, Trash2, Edit2, MoreHorizontal } from "lucide-react";
import {
  getExecutiveCommitteeData,
  saveExecutiveCommitteeData,
  getExecutiveMembers,
  addExecutiveMember,
  updateExecutiveMember,
  deleteExecutiveMember,
  type ExecutiveMemberData
} from "@/services/executiveCommitteeService";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

const committeeFormSchema = z.object({
  content: z.string().min(10, { message: "Content must be at least 10 characters." }).max(20000, { message: "Content must be at most 20,000 characters."}),
});
type CommitteeFormValues = z.infer<typeof committeeFormSchema>;

const memberFormSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters.").max(100),
    designation: z.string().min(3, "Designation must be at least 3 characters.").max(100),
    cellNumber: z.string().regex(/^$|^[+]?[0-9\s-()]{7,20}$/, "Invalid cell number format.").optional().or(z.literal('')),
});
type MemberFormValues = z.infer<typeof memberFormSchema>;

export default function ManageMembersPage() {
  const { toast } = useToast();
  // State for the main content text area
  const [isLoadingContent, setIsLoadingContent] = React.useState(true);
  const [isSubmittingContent, setIsSubmittingContent] = React.useState(false);
  const [contentError, setContentError] = React.useState<string | null>(null);

  // State for the members list
  const [members, setMembers] = React.useState<ExecutiveMemberData[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = React.useState(true);
  const [membersError, setMembersError] = React.useState<string | null>(null);

  // State for dialogs and actions
  const [isMemberDialogOpen, setIsMemberDialogOpen] = React.useState(false);
  const [editingMember, setEditingMember] = React.useState<ExecutiveMemberData | null>(null);
  const [isSubmittingMember, setIsSubmittingMember] = React.useState(false);
  const [memberToDelete, setMemberToDelete] = React.useState<ExecutiveMemberData | null>(null);
  const [isDeletingMember, setIsDeletingMember] = React.useState(false);

  const contentForm = useForm<CommitteeFormValues>({
    resolver: zodResolver(committeeFormSchema),
    defaultValues: { content: "" },
    mode: "onChange",
  });
  
  const memberForm = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: { name: "", designation: "", cellNumber: "" },
  });

  const fetchMembers = React.useCallback(async () => {
    setIsLoadingMembers(true);
    setMembersError(null);
    try {
        const fetchedMembers = await getExecutiveMembers();
        setMembers(fetchedMembers);
    } catch (e) {
        setMembersError(e instanceof Error ? e.message : "Could not load members.");
    } finally {
        setIsLoadingMembers(false);
    }
  }, []);

  React.useEffect(() => {
    async function fetchInitialData() {
      setIsLoadingContent(true);
      setContentError(null);
      try {
        const currentData = await getExecutiveCommitteeData();
        if (currentData) {
          contentForm.reset({ content: currentData.content });
        }
      } catch (e) {
        setContentError(e instanceof Error ? e.message : "Could not load content.");
      } finally {
        setIsLoadingContent(false);
      }
    }
    fetchInitialData();
    fetchMembers();
  }, [contentForm, fetchMembers]);

  const onContentSubmit = async (data: CommitteeFormValues) => {
    setIsSubmittingContent(true);
    try {
      await saveExecutiveCommitteeData(data.content);
      toast({ title: "Content Updated!", description: "The descriptive content has been saved." });
      contentForm.reset(data);
    } catch (e) {
      toast({ title: "Error Saving Content", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsSubmittingContent(false);
    }
  };

  const handleOpenMemberDialog = (member: ExecutiveMemberData | null) => {
    setEditingMember(member);
    if (member) {
        memberForm.reset({
            name: member.name,
            designation: member.designation,
            cellNumber: member.cellNumber,
        });
    } else {
        memberForm.reset({ name: "", designation: "", cellNumber: "" });
    }
    setIsMemberDialogOpen(true);
  }

  const onMemberSubmit = async (data: MemberFormValues) => {
    setIsSubmittingMember(true);
    try {
        if (editingMember) { // Update existing member
            await updateExecutiveMember(editingMember.id, data);
            toast({ title: "Member Updated", description: `${data.name}'s details have been updated.` });
        } else { // Add new member
            await addExecutiveMember(data);
            toast({ title: "Member Added", description: `${data.name} has been added to the committee.` });
        }
        setIsMemberDialogOpen(false);
        fetchMembers(); // Refresh the list
    } catch(e) {
        toast({ title: editingMember ? "Update Failed" : "Add Failed", description: (e as Error).message, variant: "destructive" });
    } finally {
        setIsSubmittingMember(false);
    }
  }

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    setIsDeletingMember(true);
    try {
        await deleteExecutiveMember(memberToDelete.id);
        toast({ title: "Member Deleted", description: `${memberToDelete.name} has been removed.` });
        fetchMembers();
        setMemberToDelete(null);
    } catch (e) {
        toast({ title: "Deletion Failed", description: (e as Error).message, variant: "destructive" });
    } finally {
        setIsDeletingMember(false);
    }
  }
  
  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-8 overflow-auto pb-20 md:pb-6">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-headline font-semibold">Manage Executive Committee</h1>
            <p className="text-muted-foreground text-sm">
              Update committee member list and page content.
            </p>
          </div>
        </div>

        {/* Members List and Management */}
        <Card className="shadow-lg max-w-4xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>২০২৫-২৭ সেশনে কার্যকরী কমিটি সদস্য</CardTitle>
                    <ShadCNCardDescription>Add, view, edit, or remove committee members.</ShadCNCardDescription>
                </div>
                <Button onClick={() => handleOpenMemberDialog(null)}>
                    <PlusCircle className="mr-2 h-4 w-4"/> Add Member
                </Button>
            </CardHeader>
            <CardContent>
                {isLoadingMembers ? (
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                ) : membersError ? (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <ShadCNAlertTitle>Error Loading Members</ShadCNAlertTitle>
                        <AlertDescription>{membersError}</AlertDescription>
                    </Alert>
                ) : members.length === 0 ? (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <ShadCNAlertTitle>No Members Added</ShadCNAlertTitle>
                        <AlertDescription>There are no committee members to display. Click "Add Member" to get started.</AlertDescription>
                    </Alert>
                ) : (
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Designation</TableHead>
                                    <TableHead>Cell Number</TableHead>
                                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell className="font-medium">{member.name}</TableCell>
                                        <TableCell>{member.designation}</TableCell>
                                        <TableCell className="text-muted-foreground">{member.cellNumber || 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleOpenMemberDialog(member)}><Edit2 className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                                                    <DropdownMenuSeparator/>
                                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setMemberToDelete(member)}><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Main Content Text Area */}
        <Card className="shadow-lg max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>২০২৫-২৭ সেশনে কার্যকরী কমিটি</CardTitle>
            <ShadCNCardDescription>
              Enter the descriptive information that will be displayed on the public committee page. You can use Markdown for formatting.
            </ShadCNCardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingContent ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-10 w-28 mt-4" />
                </div>
            ) : contentError ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <ShadCNAlertTitle>Error Loading Content</ShadCNAlertTitle>
                    <AlertDescription>{contentError}</AlertDescription>
                </Alert>
            ) : (
                <Form {...contentForm}>
                    <form onSubmit={contentForm.handleSubmit(onContentSubmit)} className="space-y-8">
                        <FormField
                            control={contentForm.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Descriptive Content</FormLabel>
                                <FormControl>
                                    <Textarea
                                    placeholder="Describe the committee, its history, roles, and other relevant information..."
                                    className="resize-y min-h-[300px]"
                                    {...field}
                                    disabled={isSubmittingContent}
                                    />
                                </FormControl>
                                <FormDescription>This content will be displayed on the public page. Markdown is supported.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isSubmittingContent || !contentForm.formState.isDirty || !contentForm.formState.isValid}>
                        {isSubmittingContent ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSubmittingContent ? "Saving..." : "Save Content"}
                        </Button>
                    </form>
                </Form>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Member Dialog */}
        <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{editingMember ? "Edit Member" : "Add New Member"}</DialogTitle>
                </DialogHeader>
                <Form {...memberForm}>
                    <form id="member-form" onSubmit={memberForm.handleSubmit(onMemberSubmit)} className="grid gap-4 py-4">
                        <FormField control={memberForm.control} name="name" render={({field}) => (
                            <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} disabled={isSubmittingMember}/></FormControl><FormMessage/></FormItem>
                        )}/>
                        <FormField control={memberForm.control} name="designation" render={({field}) => (
                            <FormItem><FormLabel>Designation</FormLabel><FormControl><Input {...field} disabled={isSubmittingMember}/></FormControl><FormMessage/></FormItem>
                        )}/>
                        <FormField control={memberForm.control} name="cellNumber" render={({field}) => (
                            <FormItem><FormLabel>Cell Number (Optional)</FormLabel><FormControl><Input type="tel" {...field} value={field.value ?? ""} disabled={isSubmittingMember}/></FormControl><FormMessage/></FormItem>
                        )}/>
                    </form>
                </Form>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmittingMember}>Cancel</Button></DialogClose>
                    <Button type="submit" form="member-form" disabled={isSubmittingMember || !memberForm.formState.isValid}>
                        {isSubmittingMember && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingMember ? "Save Changes" : "Add Member"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!memberToDelete} onOpenChange={() => setMemberToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone. This will permanently delete the member "{memberToDelete?.name}".</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeletingMember}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteMember} className="bg-destructive hover:bg-destructive/90" disabled={isDeletingMember}>
                        {isDeletingMember && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      </main>
    </AppShell>
  );
}
