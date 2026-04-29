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
  // Services
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
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

  // Service Packages
  app.get("/api/service-packages", async (req, res) => {
    try {
      const { serviceId } = req.query;
      if (serviceId && typeof serviceId === 'string') {
        const packages = await storage.getServicePackagesByService(parseInt(serviceId));
        res.json(packages);
      } else {
        const packages = await storage.getServicePackages();
        res.json(packages);
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

  // Gallery
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadDir),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
      }
    }),
    limits: { fileSize: 5 * 1024 * 1024 }
  });

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
    } catch (error) {
      res.status(400).json({ message: "Error uploading images" });
    }
  });
}
