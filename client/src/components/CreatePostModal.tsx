import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CloudUpload, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const createPostSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  region: z.enum(["india", "asia", "developed_markets"]),
  content: z.string().min(10, "Content must be at least 10 characters"),
  headline: z.string().min(1, "Headline is required"),
  summary: z.string().min(1, "Summary is required"),
});

type CreatePostForm = z.infer<typeof createPostSchema>;

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePostModal({ open, onClose, onSuccess }: CreatePostModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [aiGenerated, setAiGenerated] = useState({ headline: "", summary: "" });
  const { toast } = useToast();

  const form = useForm<CreatePostForm>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      company: "",
      region: "india",
      content: "",
      headline: "",
      summary: "",
    },
  });

  const summarizeMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/summarize", { text });
      return response.json();
    },
    onSuccess: (data) => {
      setAiGenerated(data);
      form.setValue("headline", data.headline);
      form.setValue("summary", data.summary);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate AI summary",
        variant: "destructive",
      });
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: CreatePostForm) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post created successfully",
      });
      form.reset();
      setFiles([]);
      setAiGenerated({ headline: "", summary: "" });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateAI = () => {
    const content = form.getValues("content");
    if (content.trim()) {
      summarizeMutation.mutate(content);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const onSubmit = (data: CreatePostForm) => {
    createPostMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                {...form.register("company")}
                placeholder="Enter company name"
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
          
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              rows={4}
              {...form.register("content")}
              placeholder="Enter your content or paste a link..."
            />
            {form.formState.errors.content && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.content.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="files">File Attachments</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition duration-200">
              <CloudUpload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-600">
                Drop files here or{" "}
                <label htmlFor="file-upload" className="text-primary cursor-pointer">
                  browse
                </label>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports PDF, Excel, Images (max 10MB)
              </p>
              <input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png,.gif"
              />
            </div>
            {files.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  {files.length} file(s) selected: {files.map(f => f.name).join(", ")}
                </p>
              </div>
            )}
          </div>
          
          {/* AI Summary Preview */}
          <Card className="bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">AI Generated Summary</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateAI}
                  disabled={summarizeMutation.isPending}
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${summarizeMutation.isPending ? "animate-spin" : ""}`} />
                  {summarizeMutation.isPending ? "Generating..." : "Generate"}
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="headline">Headline</Label>
                  <Input
                    id="headline"
                    {...form.register("headline")}
                    placeholder="AI-generated headline will appear here..."
                  />
                  {form.formState.errors.headline && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.headline.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea
                    id="summary"
                    rows={3}
                    {...form.register("summary")}
                    placeholder="AI-generated summary paragraph will appear here..."
                  />
                  {form.formState.errors.summary && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.summary.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPostMutation.isPending}>
              {createPostMutation.isPending ? "Publishing..." : "Publish Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
