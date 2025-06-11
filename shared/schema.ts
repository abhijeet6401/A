import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["analyst", "fund_manager"] }).notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull(),
  company: text("company").notNull(),
  region: text("region", { enum: ["india", "asia", "developed_markets"] }).notNull(),
  content: text("content").notNull(),
  headline: text("headline").notNull(),
  summary: text("summary").notNull(),
  attachments: text("attachments").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reactions = pgTable("reactions", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  type: text("type", { enum: ["mmi", "tbd", "news"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fundManagerLikes = pgTable("fund_manager_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  region: text("region", { enum: ["india", "asia", "developed_markets"] }).notNull(),
  source: text("source").notNull(),
  link: text("link").notNull(),
  summary: text("summary").notNull(),
  addedBy: integer("added_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  authorId: true,
  createdAt: true,
});

export const insertReactionSchema = createInsertSchema(reactions).omit({
  id: true,
  postId: true,
  userId: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  postId: true,
  userId: true,
  createdAt: true,
});

export const insertInterviewSchema = createInsertSchema(interviews).omit({
  id: true,
  addedBy: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertReaction = z.infer<typeof insertReactionSchema>;
export type Reaction = typeof reactions.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type Interview = typeof interviews.$inferSelect;
export type FundManagerLike = typeof fundManagerLikes.$inferSelect;

export type PostWithDetails = Post & {
  author: User;
  reactions: Reaction[];
  comments: (Comment & { author: User })[];
  reactionCounts: { mmi: number; tbd: number; news: number };
  isLikedByFundManager: boolean;
};
