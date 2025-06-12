
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
import { Users, Search, PlusCircle, MoreHorizontal, Edit2, UserX, ShieldAlert, MailWarning, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
// import { getUsers, type UserProfileDataWithAuth } from "@/services/userService"; // To be created/used later

export interface UserData {
  id: string;
  name?: string | null;
  email: string;
  avatarUrl?: string | null;
  role: 'Admin' | 'User';
  joinedDate: Date;
  lastLoginDate: Date;
  status: 'Active' | 'Suspended' | 'Pending Verification';
}

// Mock data for initial UI development - replace with Firestore fetching
const mockUsers: UserData[] = [
  { id: "usr_1", name: "Alice Wonderland", email: "alice@example.com", avatarUrl: "https://placehold.co/40x40.png?text=AW", role: "Admin", joinedDate: new Date("2023-01-15"), lastLoginDate: new Date("2024-07-20"), status: "Active" },
  { id: "usr_2", name: "Bob The Builder", email: "bob@example.com", avatarUrl: "https://placehold.co/40x40.png?text=BB", role: "User", joinedDate: new Date("2023-03-22"), lastLoginDate: new Date("2024-07-18"), status: "Active" },
  { id: "usr_3", name: "Carol Danvers", email: "carol@example.com", avatarUrl: "https://placehold.co/40x40.png?text=CD", role: "User", joinedDate: new Date("2023-05-10"), lastLoginDate: new Date("2024-06-30"), status: "Suspended" },
  { id: "usr_4", name: "David Copperfield", email: "david@example.com", avatarUrl: "https://placehold.co/40x40.png?text=DC", role: "User", joinedDate: new Date("2024-02-01"), lastLoginDate: new Date("2024-07-21"), status: "Active" },
  { id: "usr_5", name: "Eve Harrington", email: "eve@example.com", avatarUrl: "https://placehold.co/40x40.png?text=EH", role: "User", joinedDate: new Date("2024-06-15"), lastLoginDate: new Date("2024-07-15"), status: "Pending Verification" },
  { id: "usr_6", name: null, email: "frank@example.com", role: "User", joinedDate: new Date("2024-07-01"), lastLoginDate: new Date("2024-07-22"), status: "Active" },
];

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: 'numeric', day: 'numeric', year: 'numeric' }).format(date);
}

function getInitials(name?: string | null, email?: string): string {
  if (name) {
    const parts = name.split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return "NA";
}


export default function ManageUsersPage() {
  const [users, setUsers] = React.useState<UserData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();

  React.useEffect(() => {
    // Simulate fetching data for now
    setLoading(true);
    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 1000);
    // TODO: Replace with actual data fetching:
    // async function fetchUsers() {
    //   try {
    //     setLoading(true);
    //     setError(null);
    //     // const fetchedUsers = await getUsers(); // This function would fetch from Firestore userProfiles and combine with Auth data
    //     // setUsers(fetchedUsers);
    //   } catch (e) {
    //     console.error("Failed to fetch users:", e);
    //     setError(e instanceof Error ? e.message : "An unknown error occurred.");
    //   } finally {
    //     setLoading(false);
    //   }
    // }
    // fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
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
      case "Pending Verification": return "bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-500"; // Ensure text is readable
      default: return "";
    }
  };

  const handleAction = (action: string, userId: string, userName?: string | null) => {
    toast({
      title: `${action} Clicked`,
      description: `Action: ${action} for user ${userName || userId}. (Functionality to be implemented)`,
    });
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
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-1/6" />
                <Skeleton className="h-4 w-1/6" />
                <Skeleton className="h-4 w-1/6" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-8 rounded-md" />
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <Alert variant="destructive">
            <ShadCNAlertTitle>Error Fetching Users</ShadCNAlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && filteredUsers.length === 0 && (
          <Alert>
            <ShadCNAlertTitle>No Users Found</ShadCNAlertTitle>
            <AlertDescription>
              {searchTerm ? "No users match your search term." : "There are no users to display yet."}
            </AlertDescription>
          </Alert>
        )}

        {!loading && !error && filteredUsers.length > 0 && (
          <div className="border rounded-lg shadow-sm overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px] md:w-[250px]">User</TableHead>
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
                        <span className="font-medium truncate">{user.name || user.email.split('@')[0]}</span>
                      </div>
                    </TableCell>
                    <TableCell className="truncate max-w-[150px] md:max-w-xs">{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{formatDate(user.joinedDate)}</TableCell>
                    <TableCell>{formatDate(user.lastLoginDate)}</TableCell>
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
                               <UserCheck className="mr-2 h-4 w-4" /> Unsuspend User {/* Assuming UserCheck icon */}
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

// Helper icons that might be needed in Dropdown, add to lucide-react import if used
// import { UserCircle2, Edit2, UserX, ShieldAlert, MailWarning, Trash2, UserCheck } from "lucide-react";
const UserCircle2 = Users; // Placeholder if UserCircle2 is not directly imported
const UserCheck = Users; // Placeholder if UserCheck is not directly imported

