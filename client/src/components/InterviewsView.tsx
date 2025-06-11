import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const createInterviewSchema = z.object({
  title: z.string().min(1, "Title is required"),
  company: z.string().min(1, "Company is required"),
  region: z.enum(["india", "asia", "developed_markets"]),
  source: z.string().min(1, "Source is required"),
  link: z.string().url("Invalid URL"),
  summary: z.string().min(10, "Summary must be at least 10 characters"),
});

type CreateInterviewForm = z.infer<typeof createInterviewSchema>;

export default function InterviewsView() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();

  const { data: interviews, isLoading, refetch } = useQuery({
    queryKey: ["/api/interviews"],
  });

  const form = useForm<CreateInterviewForm>({
    resolver: zodResolver(createInterviewSchema),
    defaultValues: {
      title: "",
      company: "",
      region: "india",
      source: "",
      link: "",
      summary: "",
    },
  });

  const createInterviewMutation = useMutation({
    mutationFn: async (data: CreateInterviewForm) => {
      const response = await apiRequest("POST", "/api/interviews", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Interview added successfully",
      });
      form.reset();
      setShowCreateModal(false);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateInterviewForm) => {
    createInterviewMutation.mutate(data);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Management Interviews</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Interview
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6">
          {interviews?.map((interview: any) => (
            <Card key={interview.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{interview.title}</h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>{interview.source}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(interview.createdAt))} ago</span>
                      <span>•</span>
                      <Badge className={getRegionColor(interview.region)}>
                        {getRegionLabel(interview.region)}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={interview.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
                
                <p className="text-gray-700 mb-4">{interview.summary}</p>
                
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-600">
                    Company: <span className="font-medium">{interview.company}</span>
                  </span>
                  <span className="text-gray-600">
                    Added by: <span className="font-medium">
                      {interview.addedByUser.firstName} {interview.addedByUser.lastName}
                    </span>
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {interviews?.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">No interviews found</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Interview</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="Interview title"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  {...form.register("company")}
                  placeholder="Company name"
                />
                {form.formState.errors.company && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.company.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="region">Region</Label>
                <Select
                  value={form.watch("region")}
                  onValueChange={(value) => form.setValue("region", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="india">India</SelectItem>
                    <SelectItem value="asia">Asia</SelectItem>
                    <SelectItem value="developed_markets">Developed Markets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  {...form.register("source")}
                  placeholder="e.g., CNBC, Bloomberg"
                />
                {form.formState.errors.source && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.source.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="link">Link</Label>
                <Input
                  id="link"
                  {...form.register("link")}
                  placeholder="https://..."
                />
                {form.formState.errors.link && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.link.message}
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                rows={4}
                {...form.register("summary")}
                placeholder="Interview summary..."
              />
              {form.formState.errors.summary && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.summary.message}
                </p>
              )}
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createInterviewMutation.isPending}>
                {createInterviewMutation.isPending ? "Adding..." : "Add Interview"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
