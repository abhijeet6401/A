import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Lightbulb, 
  HelpCircle, 
  Newspaper, 
  MessageCircle, 
  Download,
  MoreHorizontal,
  FileText,
  Heart
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

interface PostCardProps {
  post: any;
  onUpdate: () => void;
}

export default function PostCard({ post, onUpdate }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const addReactionMutation = useMutation({
    mutationFn: async ({ type }: { type: string }) => {
      const response = await apiRequest("POST", `/api/posts/${post.id}/reactions`, { type });
      return response.json();
    },
    onSuccess: () => {
      onUpdate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/posts/${post.id}/comments`, { content });
      return response.json();
    },
    onSuccess: () => {
      setNewComment("");
      onUpdate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const fundManagerLikeMutation = useMutation({
    mutationFn: async () => {
      if (post.isLikedByFundManager) {
        const response = await apiRequest("DELETE", `/api/fund-manager/like/${post.id}`);
        return response.json();
      } else {
        const response = await apiRequest("POST", `/api/fund-manager/like/${post.id}`);
        return response.json();
      }
    },
    onSuccess: () => {
      onUpdate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeReactionMutation = useMutation({
    mutationFn: async (type: string) => {
      const response = await apiRequest("DELETE", `/api/posts/${post.id}/reactions/${type}`);
      return response.json();
    },
    onSuccess: () => {
      onUpdate();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReaction = (type: string) => {
    // Check if user already reacted with this type
    const userReaction = post.reactions?.find((r: any) => r.userId === user?.id && r.type === type);
    
    if (userReaction) {
      // Remove reaction
      removeReactionMutation.mutate(type);
    } else {
      // Add reaction
      addReactionMutation.mutate({ type });
    }
  };

  const handleComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment);
    }
  };

  const getRegionColor = (region: string) => {
    switch (region) {
      case "india":
        return "bg-green-100 text-green-800";
      case "asia":
        return "bg-blue-100 text-blue-800";
      case "developed_markets":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRegionLabel = (region: string) => {
    switch (region) {
      case "india":
        return "India";
      case "asia":
        return "Asia";
      case "developed_markets":
        return "Developed Markets";
      default:
        return region;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback>
                {post.author.firstName?.[0]}{post.author.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 
                className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer"
                onClick={() => navigate(`/profile/${post.author.id}`)}
              >
                {post.author.firstName} {post.author.lastName}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Badge className={getRegionColor(post.region)}>
                  {getRegionLabel(post.region)}
                </Badge>
                <span>{post.company}</span>
                <span>•</span>
                <span>{format(new Date(post.createdAt), "dd/MM/yyyy, HH:mm")} IST</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowEditModal(true)}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {post.headline}
          </h2>
          <p className="text-gray-700">{post.summary}</p>
        </div>
        
        {/* File Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="mb-4">
            {post.attachments.map((attachment: string, index: number) => (
              <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <FileText className="h-4 w-4 text-red-500" />
                <span className="text-sm text-gray-700">{attachment}</span>
                <Button variant="ghost" size="sm" className="ml-auto">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {/* Reactions and Actions */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction("mmi")}
              className={`flex items-center space-x-1 text-sm hover:text-orange-600 ${
                post.reactions?.find((r: any) => r.userId === user?.id && r.type === "mmi") 
                  ? "text-orange-600 bg-orange-50" : ""
              }`}
            >
              <Lightbulb className="h-4 w-4" />
              <span>MMI ({post.reactionCounts.mmi})</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction("tbd")}
              className={`flex items-center space-x-1 text-sm hover:text-yellow-600 ${
                post.reactions?.find((r: any) => r.userId === user?.id && r.type === "tbd") 
                  ? "text-yellow-600 bg-yellow-50" : ""
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              <span>TBD ({post.reactionCounts.tbd})</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction("news")}
              className={`flex items-center space-x-1 text-sm hover:text-green-600 ${
                post.reactions?.find((r: any) => r.userId === user?.id && r.type === "news") 
                  ? "text-green-600 bg-green-50" : ""
              }`}
            >
              <Newspaper className="h-4 w-4" />
              <span>NEWS ({post.reactionCounts.news})</span>
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 text-sm"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{post.comments.length} Comments</span>
            </Button>
            
            {user?.role === "fund_manager" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fundManagerLikeMutation.mutate()}
                className={`flex items-center space-x-1 text-sm ${
                  post.isLikedByFundManager ? "text-red-600" : ""
                }`}
              >
                <Heart className={`h-4 w-4 ${post.isLikedByFundManager ? "fill-current" : ""}`} />
                <span>Like</span>
              </Button>
            )}
          </div>
        </div>
        
        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="space-y-3">
              {post.comments.map((comment: any) => (
                <div key={comment.id} className="flex space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {comment.author.firstName?.[0]}{comment.author.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">
                          {comment.author.firstName} {comment.author.lastName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(comment.createdAt), "dd/MM/yyyy, HH:mm")} IST
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex space-x-2">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleComment()}
                    className="text-sm"
                  />
                  <Button size="sm" onClick={handleComment} disabled={!newComment.trim()}>
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
