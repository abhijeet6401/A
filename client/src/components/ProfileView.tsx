import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

export default function ProfileView() {
  const { user } = useAuth();

  const { data: userPosts, isLoading } = useQuery({
    queryKey: ["/api/posts/user", user?.id],
    enabled: !!user?.id,
  });

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

  const totalReactions = userPosts?.reduce((sum: number, post: any) => {
    return sum + post.reactionCounts.mmi + post.reactionCounts.tbd + post.reactionCounts.news;
  }, 0) || 0;

  const totalComments = userPosts?.reduce((sum: number, post: any) => {
    return sum + post.comments.length;
  }, 0) || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Card className="overflow-hidden">
        <div className="px-6 py-8 bg-gradient-to-r from-primary to-blue-600">
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20 bg-white">
              <AvatarFallback className="text-primary text-2xl">
                <User className="w-8 h-8" />
              </AvatarFallback>
            </Avatar>
            <div className="text-white">
              <h1 className="text-2xl font-bold">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-blue-100">{user?.email}</p>
              <div className="flex items-center space-x-4 mt-2">
                <Badge className="bg-white bg-opacity-20 text-white border-white border-opacity-20">
                  {user?.role === "fund_manager" ? "Fund Manager" : "Analyst"}
                </Badge>
                <Badge className="bg-white bg-opacity-20 text-white border-white border-opacity-20">
                  @{user?.username}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{userPosts?.length || 0}</div>
              <div className="text-sm text-gray-600">Posts Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalComments}</div>
              <div className="text-sm text-gray-600">Comments Received</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalReactions}</div>
              <div className="text-sm text-gray-600">Reactions Received</div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Posts</h2>
            
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                    <div className="space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {userPosts?.map((post: any) => (
                  <Card key={post.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{post.headline}</h3>
                        <span className="text-sm text-gray-500">
                          {format(new Date(post.createdAt), "dd/MM/yyyy, HH:mm")} IST
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <Badge className={getRegionColor(post.region)}>
                          {getRegionLabel(post.region)}
                        </Badge>
                        <span>{post.company}</span>
                        <span>
                          {post.reactionCounts.mmi + post.reactionCounts.tbd + post.reactionCounts.news} reactions
                        </span>
                        <span>{post.comments.length} comments</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {userPosts?.length === 0 && (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-500">No posts created yet</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
