import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Search, Plus, Filter } from "lucide-react";
import PostCard from "./PostCard";
import CreatePostModal from "./CreatePostModal";

export default function FeedView() {
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [minMmi, setMinMmi] = useState("");
  const [minReactions, setMinReactions] = useState("");
  const [fromDate, setFromDate] = useState("");

  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ["/api/posts", selectedRegion, searchQuery, minMmi, minReactions, fromDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedRegion !== "all") params.append("region", selectedRegion);
      if (searchQuery) params.append("company", searchQuery);
      if (minMmi) params.append("minMmi", minMmi);
      if (minReactions) params.append("minReactions", minReactions);
      if (fromDate) params.append("fromDate", fromDate);
      
      const url = `/api/posts${params.toString() ? `?${params}` : ''}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch posts");
      return response.json();
    },
  });

  const regions = [
    { value: "all", label: "All Regions" },
    { value: "india", label: "India" },
    { value: "asia", label: "Asia" },
    { value: "developed_markets", label: "Developed Markets" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex space-x-2">
              {regions.map((region) => (
                <Button
                  key={region.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRegion(region.value)}
                  className={`region-filter ${selectedRegion === region.value ? "active" : ""}`}
                >
                  {region.label}
                </Button>
              ))}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </Button>
              <Button onClick={() => setShowCreatePost(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
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
          {posts?.map((post: any) => (
            <PostCard key={post.id} post={post} onUpdate={refetch} />
          ))}
          
          {posts?.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">No posts found</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <CreatePostModal
        open={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSuccess={() => {
          setShowCreatePost(false);
          refetch();
        }}
      />
    </div>
  );
}
