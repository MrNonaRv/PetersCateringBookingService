import { type Express } from "express";
import passport from "passport";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";

export function registerAuthRoutes(app: Express) {
  // Authentication endpoints
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.json({ user: req.user });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json({ user: req.user });
    }
    res.status(401).json({ message: "Not authenticated" });
  });

  // Change password endpoint
  app.post("/api/auth/change-password", isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = (req.user as any).id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password are required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const { compare, hash } = await import('bcrypt');
      const isMatch = await compare(currentPassword, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect current password" });
      }

      // Hash new password
      const hashedPassword = await hash(newPassword, 10);

      // Update user password
      await storage.updateUser(userId, { password: hashedPassword });

      res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Error updating password" });
    }
  });

  // Forgot password endpoint
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Find user by email
      const allUsers = await storage.getUsers();
      const user = allUsers.find((u: { email: string }) => u.email === email);

      if (user) {
        // In production, you would send a reset link via email.
        // For now, we just log this for demonstration.
        console.log(`Password reset requested for user: ${user.username} (${email})`);
      }

      // Always return success to prevent email enumeration
      res.json({ message: "If an account exists with this email, you will receive password reset instructions." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Error processing forgot password request" });
    }
  });
}
