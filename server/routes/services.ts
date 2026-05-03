import { type Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { 
  insertServiceSchema, 
  insertServicePackageSchema, 
  insertDishSchema,
  insertAddOnSchema,
  insertGalleryImageSchema
} from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

export function registerServiceRoutes(app: Express) {
  // Generic Image Upload for Services
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storageMulter = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({
    storage: storageMulter,
    limits: { fileSize: 10 * 1024 * 1024 } // Increased to 10MB
  });

  app.post("/api/upload-image", isAuthenticated, upload.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }
      const imageUrl = `/uploads/${req.file.filename}`;
      res.json({ url: imageUrl });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Error uploading image" });
    }
  });

  // Services
  app.get("/api/services", async (req, res) => {
    try {
      const all = req.query.all === "true";
      const servicesList = await storage.getServices();
      if (all) {
        res.json(servicesList);
      } else {
        res.json(servicesList.filter(s => s.isActive));
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching services" });
    }
  });

  app.post("/api/services", isAuthenticated, async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error) {
      res.status(400).json({ message: "Invalid service data" });
    }
  });

  app.put("/api/services/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { id: _, ...updateData } = req.body;
      const serviceData = insertServiceSchema.partial().parse(updateData);
      const service = await storage.updateService(id, serviceData);
      if (!service) return res.status(404).json({ message: "Service not found" });
      res.json(service);
    } catch (error: any) {
      console.error("PUT /api/services error:", error);
      res.status(400).json({ message: "Invalid service data", error: error.message });
    }
  });

  app.delete("/api/services/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Try to hard delete first
      try {
        const success = await storage.deleteService(id);
        if (!success) return res.status(404).json({ message: "Service not found" });
        return res.status(200).send("Deleted");
      } catch (dbError: any) {
        // If it's a foreign key constraint error (PostgreSQL error code 23503)
        // or if it fails because of bookings/packages dependencies
        console.log(`Hard delete failed for service ${id}, attempting deactivation instead.`);
        
        // Check if the service exists
        const service = await storage.getService(id);
        if (!service) return res.status(404).json({ message: "Service not found" });

        // Deactivate instead
        await storage.updateService(id, { isActive: false });
        return res.status(200).json({ 
          message: "Service is being used by existing bookings, so it was deactivated instead of deleted to preserve history.",
          deactivated: true 
        });
      }
    } catch (error: any) {
      console.error("DELETE /api/services error:", error);
      res.status(500).json({ message: "Error processing deletion request." });
    }
  });

  // Dishes
  app.get("/api/dishes", async (req, res) => {
    try {
      const { category } = req.query;
      if (category && typeof category === 'string') {
        const dishes = await storage.getDishesByCategory(category);
        res.json(dishes);
      } else {
        const dishes = await storage.getDishes();
        res.json(dishes);
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching dishes" });
    }
  });

  app.post("/api/dishes", isAuthenticated, async (req, res) => {
    try {
      const dishData = insertDishSchema.parse(req.body);
      const dish = await storage.createDish(dishData);
      res.status(201).json(dish);
    } catch (error) {
      res.status(400).json({ message: "Invalid dish data" });
    }
  });

  app.put("/api/dishes/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { id: _, ...updateData } = req.body;
      const dishData = insertDishSchema.partial().parse(updateData);
      const dish = await storage.updateDish(id, dishData);
      if (!dish) return res.status(404).json({ message: "Dish not found" });
      res.json(dish);
    } catch (error: any) {
      console.error("PUT /api/dishes error:", error);
      res.status(400).json({ message: "Invalid dish data", error: error.message });
    }
  });

  app.delete("/api/dishes/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDish(id);
      if (!success) return res.status(404).json({ message: "Dish not found" });
      res.status(200).send("Deleted");
    } catch (error: any) {
      console.error("DELETE /api/dishes error:", error);
      res.status(500).json({ message: "Error deleting dish." });
    }
  });

  // Service Packages
  app.get("/api/service-packages", async (req, res) => {
    try {
      const { serviceId, all } = req.query;
      const includeInactive = all === "true";
      
      const [servicesList, packages] = await Promise.all([
        storage.getServices(),
        serviceId && typeof serviceId === 'string' 
          ? storage.getServicePackagesByService(parseInt(serviceId))
          : storage.getServicePackages()
      ]);

      if (includeInactive) {
        res.json(packages);
      } else {
        // Filter out packages whose parent service is inactive
        const activeServiceIds = new Set(servicesList.filter(s => s.isActive).map(s => s.id));
        res.json(packages.filter(p => activeServiceIds.has(p.serviceId)));
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching service packages" });
    }
  });

  app.post("/api/service-packages", isAuthenticated, async (req, res) => {
    try {
      const packageData = insertServicePackageSchema.parse(req.body);
      const servicePackage = await storage.createServicePackage(packageData);
      res.status(201).json(servicePackage);
    } catch (error) {
      res.status(400).json({ message: "Invalid service package data" });
    }
  });

  app.put("/api/service-packages/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { id: _, ...updateData } = req.body;
      const packageData = insertServicePackageSchema.partial().parse(updateData);
      const servicePackage = await storage.updateServicePackage(id, packageData);
      if (!servicePackage) return res.status(404).json({ message: "Package not found" });
      res.json(servicePackage);
    } catch (error: any) {
      console.error("PUT /api/service-packages error:", error);
      res.status(400).json({ message: "Invalid service package data", error: error.message });
    }
  });

  app.delete("/api/service-packages/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteServicePackage(id);
      if (!success) return res.status(404).json({ message: "Package not found" });
      res.status(200).send("Deleted");
    } catch (error: any) {
      console.error("DELETE /api/service-packages error:", error);
      res.status(500).json({ message: "Error deleting service package. It may be in use by bookings." });
    }
  });

  // Add-ons
  app.get("/api/add-ons", async (req, res) => {
    try {
      const { category } = req.query;
      if (category && typeof category === 'string') {
        const addOns = await storage.getAddOnsByCategory(category);
        res.json(addOns);
      } else {
        const addOns = await storage.getAddOns();
        res.json(addOns);
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching add-ons" });
    }
  });

  app.post("/api/add-ons", isAuthenticated, async (req, res) => {
    try {
      const addOnData = insertAddOnSchema.parse(req.body);
      const addOn = await storage.createAddOn(addOnData);
      res.status(201).json(addOn);
    } catch (error) {
      res.status(400).json({ message: "Invalid add-on data" });
    }
  });

  app.put("/api/add-ons/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { id: _, ...updateData } = req.body;
      const addOnData = insertAddOnSchema.partial().parse(updateData);
      const addOn = await storage.updateAddOn(id, addOnData);
      if (!addOn) return res.status(404).json({ message: "Add-on not found" });
      res.json(addOn);
    } catch (error: any) {
      console.error("PUT /api/add-ons error:", error);
      res.status(400).json({ message: "Invalid add-on data", error: error.message });
    }
  });

  app.delete("/api/add-ons/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAddOn(id);
      if (!success) return res.status(404).json({ message: "Add-on not found" });
      res.status(200).send("Deleted");
    } catch (error: any) {
      console.error("DELETE /api/add-ons error:", error);
      res.status(500).json({ message: "Error deleting add-on." });
    }
  });

  // Gallery


  app.get("/api/gallery-images", async (req, res) => {
    try {
      const category = req.query.category as string;
      const images = category 
        ? await storage.getGalleryImagesByCategory(category)
        : await storage.getGalleryImages();
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Error fetching gallery images" });
    }
  });

  app.post("/api/gallery-images", isAuthenticated, upload.array('images', 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) return res.status(400).json({ message: "No images uploaded" });
      
      const { title, description, category } = req.body;
      const uploadedImages = [];
      for (const file of files) {
        const image = await storage.createGalleryImage({
          title: title || file.originalname,
          description: description || "",
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          category: category || "general",
          isActive: true
        });
        uploadedImages.push(image);
      }
      res.status(201).json(uploadedImages);
    } catch (error: any) {
      console.error("Gallery Upload Error:", error);
      res.status(400).json({ 
        message: "Error uploading images", 
        error: error.message || "Unknown error" 
      });
    }
  });

  app.put("/api/gallery-images/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { id: _, ...updateData } = req.body;
      const imageData = insertGalleryImageSchema.partial().parse(updateData);
      const image = await storage.updateGalleryImage(id, imageData);
      if (!image) return res.status(404).json({ message: "Image not found" });
      res.json(image);
    } catch (error: any) {
      console.error("PUT /api/gallery-images error:", error);
      res.status(400).json({ message: "Invalid image data", error: error.message });
    }
  });

  app.delete("/api/gallery-images/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteGalleryImage(id);
      if (!success) return res.status(404).json({ message: "Image not found" });
      res.status(200).send("Deleted");
    } catch (error: any) {
      console.error("DELETE /api/gallery-images error:", error);
      res.status(500).json({ message: "Error deleting image" });
    }
  });

  app.put("/api/gallery-images/:id/replace", isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No image uploaded" });

      const image = await storage.updateGalleryImage(id, {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size
      });
      if (!image) return res.status(404).json({ message: "Image not found" });
      res.json(image);
    } catch (error: any) {
      console.error("PUT /api/gallery-images/replace error:", error);
      res.status(500).json({ message: "Error replacing image" });
    }
  });
}
