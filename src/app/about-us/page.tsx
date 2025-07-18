// src/app/about-us/page.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Info, MapPin, Building, Phone, Mail, UserCircle, Users, CalendarRange, AlertCircle, CalendarCheck, FileText, Loader2, ServerCrash } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import type { OrganizationSettingsData } from "@/services/organizationSettingsService";
import { getAdvisoryBoardMembers, type AdvisoryBoardMemberData } from "@/services/advisoryBoardService";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Alert, AlertTitle as ShadcnAlertTitle, AlertDescription as ShadcnAlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function AboutUsPage() {
  const { organizationSettings, isLoadingAppSettings } = useAppContext();
  const [settingsToDisplay, setSettingsToDisplay] = React.useState<OrganizationSettingsData | null>(null);
  const [advisoryBoardMembers, setAdvisoryBoardMembers] = React.useState<AdvisoryBoardMemberData[]>([]);
  const [isLoadingAdvisory, setIsLoadingAdvisory] = React.useState(true);
  const [advisoryError, setAdvisoryError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isLoadingAppSettings && organizationSettings) {
      setSettingsToDisplay(organizationSettings);
    }
  }, [organizationSettings, isLoadingAppSettings]);

  React.useEffect(() => {
    async function fetchAdvisoryData() {
      setIsLoadingAdvisory(true);
      setAdvisoryError(null);
      try {
        const members = await getAdvisoryBoardMembers();
        setAdvisoryBoardMembers(members);
      } catch (error) {
        console.error("Failed to load advisory board members:", error);
        let message = "An unknown error occurred while fetching advisory board members.";
        if (error instanceof Error) {
            message = error.message;
            if (message.includes("permission denied")) {
                message = "Could not load advisory board: Permission denied. Please check Firestore rules for 'siteContent/organizationDetails/advisoryBoardMembers'.";
            }
        }
        setAdvisoryError(message);
      } finally {
        setIsLoadingAdvisory(false);
      }
    }
    fetchAdvisoryData();
  }, []);

  const coverImageUrlToUse = settingsToDisplay?.coverImageUrl || "https://placehold.co/1200x500.png";

  // Combined loading state for initial page skeleton
  if (isLoadingAppSettings || !settingsToDisplay) { 
    return (
      <AppShell>
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8 overflow-auto pb-20 md:pb-8">
          <Skeleton className="h-10 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Card className="shadow-lg">
            <Skeleton className="h-48 md:h-56 w-full rounded-t-lg" />
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
                    <Skeleton className="h-4 w-20 mt-1" />
                  </div>
                ))}
              </div>
              <div className="pt-8 mt-8 border-t">
                <Skeleton className="h-7 w-1/3 mx-auto mb-6" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(3)].map((_,i) => (
                    <div key={i} className="p-1"><Skeleton className="h-48 w-full" /></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </AppShell>
    );
  }
  
  if (!settingsToDisplay.organizationName && !isLoadingAppSettings) {
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
            <p className="text-muted-foreground text-md">Learn more about our organization.</p>
          </div>
        </div>

        <Card className="shadow-xl overflow-hidden rounded-lg">
          <div className="relative h-48 md:h-56 w-full">
            <Image src={coverImageUrlToUse} alt={`${settingsToDisplay.organizationName || 'Organization'} cover image`} layout="fill" objectFit="cover" priority data-ai-hint="organization banner abstract"/>
          </div>
          <CardHeader className="bg-muted/20 border-b border-t">
            <div className="flex items-center gap-3">
              <Building className="h-7 w-7 text-green-600" />
              <CardTitle className="text-2xl font-headline">{settingsToDisplay.organizationName}</CardTitle>
            </div>
            {(settingsToDisplay.registrationNumber || settingsToDisplay.establishedYear) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 pt-1 pl-10">
                {settingsToDisplay.registrationNumber && (<div className="flex items-center"><FileText className="h-4 w-4 mr-1.5 text-muted-foreground" /><CardDescription>Registration No: {settingsToDisplay.registrationNumber}</CardDescription></div>)}
                {settingsToDisplay.establishedYear && (<div className="flex items-center"><CalendarCheck className="h-4 w-4 mr-1.5 text-muted-foreground" /><CardDescription>Established: {settingsToDisplay.establishedYear}</CardDescription></div>)}
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
            {settingsToDisplay.committeePeriod && (<div className="text-center pt-6 mt-4 border-t"><p className="text-lg font-semibold text-foreground">Committee Period: {settingsToDisplay.committeePeriod}</p></div>)}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t mt-4">
              <LeadershipProfile name={settingsToDisplay.presidentName} title="President" imageUrl={settingsToDisplay.presidentImageURL} mobileNumber={settingsToDisplay.presidentMobileNumber} dataAiHint="person portrait"/>
              <LeadershipProfile name={settingsToDisplay.secretaryName} title="General Secretary" imageUrl={settingsToDisplay.secretaryImageURL} mobileNumber={settingsToDisplay.secretaryMobileNumber} dataAiHint="person portrait"/>
            </div>

            <div className="pt-8 mt-8 border-t">
              <h2 className="text-2xl font-headline font-bold text-foreground mb-6 text-center">Advisory Board</h2>
              {isLoadingAdvisory ? (
                 <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : advisoryError ? (
                  <Alert variant="destructive" className="max-w-lg mx-auto">
                    <ServerCrash className="h-5 w-5" />
                    <ShadcnAlertTitle>Error Loading Advisory Board</ShadcnAlertTitle>
                    <ShadcnAlertDescription>
                      {advisoryError}
                      {/* <p className="mt-2 text-xs">If this persists, please check the console for details or contact an administrator. Ensure Firestore permissions allow reading `siteContent/organizationDetails/advisoryBoardMembers`.</p> */}
                    </ShadcnAlertDescription>
                  </Alert>
              ) : advisoryBoardMembers.length > 0 ? (
                <Carousel opts={{ align: "start", loop: advisoryBoardMembers.length > 2 }} className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl mx-auto">
                  <CarouselContent className="-ml-4">
                    {advisoryBoardMembers.map((member) => (
                      <CarouselItem key={member.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                        <div className="p-1 h-full">
                          <Card className="shadow-md h-full flex flex-col bg-card hover:shadow-lg transition-shadow">
                            <CardContent className="flex flex-col items-center justify-start p-4 sm:p-6 flex-grow">
                              <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-4 rounded-full overflow-hidden border-2 border-primary/40 shadow-sm">
                                <Image src={member.imageUrl || `https://placehold.co/150x150.png?text=${member.name ? member.name.charAt(0) : 'A'}`} alt={member.name || 'Advisory Member'} layout="fill" objectFit="cover" data-ai-hint="person portrait"/>
                              </div>
                              <p className="text-md sm:text-lg font-semibold text-center text-foreground">{member.name}</p>
                              <p className="text-xs sm:text-sm text-muted-foreground text-center mt-1">{member.title}</p>
                            </CardContent>
                          </Card>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {advisoryBoardMembers.length > 1 && (<>
                      <CarouselPrevious className="absolute left-[-15px] sm:left-[-25px] md:left-[-35px] top-1/2 -translate-y-1/2 hidden md:flex text-foreground hover:text-primary disabled:opacity-50" />
                      <CarouselNext className="absolute right-[-15px] sm:right-[-25px] md:right-[-35px] top-1/2 -translate-y-1/2 hidden md:flex text-foreground hover:text-primary disabled:opacity-50" />
                  </>)}
                </Carousel>
              ) : (
                 <p className="text-muted-foreground text-center">Advisory board members will be listed here soon.</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Previous Committee Accordion */}
        <Card className="shadow-lg mt-8 text-center">
          <CardHeader className="text-center">
            <CardTitle>PREVIOUS COMMITTEE</CardTitle>
            <CardDescription>
            Period - 2018-2026
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion
              type="single"
              collapsible
              className="w-full"
              defaultValue="item-1"
            >
              <AccordionItem value="item-1">
                <AccordionTrigger>2025-2026</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    {/* President Profile */}
                    <div className="flex flex-col items-center text-center p-4 bg-muted/20 rounded-lg border">
                      <div className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-2 border-primary/40">
                        <Image src="https://firebasestorage.googleapis.com/v0/b/impactboard-opo8r.firebasestorage.app/o/organization%2ForganizationDetails%2Fpresident_image.png?alt=media&token=92d6d216-d1c3-44ea-a13c-2d336a74aaed" alt="President 2025-2026" layout="fill" objectFit="cover" data-ai-hint="person portrait" />
                      </div>
                      <h4 className="text-lg font-semibold">মোহাম্মদ আবদুল্লাহ বিন হক</h4>
                      <p className="text-muted-foreground">President</p>
                    </div>
                    {/* Secretary Profile */}
                    <div className="flex flex-col items-center text-center p-4 bg-muted/20 rounded-lg border">
                      <div className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-2 border-primary/40">
                        <Image src="https://firebasestorage.googleapis.com/v0/b/impactboard-opo8r.firebasestorage.app/o/organization%2ForganizationDetails%2Fsecretary_image.png?alt=media&token=3bc40b95-56c3-4dbe-9907-8d3b6b512c05" alt="General Secretary 2025-2026" layout="fill" objectFit="cover" data-ai-hint="person portrait" />
                      </div>
                      <h4 className="text-lg font-semibold">মোহাম্মদ আবু বকর সিদ্দিক</h4>
                      <p className="text-muted-foreground">General Secretary</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>2023-2024</AccordionTrigger>
                <AccordionContent>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    {/* President Profile */}
                    <div className="flex flex-col items-center text-center p-4 bg-muted/20 rounded-lg border">
                      <div className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-2 border-primary/40">
                        <Image src="https://placehold.co/150x150.png" alt="President 2023-2024" layout="fill" objectFit="cover" data-ai-hint="person portrait" />
                      </div>
                      <h4 className="text-lg font-semibold">মোঃ জহির চৌধুরী</h4>
                      <p className="text-muted-foreground">President</p>
                    </div>
                    {/* Secretary Profile */}
                    <div className="flex flex-col items-center text-center p-4 bg-muted/20 rounded-lg border">
                      <div className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-2 border-primary/40">
                        <Image src="https://placehold.co/150x150.png" alt="General Secretary 2023-2024" layout="fill" objectFit="cover" data-ai-hint="person portrait" />
                      </div>
                      <h4 className="text-lg font-semibold">নুর ইমরান ইমু তালুকদার</h4>
                      <p className="text-muted-foreground">General Secretary</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>2021-2022</AccordionTrigger>
                <AccordionContent>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    {/* President Profile */}
                    <div className="flex flex-col items-center text-center p-4 bg-muted/20 rounded-lg border">
                      <div className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-2 border-primary/40">
                        <Image src="https://placehold.co/150x150.png" alt="President 2021-2022" layout="fill" objectFit="cover" data-ai-hint="person portrait" />
                      </div>
                      <h4 className="text-lg font-semibold">মোঃ জহির চৌধুরী</h4>
                      <p className="text-muted-foreground">President</p>
                    </div>
                    {/* Secretary Profile */}
                    <div className="flex flex-col items-center text-center p-4 bg-muted/20 rounded-lg border">
                      <div className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-2 border-primary/40">
                        <Image src="https://placehold.co/150x150.png" alt="General Secretary 2021-2022" layout="fill" objectFit="cover" data-ai-hint="person portrait" />
                      </div>
                      <h4 className="text-lg font-semibold">মোঃ আবু বক্কর</h4>
                      <p className="text-muted-foreground">General Secretary</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>2019-2020</AccordionTrigger>
                <AccordionContent>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    {/* President Profile */}
                    <div className="flex flex-col items-center text-center p-4 bg-muted/20 rounded-lg border">
                      <div className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-2 border-primary/40">
                        <Image src="https://placehold.co/150x150.png" alt="President 2019-2020" layout="fill" objectFit="cover" data-ai-hint="person portrait" />
                      </div>
                      <h4 className="text-lg font-semibold">মোঃ লোকমান হোসেন</h4>
                      <p className="text-muted-foreground">President</p>
                    </div>
                    {/* Secretary Profile */}
                    <div className="flex flex-col items-center text-center p-4 bg-muted/20 rounded-lg border">
                      <div className="relative w-28 h-28 mb-4 rounded-full overflow-hidden border-2 border-primary/40">
                        <Image src="https://placehold.co/150x150.png" alt="General Secretary 2019-2020" layout="fill" objectFit="cover" data-ai-hint="person portrait" />
                      </div>
                      <h4 className="text-lg font-semibold">নুর ইমরান ইমু তালুকদার</h4>
                      <p className="text-muted-foreground">General Secretary</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}

interface InfoItemProps { icon: React.ReactNode; label: string; value: React.ReactNode; }
const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value }) => (<div className="flex items-start space-x-3"><span className="mt-1 flex-shrink-0 w-5 h-5">{icon}</span><div><p className="text-sm font-medium text-muted-foreground">{label}</p><p className="text-md text-foreground">{value}</p></div></div>);

interface LeadershipProfileProps { name?: string | null; title?: string | null; imageUrl?: string | null; mobileNumber?: string | null; dataAiHint?: string; }
const LeadershipProfile: React.FC<LeadershipProfileProps> = ({ name, title, imageUrl, mobileNumber, dataAiHint }) => (<div className="flex flex-col items-center text-center p-4 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow"><div className="relative w-32 h-32 md:w-36 md:h-36 mb-4 rounded-full overflow-hidden border-2 border-primary/50 shadow-lg"><Image src={imageUrl || `https://placehold.co/150x150.png?text=${name ? name.charAt(0) : 'L'}`} alt={name || 'Leader'} layout="fill" objectFit="cover" data-ai-hint={dataAiHint || "person portrait"}/></div><h3 className="text-xl font-semibold text-foreground">{name || "Not Provided"}</h3><p className="text-muted-foreground">{title || "N/A"}</p>{mobileNumber && (<div className="flex items-center mt-1.5 text-sm text-muted-foreground"><Phone className="h-4 w-4 mr-1.5 text-green-600/80" />{mobileNumber}</div>)}</div>);
