// src/components/landing/Footer.tsx
"use client";

import Link from "next/link";
import { useAppContext } from "@/contexts/AppContext";
import { Facebook, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  const { organizationSettings } = useAppContext();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-header-background text-foreground border-t">
      <div className="container py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{organizationSettings?.organizationName || "Our Organization"}</h3>
            <p className="text-sm text-muted-foreground flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{organizationSettings?.address || "Community Address, City, Country"}</span>
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{organizationSettings?.contactPersonCell || "Not Available"}</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span>{organizationSettings?.contactEmail || "contact@example.com"}</span>
                </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Follow Us</h3>
            <div className="flex items-center space-x-4">
              <a href="https://www.facebook.com/groups/bpkt2018" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <Facebook className="h-6 w-6" />
                <span className="sr-only">Facebook Group</span>
              </a>
               <a href="https://www.facebook.com/bpjkp" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <Facebook className="h-6 w-6" />
                <span className="sr-only">Facebook Page</span>
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} {organizationSettings?.organizationName}. All rights reserved.</p>
          <p className="mt-1">
            Designed and Developed by <a href="https://vcard.mddoulat.com/iamdoulat" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-primary">Doulat</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
