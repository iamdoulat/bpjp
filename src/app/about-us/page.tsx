
// src/app/about-us/page.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, MapPin, Building, Phone, Mail, UserCircle, Users, CalendarRange, AlertCircle, CalendarCheck, FileText } from "lucide-react"; // Added FileText
import { useAppContext } from "@/contexts/AppContext"; // Use AppContext to get settings
import type { OrganizationSettingsData } from "@/services/organizationSettingsService";

export default function AboutUsPage() {
  const { organizationSettings, isLoadingAppSettings } = useAppContext();
  const [settingsToDisplay, setSettingsToDisplay] = React.useState<OrganizationSettingsData | null>(null);

  React.useEffect(() => {
    if (!isLoadingAppSettings && organizationSettings) {
      setSettingsToDisplay(organizationSettings);
    }
  }, [organizationSettings, isLoadingAppSettings]);

  const coverImageUrlToUse = settingsToDisplay?.coverImageUrl || "https://placehold.co/1200x500.png";

  if (isLoadingAppSettings || !settingsToDisplay) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8 overflow-auto pb-20 md:pb-8">
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Card className="shadow-lg">
            <Skeleton className="h-48 md:h-56 w-full rounded-t-lg" /> {/* Skeleton for banner */}
            <CardHeader>
              <Skeleton className="h-8 w-1/2 mb-1" />
              <Skeleton className="h-4 w-3/4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 pt-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-5 w-3/5" />
                  </div>
                </div>
              ))}
              <div className="text-center pt-6 mt-2">
                <Skeleton className="h-5 w-1/3 mx-auto" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center text-center space-y-3">
                    <Skeleton className="h-28 w-28 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20 mt-1" /> {/* Skeleton for mobile number */}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </AppShell>
    );
  }
  
  if (!settingsToDisplay.organizationName && !isLoadingAppSettings) { // Check if core data is missing after load
     return (
      <AppShell>
        <main className="flex-1 p-6 flex items-center justify-center">
            <Card className="p-6 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <CardTitle>Information Unavailable</CardTitle>
                </div>
                <CardDescription>Organization information is not available or has not been configured by an administrator yet.</CardDescription>
            </Card>
        </main>
      </AppShell>
    );
  }


  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8 overflow-auto pb-20 md:pb-8">
        <div className="flex items-center gap-3 mb-4">
          <Info className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-headline font-bold">About Us</h1>
            <p className="text-muted-foreground text-md">
              Learn more about our organization.
            </p>
          </div>
        </div>

        <Card className="shadow-xl overflow-hidden rounded-lg">
          <div className="relative h-48 md:h-56 w-full"> {/* Banner Image Container */}
            <Image
              src={coverImageUrlToUse}
              alt={`${settingsToDisplay.organizationName || 'Organization'} cover image`}
              layout="fill"
              objectFit="cover"
              priority
              data-ai-hint="organization banner abstract"
            />
          </div>
          <CardHeader className="bg-muted/20 border-b border-t">
            <div className="flex items-center gap-3">
              <Building className="h-7 w-7 text-green-600" />
              <CardTitle className="text-2xl font-headline">{settingsToDisplay.organizationName}</CardTitle>
            </div>
            {(settingsToDisplay.registrationNumber || settingsToDisplay.establishedYear) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 pt-1 pl-10">
                {settingsToDisplay.registrationNumber && (
                   <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-1.5 text-muted-foreground" />
                    <CardDescription>
                      Registration No: {settingsToDisplay.registrationNumber}
                    </CardDescription>
                  </div>
                )}
                {settingsToDisplay.establishedYear && (
                  <div className="flex items-center">
                    <CalendarCheck className="h-4 w-4 mr-1.5 text-muted-foreground" />
                    <CardDescription>
                      Established: {settingsToDisplay.establishedYear}
                    </CardDescription>
                  </div>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <InfoItem icon={<MapPin className="text-green-600"/>} label="Address" value={settingsToDisplay.address} />
              <InfoItem icon={<Mail className="text-green-600"/>} label="Contact Email" value={<a href={`mailto:${settingsToDisplay.contactEmail}`} className="text-green-600 hover:underline">{settingsToDisplay.contactEmail}</a>} />
              <InfoItem icon={<UserCircle className="text-green-600"/>} label="Contact Person" value={settingsToDisplay.contactPersonName} />
              <InfoItem icon={<Phone className="text-green-600"/>} label="Contact Cell" value={settingsToDisplay.contactPersonCell || "Not Provided"} />
            </div>

            {settingsToDisplay.committeePeriod && (
              <div className="text-center pt-6 mt-6 border-t">
                <p className="text-lg font-semibold text-foreground">
                  Committee Period: {settingsToDisplay.committeePeriod}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t mt-8">
              <LeadershipProfile
                name={settingsToDisplay.presidentName}
                title="President"
                imageUrl={settingsToDisplay.presidentImageURL}
                mobileNumber={settingsToDisplay.presidentMobileNumber}
                dataAiHint="person portrait"
              />
              <LeadershipProfile
                name={settingsToDisplay.secretaryName}
                title="General Secretary"
                imageUrl={settingsToDisplay.secretaryImageURL}
                mobileNumber={settingsToDisplay.secretaryMobileNumber}
                dataAiHint="person portrait"
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value }) => (
  <div className="flex items-start space-x-3">
    <span className="mt-1 flex-shrink-0 w-5 h-5">{icon}</span>
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-md text-foreground">{value}</p>
    </div>
  </div>
);

interface LeadershipProfileProps {
  name: string;
  title: string;
  imageUrl?: string | null;
  mobileNumber?: string | null;
  dataAiHint?: string;
}

const LeadershipProfile: React.FC<LeadershipProfileProps> = ({ name, title, imageUrl, mobileNumber, dataAiHint }) => (
  <div className="flex flex-col items-center text-center p-4 bg-card rounded-lg border shadow-sm">
    <div className="relative w-32 h-32 md:w-36 md:h-36 mb-4 rounded-full overflow-hidden border-2 border-primary/50 shadow-lg">
      <Image
        src={imageUrl || `https://placehold.co/150x150.png?text=${name ? name.charAt(0) : 'L'}`}
        alt={name}
        layout="fill"
        objectFit="cover"
        data-ai-hint={dataAiHint || "person portrait"}
      />
    </div>
    <h3 className="text-xl font-semibold text-foreground">{name}</h3>
    <p className="text-muted-foreground">{title}</p>
    {mobileNumber && (
      <div className="flex items-center mt-1.5 text-sm text-muted-foreground">
        <Phone className="h-4 w-4 mr-1.5 text-green-600/80" />
        {mobileNumber}
      </div>
    )}
  </div>
);

