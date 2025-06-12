
// src/app/about-us/page.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, MapPin, Building, Phone, Mail, UserCircle, Users, CalendarRange } from "lucide-react"; // Added CalendarRange
// import { getOrganizationSettings, type OrganizationSettingsData } from "@/services/organizationSettingsService"; // To be created

// Placeholder Data - Replace with fetched data
const placeholderSettings = {
  organizationName: "BPJP Organization",
  address: "123 Philanthropy Lane, Generosity City, State 12345",
  registrationNumber: "NGO-REG-001",
  committeePeriod: "2024-2026", // Added committee period
  contactPersonName: "Jane Donor",
  contactPersonCell: "+1-800-GIVE-NOW",
  contactEmail: "info@bpjporg.example.com",
  presidentName: "Dr. Alex President",
  presidentImageURL: "https://placehold.co/150x150.png",
  secretaryName: "Ms. Casey Secretary",
  secretaryImageURL: "https://placehold.co/150x150.png",
  // coverImageUrl is now handled by environment variable or fallback
};

export default function AboutUsPage() {
  const [settings, setSettings] = React.useState<Omit<typeof placeholderSettings, 'coverImageUrl'> | null>(placeholderSettings); // Default to placeholder
  const [loading, setLoading] = React.useState(false); // Set to true when fetching data

  const coverImageUrl = process.env.NEXT_PUBLIC_PROFILE_COVER_URL || "https://placehold.co/1200x250.png";

  // React.useEffect(() => {
  //   async function fetchSettings() {
  //     setLoading(true);
  //     try {
  //       // const fetchedSettings = await getOrganizationSettings(); // To be created
  //       // if (fetchedSettings) {
  //       //   setSettings(fetchedSettings);
  //       // } else {
  //       //   setSettings(placeholderSettings); // Fallback to placeholder if no settings found
  //       // }
  //     } catch (error) {
  //       console.error("Error fetching organization settings:", error);
  //       setSettings(placeholderSettings); // Fallback on error
  //     } finally {
  //       setLoading(false);
  //     }
  //   }
  //   fetchSettings();
  // }, []);

  if (loading) {
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8 overflow-auto pb-20 md:pb-8">
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Card className="shadow-lg">
            <Skeleton className="h-40 md:h-56 w-full rounded-t-lg" /> {/* Skeleton for banner */}
            <CardHeader>
              <Skeleton className="h-8 w-1/2 mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-6">
              {[...Array(4)].map((_, i) => ( // Increased to 4 for new item
                <div key={i} className="flex items-start space-x-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-5 w-3/5" />
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center text-center space-y-3">
                    <Skeleton className="h-28 w-28 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </AppShell>
    );
  }

  if (!settings) { // Should not happen with placeholder logic, but good practice
    return (
      <AppShell>
        <main className="flex-1 p-6 flex items-center justify-center">
            <p>Organization information is not available at the moment.</p>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8 overflow-auto pb-20 md:pb-8">
        <div className="flex items-center gap-3 mb-4">
          <Info className="h-8 w-8 text-primary" /> {/* Adjusted icon size */}
          <div>
            <h1 className="text-3xl font-headline font-bold">About Us</h1> {/* Changed from text-4xl */}
            <p className="text-muted-foreground text-md"> {/* Changed from text-lg */}
              Learn more about our organization and mission.
            </p>
          </div>
        </div>

        <Card className="shadow-xl overflow-hidden rounded-lg">
          <div className="relative h-40 md:h-56 w-full"> {/* Banner Image Container */}
            <Image
              src={coverImageUrl}
              alt={`${settings.organizationName} cover image`}
              layout="fill"
              objectFit="cover"
              priority
              data-ai-hint="abstract banner"
            />
          </div>
          <CardHeader className="bg-muted/20 border-b border-t"> {/* Added border-t for separation */}
            <div className="flex items-center gap-3">
              <Building className="h-7 w-7 text-primary" />
              <CardTitle className="text-2xl font-headline">{settings.organizationName}</CardTitle>
            </div>
             {settings.registrationNumber && (
              <CardDescription className="pt-1 pl-10">
                Registration No: {settings.registrationNumber}
              </CardDescription>
            )}
             {settings.committeePeriod && (
                <CardDescription className="pt-1 pl-10">
                    Committee Period: {settings.committeePeriod}
                </CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <InfoItem icon={<MapPin />} label="Address" value={settings.address} />
              <InfoItem icon={<Mail />} label="Contact Email" value={<a href={`mailto:${settings.contactEmail}`} className="text-primary hover:underline">{settings.contactEmail}</a>} />
              <InfoItem icon={<UserCircle />} label="Contact Person" value={settings.contactPersonName} />
              <InfoItem icon={<Phone />} label="Contact Cell" value={settings.contactPersonCell || "Not Provided"} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t mt-8">
              <LeadershipProfile
                name={settings.presidentName}
                title="President"
                imageUrl={settings.presidentImageURL}
                dataAiHint="person portrait"
              />
              <LeadershipProfile
                name={settings.secretaryName}
                title="General Secretary"
                imageUrl={settings.secretaryImageURL}
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
    <span className="text-primary mt-1 flex-shrink-0 w-5 h-5">{icon}</span>
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-md">{value}</p>
    </div>
  </div>
);

interface LeadershipProfileProps {
  name: string;
  title: string;
  imageUrl?: string;
  dataAiHint?: string;
}

const LeadershipProfile: React.FC<LeadershipProfileProps> = ({ name, title, imageUrl, dataAiHint }) => (
  <div className="flex flex-col items-center text-center p-4 bg-card rounded-lg border shadow-sm">
    <div className="relative w-32 h-32 md:w-36 md:h-36 mb-4 rounded-full overflow-hidden border-2 border-primary/50 shadow-lg">
      <Image
        src={imageUrl || `https://placehold.co/150x150.png?text=${name.charAt(0)}`}
        alt={name}
        layout="fill"
        objectFit="cover"
        data-ai-hint={dataAiHint || "person portrait"}
      />
    </div>
    <h3 className="text-xl font-semibold text-primary">{name}</h3>
    <p className="text-muted-foreground">{title}</p>
  </div>
);

    
