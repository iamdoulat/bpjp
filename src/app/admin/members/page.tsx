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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, AlertCircle, Users, PlusCircle, Trash2, Edit2, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getExecutiveCommitteeData,
  saveExecutiveCommitteeData,
  getExecutiveMembers,
  addExecutiveMember,
  updateExecutiveMember,
  deleteExecutiveMember,
  type ExecutiveMemberData,
  type CommitteeType
} from "@/services/executiveCommitteeService";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Timestamp } from "firebase/firestore";

const committeeFormSchema = z.object({
  content: z.string().min(10, { message: "Content must be at least 10 characters." }).max(20000, { message: "Content must be at most 20,000 characters."}),
  membersContent: z.string().min(10, { message: "Content must be at least 10 characters." }).max(20000, { message: "Content must be at most 20,000 characters."}).optional().or(z.literal('')),
});
type CommitteeFormValues = z.infer<typeof committeeFormSchema>;

const memberFormSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters.").max(100),
    designation: z.string().min(3, "Designation must be at least 3 characters.").max(100),
    committeeType: z.enum(['কার্যকরী কমিটি', 'কার্যনির্বাহী কমিটি'], {
        required_error: "Please select a committee type.",
    }),
    cellNumber: z.string().regex(/^$|^[+]?[0-9\s-()]{7,20}$/, "Invalid cell number format.").optional().or(z.literal('')),
});
type MemberFormValues = z.infer<typeof memberFormSchema>;

const MEMBERS_PER_PAGE = 20;

const MemberTable = ({
  members,
  onEdit,
  onDelete,
  isLoading,
  error,
  isProcessingAction,
  committeeName,
}: {
  members: ExecutiveMemberData[];
  onEdit: (member: ExecutiveMemberData) => void;
  onDelete: (member: ExecutiveMemberData) => void;
  isLoading: boolean;
  error: string | null;
  isProcessingAction: boolean;
  committeeName: string;
}) => {
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.ceil(members.length / MEMBERS_PER_PAGE);
  const paginatedMembers = members.slice(
    (currentPage - 1) * MEMBERS_PER_PAGE,
    currentPage * MEMBERS_PER_PAGE
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <ShadCNAlertTitle>Error Loading Members</ShadCNAlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (members.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <ShadCNAlertTitle>No Members Found</ShadCNAlertTitle>
        <AlertDescription>There are no members in the {committeeName} yet.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
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
            {paginatedMembers.map((member) => (
                <TableRow key={member.id}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.designation}</TableCell>
                <TableCell className="text-muted-foreground">{member.cellNumber || 'N/A'}</TableCell>
                <TableCell className="text-right">
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isProcessingAction}><MoreHorizontal className="h-4 w-4"/></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(member)} disabled={isProcessingAction}><Edit2 className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(member)} disabled={isProcessingAction}><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
        </div>
        {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-3 w-3 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
        )}
    </div>
  );
};


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
    defaultValues: { content: "", membersContent: "" },
    mode: "onChange",
  });
  
  const memberForm = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: { name: "", designation: "", cellNumber: "", committeeType: 'কার্যকরী কমিটি' },
  });

  const fetchMembers = React.useCallback(async () => {
    setIsLoadingMembers(true);
    setMembersError(null);
    try {
        const fetchedMembers = await getExecutiveMembers();
        // Sort by creation date ascending (oldest first)
        fetchedMembers.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
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
          contentForm.reset({ 
            content: currentData.content,
            membersContent: currentData.membersContent || ""
          });
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
      await saveExecutiveCommitteeData({ content: data.content, membersContent: data.membersContent || "" });
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
            committeeType: member.committeeType || 'কার্যকরী কমিটি',
        });
    } else {
        memberForm.reset({ name: "", designation: "", cellNumber: "", committeeType: 'কার্যকরী কমিটি' });
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
  
  const karjokoriMembers = members.filter(m => m.committeeType === 'কার্যকরী কমিটি');
  const karjonirbahiMembers = members.filter(m => m.committeeType === 'কার্যনির্বাহী কমিটি');

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-8 overflow-auto pb-20 md:pb-6">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-headline font-semibold">Manage Executive Committee</h1>
            <p className="text-muted-foreground text-sm">
              Update committee member lists and page content.
            </p>
          </div>
        </div>

        {/* কার্যকরী কমিটি Members List */}
        <Card className="shadow-lg max-w-4xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>কার্যকরী কমিটি সদস্য</CardTitle>
                    <ShadCNCardDescription>Add, view, edit, or remove committee members.</ShadCNCardDescription>
                </div>
                <Button onClick={() => handleOpenMemberDialog(null)}>
                    <PlusCircle className="mr-2 h-4 w-4"/> Add Member
                </Button>
            </CardHeader>
            <CardContent>
                <MemberTable
                    members={karjokoriMembers}
                    onEdit={handleOpenMemberDialog}
                    onDelete={setMemberToDelete}
                    isLoading={isLoadingMembers}
                    error={membersError}
                    isProcessingAction={isSubmittingMember || isDeletingMember}
                    committeeName="কার্যকরী কমিটি"
                />
            </CardContent>
        </Card>

        {/* কার্যনির্বাহী কমিটি Members List */}
        <Card className="shadow-lg max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>কার্যনির্বাহী কমিটি</CardTitle>
                <ShadCNCardDescription>List of members for the Executive Working Committee.</ShadCNCardDescription>
            </CardHeader>
            <CardContent>
                 <MemberTable
                    members={karjonirbahiMembers}
                    onEdit={handleOpenMemberDialog}
                    onDelete={setMemberToDelete}
                    isLoading={isLoadingMembers}
                    error={membersError}
                    isProcessingAction={isSubmittingMember || isDeletingMember}
                    committeeName="কার্যনির্বাহী কমিটি"
                />
            </CardContent>
        </Card>


        {/* Content Forms */}
        <Form {...contentForm}>
          <form onSubmit={contentForm.handleSubmit(onContentSubmit)} className="space-y-8">
            {/* Main Content Text Area */}
            <Card className="shadow-lg max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle>কার্যকরী কমিটি</CardTitle>
                <ShadCNCardDescription>
                  Enter the descriptive information that will be displayed on the public committee page. You can use Markdown for formatting.
                </ShadCNCardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingContent ? (
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-48 w-full" />
                    </div>
                ) : contentError ? (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <ShadCNAlertTitle>Error Loading Content</ShadCNAlertTitle>
                        <AlertDescription>{contentError}</AlertDescription>
                    </Alert>
                ) : (
                  <FormField
                    control={contentForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Committee Descriptive Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the committee, its history, roles, and other relevant information..."
                            className="resize-y min-h-[200px]"
                            {...field}
                            disabled={isSubmittingContent}
                          />
                        </FormControl>
                        <FormDescription>This content will be displayed on the public committee page. Markdown is supported.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Executive Member Content */}
            <Card className="shadow-lg max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle>কার্যনির্বাহী কমিটি</CardTitle>
                <ShadCNCardDescription>
                  Enter the descriptive information for the executive members list page. You can use Markdown for formatting.
                </ShadCNCardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingContent ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-48 w-full" />
                  </div>
                ) : contentError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <ShadCNAlertTitle>Error Loading Content</ShadCNAlertTitle>
                    <AlertDescription>{contentError}</AlertDescription>
                  </Alert>
                ) : (
                  <FormField
                    control={contentForm.control}
                    name="membersContent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Executive Member Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the executive members, their roles, and other relevant information..."
                            className="resize-y min-h-[200px]"
                            {...field}
                            value={field.value ?? ""}
                            disabled={isSubmittingContent}
                          />
                        </FormControl>
                        <FormDescription>This content will be displayed on the public members list page. Markdown is supported.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            <div className="max-w-4xl mx-auto">
              <Button type="submit" disabled={isSubmittingContent || !contentForm.formState.isDirty || !contentForm.formState.isValid}>
                {isSubmittingContent ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSubmittingContent ? "Saving..." : "Save All Content"}
              </Button>
            </div>
          </form>
        </Form>
        

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
                        <FormField
                            control={memberForm.control}
                            name="committeeType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Committee Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmittingMember}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a committee type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="কার্যকরী কমিটি">কার্যকরী কমিটি</SelectItem>
                                            <SelectItem value="কার্যনির্বাহী কমিটি">কার্যনির্বাহী কমিটি</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
