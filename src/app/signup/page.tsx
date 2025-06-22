// src/app/signup/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Handshake } from "lucide-react";
import type { AuthError } from "firebase/auth";
import { useAppContext } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

const signupFormSchema = z.object({
  displayName: z.string().min(2, { message: "Name must be at least 2 characters." }).max(50, {message: "Name must be at most 50 characters."}),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
  mobileNumber: z.string().regex(/^$|^[+]?[0-9\s-()]{7,20}$/, "Invalid mobile number format.").optional().or(z.literal('')),
  wardNo: z.string().min(1, { message: "Ward No. is required."}).max(20, {message: "Ward No. must be at most 20 characters."}),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

export default function SignupPage() {
  const { signup, loading: authLoading } = useAuth();
  const { appName } = useAppContext();
  const appLogoUrl = process.env.NEXT_PUBLIC_APP_LOGO_URL;
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
      mobileNumber: "",
      wardNo: "",
    },
    mode: "onChange",
  });

  async function onSubmit(data: SignupFormValues) {
    setIsSubmitting(true);
    // Pass all form data to the signup function
    const result = await signup(
      data.email,
      data.password,
      data.displayName,
      data.mobileNumber, // Changed from data.whatsAppNumber
      data.wardNo
    );
    setIsSubmitting(false);

    if (result && 'code' in result) { // AuthError
      const firebaseError = result as AuthError;
      let errorMessage = "Signup failed. Please try again.";
      if (firebaseError.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Try logging in.";
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format.";
      } else if (firebaseError.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please choose a stronger password.";
      }
      toast({
        title: "Signup Error",
        description: errorMessage,
        variant: "destructive",
      });
    } else if (result) { // User
      toast({
        title: "Signup Successful!",
        description: "Your account has been created. Redirecting to dashboard...",
        variant: "default",
      });
      router.push("/"); // Redirect to dashboard
    } else {
         toast({
            title: "Signup Error",
            description: "An unexpected error occurred. Please try again.",
            variant: "destructive",
          });
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <div className="flex flex-col items-center pt-6 pb-2">
            <Link href="/" passHref>
            <div className="flex flex-col items-center gap-2 cursor-pointer">
                {appLogoUrl ? (
                <Image src={appLogoUrl} alt={`${appName} Logo`} width={40} height={40} className="h-10 w-10 rounded" data-ai-hint="logo company"/>
                ) : (
                <Handshake className="h-10 w-10 text-primary" />
                )}
                <span className="text-xl font-semibold text-foreground">{appName}</span>
            </div>
            </Link>
        </div>
        <CardHeader className="text-center pt-2">
          <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
          <CardDescription>Join {appName} to start making a difference.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name <span className="text-foreground">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} disabled={isSubmitting || authLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email <span className="text-foreground">*</span></FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} disabled={isSubmitting || authLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password <span className="text-foreground">*</span></FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isSubmitting || authLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password <span className="text-foreground">*</span></FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isSubmitting || authLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobileNumber" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="Your WhatsApp Number" {...field} value={field.value ?? ""} disabled={isSubmitting || authLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="wardNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ward No. <span className="text-foreground">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Your ward number" {...field} disabled={isSubmitting || authLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className={cn(
                  "w-full",
                  "bg-specific-button-bg text-specific-button-fg hover:bg-specific-button-hover-bg"
                )}
                disabled={isSubmitting || authLoading || !form.formState.isValid}
              >
                {(isSubmitting || authLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 text-sm">
          <p>
            Already have an account?{" "}
            <Button variant="link" asChild className="p-0 h-auto text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400">
              <Link href="/login">Sign In</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
