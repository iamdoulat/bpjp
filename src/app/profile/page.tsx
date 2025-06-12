
// src/app/profile/page.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { getUserProfile, updateUserProfileService, uploadProfilePictureAndUpdate, type UserProfileData } from "@/services/userService";
import { Loader2, Edit3, Save, XCircle, Mail, CalendarDays, Smartphone, Shield, UploadCloud, User as UserIcon } from "lucide-react";
import { format } from 'date-fns';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const profileFormSchema = z.object({
  displayName: z.string().min(3, "Display name must be at least 3 characters.").max(50, "Display name cannot exceed 50 characters.").optional().or(z.literal('')),
  mobileNumber: z.string().regex(/^$|^[+]?[0-9\s-()]{7,20}$/, "Invalid mobile number format.").optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user, loading: authLoading, refreshAuthUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = React.useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isUserAdmin = user?.email === adminEmail;
  const profileCoverUrl = process.env.NEXT_PUBLIC_PROFILE_COVER_URL || "https://placehold.co/1200x300.png";


  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
      mobileNumber: "",
    },
  });

  React.useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedProfile = await getUserProfile(user.uid);
          if (fetchedProfile) {
            setProfileData(fetchedProfile);
            form.reset({
              displayName: fetchedProfile.displayName || user.displayName || "",
              mobileNumber: fetchedProfile.mobileNumber || "",
            });
          } else {
            // No profile in Firestore, use Auth data and prepare for creation
            setProfileData({ uid: user.uid, email: user.email }); // Minimal profile
            form.reset({
              displayName: user.displayName || "",
              mobileNumber: "",
            });
            // If user has no Firestore profile yet, create one on first edit or image upload.
          }
        } catch (e) {
          console.error("Failed to fetch profile:", e);
          setError("Could not load profile data.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchProfile();
    } else if (!authLoading) {
      setIsLoading(false);
      // Redirect or show message if no user and not loading (handled by AppShell typically)
    }
  }, [user, authLoading, form]);

  const getInitials = (name?: string | null) => {
    if (!name) return user?.email?.substring(0, 2).toUpperCase() || "U";
    const parts = name.split(" ");
    if (parts.length > 1) {
      return parts[0][0] + parts[parts.length - 1][0];
    }
    return name.substring(0, 2);
  };

  const handleEditToggle = () => {
    if (isEditing) { // If was editing, reset form to current profile data
      form.reset({
        displayName: profileData?.displayName || user?.displayName || "",
        mobileNumber: profileData?.mobileNumber || "",
      });
    }
    setIsEditing(!isEditing);
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await updateUserProfileService(user, data);
      await refreshAuthUser(); // Refresh user in AuthContext to get updated displayName/photoURL
      const updatedProfile = await getUserProfile(user.uid); // Re-fetch from Firestore
      if (updatedProfile) setProfileData(updatedProfile);

      toast({ title: "Profile Updated", description: "Your profile information has been saved." });
      setIsEditing(false);
    } catch (e) {
      console.error("Profile update error:", e);
      toast({ title: "Update Failed", description: (e as Error).message || "Could not save profile.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    setIsUploading(true);
    try {
      const newPhotoURL = await uploadProfilePictureAndUpdate(user, file);
      await refreshAuthUser(); // Refresh user in AuthContext
      setProfileData(prev => ({ ...prev, photoURL: newPhotoURL } as UserProfileData)); // Optimistically update local state
      toast({ title: "Profile Picture Updated", description: "Your new profile picture has been uploaded." });
    } catch (e) {
      console.error("Profile picture upload error:", e);
      toast({ title: "Upload Failed", description: (e as Error).message || "Could not upload picture.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
      }
    }
  };


  if (authLoading || isLoading) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <Skeleton className="h-48 w-full rounded-t-md" />
              <div className="relative flex justify-center -mt-16">
                <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
              </div>
              <div className="text-center mt-4">
                <Skeleton className="h-8 w-48 mx-auto mb-1" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-6 w-2/3" />
            </CardContent>
            <CardFooter className="flex justify-end">
                <Skeleton className="h-10 w-24" />
            </CardFooter>
          </Card>
        </main>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <Alert variant="destructive">
            <ShadCNAlertTitle>Not Authenticated</ShadCNAlertTitle>
            <AlertDescription>Please log in to view your profile.</AlertDescription>
          </Alert>
        </main>
      </AppShell>
    );
  }

  if (error) {
     return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 flex items-center justify-center">
          <Alert variant="destructive">
            <ShadCNAlertTitle>Error</ShadCNAlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </main>
      </AppShell>
    );
  }

  const currentDisplayName = profileData?.displayName || user.displayName || "User";
  const currentPhotoURL = profileData?.photoURL || user.photoURL;


  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        <Card className="max-w-4xl mx-auto shadow-xl">
          <CardHeader className="p-0">
            <div className="h-48 bg-muted/30 relative">
              <Image 
                src={profileCoverUrl} 
                alt="Cover photo" 
                layout="fill" 
                objectFit="cover" 
                priority // Preload cover image
                data-ai-hint="abstract texture" 
              />
            </div>
            <div className="relative flex flex-col items-center -mt-16">
              <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                <AvatarImage src={currentPhotoURL || `https://placehold.co/128x128.png?text=${getInitials(currentDisplayName)}`} alt={currentDisplayName || "User"} data-ai-hint="profile person" />
                <AvatarFallback>{getInitials(currentDisplayName)}</AvatarFallback>
              </Avatar>
              {!isEditing && (
                <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-16 right-20 bg-background/70 backdrop-blur-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    aria-label="Upload profile picture"
                  >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                </Button>
              )}
               <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleProfilePictureUpload}
                  accept="image/png, image/jpeg, image/gif"
                  className="hidden"
                  disabled={isUploading}
                />
              <div className="text-center mt-4">
                {isEditing ? (
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Your Display Name"
                        className="text-2xl font-bold text-center max-w-xs mx-auto"
                        disabled={isSubmitting}
                      />
                    )}
                  />
                ) : (
                  <h1 className="text-2xl font-bold">{currentDisplayName}</h1>
                )}
                 {form.formState.errors.displayName && isEditing && (
                    <p className="text-xs text-destructive mt-1">{form.formState.errors.displayName.message}</p>
                  )}
                <p className="text-sm text-muted-foreground">{isUserAdmin ? "Admin" : "User"}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="mt-6 space-y-6">
           <Form {...form}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2 p-3 bg-muted/20 rounded-md">
                <Mail className="h-5 w-5 text-primary" />
                <span>{user.email || "No email provided"}</span>
              </div>
              <div className="flex items-center space-x-2 p-3 bg-muted/20 rounded-md">
                <CalendarDays className="h-5 w-5 text-primary" />
                <span>Joined: {user.metadata.creationTime ? format(new Date(user.metadata.creationTime), "MMMM d, yyyy") : "N/A"}</span>
              </div>
            </div>
            
            {isEditing ? (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="mobileNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="mobileNumber">Mobile Number</FormLabel>
                          <div className="flex items-center space-x-2">
                            <Smartphone className="h-5 w-5 text-muted-foreground" />
                            <FormControl>
                              <Input
                                id="mobileNumber"
                                {...field}
                                placeholder="e.g., +1 123 456 7890"
                                disabled={isSubmitting}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleEditToggle} disabled={isSubmitting}>
                    <XCircle className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !form.formState.isDirty || !form.formState.isValid}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-3 bg-muted/20 rounded-md min-h-[46px]">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <span>{profileData?.mobileNumber || "Not set"}</span>
                </div>
              </div>
            )}
            
            {!isEditing && (
               <div className="flex justify-end">
                 <Button onClick={handleEditToggle}>
                   <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
                 </Button>
               </div>
            )}
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle className="flex items-center"><UserIcon className="mr-2 h-5 w-5 text-primary" /> Donation History</CardTitle>
                    <CardDescription>Your contributions and their status (coming soon).</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">Donation history feature will be available here.</p>
                </CardContent>
            </Card>
           </Form>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
