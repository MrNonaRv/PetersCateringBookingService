import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { RedirectIfAuthenticated } from "@/components/providers/ProtectedRoute";
import { Helmet } from "react-helmet-async";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mail, ArrowLeft } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormValues) => {
      const res = await apiRequest('POST', '/api/auth/forgot-password', data);
      return res.json();
    },
    onSuccess: () => {
      setResetEmailSent(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "If an account exists with this email, you will receive password reset instructions.",
        variant: "default",
      });
      setResetEmailSent(true);
    }
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    
    try {
      await login(data.username, data.password);
      toast({
        title: "Login successful",
        description: "Welcome to the admin dashboard",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function onForgotPasswordSubmit(data: ForgotPasswordFormValues) {
    forgotPasswordMutation.mutate(data);
  }

  function handleCloseForgotPassword() {
    setShowForgotPassword(false);
    setResetEmailSent(false);
    forgotPasswordForm.reset();
  }

  return (
    <RedirectIfAuthenticated>
      <>
        <Helmet>
          <title>Admin Login | Peter's Creation Catering</title>
          <meta name="description" content="Login to the admin dashboard for Peter's Creation Catering Services." />
        </Helmet>
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="space-y-1">
              <div className="flex flex-col items-center">
                <h1 className="text-2xl font-heading font-bold text-primary">Peter's Creation</h1>
                <span className="text-secondary font-accent">Catering Services</span>
              </div>
              <CardTitle className="text-xl font-medium text-center mt-4">Admin Login</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="admin" {...field} />
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
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Button type="submit" className="w-full bg-primary" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <Dialog open={showForgotPassword} onOpenChange={handleCloseForgotPassword}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {resetEmailSent ? "Check Your Email" : "Forgot Password"}
              </DialogTitle>
              <DialogDescription>
                {resetEmailSent 
                  ? "If an account exists with the email you provided, you will receive password reset instructions shortly."
                  : "Enter your email address and we'll send you instructions to reset your password."
                }
              </DialogDescription>
            </DialogHeader>
            
            {!resetEmailSent ? (
              <Form {...forgotPasswordForm}>
                <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={forgotPasswordForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="admin@peterscreation.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCloseForgotPassword}
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Login
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-primary"
                      disabled={forgotPasswordMutation.isPending}
                    >
                      {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-800 text-sm">
                    Password reset instructions have been sent to your email. Please check your inbox and spam folder.
                  </p>
                </div>
                <Button 
                  onClick={handleCloseForgotPassword}
                  className="w-full bg-primary"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    </RedirectIfAuthenticated>
  );
}
