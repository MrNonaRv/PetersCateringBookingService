import { useState } from "react";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Contact form schema
const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(5, "Please enter a valid phone number"),
  message: z.string().min(10, "Message must be at least 10 characters")
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: ""
    }
  });

  // Handle form submission
  function onSubmit(data: ContactFormValues) {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log("Contact form data:", data);
      
      // Show success message
      toast({
        title: "Message Sent",
        description: "Thank you for contacting us. We'll get back to you soon!",
      });
      
      // Reset form
      form.reset();
      setIsSubmitting(false);
    }, 1000);
  }

  return (
    <section id="contact" className="py-16 bg-primary bg-opacity-10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-heading font-bold text-primary mb-2">Contact Us</h2>
          <p className="text-[#343a40] max-w-2xl mx-auto">Have questions or ready to book? Get in touch with us</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/2">
            <Card className="bg-white p-8 rounded-lg shadow-md">
              <CardContent className="p-0">
                <h3 className="text-xl font-heading font-bold text-primary mb-4">Send Us a Message</h3>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input type="tel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea rows={4} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-opacity-90 text-white font-accent"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:w-1/2">
            <Card className="bg-white p-8 rounded-lg shadow-md h-full">
              <CardContent className="p-0">
                <h3 className="text-xl font-heading font-bold text-primary mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <i className="fas fa-map-marker-alt text-secondary mt-1 mr-3"></i>
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-[#343a40]">The Grand Venue Brgy. Atiplo</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <i className="fas fa-phone-alt text-secondary mt-1 mr-3"></i>
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-[#343a40]">0998 579 7571</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <i className="fas fa-envelope text-secondary mt-1 mr-3"></i>
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-[#343a40]">peterscreation2016@gmail.com</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <i className="fas fa-clock text-secondary mt-1 mr-3"></i>
                    <div>
                      <p className="font-medium">Business Hours</p>
                      <p className="text-[#343a40]">Monday - Friday: 9:00 AM - 5:00 PM</p>
                      <p className="text-[#343a40]">Saturday: 10:00 AM - 3:00 PM</p>
                      <p className="text-[#343a40]">Sunday: By appointment only</p>
                      <p className="text-[#343a40] mt-2 italic">Please call for consultations</p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <p className="font-medium mb-2">Follow us on social media</p>
                    <div className="flex items-center">
                      <a href="https://www.facebook.com/peterscreation2016?mibextid=rS40aB7S9Ucbxw6v" target="_blank" rel="noopener noreferrer" className="flex items-center text-primary hover:text-secondary transition">
                        <i className="fab fa-facebook-f text-xl mr-2"></i>
                        <span>Peter's Creation Catering Services</span>
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
