import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Image as ImageIcon } from "lucide-react";

interface GalleryImage {
  id: number;
  title: string;
  description: string;
  filename: string;
  category: string;
  isActive: boolean;
}

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const { data: images, isLoading } = useQuery<GalleryImage[]>({
    queryKey: ["/api/gallery-images"],
    queryFn: async () => {
      const res = await fetch("/api/gallery-images");
      if (!res.ok) throw new Error("Failed to fetch gallery images");
      return res.json();
    },
  });

  const activeImages = images?.filter(img => img.isActive) || [];

  const getImageUrl = (filename: string) => {
    if (filename.startsWith('data:') || filename.startsWith('http')) return filename;
    return `/uploads/${filename}`;
  };

  return (
    <section id="gallery" className="py-16 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-heading font-bold text-primary mb-4">Our Event Gallery</h2>
          <div className="w-20 h-1 bg-secondary mx-auto mb-6"></div>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Experience the memorable moments and beautiful setups from our past events.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-gray-500 font-medium">Loading our masterpiece gallery...</p>
          </div>
        ) : activeImages.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <ImageIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No images yet</h3>
            <p className="text-gray-500">We're currently preparing our gallery. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeImages.map((image) => (
              <div 
                key={image.id}
                className="group relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:shadow-xl hover:-translate-y-1"
                onClick={() => setSelectedImage(image)}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={getImageUrl(image.filename)} 
                    alt={image.title} 
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-6">
                  <h4 className="text-white font-bold text-lg mb-1 transform translate-y-4 transition-transform duration-300 group-hover:translate-y-0">
                    {image.title}
                  </h4>
                  <p className="text-white/80 text-sm line-clamp-2 transform translate-y-4 transition-transform duration-300 delay-75 group-hover:translate-y-0">
                    {image.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl p-0 max-h-[90vh] overflow-y-auto bg-white border-none sm:rounded-3xl">
            {selectedImage && (
              <div className="flex flex-col">
                <div className="relative aspect-video sm:aspect-[16/9] bg-gray-100">
                  <img 
                    src={getImageUrl(selectedImage.filename)} 
                    alt={selectedImage.title} 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-8">
                  <DialogHeader className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                        {selectedImage.category}
                      </span>
                    </div>
                    <DialogTitle className="text-3xl font-heading font-bold text-gray-900">
                      {selectedImage.title}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="prose prose-slate max-w-none">
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {selectedImage.description || "No description available for this image."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
