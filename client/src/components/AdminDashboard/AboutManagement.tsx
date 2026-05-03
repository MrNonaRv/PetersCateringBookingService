import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AboutManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: images = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/gallery-images", "about"],
    queryFn: async () => {
      const res = await fetch("/api/gallery-images?category=about", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch images");
      return res.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("images", file);
      fd.append("title", "About Image");
      fd.append("description", "About section image");
      fd.append("category", "about");
      const res = await fetch("/api/gallery-images", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Upload failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery-images", "about"] });
      toast({ title: "Uploaded", description: "About image uploaded successfully." });
    },
    onError: (e: any) => {
      toast({ title: "Upload failed", description: e.message || "Please try again.", variant: "destructive" });
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: async (id: number) => {
      // Deactivate others then activate selected
      const current = images as any[];
      for (const img of current) {
        if (img.id !== id && img.isActive) {
          await fetch(`/api/gallery-images/${img.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: false }),
            credentials: "include",
          });
        }
      }
      const res = await fetch(`/api/gallery-images/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to set active image");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery-images", "about"] });
      toast({ title: "Updated", description: "Active About image set." });
    },
    onError: (e: any) => {
      toast({ title: "Update failed", description: e.message || "Please try again.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/gallery-images/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete image");
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery-images", "about"] });
      toast({ title: "Deleted", description: "Image removed." });
    },
    onError: (e: any) => {
      toast({ title: "Delete failed", description: e.message || "Please try again.", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="px-6 py-4 border-b">
          <CardTitle className="text-lg font-medium">About Section Image</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right">Upload New</Label>
            <div className="col-span-3">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadMutation.mutate(f);
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoading ? (
              <div>Loading...</div>
            ) : (
              (images || []).map((img: any) => (
                <Card key={img.id} className="overflow-hidden">
                  <div className="relative h-40">
                    <img
                      src={img.filename.startsWith('data:') || img.filename.startsWith('http') ? img.filename : `/uploads/${img.filename}`}
                      className="w-full h-full object-cover"
                      alt={img.title}
                    />
                    {img.isActive && (
                      <div className="absolute top-2 right-2 bg-secondary text-white px-2 py-1 rounded text-xs">
                        Active
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setActiveMutation.mutate(img.id)}
                      disabled={setActiveMutation.isPending}
                    >
                      Set Active
                    </Button>
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Delete this image?")) deleteMutation.mutate(img.id);
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
