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
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
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
                  <Button type="submit" className="w-full bg-primary" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </>
    </RedirectIfAuthenticated>
  );
}
