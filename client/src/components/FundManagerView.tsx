import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Heart } from "lucide-react";
import PostCard from "./PostCard";

export default function FundManagerView() {
  const { data: likedPosts, isLoading, refetch } = useQuery({
    queryKey: ["/api/fund-manager/liked-posts"],
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fund Manager Dashboard</h1>
          <p className="text-gray-600 mt-1">Posts liked by fund managers - high priority research items</p>
        </div>
        <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-800">
          <Crown className="w-4 h-4 mr-2" />
          Private Access
        </Badge>
      </div>
      
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-48"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {likedPosts?.map((post: any) => (
            <div key={post.id} className="relative">
              <div className="absolute -left-4 top-6 z-10">
                <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-800">
                  <Heart className="w-3 h-3 mr-1 fill-current" />
                  Fund Manager Liked
                </Badge>
              </div>
              <Card className="border-l-4 border-l-orange-500">
                <PostCard post={post} onUpdate={refetch} />
              </Card>
            </div>
          ))}
          
          {likedPosts?.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <Crown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Liked Posts Yet</h3>
                <p className="text-gray-500">
                  Posts that you like from the main feed will appear here for quick access.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
