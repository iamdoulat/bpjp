// src/components/landing/Footer.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useAppContext } from "@/contexts/AppContext";
import { Facebook, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  const { organizationSettings, appName } = useAppContext();
  const currentYear = new Date().getFullYear();
  const appLogoUrl = process.env.NEXT_PUBLIC_APP_LOGO_URL;

  return (
    <footer className="bg-header-background text-foreground border-t">
      <div className="container py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {appLogoUrl && (
                <Image
                  src={appLogoUrl}
                  alt={`${appName} Logo`}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded"
                  data-ai-hint="logo company"
                />
              )}
              <h3 className="text-lg font-semibold text-black dark:text-foreground">
                {organizationSettings?.organizationName || "Our Organization"}
              </h3>
            </div>
            <p className="text-sm text-black dark:text-muted-foreground flex items-start gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-600 text-white flex-shrink-0">
                <MapPin className="h-4 w-4" />
              </div>
              <span>
                {organizationSettings?.address ||
                  "Community Address, City, Country"}
              </span>
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black dark:text-foreground">
              Contact Us
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-3 text-black dark:text-muted-foreground">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-600 text-white">
                    <Phone className="h-4 w-4" />
                </div>
                <span>{organizationSettings?.contactPersonCell || "Not Available"}</span>
              </li>
              <li className="flex items-center gap-3 text-black dark:text-muted-foreground">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-600 text-white">
                    <Mail className="h-4 w-4" />
                </div>
                <span>{organizationSettings?.contactEmail || "contact@example.com"}</span>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-black dark:text-foreground">
              Follow Us
            </h3>
            <div className="flex items-center space-x-4">
              <a
                href="https://www.facebook.com/groups/bpkt2018"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                aria-label="Facebook Group"
              >
                <Facebook className="h-6 w-6" />
                <span className="sr-only">Facebook Group</span>
              </a>
              <a
                href="https://www.facebook.com/bpjkp"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                aria-label="Facebook Page"
              >
                <Facebook className="h-6 w-6" />
                <span className="sr-only">Facebook Page</span>
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-black dark:text-muted-foreground">
          <p>
            &copy; {currentYear} {organizationSettings?.organizationName}. All rights reserved.
          </p>
          <p className="mt-1">
            Designed and Developed by{" "}
            <a
              href="https://vcard.mddoulat.com/iamdoulat"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-black dark:text-foreground hover:text-primary"
            >
              Doulat
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
