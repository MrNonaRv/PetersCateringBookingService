import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RecentEvent, InsertRecentEvent, insertRecentEventSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Calendar, MapPin, Users } from "lucide-react";

const formSchema = insertRecentEventSchema.extend({
  eventDate: z.string(),
  highlights: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function RecentEventsManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<RecentEvent | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data: events, isLoading } = useQuery<RecentEvent[]>({
    queryKey: ["/api/recent-events"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      eventType: "",
      eventDate: "",
      venue: "",
      guestCount: 0,
      imageUrl: "",
      highlights: "",
      featured: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertRecentEvent) => {
      return apiRequest("POST", "/api/recent-events", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recent-events"] });
      toast({
        title: "Success",
        description: "Recent event created successfully",
      });
      setIsModalOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertRecentEvent> }) => {
      return apiRequest("PUT", `/api/recent-events/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recent-events"] });
      toast({
        title: "Success",
        description: "Recent event updated successfully",
      });
      setIsModalOpen(false);
      setEditingEvent(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/recent-events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recent-events"] });
      toast({
        title: "Success",
        description: "Recent event deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const eventData: InsertRecentEvent = {
      ...data,
      highlights: data.highlights ? data.highlights.split(',').map(h => h.trim()) : [],
    };

    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: eventData });
    } else {
      createMutation.mutate(eventData);
    }
  };

  const handleEdit = (event: RecentEvent) => {
    setEditingEvent(event);
    form.reset({
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      eventDate: event.eventDate,
      venue: event.venue,
      guestCount: event.guestCount,
      imageUrl: event.imageUrl,
      highlights: event.highlights?.join(", ") || "",
      featured: Boolean(event.featured),
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreateNew = () => {
    setEditingEvent(null);
    form.reset();
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Recent Events Management</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-300 rounded-lg h-48"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recent Events Management</h2>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? "Edit Recent Event" : "Add Recent Event"}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Martinez Wedding Reception" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Detailed description of the event..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="eventType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Wedding">Wedding</SelectItem>
                            <SelectItem value="Corporate">Corporate</SelectItem>
                            <SelectItem value="Birthday">Birthday</SelectItem>
                            <SelectItem value="Anniversary">Anniversary</SelectItem>
                            <SelectItem value="Graduation">Graduation</SelectItem>
                            <SelectItem value="Holiday">Holiday</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="eventDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="venue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Venue</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Event venue location" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="guestCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guest Count</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <div className="space-y-2">
                        <FormControl>
                          <Input {...field} placeholder="https://..." />
                        </FormControl>
                        <div className="flex items-center gap-3">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                setUploadingImage(true);
                                const fd = new FormData();
                                fd.append("image", file);
                                const res = await fetch("/api/upload-image", {
                                  method: "POST",
                                  body: fd,
                                  credentials: "include",
                                });
                                if (!res.ok) throw new Error("Upload failed");
                                const data = await res.json();
                                form.setValue("imageUrl", data.url);
                                toast({
                                  title: "Image uploaded",
                                  description: "Event image URL updated.",
                                });
                              } catch (err: any) {
                                toast({
                                  title: "Upload failed",
                                  description: err.message || "Could not upload image.",
                                  variant: "destructive",
                                });
                              } finally {
                                setUploadingImage(false);
                              }
                            }}
                          />
                          {uploadingImage && <span className="text-sm">Uploading...</span>}
                        </div>
                        {field.value && (
                          <img
                            src={field.value}
                            alt="Event image"
                            className="w-full h-40 object-cover rounded border"
                          />
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="highlights"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Highlights (comma-separated)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Live cooking stations, Custom floral arrangements, Filipino-Spanish fusion menu"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Featured Event</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Featured events are highlighted on the website
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={Boolean(field.value)}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingEvent ? "Update Event" : "Create Event"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events?.map((event) => (
          <Card key={event.id} className="overflow-hidden">
            <div className="relative">
              <img 
                src={event.imageUrl} 
                alt={event.title}
                className="w-full h-32 object-cover"
              />
              {Boolean(event.featured) && (
                <Badge className="absolute top-2 right-2 bg-yellow-500">
                  Featured
                </Badge>
              )}
              <Badge variant="secondary" className="absolute top-2 left-2">
                {event.eventType}
              </Badge>
            </div>

            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{event.title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                {(() => {
                  const [y, m, d] = event.eventDate.split("-").map((v: string) => parseInt(v, 10));
                  return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString();
                })()}
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                {event.venue}
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                {event.guestCount} guests
              </div>

              <p className="text-sm text-gray-700 line-clamp-2">
                {event.description}
              </p>

              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(event)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(event.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {events?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No recent events found.</p>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Event
          </Button>
        </div>
      )}
    </div>
  );
}
