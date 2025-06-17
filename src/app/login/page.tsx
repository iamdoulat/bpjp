// src/app/login/page.tsx
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
import { Loader2, LogIn, Handshake, MailQuestion } from "lucide-react"; // Added MailQuestion
import type { AuthError } from "firebase/auth";
import { useAppContext } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"; // Import Dialog components

const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const forgotPasswordSchema = z.object({
  resetEmail: z.string().email({ message: "Please enter a valid email address." }),
});
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function LoginPage() {
  const { login, loading: authLoading, sendPasswordReset } = useAuth(); // Added sendPasswordReset
  const { appName } = useAppContext();
  const appLogoUrl = process.env.NEXT_PUBLIC_APP_LOGO_URL;
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [isForgotPasswordDialogOpen, setIsForgotPasswordDialogOpen] = React.useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = React.useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      resetEmail: "",
    },
    mode: "onChange",
  });


  async function onLoginSubmit(data: LoginFormValues) {
    setIsSubmitting(true);
    const result = await login(data.email, data.password);
    setIsSubmitting(false);

    if (result && 'code' in result) { // AuthError
      const firebaseError = result as AuthError;
      let errorMessage = "Login failed. Please check your credentials.";
      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password.";
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format.";
      }
      toast({
        title: "Login Error",
        description: errorMessage,
        variant: "destructive",
      });
    } else if (result) { // User
      toast({
        title: "Login Successful",
        description: "Welcome back!",
        variant: "default",
      });
      router.push("/"); // Redirect to dashboard
    } else {
        toast({
            title: "Login Error",
            description: "An unexpected error occurred. Please try again.",
            variant: "destructive",
          });
    }
  }

  async function onForgotPasswordSubmit(data: ForgotPasswordFormValues) {
    setIsSendingResetEmail(true);
    const result = await sendPasswordReset(data.resetEmail);
    setIsSendingResetEmail(false);

    if (result.success) {
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your email for instructions to reset your password.",
        variant: "default",
      });
      setIsForgotPasswordDialogOpen(false);
      forgotPasswordForm.reset();
    } else {
      let errorMessage = "Failed to send password reset email. Please try again.";
      if (result.error && 'code' in result.error) {
        const firebaseError = result.error as AuthError;
        if (firebaseError.code === 'auth/user-not-found') {
          errorMessage = "No user found with this email address.";
        } else if (firebaseError.code === 'auth/invalid-email') {
          errorMessage = "Invalid email format.";
        }
      }
      toast({
        title: "Error",
        description: errorMessage,
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
          <CardTitle className="text-2xl font-headline">Welcome Back!</CardTitle>
          <CardDescription>Sign in to access your {appName} dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} disabled={isSubmitting || authLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isSubmitting || authLoading} />
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
                disabled={isSubmitting || authLoading || !loginForm.formState.isValid}
              >
                {(isSubmitting || authLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-sm pt-4">
          <p className="text-center sm:text-left">
            Don&apos;t have an account?{" "}
            <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </p>
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto text-sm"
            onClick={() => setIsForgotPasswordDialogOpen(true)}
            disabled={isSubmitting || authLoading}
          >
            Forgot Password?
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isForgotPasswordDialogOpen} onOpenChange={setIsForgotPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
                <MailQuestion className="mr-2 h-5 w-5 text-primary"/>
                Reset Your Password
            </DialogTitle>
            <DialogDescription>
              Enter your email address below and we&apos;ll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <Form {...forgotPasswordForm}>
            <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4 pt-2">
              <FormField
                control={forgotPasswordForm.control}
                name="resetEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} disabled={isSendingResetEmail} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isSendingResetEmail}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={isSendingResetEmail || !forgotPasswordForm.formState.isValid}>
                  {isSendingResetEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Email
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
