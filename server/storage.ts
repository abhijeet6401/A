import {
  users,
  posts,
  reactions,
  comments,
  fundManagerLikes,
  interviews,
  type User,
  type InsertUser,
  type Post,
  type InsertPost,
  type Reaction,
  type InsertReaction,
  type Comment,
  type InsertComment,
  type FundManagerLike,
  type Interview,
  type InsertInterview,
  type PostWithDetails,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Post operations
  createPost(post: InsertPost & { authorId: number }): Promise<Post>;
  getPosts(region?: string, filters?: { minMmi?: number; minReactions?: number; fromDate?: Date }): Promise<PostWithDetails[]>;
  getPostsByCompany(company: string): Promise<PostWithDetails[]>;
  getPostsByUser(userId: number): Promise<PostWithDetails[]>;
  getPost(id: number): Promise<PostWithDetails | undefined>;

  // Reaction operations
  addReaction(reaction: InsertReaction & { userId: number; postId: number }): Promise<Reaction>;
  removeReaction(postId: number, userId: number, type: string): Promise<boolean>;
  getReactionsByPost(postId: number): Promise<Reaction[]>;

  // Comment operations
  addComment(comment: InsertComment & { userId: number; postId: number }): Promise<Comment>;
  getCommentsByPost(postId: number): Promise<(Comment & { author: User })[]>;

  // Fund Manager operations
  addFundManagerLike(postId: number, userId: number): Promise<FundManagerLike>;
  removeFundManagerLike(postId: number, userId: number): Promise<boolean>;
  getFundManagerLikedPosts(userId: number): Promise<PostWithDetails[]>;

  // Interview operations
  createInterview(interview: InsertInterview & { addedBy: number }): Promise<Interview>;
  getInterviews(): Promise<(Interview & { addedByUser: User })[]>;

  // Seed data
  seedData(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private reactions: Map<number, Reaction>;
  private comments: Map<number, Comment>;
  private fundManagerLikes: Map<number, FundManagerLike>;
  private interviews: Map<number, Interview>;
  
  private currentUserId: number;
  private currentPostId: number;
  private currentReactionId: number;
  private currentCommentId: number;
  private currentFundManagerLikeId: number;
  private currentInterviewId: number;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.reactions = new Map();
    this.comments = new Map();
    this.fundManagerLikes = new Map();
    this.interviews = new Map();
    
    this.currentUserId = 1;
    this.currentPostId = 1;
    this.currentReactionId = 1;
    this.currentCommentId = 1;
    this.currentFundManagerLikeId = 1;
    this.currentInterviewId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async createPost(postData: InsertPost & { authorId: number }): Promise<Post> {
    const id = this.currentPostId++;
    const post: Post = {
      id,
      authorId: postData.authorId,
      company: postData.company,
      region: postData.region,
      content: postData.content,
      headline: postData.headline,
      summary: postData.summary,
      attachments: postData.attachments || null,
      createdAt: new Date(),
    };
    this.posts.set(id, post);
    return post;
  }

  async getPosts(region?: string, filters?: { minMmi?: number; minReactions?: number; fromDate?: Date }): Promise<PostWithDetails[]> {
    let posts = Array.from(this.posts.values());
    
    if (region && region !== 'all') {
      posts = posts.filter(post => post.region === region);
    }
    
    // Apply date filter
    if (filters?.fromDate) {
      posts = posts.filter(post => post.createdAt && post.createdAt >= filters.fromDate!);
    }
    
    const enrichedPosts = await this.enrichPostsWithDetails(posts);
    
    // Apply MMI count filter
    if (filters?.minMmi !== undefined) {
      return enrichedPosts.filter(post => post.reactionCounts.mmi >= filters.minMmi!);
    }
    
    // Apply total reactions filter
    if (filters?.minReactions !== undefined) {
      const totalReactions = (post: any) => post.reactionCounts.mmi + post.reactionCounts.tbd + post.reactionCounts.news;
      return enrichedPosts.filter(post => totalReactions(post) >= filters.minReactions!);
    }
    
    return enrichedPosts;
  }

  async getPostsByCompany(company: string): Promise<PostWithDetails[]> {
    const filteredPosts = Array.from(this.posts.values())
      .filter(post => post.company.toLowerCase().includes(company.toLowerCase()));
    
    return this.enrichPostsWithDetails(filteredPosts);
  }

  async getPostsByUser(userId: number): Promise<PostWithDetails[]> {
    const userPosts = Array.from(this.posts.values())
      .filter(post => post.authorId === userId);
    
    return this.enrichPostsWithDetails(userPosts);
  }

  async getPost(id: number): Promise<PostWithDetails | undefined> {
    const post = this.posts.get(id);
    if (!post) return undefined;
    
    const enriched = await this.enrichPostsWithDetails([post]);
    return enriched[0];
  }

  private async enrichPostsWithDetails(posts: Post[]): Promise<PostWithDetails[]> {
    return Promise.all(posts.map(async (post) => {
      const author = await this.getUser(post.authorId);
      const reactions = await this.getReactionsByPost(post.id);
      const comments = await this.getCommentsByPost(post.id);
      
      const reactionCounts = {
        mmi: reactions.filter(r => r.type === 'mmi').length,
        tbd: reactions.filter(r => r.type === 'tbd').length,
        news: reactions.filter(r => r.type === 'news').length,
      };

      const isLikedByFundManager = Array.from(this.fundManagerLikes.values())
        .some(like => like.postId === post.id);

      return {
        ...post,
        author: author!,
        reactions,
        comments,
        reactionCounts,
        isLikedByFundManager,
      };
    }));
  }

  async addReaction(reactionData: InsertReaction & { userId: number; postId: number }): Promise<Reaction> {
    // Remove existing reaction of same type from same user
    await this.removeReaction(reactionData.postId, reactionData.userId, reactionData.type);
    
    const id = this.currentReactionId++;
    const reaction: Reaction = {
      ...reactionData,
      id,
      createdAt: new Date(),
    };
    this.reactions.set(id, reaction);
    return reaction;
  }

  async removeReaction(postId: number, userId: number, type: string): Promise<boolean> {
    const existingReaction = Array.from(this.reactions.values())
      .find(r => r.postId === postId && r.userId === userId && r.type === type);
    
    if (existingReaction) {
      this.reactions.delete(existingReaction.id);
      return true;
    }
    return false;
  }

  async getReactionsByPost(postId: number): Promise<Reaction[]> {
    return Array.from(this.reactions.values())
      .filter(reaction => reaction.postId === postId);
  }

  async addComment(commentData: InsertComment & { userId: number; postId: number }): Promise<Comment> {
    const id = this.currentCommentId++;
    const comment: Comment = {
      ...commentData,
      id,
      createdAt: new Date(),
    };
    this.comments.set(id, comment);
    return comment;
  }

  async getCommentsByPost(postId: number): Promise<(Comment & { author: User })[]> {
    const postComments = Array.from(this.comments.values())
      .filter(comment => comment.postId === postId);
    
    return Promise.all(postComments.map(async (comment) => {
      const author = await this.getUser(comment.userId);
      return { ...comment, author: author! };
    }));
  }

  async addFundManagerLike(postId: number, userId: number): Promise<FundManagerLike> {
    const id = this.currentFundManagerLikeId++;
    const like: FundManagerLike = {
      id,
      postId,
      userId,
      createdAt: new Date(),
    };
    this.fundManagerLikes.set(id, like);
    return like;
  }

  async removeFundManagerLike(postId: number, userId: number): Promise<boolean> {
    const existingLike = Array.from(this.fundManagerLikes.values())
      .find(like => like.postId === postId && like.userId === userId);
    
    if (existingLike) {
      this.fundManagerLikes.delete(existingLike.id);
      return true;
    }
    return false;
  }

  async getFundManagerLikedPosts(userId: number): Promise<PostWithDetails[]> {
    const likedPostIds = Array.from(this.fundManagerLikes.values())
      .map(like => like.postId);
    
    const likedPosts = Array.from(this.posts.values())
      .filter(post => likedPostIds.includes(post.id));
    
    return this.enrichPostsWithDetails(likedPosts);
  }

  async createInterview(interviewData: InsertInterview & { addedBy: number }): Promise<Interview> {
    const id = this.currentInterviewId++;
    const interview: Interview = {
      ...interviewData,
      id,
      createdAt: new Date(),
    };
    this.interviews.set(id, interview);
    return interview;
  }

  async getInterviews(): Promise<(Interview & { addedByUser: User })[]> {
    const allInterviews = Array.from(this.interviews.values());
    
    return Promise.all(allInterviews.map(async (interview) => {
      const addedByUser = await this.getUser(interview.addedBy);
      return { ...interview, addedByUser: addedByUser! };
    }));
  }

  async seedData(): Promise<void> {
    // Create users
    const analyst1 = await this.createUser({
      username: "sarah.chen",
      email: "sarah.chen@company.com",
      password: "password123",
      role: "analyst",
      firstName: "Sarah",
      lastName: "Chen",
    });

    const analyst2 = await this.createUser({
      username: "david.kim",
      email: "david.kim@company.com",
      password: "password123",
      role: "analyst",
      firstName: "David",
      lastName: "Kim",
    });

    const analyst3 = await this.createUser({
      username: "priya.sharma",
      email: "priya.sharma@company.com",
      password: "password123",
      role: "analyst",
      firstName: "Priya",
      lastName: "Sharma",
    });

    const fundManager = await this.createUser({
      username: "john.manager",
      email: "john.manager@company.com",
      password: "password123",
      role: "fund_manager",
      firstName: "John",
      lastName: "Manager",
    });

    // Create posts
    const post1 = await this.createPost({
      authorId: analyst1.id,
      company: "Reliance Industries",
      region: "india",
      content: "Reliance Industries reported exceptional quarterly performance...",
      headline: "Reliance Q3 Revenue Jumps 15% to $28.7B, Retail Segment Shows Strong Growth",
      summary: "Reliance Industries reported exceptional quarterly performance with revenue reaching $28.7 billion, marking a 15% increase year-over-year. The retail segment particularly stood out with 22% growth, driven by expansion in tier-2 cities and digital commerce integration.",
      attachments: ["Reliance_Q3_Results.pdf"],
    });

    const post2 = await this.createPost({
      authorId: analyst2.id,
      company: "Samsung Electronics",
      region: "asia",
      content: "Samsung Electronics unveiled plans for a massive semiconductor facility...",
      headline: "Samsung Announces $17B Investment in Texas Semiconductor Facility, Production Starts 2026",
      summary: "Samsung Electronics unveiled plans for a massive $17 billion semiconductor manufacturing facility in Texas, expected to commence production by 2026. The facility will focus on advanced 3nm process technology and is projected to create 2,000 high-tech jobs.",
      attachments: ["samsung_facility.jpg"],
    });

    const post3 = await this.createPost({
      authorId: analyst3.id,
      company: "Tesla",
      region: "developed_markets",
      content: "Tesla Q4 deliveries exceeded expectations...",
      headline: "Tesla Q4 Deliveries Beat Expectations with 484K Vehicles Delivered",
      summary: "Tesla delivered 484,507 vehicles in Q4 2023, beating analyst expectations of 473,000. The strong performance was driven by Model Y demand and improved production efficiency at Gigafactories.",
      attachments: [],
    });

    // Add reactions
    await this.addReaction({ type: "mmi", postId: post1.id, userId: analyst2.id });
    await this.addReaction({ type: "news", postId: post1.id, userId: analyst3.id });
    await this.addReaction({ type: "mmi", postId: post2.id, userId: analyst1.id });
    await this.addReaction({ type: "tbd", postId: post3.id, userId: analyst1.id });

    // Add comments
    await this.addComment({
      content: "Excellent analysis! The retail growth numbers are particularly impressive.",
      postId: post1.id,
      userId: analyst2.id,
    });

    await this.addComment({
      content: "This investment shows Samsung's commitment to competing with TSMC.",
      postId: post2.id,
      userId: analyst1.id,
    });

    // Add fund manager like
    await this.addFundManagerLike(post1.id, fundManager.id);

    // Add interview
    await this.createInterview({
      title: "Tata Motors CEO Interview on EV Strategy",
      company: "Tata Motors",
      region: "india",
      source: "CNBC",
      link: "https://cnbc.com/tata-motors-ev-strategy",
      summary: "Tata Motors CEO discussed the company's aggressive EV expansion plans, targeting 50% electric vehicle sales by 2030. Key highlights include $2B investment in battery technology and plans to launch 10 new EV models.",
      addedBy: analyst3.id,
    });
  }
}

export const storage = new MemStorage();
