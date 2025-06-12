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
import { Loader2, LogIn, Handshake } from "lucide-react";
import type { AuthError } from "firebase/auth";
import { useAppContext } from "@/contexts/AppContext";

const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const { login, loading: authLoading } = useAuth();
  const { appName } = useAppContext();
  const appLogoUrl = process.env.NEXT_PUBLIC_APP_LOGO_URL;
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  async function onSubmit(data: LoginFormValues) {
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-8">
        <Link href="/" passHref>
          <div className="flex items-center gap-2 cursor-pointer text-lg sm:text-xl font-semibold text-primary">
            {appLogoUrl ? (
              <Image src={appLogoUrl} alt={`${appName} Logo`} width={32} height={32} className="h-7 w-7 sm:h-8 sm:w-8 rounded flex-shrink-0" data-ai-hint="logo company"/>
            ) : (
              <Handshake className="h-7 w-7 sm:h-8 sm:w-8" />
            )}
            <span>{appName}</span>
          </div>
        </Link>
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Welcome Back!</CardTitle>
          <CardDescription>Sign in to access your {appName} dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
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
                control={form.control}
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
              <Button type="submit" className="w-full" disabled={isSubmitting || authLoading || !form.formState.isValid}>
                {(isSubmitting || authLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 text-sm">
          <p>
            Don&apos;t have an account?{" "}
            <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
