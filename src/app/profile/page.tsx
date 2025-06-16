
// src/app/profile/page.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle as ShadCNAlertTitle } from "@/components/ui/alert";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { getUserProfile, updateUserProfileService, uploadProfilePictureAndUpdate, type UserProfileData } from "@/services/userService";
import { getTotalDonationsByUser, getTotalRefundedByUser } from "@/services/paymentService";
import { Loader2, Edit3, Save, XCircle, Mail, CalendarDays, Smartphone, Shield, UploadCloud, User as UserIcon, DollarSign, Wallet } from "lucide-react";
import { format } from 'date-fns';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import DonationHistory from "@/components/profile/donation-history";
import ImageCropDialog from "@/components/ui/image-crop-dialog"; // Import ImageCropDialog

const profileFormSchema = z.object({
  displayName: z.string().min(3, "Display name must be at least 3 characters.").max(50, "Display name cannot exceed 50 characters.").optional().or(z.literal('')),
  mobileNumber: z.string().regex(/^$|^[+]?[0-9\s-()]{7,20}$/, "Invalid mobile number format.").optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return "$0.00";
  }
  return amount.toLocaleString("en-US", { style: "currency", currency: "BDT", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ProfilePage() {
  const { user, loading: authLoading, refreshAuthUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = React.useState<UserProfileData | null>(null);
  const [totalUserDonations, setTotalUserDonations] = React.useState<number | null>(null);
  const [totalUserRefunds, setTotalUserRefunds] = React.useState<number | null>(null);
  const [isLoadingTotalDonations, setIsLoadingTotalDonations] = React.useState(true);
  const [isLoadingTotalRefunds, setIsLoadingTotalRefunds] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // State for image cropping
  const [imageToCropSrc, setImageToCropSrc] = React.useState<string | null>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = React.useState(false);
  const [isUploadingCroppedImage, setIsUploadingCroppedImage] = React.useState(false); // Renamed from isUploading

  const [displayWalletBalance, setDisplayWalletBalance] = React.useState<string | React.ReactNode>(<Skeleton className="h-5 w-16 inline-block" />);
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
      const fetchProfileAndFinancials = async () => {
        setIsLoading(true);
        setIsLoadingTotalDonations(true);
        setIsLoadingTotalRefunds(true);
        setError(null);
        try {
          const fetchedProfile = await getUserProfile(user.uid);
          if (fetchedProfile) {
            setProfileData(fetchedProfile);
            form.reset({
              displayName: fetchedProfile.displayName || user.displayName || "",
              mobileNumber: fetchedProfile.mobileNumber || "",
            });
            setDisplayWalletBalance(formatCurrency(fetchedProfile.walletBalance));
          } else {
            setProfileData({ uid: user.uid, email: user.email, walletBalance: 0 });
            form.reset({
              displayName: user.displayName || "",
              mobileNumber: "",
            });
            setDisplayWalletBalance(formatCurrency(0));
          }

          const donationsSum = await getTotalDonationsByUser(user.uid);
          setTotalUserDonations(donationsSum);

          const refundsSum = await getTotalRefundedByUser(user.uid);
          setTotalUserRefunds(refundsSum);

        } catch (e) {
          console.error("Failed to fetch profile or financial data:", e);
          setError("Could not load profile or financial data.");
        } finally {
          setIsLoading(false);
          setIsLoadingTotalDonations(false);
          setIsLoadingTotalRefunds(false);
        }
      };
      fetchProfileAndFinancials();
    } else if (!authLoading) {
      setIsLoading(false);
      setIsLoadingTotalDonations(false);
      setIsLoadingTotalRefunds(false);
      setDisplayWalletBalance(formatCurrency(0));
    }
  }, [user, authLoading, form]);

  const getInitials = (name?: string | null) => {
    if (!name) return user?.email?.substring(0, 2).toUpperCase() || "U";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
      return parts[0][0] + parts[parts.length - 1][0];
    }
    return name.substring(0, 2);
  };

  const handleEditToggle = () => {
    if (isEditing) {
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
      await refreshAuthUser();
      const updatedProfile = await getUserProfile(user.uid);
      if (updatedProfile) {
        setProfileData(updatedProfile);
        setDisplayWalletBalance(formatCurrency(updatedProfile.walletBalance))
      }
      toast({ title: "Profile Updated", description: "Your profile information has been saved." });
      setIsEditing(false);
    } catch (e) {
      console.error("Profile update error:", e);
      toast({ title: "Update Failed", description: (e as Error).message || "Could not save profile.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelectForCrop = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleCroppedImageUpload = async (croppedBlob: Blob) => {
    if (!user) return;
    setIsUploadingCroppedImage(true);
    try {
      const croppedFile = new File([croppedBlob], "profile_picture.png", { type: "image/png" });
      const newPhotoURL = await uploadProfilePictureAndUpdate(user, croppedFile);
      await refreshAuthUser();
      const updatedProfile = await getUserProfile(user.uid);
      if (updatedProfile) {
        setProfileData(updatedProfile);
        setDisplayWalletBalance(formatCurrency(updatedProfile.walletBalance));
      }
      toast({ title: "Profile Picture Updated", description: "Your new profile picture has been uploaded." });
    } catch (e) {
      console.error("Profile picture upload error:", e);
      toast({ title: "Upload Failed", description: (e as Error).message || "Could not upload picture.", variant: "destructive" });
    } finally {
      setIsUploadingCroppedImage(false);
      setIsCropDialogOpen(false); // Close dialog after processing
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
      }
    }
  };


  if (authLoading || isLoading) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 space-y-6">
          <Card className="shadow-xl">
            <CardHeader className="p-0">
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
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
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
  const currentUserRole = profileData?.role ? profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1) : "User";


  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 space-y-6 overflow-auto pb-20 md:pb-6">
        <Card className="shadow-xl">
          <CardHeader className="p-0">
            <div className="h-48 bg-muted/30 relative">
              <Image
                src={profileCoverUrl}
                alt="Cover photo"
                layout="fill"
                objectFit="cover"
                priority
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
                    className="absolute top-16 right-4 sm:right-6 md:right-8 lg:right-10 xl:right-12 bg-background/70 backdrop-blur-sm p-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingCroppedImage || isCropDialogOpen}
                    aria-label="Upload profile picture"
                  >
                  {isUploadingCroppedImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                </Button>
              )}
               <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelectForCrop}
                  accept="image/png, image/jpeg, image/gif"
                  className="hidden"
                  disabled={isUploadingCroppedImage || isCropDialogOpen}
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
                <p className="text-sm text-muted-foreground">{currentUserRole}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="mt-6 space-y-6">
           <Form {...form}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start space-x-3 p-3 bg-muted/20 rounded-md">
                <Mail className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-semibold">{user.email || "No email provided"}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-muted/20 rounded-md">
                <CalendarDays className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                 <div>
                  <p className="text-xs text-muted-foreground">Joined</p>
                  <p className="font-semibold">{user.metadata.creationTime ? format(new Date(user.metadata.creationTime), "MMMM d, yyyy") : "N/A"}</p>
                </div>
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
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start space-x-3 p-3 bg-muted/20 rounded-md">
                    <Smartphone className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Mobile Number</p>
                      <p className="font-semibold">{profileData?.mobileNumber || "Not set"}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-muted/20 rounded-md">
                    <DollarSign className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total Approved Donations</p>
                      {isLoadingTotalDonations ? (
                        <Skeleton className="h-6 w-20" />
                      ) : (
                        <p className="font-semibold">{formatCurrency(totalUserDonations)}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => toast({
                      title: "My Wallet Details",
                      description: `Current Balance: ${displayWalletBalance}. Total Refunded (credited to wallet): ${isLoadingTotalRefunds || totalUserRefunds === null ? 'Loading...' : formatCurrency(totalUserRefunds)}`
                    })}
                  >
                    <Wallet className="mr-2 h-4 w-4" /> My Wallet: {isLoading ? <Skeleton className="h-5 w-16 inline-block" /> : displayWalletBalance}
                  </Button>
                  <Button onClick={handleEditToggle}>
                    <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
                  </Button>
                </div>
              </>
            )}
           </Form>
          </CardContent>
        </Card>

        <DonationHistory />

        {imageToCropSrc && (
          <ImageCropDialog
            isOpen={isCropDialogOpen}
            onClose={() => {
              setIsCropDialogOpen(false);
              setImageToCropSrc(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = ""; // Reset file input
              }
            }}
            imageSrc={imageToCropSrc}
            onCropComplete={handleCroppedImageUpload}
            aspectRatio={1} // 1:1 for profile picture
            targetWidth={100} // Target 100px width
            targetHeight={100} // Target 100px height
          />
        )}

      </main>
    </AppShell>
  );
}
