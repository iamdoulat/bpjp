
// src/app/admin/users/page.tsx
"use client";

import * as React from "react";
import Link from 'next/link';
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
import { Users, Search, PlusCircle, MoreHorizontal, Edit2, UserX, ShieldAlert, MailWarning, Trash2, UserCircle2, UserCheck, Loader2, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getAllUserProfiles, type UserProfileData } from "@/services/userService";
import type { VariantProps } from "class-variance-authority"; // For Badge variant type

export interface UserData {
  id: string; // uid from Firestore doc id
  uid: string;
  name?: string | null; // displayName
  email: string;
  avatarUrl?: string | null; // photoURL
  role: 'Admin' | 'User'; // Capitalized for UI
  mobileNumber?: string | null;
  joinedDate?: Date; // Converted to Date for UI
  lastLoginDate?: Date; // Converted to Date for UI
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


export default function ManageUsersPage() {
  const [users, setUsers] = React.useState<UserData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();

  React.useEffect(() => {
    async function fetchUsers() {
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
        setError(e instanceof Error ? e.message : "An unknown error occurred while fetching user data.");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

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

  const handleAction = (action: string, userId: string, userName?: string | null) => {
    // Placeholder for actual actions (e.g., opening a dialog for edit/role change)
    toast({
      title: `${action} Clicked`,
      description: `Action: ${action} for user ${userName || userId}. (Functionality to be implemented)`,
    });
    // Example: if (action === "Edit User") router.push(`/admin/users/edit/${userId}`);
  };

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
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
            <Button onClick={() => handleAction("Add User", "")}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        {loading && (
          <div className="space-y-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-3 border-b border-border last:border-b-0 bg-card rounded-md">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-1/2" /> {/* For name */}
                  <Skeleton className="h-3 w-1/3" /> {/* For mobile */}
                </div>
                <Skeleton className="h-4 w-1/4" /> {/* Email */}
                <Skeleton className="h-4 w-[80px]" /> {/* Role */}
                <Skeleton className="h-4 w-[70px]" /> {/* Joined */}
                <Skeleton className="h-4 w-[70px]" /> {/* Last Login */}
                <Skeleton className="h-6 w-24 rounded-full" /> {/* Status */}
                <Skeleton className="h-8 w-8 rounded-md" /> {/* Actions */}
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
                          <span className="font-medium truncate block">{user.name || user.email.split('@')[0]}</span>
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
                          <DropdownMenuItem onSelect={() => handleAction("View Profile", user.id, user.name)}>
                            <UserCircle2 className="mr-2 h-4 w-4" /> View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleAction("Edit User", user.id, user.name)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <DropdownMenuItem onSelect={() => handleAction("Change Role", user.id, user.name)}>
                            <ShieldAlert className="mr-2 h-4 w-4" /> Change Role
                          </DropdownMenuItem>
                          {user.status === "Pending Verification" && (
                             <DropdownMenuItem onSelect={() => handleAction("Resend Verification", user.id, user.name)}>
                              <MailWarning className="mr-2 h-4 w-4" /> Resend Verification
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {user.status !== "Suspended" ? (
                            <DropdownMenuItem className="text-yellow-600 focus:text-yellow-700 focus:bg-yellow-500/10" onSelect={() => handleAction("Suspend User", user.id, user.name)}>
                              <UserX className="mr-2 h-4 w-4" /> Suspend User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-green-600 focus:text-green-700 focus:bg-green-500/10" onSelect={() => handleAction("Unsuspend User", user.id, user.name)}>
                               <UserCheck className="mr-2 h-4 w-4" /> Unsuspend User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={() => handleAction("Delete User", user.id, user.name)}>
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
    </AppShell>
  );
}

