import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Edit, Trash2, Image as ImageIcon, Eye, Check, X } from "lucide-react";

interface GalleryImage {
  id: number;
  title: string;
  description: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  isActive: boolean;
  createdAt: string;
}

interface GalleryManagementProps {
  onSelectImage?: (image: GalleryImage) => void;
  selectedImages?: number[];
  selectionMode?: boolean;
}

export default function GalleryManagement({ onSelectImage, selectedImages = [], selectionMode = false }: GalleryManagementProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<GalleryImage | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    category: "general"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getImageUrl = (filename: string) => {
    return `/uploads/${filename}`;
  };

  // Fetch gallery images
  const { data: images, isLoading } = useQuery({
    queryKey: ['/api/gallery-images', selectedCategory],
    queryFn: async () => {
      const url = selectedCategory === "all" ? '/api/gallery-images' : `/api/gallery-images?category=${selectedCategory}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch gallery images');
      return res.json();
    },
  });

  // Upload images mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/gallery-images', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload images');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gallery-images'] });
      toast({
        title: "Images uploaded",
        description: "Your images have been uploaded successfully.",
      });
      setIsUploadDialogOpen(false);
      resetUploadForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update image mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest('PUT', `/api/gallery-images/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gallery-images'] });
      toast({
        title: "Image updated",
        description: "The image has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setCurrentImage(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update the image. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: async (imageId: number) => {
      return apiRequest('DELETE', `/api/gallery-images/${imageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gallery-images'] });
      toast({
        title: "Image deleted",
        description: "The image has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetUploadForm = () => {
    setUploadForm({
      title: "",
      description: "",
      category: "general"
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = () => {
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one image to upload.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('images', file);
    });
    formData.append('title', uploadForm.title);
    formData.append('description', uploadForm.description);
    formData.append('category', uploadForm.category);

    uploadMutation.mutate(formData);
  };

  const handleEditImage = (image: GalleryImage) => {
    setCurrentImage(image);
    setIsEditDialogOpen(true);
  };

  const handleUpdateImage = () => {
    if (!currentImage) return;

    updateMutation.mutate({
      id: currentImage.id,
      data: {
        title: currentImage.title,
        description: currentImage.description,
        category: currentImage.category,
        isActive: currentImage.isActive
      }
    });
  };

  const replaceImageMutation = useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`/api/gallery-images/${id}/replace`, {
        method: "PUT",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to replace image");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gallery-images'] });
      toast({
        title: "Image replaced",
        description: "The image file has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to replace the image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteImage = (imageId: number) => {
    if (confirm("Are you sure you want to delete this image?")) {
      deleteMutation.mutate(imageId);
    }
  };

  const handleSelectImage = (image: GalleryImage) => {
    if (onSelectImage) {
      onSelectImage(image);
    }
  };

  const isSelected = (imageId: number) => {
    return selectedImages.includes(imageId);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold text-primary">Gallery Management</h2>
          <p className="text-gray-600">Upload and manage Peter's creation images</p>
        </div>
        {!selectionMode && (
          <Button onClick={() => setIsUploadDialogOpen(true)} className="bg-primary hover:bg-secondary">
            <Upload className="h-4 w-4 mr-2" />
            Upload Images
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Filter by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="about">About Section</SelectItem>
                <SelectItem value="wedding">Weddings</SelectItem>
                <SelectItem value="corporate">Corporate Events</SelectItem>
                <SelectItem value="birthday">Birthday Parties</SelectItem>
                <SelectItem value="private">Private Dinners</SelectItem>
              </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Images Grid */}
      <div className="grid gap-6">
        {isLoading ? (
          <div className="text-center py-8">Loading images...</div>
        ) : images?.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No images found</h3>
              <p className="text-gray-500 mb-4">
                {selectedCategory === "all" ? "No images uploaded yet." : `No images in ${selectedCategory} category.`}
              </p>
              {!selectionMode && (
                <Button onClick={() => setIsUploadDialogOpen(true)} className="bg-primary hover:bg-secondary">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Images
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {images?.map((image: GalleryImage) => (
              <Card key={image.id} className={`overflow-hidden group ${selectionMode ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''} ${isSelected(image.id) ? 'ring-2 ring-primary' : ''}`}>
                <div
                  className={`relative ${!selectionMode ? 'cursor-pointer' : ''}`}
                  onClick={() => selectionMode ? handleSelectImage(image) : handleEditImage(image)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      selectionMode ? handleSelectImage(image) : handleEditImage(image);
                    }
                  }}
                  role="button"
                  aria-label={selectionMode ? 'Select image' : 'Edit image'}
                >
                  <img
                    src={getImageUrl(image.filename)}
                    alt={image.title}
                    className="w-full h-48 object-cover"
                  />
                  {!image.isActive && (
                    <Badge variant="destructive" className="absolute top-2 right-2">
                      Inactive
                    </Badge>
                  )}
                  {selectionMode && (
                    <div className="absolute top-2 left-2">
                      {isSelected(image.id) ? (
                        <div className="bg-primary text-white rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="bg-white bg-opacity-80 rounded-full p-1">
                          <div className="h-4 w-4 border-2 border-gray-400 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  )}
                  {!selectionMode && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditImage(image)}
                        className="bg-white bg-opacity-80 hover:bg-opacity-100"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteImage(image.id)}
                        className="bg-white bg-opacity-80 hover:bg-opacity-100 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h4 className="font-semibold text-sm mb-1 truncate">{image.title}</h4>
                  {image.description && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{image.description}</p>
                  )}
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <Badge variant="outline" className="text-xs">
                      {image.category}
                    </Badge>
                    <span>{formatFileSize(image.size)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
        setIsUploadDialogOpen(open);
        if (!open) resetUploadForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Images</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="images">Select Images</Label>
              <Input
                id="images"
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                value={uploadForm.title}
                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Image title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Image description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={uploadForm.category} onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="about">About Section</SelectItem>
                <SelectItem value="wedding">Weddings</SelectItem>
                <SelectItem value="corporate">Corporate Events</SelectItem>
                <SelectItem value="birthday">Birthday Parties</SelectItem>
                <SelectItem value="private">Private Dinners</SelectItem>
              </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) setCurrentImage(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
          </DialogHeader>

          {currentImage && (
            <div className="space-y-4">
              <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={getImageUrl(currentImage.filename)}
                  alt={currentImage.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <Label htmlFor="replaceFile">Replace Image</Label>
                <Input
                  id="replaceFile"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && currentImage) {
                      replaceImageMutation.mutate({ id: currentImage.id, file: f });
                    }
                  }}
                />
              </div>

              <div>
                <Label htmlFor="editTitle">Title</Label>
                <Input
                  id="editTitle"
                  value={currentImage.title}
                  onChange={(e) => setCurrentImage(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
              </div>

              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={currentImage.description || ""}
                  onChange={(e) => setCurrentImage(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="editCategory">Category</Label>
                <Select value={currentImage.category} onValueChange={(value) => setCurrentImage(prev => prev ? { ...prev, category: value } : null)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="wedding">Weddings</SelectItem>
                    <SelectItem value="corporate">Corporate Events</SelectItem>
                    <SelectItem value="birthday">Birthday Parties</SelectItem>
                    <SelectItem value="private">Private Dinners</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="editActive"
                  checked={currentImage.isActive}
                  onCheckedChange={(checked) => setCurrentImage(prev => prev ? { ...prev, isActive: checked } : null)}
                />
                <Label htmlFor="editActive">Image is active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateImage} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
