import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GalleryManagement from "./GalleryManagement";
import { ImageIcon, Upload, Link } from "lucide-react";

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

interface ImagePickerProps {
  value?: string;
  onChange?: (url: string) => void;
  onImageSelect?: (image: GalleryImage) => void;
  label?: string;
  className?: string;
}

export default function ImagePicker({ value, onChange, onImageSelect, label = "Image", className }: ImagePickerProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState(value || "");

  const handleImageSelect = (image: GalleryImage) => {
    const imageUrl = `/uploads/${image.filename}`;
    
    if (onChange) {
      onChange(imageUrl);
    }
    
    if (onImageSelect) {
      onImageSelect(image);
    }
    
    setIsGalleryOpen(false);
  };

  const handleUrlSubmit = () => {
    if (onChange && urlInput.trim()) {
      onChange(urlInput.trim());
    }
    setIsUrlMode(false);
    setUrlInput("");
  };

  const getImageUrl = (url: string) => {
    if (url.startsWith("/uploads/")) {
      return url;
    }
    return url;
  };

  return (
    <div className={className}>
      <Label>{label}</Label>
      
      {/* Current Image Display */}
      {value && (
        <div className="mt-2 mb-4">
          <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={getImageUrl(value)}
              alt="Selected image"
              className="w-full h-full object-cover"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onChange?.("")}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white"
            >
              ×
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-1 truncate">{value}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsGalleryOpen(true)}
          className="flex-1"
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Choose from Gallery
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsUrlMode(true)}
          className="flex-1"
        >
          <Link className="h-4 w-4 mr-2" />
          Enter URL
        </Button>
      </div>

      {/* Gallery Selection Dialog */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Select Image from Gallery</DialogTitle>
          </DialogHeader>
          <div className="h-[70vh] overflow-y-auto">
            <GalleryManagement
              onSelectImage={handleImageSelect}
              selectionMode={true}
              selectedImages={[]}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* URL Input Dialog */}
      <Dialog open={isUrlMode} onOpenChange={setIsUrlMode}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Image URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUrlMode(false)}>
                Cancel
              </Button>
              <Button onClick={handleUrlSubmit} disabled={!urlInput.trim()}>
                Set Image
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}