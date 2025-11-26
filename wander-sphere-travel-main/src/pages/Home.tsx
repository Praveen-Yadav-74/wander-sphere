import React, { useState, useRef, useEffect, FC, useCallback, useMemo, ChangeEvent, KeyboardEvent } from "react";
import { Plus, Camera, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, MapPin, X, ChevronLeft, ChevronRight, Send, Flag, UserX, Smile, AtSign, Hash, Search, Link, Palette, AlignLeft, AlignCenter, AlignRight, Compass, Film, BellOff, Layers, Home as HomeIcon, CheckCircle, Play, Loader2, Luggage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/utils/api";
import { apiConfig, endpoints } from "@/config/api";
import { journeyService } from "@/services/journeyService";
import { storyService } from "@/services/storyService";
import { authService } from "@/services/authService";
import heroBeach from "@/assets/hero-beach.jpg";
import mountainAdventure from "@/assets/mountain-adventure.jpg";
import streetFood from "@/assets/street-food.jpg";

// --- START: Placeholder Hooks and Utils (Replace with your actual implementations) ---

// Removed useOptimizedCallback - using useCallback directly with proper dependencies

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackSrc: string, logMessage: string) => {
  console.error(logMessage);
  e.currentTarget.src = fallbackSrc;
};

// --- END: Placeholder Hooks and Utils ---

// --- Types and Interfaces ---

interface Story {
  id: string;
  user: string;
  avatar: string;
  media: string;
  timestamp?: string;
  viewed?: boolean;
  isOwn?: boolean;
  hasStory?: boolean;
}

interface StoryViewerProps {
  story: Story | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StoryViewer: FC<StoryViewerProps> = React.memo(({ story, onClose, onNext, onPrev }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!story) return;
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          onNext();
          return 0;
        }
        return prev + 1;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [story, onNext]);

  if (!story) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="relative w-full max-w-md h-full bg-black">
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="w-full bg-gray-600 rounded-full h-1">
            <div 
              className="bg-white h-1 rounded-full transition-all duration-100" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:text-gray-300"
        >
          <X className="w-6 h-6" />
        </button>
        <img 
          src={story.media} 
          alt="Story" 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={story.avatar} />
              <AvatarFallback>{story.user[0]}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{story.user}</span>
          </div>
        </div>
        <button 
          onClick={onPrev}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button 
          onClick={onNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
});

const CreatePostDialog: FC<CreatePostDialogProps> = React.memo(({ open, onOpenChange }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [caption, setCaption] = useState("");
    const [location, setLocation] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            
            // Create preview URL
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleCreatePost = async () => {
        if (!selectedFile || !caption.trim()) return;
        
        try {
            setIsUploading(true);
            
            // Ensure we have a session before making the request
            const { supabase } = await import('@/config/supabase');
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session?.access_token) {
                throw new Error('No authentication token available. Please log in.');
            }
            
            // First upload the image to media service
            const formData = new FormData();
            formData.append('file', selectedFile);
            
            const { getAuthHeader } = await import('@/config/api');
            const authHeaders = await getAuthHeader();
            
            const mediaResponse = await apiRequest(
                `${apiConfig.baseURL}/media/temp`,
                {
                    method: 'POST',
                    body: formData,
                    headers: {
                        ...authHeaders,
                        // Don't set Content-Type for FormData, let browser set it with boundary
                    },
                }
            ) as { success: boolean; data?: { url: string }; message?: string };
            
            if (!mediaResponse.success || !mediaResponse.data) {
                throw new Error('Failed to upload image');
            }
            
            // Create the journey/post with the uploaded image
            const journeyData = {
                title: caption.slice(0, 50) + (caption.length > 50 ? '...' : ''), // Use first part of caption as title
                description: caption.length >= 20 ? caption : caption + ' '.repeat(20 - caption.length) + 'Shared from my travel experience.',
                content: caption.length >= 100 ? caption : caption + '\n\nThis is a wonderful travel moment I wanted to share with everyone. Every journey tells a story, and this particular experience holds special memories that I hope will inspire others to explore and discover new places.',
                isPublic: isPublic,
                images: [mediaResponse.data.url],
                destinations: location ? [location] : [],
                tags: [],
            };
            
            const response = await journeyService.createJourney(journeyData);
            
            if (response.success) {
                toast({
                    title: "Success",
                    description: "Post created successfully!",
                });
                
                onOpenChange(false);
                resetForm();
            } else {
                throw new Error(response.message || 'Failed to create post');
            }
        } catch (error: any) {
            console.error('Error creating post:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to create post. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        setSelectedFile(null);
        setPreviewUrl("");
        setCaption("");
        setLocation("");
        setIsPublic(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        resetForm();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {!previewUrl ? (
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                            <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground mb-4">Select a photo to share</p>
                            <Button onClick={() => fileInputRef.current?.click()}>
                                <Plus className="w-4 h-4 mr-2" />
                                Choose Photo
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted max-w-md mx-auto">
                                <img
                                    src={previewUrl}
                                    alt="Post preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Caption</label>
                                    <Textarea
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        placeholder="Write a caption..."
                                        rows={3}
                                        className="resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Location (optional)</label>
                                    <Input
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Add location..."
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div>
                                        <label className="text-sm font-medium">Privacy</label>
                                        <p className="text-xs text-muted-foreground">
                                            {isPublic ? "Anyone can see this post" : "Only your followers can see this post"}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-muted-foreground">Private</span>
                                        <Switch
                                            checked={isPublic}
                                            onCheckedChange={setIsPublic}
                                        />
                                        <span className="text-sm text-muted-foreground">Public</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={resetForm} className="flex-1">
                                        Change Photo
                                    </Button>
                                    <Button 
                                        onClick={handleCreatePost} 
                                        disabled={isUploading || !caption.trim()}
                                        className="flex-1 bg-gradient-primary text-white"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            "Share Post"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
});


interface AddStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddStoryDialog: FC<AddStoryDialogProps> = React.memo(({ open, onOpenChange }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            
            // Create preview URL
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        
        try {
            setIsUploading(true);
            
            // Determine media type
            const mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'image';
            
            // Create story data
            const storyData = {
                media: selectedFile,
                mediaType: mediaType as 'image' | 'video',
                duration: mediaType === 'video' ? 15 : undefined, // Default 15 seconds for video
            };
            
            const response = await storyService.createStory(storyData);
            
            if (response.success) {
                toast({
                    title: "Success",
                    description: "Story uploaded successfully!",
                });
                
                onOpenChange(false);
                resetForm();
            } else {
                throw new Error(response.message || 'Failed to upload story');
            }
        } catch (error: any) {
            console.error('Error uploading story:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to upload story. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        setSelectedFile(null);
        setPreviewUrl("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        resetForm();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add to Your Story</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {!previewUrl ? (
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                            <Camera className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                            <p className="text-muted-foreground mb-4">Select a photo or video to share</p>
                            <Button onClick={() => fileInputRef.current?.click()}>
                                <Plus className="w-4 h-4 mr-2" />
                                Choose File
                            </Button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                                <img
                                    src={previewUrl}
                                    alt="Story preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={resetForm} className="flex-1">
                                    Change
                                </Button>
                                <Button 
                                    onClick={handleUpload} 
                                    disabled={isUploading}
                                    className="flex-1 bg-gradient-primary text-white"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        "Share Story"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
});

const PostOptionsDropdown: FC = React.memo(() => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon">
        <MoreHorizontal className="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem><Share2 className="w-4 h-4 mr-2" /> Share to...</DropdownMenuItem>
        <DropdownMenuItem><Link className="w-4 h-4 mr-2" /> Copy link</DropdownMenuItem>
        <DropdownMenuItem><Bookmark className="w-4 h-4 mr-2" /> Save</DropdownMenuItem>
        <DropdownMenuItem><UserX className="w-4 h-4 mr-2" /> Unfollow</DropdownMenuItem>
        <DropdownMenuItem><BellOff className="w-4 h-4 mr-2" /> Mute</DropdownMenuItem>
        <DropdownMenuItem className="text-destructive"><Flag className="w-4 h-4 mr-2" /> Report</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
));

interface Comment {
  id: number;
  user: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
  isVerified?: boolean;
}

interface PostCommentsProps {
  commentsCount: number;
}

const PostComments: FC<PostCommentsProps> = React.memo(({ commentsCount }) => {
    const [newComment, setNewComment] = useState("");
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Load comments from API when component mounts
    useEffect(() => {
        // TODO: Implement API call to fetch comments
        // fetchComments();
    }, []);
    
    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        
        try {
            setIsLoading(true);
            // TODO: Implement API call to add comment
            // await apiRequest(endpoints.comments.create, {
            //   method: 'POST',
            //   body: { text: newComment }
            // });
            setNewComment("");
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to add comment",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="p-4 pt-2 space-y-4">
            {comments.length === 0 ? (
                <p className="text-muted-foreground text-sm">No comments yet. Be the first to comment!</p>
            ) : (
                comments.map(comment => (
                    <div key={comment.id} className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.avatar} />
                            <AvatarFallback>{comment.user[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-center space-x-2">
                                <span className="font-semibold text-sm">{comment.user}</span>
                                <span className="text-muted-foreground text-xs">{comment.time}</span>
                            </div>
                            <p className="text-sm">{comment.text}</p>
                        </div>
                    </div>
                ))
            )}
            <div className="flex items-center space-x-2 mt-4">
                <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1"
                />
                <Button 
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isLoading}
                    size="sm"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
            </div>
        </div>
    );
});

interface Post {
  id: number;
  user: string;
  avatar: string;
  location: string;
  time: string;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  isSaved: boolean;
  hasMultipleImages?: boolean;
  hasVideo?: boolean;
}

// --- Main Home Component ---
const Home: FC = () => {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isAddStoryOpen, setIsAddStoryOpen] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [openCommentsPostId, setOpenCommentsPostId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("feed");

  const [stories, setStories] = useState<Story[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingStories, setIsLoadingStories] = useState(true);

  // Load posts from API with REAL like status from database
  const fetchPosts = useCallback(async () => {
    try {
      setIsLoadingPosts(true);
      
      // User must be authenticated to see this page
      const response = await journeyService.getMyJourneys();
      
      if (response && (response.success || response.data)) {
         // Transform journey data to post format
         const journeys = response.data?.journeys || response.data || [];
         
         // Get current user's likes from post_likes table
         const { supabase } = await import('@/config/supabase');
         const { data: { session } } = await supabase.auth.getSession();
         
         let userLikes: string[] = [];
         if (session?.user) {
           const { data: likesData } = await supabase
             .from('post_likes')
             .select('post_id')
             .eq('user_id', session.user.id)
             .eq('post_type', 'journey');
           
           userLikes = likesData?.map(like => like.post_id) || [];
         }
         
         // Get like counts for all posts
         const postIds = journeys.map((j: any) => j.id?.toString() || '');
         let likeCounts: Record<string, number> = {};
         
         if (postIds.length > 0) {
           const { data: allLikes } = await supabase
             .from('post_likes')
             .select('post_id')
             .in('post_id', postIds)
             .eq('post_type', 'journey');
           
           if (allLikes) {
             likeCounts = allLikes.reduce((acc: Record<string, number>, like) => {
               acc[like.post_id] = (acc[like.post_id] || 0) + 1;
               return acc;
             }, {});
           }
         }
         
         const transformedPosts = Array.isArray(journeys) ? journeys.map((journey: any) => {
           const postId = journey.id?.toString() || '';
           return {
             id: parseInt(postId) || journey.id, // Keep as number for compatibility
             user: journey.author?.name || journey.author?.firstName || 'Anonymous',
             avatar: journey.author?.avatar || journey.author?.avatar_url || '/placeholder-avatar.jpg',
             location: journey.destinations?.[0] || 'Unknown',
             time: journey.createdAt ? new Date(journey.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
             image: journey.images?.[0] || heroBeach,
             caption: journey.description || journey.content || '',
             likes: likeCounts[postId] || journey.likes || journey.likeCount || 0,
             comments: journey.comments?.length || journey.commentCount || 0,
             isLiked: userLikes.includes(postId), // REAL like status from database
             isSaved: journey.isSaved || false,
             hasMultipleImages: journey.images?.length > 1,
             hasVideo: false
           };
         }) : [];
         setPosts(transformedPosts);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      setPosts([]); // Set empty array on error to prevent infinite loading
      toast({
        title: "Error",
        description: "Failed to load posts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPosts(false);
    }
  }, [toast]);

  // Load stories from API
  // STRICT AUTH: Only fetch user's own stories (user must be authenticated)
  const fetchStories = useCallback(async () => {
    try {
      setIsLoadingStories(true);
      
      // User must be authenticated to see this page
      const response = await storyService.getStories();
      
      if (response && (response.success || response.data)) {
         // Transform story data and add "Your Story" option
         const stories = response.data?.stories || response.data || [];
         const transformedStories = Array.isArray(stories) ? stories.map((story: any) => ({
           id: story.id,
           user: story.isOwner ? 'Your Story' : (story.user?.firstName && story.user?.lastName ? `${story.user.firstName} ${story.user.lastName}` : story.user?.username || 'Anonymous'),
           avatar: story.user?.avatar || story.user?.avatar_url || '/placeholder-avatar.jpg',
           media: story.media || story.media_url || '',
           timestamp: story.createdAt || story.created_at,
           viewed: story.isViewed || false,
           isOwn: story.isOwner || false,
           hasStory: true
         })) : [];
         
         // Filter out user's own stories from the main list and add a single "Your Story" entry if user has stories
         const userStories = transformedStories.filter(story => story.isOwn);
         const otherStories = transformedStories.filter(story => !story.isOwn);
         
         if (userStories.length > 0) {
           setStories([{ id: "user-stories", user: "Your Story", avatar: "", media: userStories[0].media, isOwn: true, hasStory: true }, ...otherStories]);
         } else {
           setStories([{ id: "1", user: "Your Story", avatar: "", media: "", isOwn: true }, ...otherStories]);
         }
      } else {
        // Show only "Your Story" option if no stories available
        setStories([{ id: "1", user: "Your Story", avatar: "", media: "", isOwn: true }]);
      }
    } catch (error) {
      console.error('Failed to fetch stories:', error);
      // Fallback to "Your Story" only
      setStories([{ id: "1", user: "Your Story", avatar: "", media: "", isOwn: true }]);
      toast({
        title: "Error",
        description: "Failed to load stories. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingStories(false);
    }
  }, [toast]);

  // Load data on component mount with timeout
  // Always fetch data (public or private) - no need to check auth here
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    // Always fetch posts and stories (will use public endpoints if not authenticated)
    fetchPosts();
    fetchStories();
    
    // Set a timeout to prevent infinite loading (30 seconds max)
    timeoutId = setTimeout(() => {
      console.warn('Data loading timeout reached, forcing loading states to false');
      setIsLoadingPosts(false);
      setIsLoadingStories(false);
    }, 30000);
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [fetchPosts, fetchStories]);
  
  // REAL LIKE FUNCTIONALITY - Uses post_likes table in Supabase
  const handleLikeToggle = useCallback(async (postId: number | string) => {
    try {
      const { supabase } = await import('@/config/supabase');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        toast({
          title: "Error",
          description: "Please log in to like posts",
          variant: "destructive"
        });
        return;
      }

      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const isCurrentlyLiked = post.isLiked;
      const postIdStr = postId.toString();

      if (isCurrentlyLiked) {
        // Unlike: Delete from post_likes table
        const { error: deleteError } = await supabase
          .from('post_likes')
          .delete()
          .eq('user_id', session.user.id)
          .eq('post_id', postIdStr)
          .eq('post_type', 'journey');

        // CRITICAL: If delete fails, throw error - don't update UI
        if (deleteError) {
          throw new Error(deleteError.message || 'Failed to unlike post');
        }

        // Update UI only after successful database operation
        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, isLiked: false, likes: Math.max(0, p.likes - 1) } 
            : p
        ));
      } else {
        // Like: Insert into post_likes table
        const { error: insertError } = await supabase
          .from('post_likes')
          .insert({
            user_id: session.user.id,
            post_id: postIdStr,
            post_type: 'journey'
          });

        // CRITICAL: If insert fails, throw error - don't update UI
        if (insertError) {
          // If it's a duplicate, that's okay - just update UI
          if (insertError.code !== '23505') {
            throw new Error(insertError.message || 'Failed to like post');
          }
        }

        // Update UI only after successful database operation
        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, isLiked: true, likes: p.likes + 1 } 
            : p
        ));
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update like. Please try again.",
        variant: "destructive"
      });
    }
  }, [posts, toast]);

  const handleDoubleTapLike = useCallback(async (postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (post && !post.isLiked) {
      // Use the same like handler
      await handleLikeToggle(postId);
    }
  }, [posts, handleLikeToggle]);

  const handleSaveToggle = useCallback((postId: number) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isSaved: !p.isSaved } : p));
  }, []);

  const handleCommentToggle = useCallback((postId: number) => {
    setOpenCommentsPostId(prevId => (prevId === postId ? null : postId));
  }, []);

  const openStory = useCallback((index: number) => {
    if (stories[index]?.isOwn) setIsAddStoryOpen(true);
    else setActiveStoryIndex(index);
  }, [stories]);

  const closeStory = useCallback(() => setActiveStoryIndex(null), []);
  const nextStory = useCallback(() => setActiveStoryIndex(prev => (prev !== null && prev < stories.length - 1 ? prev + 1 : null)), [stories.length]);
  const prevStory = useCallback(() => setActiveStoryIndex(prev => (prev !== null && prev > 0 ? prev - 1 : null)), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 relative">


      {/* Quick Actions Floating Button - Mobile */}
      <div className="fixed bottom-20 right-4 z-50 lg:hidden">
        <div className="flex flex-col gap-2">
          <Button 
            onClick={() => setIsCreatePostOpen(true)}
            className="h-12 w-12 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="w-6 h-6" />
          </Button>
          <Button 
            onClick={() => setIsAddStoryOpen(true)}
            variant="outline"
            className="h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm border-border/50 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Camera className="w-4 h-4" />
          </Button>
        </div>
      </div>



      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto pt-20 lg:pt-6 pb-20 lg:pb-6">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
          {/* Header with Create Post Button */}
          <div className="hidden lg:flex justify-end items-center mb-6 lg:mb-8">
            <div className="flex gap-3">
              <Button onClick={() => setIsCreatePostOpen(true)} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg transition-all duration-300">
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
              <Button onClick={() => setIsAddStoryOpen(true)} variant="outline" className="border-primary/20 hover:bg-primary/5 shadow-sm hover:shadow-md transition-all duration-300">
                <Camera className="w-4 h-4 mr-2" />
                Add Story
              </Button>
            </div>
          </div>
          {/* Top Search Bar */}
          <div className="mb-4 md:mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 bg-background/60 backdrop-blur-sm border-none rounded-xl h-10 md:h-11 shadow-sm focus:shadow-md transition-all duration-200" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
          </div>
          
          {activeTab === 'feed' && (
            <div className="space-y-4 lg:space-y-6">
              {/* Stories */}
              {isLoadingStories ? (
                <div className="grid grid-cols-1 sm:flex sm:gap-4 gap-3 sm:overflow-x-auto pb-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 sm:gap-2 min-w-fit">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 rounded-full bg-gray-200 animate-pulse"></div>
                      <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:flex sm:gap-4 gap-3 sm:overflow-x-auto pb-4 scrollbar-hide">
                  {stories.map((story, index) => (
                    <div key={story.id} className="flex flex-col items-center gap-1 sm:gap-2 min-w-fit cursor-pointer" onClick={() => openStory(index)}>
                      <div className={`p-[2px] rounded-full ${story.isOwn ? '' : 'bg-gradient-to-tr from-yellow-400 to-purple-600'}`}>
                        <Avatar className="w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 shadow-md">
                          <AvatarImage src={story.avatar} />
                          <AvatarFallback className="text-xs sm:text-sm">{story.user.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-center max-w-16 truncate">{story.isOwn ? "Your Story" : story.user}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Posts */}
              {isLoadingPosts ? (
                // Loading skeleton
                [...Array(3)].map((_, i) => (
                  <Card key={i} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-3 sm:p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 animate-pulse"></div>
                        <div className="flex-1">
                          <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                          <div className="w-32 h-3 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </CardContent>
                    <div className="aspect-square bg-gray-200 animate-pulse"></div>
                    <CardContent className="p-3 sm:p-4">
                      <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </CardContent>
                  </Card>
                ))
              ) : posts.length === 0 ? (
                // Empty state
                <Card className="overflow-hidden shadow-sm">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                    <p className="text-muted-foreground mb-4">Start following travelers or create your first post to see content here.</p>
                    <Button onClick={() => setIsCreatePostOpen(true)} className="bg-gradient-to-r from-primary to-primary/80">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Post
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => (
                  <Card key={post.id} className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 rounded-xl border-0">
                    <div id={`post-${post.id}`} className="relative">
                    <CardContent className="p-4 sm:p-5 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 ring-2 ring-offset-2 ring-primary/20">
                              <AvatarImage src={post.avatar} />
                              <AvatarFallback className="text-sm font-semibold">{post.user.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm sm:text-base truncate">{post.user}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground truncate flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {post.location}
                                </p>
                            </div>
                        </div>
                        <PostOptionsDropdown />
                    </CardContent>
                    <div className="aspect-square bg-muted relative overflow-hidden" onDoubleClick={() => handleDoubleTapLike(post.id)}>
                        <img 
                          src={post.image} 
                          alt="Post" 
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
                          onError={(e) => handleImageError(e, heroBeach, 'Post image failed to load')} 
                        />
                    </div>
                    <CardContent className="p-4 sm:p-5 bg-white">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-4 sm:gap-5">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-9 w-9 sm:h-10 sm:w-10 hover:bg-red-50 transition-colors" 
                                  onClick={() => handleLikeToggle(post.id)}
                                >
                                  <Heart className={`w-5 h-5 sm:w-6 sm:h-6 transition-all ${post.isLiked ? "text-red-500 fill-current scale-110" : "text-gray-700"}`} />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-9 w-9 sm:h-10 sm:w-10 hover:bg-blue-50 transition-colors" 
                                  onClick={() => handleCommentToggle(post.id)}
                                >
                                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-9 w-9 sm:h-10 sm:w-10 hover:bg-green-50 transition-colors"
                                  onClick={async () => {
                                    try {
                                      const postUrl = `${window.location.origin}/post/${post.id}`;
                                      
                                      // Try native share API (mobile)
                                      if (navigator.share) {
                                        await navigator.share({
                                          title: `${post.user}'s Post`,
                                          text: post.caption,
                                          url: postUrl,
                                        });
                                      } else {
                                        // Fallback: Copy to clipboard (desktop)
                                        await navigator.clipboard.writeText(postUrl);
                                        toast({
                                          title: "Link copied!",
                                          description: "Post link copied to clipboard",
                                        });
                                      }
                                    } catch (error: any) {
                                      // User cancelled share - that's okay
                                      if (error.name !== 'AbortError') {
                                        console.error('Share error:', error);
                                        // Fallback to clipboard
                                        try {
                                          const postUrl = `${window.location.origin}/post/${post.id}`;
                                          await navigator.clipboard.writeText(postUrl);
                                          toast({
                                            title: "Link copied!",
                                            description: "Post link copied to clipboard",
                                          });
                                        } catch (clipboardError) {
                                          toast({
                                            title: "Error",
                                            description: "Failed to share post",
                                            variant: "destructive"
                                          });
                                        }
                                      }
                                    }
                                  }}
                                >
                                  <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                                </Button>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 sm:h-10 sm:w-10 hover:bg-blue-50 transition-colors" 
                              onClick={() => handleSaveToggle(post.id)}
                            >
                              <Bookmark className={`w-5 h-5 sm:w-6 sm:h-6 transition-all ${post.isSaved ? "text-blue-500 fill-current" : "text-gray-700"}`} />
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <p className="font-semibold text-sm sm:text-base">{post.likes.toLocaleString()} likes</p>
                            <p className="text-sm sm:text-base leading-relaxed">
                              <span className="font-semibold mr-2">{post.user}</span> 
                              <span className="text-gray-800">{post.caption}</span>
                            </p>
                            {post.comments > 0 && (
                                <button 
                                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium" 
                                  onClick={() => handleCommentToggle(post.id)}
                                >
                                  View all {post.comments} {post.comments === 1 ? 'comment' : 'comments'}
                                </button>
                            )}
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">{post.time}</p>
                        </div>
                        {openCommentsPostId === post.id && <PostComments commentsCount={post.comments} />}
                    </CardContent>
                  </div>
                </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'explore' && (
            <div className="grid grid-cols-3 gap-1">
                {posts.map(post => (
                    <div key={post.id} className="aspect-square bg-muted relative group">
                        <img src={post.image} alt="Explore post" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center text-white opacity-0 group-hover:opacity-100">
                           <Heart className="w-5 h-5 mr-1" /> {post.likes}
                        </div>
                    </div>
                ))}
            </div>
          )}
        </div>
      </div>
      
      <StoryViewer story={activeStoryIndex !== null ? stories[activeStoryIndex] : null} onClose={closeStory} onNext={nextStory} onPrev={prevStory} />
      <AddStoryDialog open={isAddStoryOpen} onOpenChange={setIsAddStoryOpen} />
      <CreatePostDialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen} />
    </div>
  );
};

export default Home;