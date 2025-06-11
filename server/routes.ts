import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { authenticateToken, requireRole, generateToken, type AuthRequest } from "./middleware/auth";
import { insertUserSchema, insertPostSchema, insertCommentSchema, insertReactionSchema, insertInterviewSchema } from "@shared/schema";
import { summarize } from "./utils/summarize";
import multer from "multer";
import path from "path";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|xlsx|xls|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize with seed data
  await storage.seedData();

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      const token = generateToken(user.id);
      
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(user.id);
      
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/user", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // AI Summarization route
  app.post("/api/summarize", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      const result = await summarize(text);
      res.json(result);
    } catch (error) {
      console.error("Summarization error:", error);
      res.status(500).json({ message: "Failed to generate summary" });
    }
  });

  // Post routes
  app.post("/api/posts", authenticateToken, upload.array('files'), async (req: AuthRequest, res) => {
    try {
      const postData = insertPostSchema.parse(req.body);
      
      // Handle file attachments
      const attachments = req.files ? (req.files as Express.Multer.File[]).map(file => file.filename) : [];
      
      const post = await storage.createPost({
        ...postData,
        authorId: req.user!.id,
        attachments,
      });

      const enrichedPost = await storage.getPost(post.id);
      res.json(enrichedPost);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(400).json({ message: "Failed to create post" });
    }
  });

  app.get("/api/posts", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { region, company, minMmi, minTbd, minNews, minReactions, fromDate } = req.query;
      
      let posts;
      if (company) {
        posts = await storage.getPostsByCompany(company as string);
      } else {
        const filters = {
          minMmi: minMmi ? parseInt(minMmi as string) : undefined,
          minTbd: minTbd ? parseInt(minTbd as string) : undefined,
          minNews: minNews ? parseInt(minNews as string) : undefined,
          minReactions: minReactions ? parseInt(minReactions as string) : undefined,
          fromDate: fromDate ? new Date(fromDate as string) : undefined
        };
        posts = await storage.getPosts(region as string, filters);
      }

      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/user/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const posts = await storage.getPostsByUser(userId);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ message: "Failed to fetch user posts" });
    }
  });

  app.put("/api/posts/:postId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const updateData = {
        headline: req.body.headline,
        content: req.body.content,
        company: req.body.company,
        region: req.body.region
      };
      
      const updatedPost = await storage.updatePost(postId, updateData);
      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  // Reaction routes
  app.post("/api/posts/:postId/reactions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const reactionData = insertReactionSchema.parse(req.body);
      
      const reaction = await storage.addReaction({
        ...reactionData,
        postId,
        userId: req.user!.id,
      });

      res.json(reaction);
    } catch (error) {
      console.error("Error adding reaction:", error);
      res.status(400).json({ message: "Failed to add reaction" });
    }
  });

  app.delete("/api/posts/:postId/reactions/:type", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const type = req.params.type;
      
      const removed = await storage.removeReaction(postId, req.user!.id, type);
      
      if (removed) {
        res.json({ message: "Reaction removed" });
      } else {
        res.status(404).json({ message: "Reaction not found" });
      }
    } catch (error) {
      console.error("Error removing reaction:", error);
      res.status(500).json({ message: "Failed to remove reaction" });
    }
  });

  // Comment routes
  app.post("/api/posts/:postId/comments", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const commentData = insertCommentSchema.parse(req.body);
      
      const comment = await storage.addComment({
        ...commentData,
        postId,
        userId: req.user!.id,
      });

      res.json(comment);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(400).json({ message: "Failed to add comment" });
    }
  });

  // Fund Manager routes
  app.post("/api/fund-manager/like/:postId", authenticateToken, requireRole("fund_manager"), async (req: AuthRequest, res) => {
    try {
      const postId = parseInt(req.params.postId);
      
      const like = await storage.addFundManagerLike(postId, req.user!.id);
      res.json(like);
    } catch (error) {
      console.error("Error adding fund manager like:", error);
      res.status(500).json({ message: "Failed to add like" });
    }
  });

  app.delete("/api/fund-manager/like/:postId", authenticateToken, requireRole("fund_manager"), async (req: AuthRequest, res) => {
    try {
      const postId = parseInt(req.params.postId);
      
      const removed = await storage.removeFundManagerLike(postId, req.user!.id);
      
      if (removed) {
        res.json({ message: "Like removed" });
      } else {
        res.status(404).json({ message: "Like not found" });
      }
    } catch (error) {
      console.error("Error removing fund manager like:", error);
      res.status(500).json({ message: "Failed to remove like" });
    }
  });

  app.get("/api/fund-manager/liked-posts", authenticateToken, requireRole("fund_manager"), async (req: AuthRequest, res) => {
    try {
      const posts = await storage.getFundManagerLikedPosts(req.user!.id);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching liked posts:", error);
      res.status(500).json({ message: "Failed to fetch liked posts" });
    }
  });

  // Interview routes
  app.post("/api/interviews", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const interviewData = insertInterviewSchema.parse(req.body);
      
      const interview = await storage.createInterview({
        ...interviewData,
        addedBy: req.user!.id,
      });

      res.json(interview);
    } catch (error) {
      console.error("Error creating interview:", error);
      res.status(400).json({ message: "Failed to create interview" });
    }
  });

  app.get("/api/interviews", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const interviews = await storage.getInterviews();
      res.json(interviews);
    } catch (error) {
      console.error("Error fetching interviews:", error);
      res.status(500).json({ message: "Failed to fetch interviews" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
