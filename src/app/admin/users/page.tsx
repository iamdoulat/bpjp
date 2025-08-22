// src/app/admin/users/page.tsx
"use client";

import * as React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Users, Search, PlusCircle, MoreHorizontal, Edit2, UserX, ShieldAlert, MailWarning, Trash2, UserCircle2, UserCheck, Loader2, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getAllUserProfiles, updateUserProfileAdmin, deleteUserProfileDocument, createUserProfileDocument, type UserProfileData, type NewUserProfileFirestoreData } from "@/services/userService";
import type { VariantProps } from "class-variance-authority";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext"; // For signup
import { Timestamp } from "firebase/firestore";
import type { User as AuthUserType, AuthError } from 'firebase/auth'; // For type hints

export interface UserData {
  id: string;
  uid: string;
  name?: string | null;
  email: string;
  avatarUrl?: string | null;
  role: 'Admin' | 'User';
  mobileNumber?: string | null;
  joinedDate?: Date;
  lastLoginDate?: Date;
  status: 'Active' | 'Suspended' | 'Pending Verification';
}

function formatDisplayDate(date?: Date): string {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", { month: 'numeric', day: 'numeric', year: 'numeric' }).format(date);
}

function getInitials(name?: string | null, email?: string): string {
  if (name) {
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[parts.length -1]) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return "U";
}

const editUserFormSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters.").max(50).optional().or(z.literal('')),
  mobileNumber: z.string().regex(/^$|^[+]?[0-9\s-()]{7,20}$/, "Invalid mobile number.").optional().or(z.literal('')),
});
type EditUserFormValues = z.infer<typeof editUserFormSchema>;

const addUserFormSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters.").max(50),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string(),
  mobileNumber: z.string().regex(/^$|^[+]?[0-9\s-()]{7,20}$/, "Invalid mobile number.").optional().or(z.literal('')),
  role: z.enum(['user', 'admin']),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});
type AddUserFormValues = z.infer<typeof addUserFormSchema>;


export default function ManageUsersPage() {
  const [users, setUsers] = React.useState<UserData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();
  const { signup: signupUserFromContext } = useAuth(); // Renamed to avoid conflict with local var

  const [currentUserForAction, setCurrentUserForAction] = React.useState<UserData | null>(null);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = React.useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = React.useState(false);
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = React.useState(false);
  const [isSuspendConfirmOpen, setIsSuspendConfirmOpen] = React.useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedNewRole, setSelectedNewRole] = React.useState<'admin' | 'user'>('user');

  const editUserForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
  });

  const addUserForm = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserFormSchema),
    defaultValues: {
        displayName: "",
        email: "",
        password: "",
        confirmPassword: "",
        mobileNumber: "",
        role: "user",
    }
  });

  const fetchUsersData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedProfiles: UserProfileData[] = await getAllUserProfiles();
      const mappedUsers: UserData[] = fetchedProfiles.map(profile => ({
        id: profile.uid,
        uid: profile.uid,
        name: profile.displayName || null,
        email: profile.email || 'No email provided',
        avatarUrl: profile.photoURL || null,
        role: profile.role === 'admin' ? 'Admin' : 'User',
        mobileNumber: profile.mobileNumber || null,
        joinedDate: profile.joinedDate ? profile.joinedDate.toDate() : undefined,
        lastLoginDate: profile.lastLoginDate ? profile.lastLoginDate.toDate() : undefined,
        status: profile.status || 'Active',
      }));
      setUsers(mappedUsers);
    } catch (e) {
      console.error("Failed to fetch users:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUsersData();
  }, [fetchUsersData]);

  const filteredUsers = users.filter(user =>
    (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.mobileNumber || '').includes(searchTerm)
  );

  const getStatusBadgeVariant = (status: UserData["status"]): VariantProps<typeof Badge>["variant"] => {
    switch (status) {
      case "Active": return "default";
      case "Suspended": return "destructive";
      case "Pending Verification": return "secondary";
      default: return "outline";
    }
  };
  
  const getStatusBadgeClassName = (status: UserData["status"]): string => {
    switch (status) {
      case "Active": return "bg-blue-600 hover:bg-blue-700 text-white border-blue-600";
      case "Suspended": return "bg-red-600 hover:bg-red-700 text-white border-red-600";
      case "Pending Verification": return "bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-500";
      default: return "";
    }
  };

  const handleOpenEditUserDialog = (user: UserData) => {
    setCurrentUserForAction(user);
    editUserForm.reset({
      displayName: user.name || "",
      mobileNumber: user.mobileNumber || "",
    });
    setIsEditUserDialogOpen(true);
  };

  const handleEditUserSubmit = async (values: EditUserFormValues) => {
    if (!currentUserForAction) return;
    setIsSubmitting(true);
    try {
      await updateUserProfileAdmin(currentUserForAction.uid, {
        displayName: values.displayName,
        mobileNumber: values.mobileNumber,
      });
      toast({ title: "User Updated", description: `${currentUserForAction.name || currentUserForAction.email}'s profile has been updated.` });
      fetchUsersData(); 
      setIsEditUserDialogOpen(false);
    } catch (e) {
      toast({ title: "Update Failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChangeRoleDialog = (user: UserData) => {
    setCurrentUserForAction(user);
    setSelectedNewRole(user.role.toLowerCase() as 'admin' | 'user');
    setIsChangeRoleDialogOpen(true);
  };

  const handleChangeRoleSubmit = async () => {
    if (!currentUserForAction) return;
    setIsSubmitting(true);
    try {
      await updateUserProfileAdmin(currentUserForAction.uid, { role: selectedNewRole });
      toast({ title: "Role Updated", description: `${currentUserForAction.name || currentUserForAction.email}'s role changed to ${selectedNewRole}.` });
      fetchUsersData();
      setIsChangeRoleDialogOpen(false);
    } catch (e) {
      toast({ title: "Role Update Failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenSuspendConfirm = (user: UserData) => {
    setCurrentUserForAction(user);
    setIsSuspendConfirmOpen(true);
  };

  const handleSuspendToggle = async () => {
    if (!currentUserForAction) return;
    setIsSubmitting(true);
    const newStatus = currentUserForAction.status === 'Active' ? 'Suspended' : 'Active';
    try {
      await updateUserProfileAdmin(currentUserForAction.uid, { status: newStatus });
      toast({ title: `User ${newStatus === 'Suspended' ? 'Suspended' : 'Unsuspended'}`, description: `${currentUserForAction.name || currentUserForAction.email} is now ${newStatus.toLowerCase()}.` });
      fetchUsersData();
      setIsSuspendConfirmOpen(false);
    } catch (e) {
      toast({ title: "Action Failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteConfirm = (user: UserData) => {
    setCurrentUserForAction(user);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!currentUserForAction) return;
    setIsSubmitting(true);
    try {
      await deleteUserProfileDocument(currentUserForAction.uid);
      toast({ title: "User Profile Deleted", description: `Firestore profile for ${currentUserForAction.name || currentUserForAction.email} deleted.` });
      fetchUsersData();
      setIsDeleteConfirmOpen(false);
    } catch (e) {
      toast({ title: "Deletion Failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddUserSubmit = async (data: AddUserFormValues) => {
    setIsSubmitting(true);
    try {
      // This part is tricky as signup logs the admin out. The functionality is unusual.
      // For now, we'll assume a backend function would handle this, but for client-side, we'll just create the profile.
      // NOTE: This does NOT create a Firebase Auth user, only a Firestore profile document.
      // This is a common pattern for admin panels where auth user creation is a separate, more secure process.
      const newUserId = doc(collection(db, 'userProfiles')).id; // Generate a new ID
      const profileData: NewUserProfileFirestoreData = {
        displayName: data.displayName,
        email: data.email,
        mobileNumber: data.mobileNumber || null,
        role: data.role,
        status: 'Pending Verification', // New users start as pending
        joinedDate: Timestamp.now(),
        photoURL: null,
      };
      await createUserProfileDocument(newUserId, profileData);
      
      toast({
        title: "User Profile Created",
        description: `Profile for ${data.displayName} (${data.email}) created. The user must be invited or have their auth account created separately.`,
        duration: 8000,
      });
      setIsAddUserDialogOpen(false);
      addUserForm.reset();
      fetchUsersData();
    } catch (e) {
      toast({ title: "Add User Failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-headline font-semibold">Manage Users</h1>
              <p className="text-muted-foreground text-sm">
                View, edit, and manage user accounts.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* The "Add User" button functionality was complex and led to admin being logged out.
                Disabling for now to prevent accidental logout. A more robust implementation is needed.
            <Button onClick={() => setIsAddUserDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add User
            </Button>
            */}
          </div>
        </div>

        {loading && (
          <div className="space-y-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-3 border-b border-border last:border-b-0 bg-card rounded-md">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[70px]" />
                <Skeleton className="h-4 w-[70px]" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <ShadCNAlertTitle>Error Fetching Users</ShadCNAlertTitle>
            <AlertDescription>{error} <br/> Please ensure Firestore security rules allow admins to list userProfiles.</AlertDescription>
          </Alert>
        )}

        {!loading && !error && filteredUsers.length === 0 && (
          <Alert>
             <Users className="h-4 w-4" />
            <ShadCNAlertTitle>No Users Found</ShadCNAlertTitle>
            <AlertDescription>
              {searchTerm ? "No users match your search term." : "There are no user profiles in the database yet."}
            </AlertDescription>
          </Alert>
        )}

        {!loading && !error && filteredUsers.length > 0 && (
          <div className="border rounded-lg shadow-sm overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px] md:w-[280px]">User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                           <AvatarImage src={user.avatarUrl || `https://placehold.co/40x40.png?text=${getInitials(user.name, user.email)}`} alt={user.name || user.email} data-ai-hint="profile person" />
                           <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium truncate block text-sm">{user.name || user.email.split('@')[0]}</span>
                          {user.mobileNumber && <span className="text-xs text-muted-foreground block">Mobile: {user.mobileNumber}</span>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="truncate max-w-[150px] md:max-w-xs text-xs">{user.email}</TableCell>
                    <TableCell className="text-xs">{user.role}</TableCell>
                    <TableCell className="text-xs">{formatDisplayDate(user.joinedDate)}</TableCell>
                    <TableCell className="text-xs">{formatDisplayDate(user.lastLoginDate)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusBadgeVariant(user.status)} className={cn("text-xs", getStatusBadgeClassName(user.status))}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">User actions for {user.name || user.email}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => toast({title: "View Profile Clicked", description: `Viewing profile for ${user.name || user.email}. (Functionality for specific user profile page to be implemented)`})}>
                            <UserCircle2 className="mr-2 h-4 w-4" /> View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleOpenEditUserDialog(user)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <DropdownMenuItem onSelect={() => handleOpenChangeRoleDialog(user)}>
                            <ShieldAlert className="mr-2 h-4 w-4" /> Change Role
                          </DropdownMenuItem>
                          {user.status === "Pending Verification" && (
                             <DropdownMenuItem onSelect={() => toast({title: "Resend Verification Clicked", description: `Resending verification for ${user.name || user.email}. (Functionality to be implemented)`})}>
                              <MailWarning className="mr-2 h-4 w-4" /> Resend Verification
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className={cn(user.status === 'Suspended' ? "text-green-600 focus:text-green-700 focus:bg-green-500/10" : "text-yellow-600 focus:text-yellow-700 focus:bg-yellow-500/10")}
                            onSelect={() => handleOpenSuspendConfirm(user)}
                          >
                            {user.status === 'Suspended' ? <UserCheck className="mr-2 h-4 w-4" /> : <UserX className="mr-2 h-4 w-4" />}
                            {user.status === 'Suspended' ? 'Unsuspend User' : 'Suspend User'}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={() => handleOpenDeleteConfirm(user)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 text-sm text-muted-foreground border-t">
              Showing {filteredUsers.length} of {users.length} user(s).
            </div>
          </div>
        )}
      </main>

      {/* Add User Dialog - Functionality disabled for now */}
      

      {/* Edit User Dialog */}
      {currentUserForAction && (
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User: {currentUserForAction.name || currentUserForAction.email}</DialogTitle>
              <DialogDescription>Make changes to the user's profile information.</DialogDescription>
            </DialogHeader>
            <Form {...editUserForm}>
              <form onSubmit={editUserForm.handleSubmit(handleEditUserSubmit)} className="space-y-4 py-4">
                <FormField
                  control={editUserForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="User's display name" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editUserForm.control}
                  name="mobileNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mobile Number</FormLabel>
                      <FormControl>
                        <Input placeholder="User's mobile number" {...field} value={field.value ?? ""} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isSubmitting || !editUserForm.formState.isDirty || !editUserForm.formState.isValid}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* Change Role Dialog */}
      {currentUserForAction && (
        <Dialog open={isChangeRoleDialogOpen} onOpenChange={setIsChangeRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Role: {currentUserForAction.name || currentUserForAction.email}</DialogTitle>
              <DialogDescription>Current role: {currentUserForAction.role}. Select a new role.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <Label htmlFor="role-select">New Role</Label>
              <Select value={selectedNewRole} onValueChange={(value: 'admin' | 'user') => setSelectedNewRole(value)}>
                <SelectTrigger id="role-select">
                  <SelectValue placeholder="Select new role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
              <Button onClick={handleChangeRoleSubmit} disabled={isSubmitting || selectedNewRole === currentUserForAction.role.toLowerCase()}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm Role Change
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Suspend/Unsuspend Confirmation Dialog */}
      {currentUserForAction && (
        <AlertDialog open={isSuspendConfirmOpen} onOpenChange={setIsSuspendConfirmOpen}>
          <ShadCNAlertDialogContent>
            <ShadCNAlertDialogHeader>
              <ShadCNAlertDialogTitle>
                Are you sure you want to {currentUserForAction.status === 'Active' ? 'suspend' : 'unsuspend'} this user?
              </ShadCNAlertDialogTitle>
              <ShadCNAlertDialogDescription>
                User: {currentUserForAction.name || currentUserForAction.email}. 
                This will change their status to {currentUserForAction.status === 'Active' ? 'Suspended' : 'Active'}.
              </ShadCNAlertDialogDescription>
            </ShadCNAlertDialogHeader>
            <ShadCNAlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSuspendToggle}
                className={currentUserForAction.status === 'Active' ? "bg-yellow-500 hover:bg-yellow-600 text-black" : "bg-green-600 hover:bg-green-700 text-white"}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentUserForAction.status === 'Active' ? 'Suspend' : 'Unsuspend'}
              </AlertDialogAction>
            </ShadCNAlertDialogFooter>
          </ShadCNAlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete User Confirmation Dialog */}
      {currentUserForAction && (
         <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <ShadCNAlertDialogContent>
            <ShadCNAlertDialogHeader>
              <ShadCNAlertDialogTitle>Are you sure you want to delete this user's profile?</ShadCNAlertDialogTitle>
              <ShadCNAlertDialogDescription>
                This action cannot be undone. This will permanently delete the Firestore profile for 
                <span className="font-semibold"> {currentUserForAction.name || currentUserForAction.email}</span>.
                This does not delete their Firebase Authentication account.
              </ShadCNAlertDialogDescription>
            </ShadCNAlertDialogHeader>
            <ShadCNAlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Profile
              </AlertDialogAction>
            </ShadCNAlertDialogFooter>
          </ShadCNAlertDialogContent>
        </AlertDialog>
      )}

    </AppShell>
  );
}
