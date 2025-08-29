import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Camera, Heart, MessageCircle, Share2, Map, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { journeyService, Journey, JourneyComment } from '@/services/journeyService';
import streetFood from "@/assets/street-food.jpg";
import heroBeach from "@/assets/hero-beach.jpg";
import mountainAdventure from "@/assets/mountain-adventure.jpg";
import castleEurope from "@/assets/castle-europe.jpg";

const JourneyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchJourneyData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const response = await journeyService.getJourney(id);
        if (response.success && response.data) {
          setJourney(response.data.journey);
          setIsLiked(response.data.journey.isLiked || false);
        }
      } catch (err) {
        console.error('Error fetching journey:', err);
        if (err instanceof Error && err.message.includes('404')) {
          setError('Journey not found');
        } else {
          setError('Failed to load journey details');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchJourneyData();
  }, [id]);

  const handleLike = async () => {
    if (!journey) return;
    
    try {
      const response = await journeyService.toggleLike(journey.id);
      if (response.success && response.data) {
        setIsLiked(response.data.isLiked);
        // Update journey like count if needed
        setJourney(prev => prev ? { ...prev, likeCount: response.data.likeCount } : prev);
      }
      
      toast({
        title: isLiked ? "Removed from favorites" : "Added to favorites",
        description: isLiked 
          ? "Journey removed from your favorites" 
          : "Journey added to your favorites",
      });
    } catch (err) {
      console.error('Error toggling like:', err);
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async () => {
    if (!journey || !newComment.trim()) return;
    
    try {
      setIsCommenting(true);
      const response = await journeyService.addComment(journey.id, newComment.trim());
      if (response.success && response.data) {
        // Update journey with new comment
        setJourney(prev => prev ? {
          ...prev,
          comments: [...prev.comments, response.data.comment],
          commentCount: response.data.commentCount
        } : prev);
      }
      setNewComment('');
      
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCommenting(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: journey?.title || 'Journey',
          text: `Check out this amazing journey: ${journey?.title}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "Journey link copied to clipboard",
        });
      }
    } catch (err) {
      console.error('Error sharing:', err);
      toast({
        title: "Error",
        description: "Failed to share journey",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading journey details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
            <Button asChild>
              <Link to="/map">Back to Map</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Journey not found</p>
          <Button asChild>
            <Link to="/map">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Travel Map
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const getFallbackImage = (index: number) => {
    const images = [streetFood, castleEurope, heroBeach, mountainAdventure];
    return images[index % images.length];
  };

  const journeyImages = journey?.images || [];
  const journeyDestinations = journey?.destinations || [];
  const journeyComments = journey?.comments || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-4">
        <Link to="/map">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Travel Map
        </Link>
      </Button>

      {/* Journey Header */}
      <Card className="bg-surface-elevated mb-8">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-4">{journey.title}</h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{journeyDestinations.length}</p>
                  <p className="text-sm text-muted-foreground">Destinations</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">{journey.duration || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">Duration</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning">{journeyImages.length}</p>
                  <p className="text-sm text-muted-foreground">Photos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent">{journey.views}</p>
                  <p className="text-sm text-muted-foreground">Views</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {journeyDestinations.map((destination, index) => (
                  <Badge key={index} variant="secondary">
                    <MapPin className="w-3 h-3 mr-1" />
                    {destination}
                  </Badge>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {journey.tags?.map((tag, index) => (
                  <Badge key={`tag-${index}`} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
              
              <div className="prose prose-sm max-w-none mb-6">
                {journey.description?.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-3 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Destinations</h3>
                {journey.destinations?.map((destination, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>{destination}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
                className="flex items-center gap-2"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                {journey.likes || 0}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Photo Gallery */}
          <Card className="bg-surface-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Photo Gallery ({journeyImages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {journeyImages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {journeyImages.map((image, index) => (
                    <div key={index} className="group cursor-pointer">
                      <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                        <img
                          src={image || getFallbackImage(index)}
                          alt={`Journey photo ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = getFallbackImage(index);
                          }}
                        />
                      </div>
                      <div className="mt-2">
                        <h4 className="font-semibold">Journey Photo {index + 1}</h4>
                        <p className="text-sm text-muted-foreground">
                          No caption available
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No photos available for this journey.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card className="bg-surface-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Comments ({journeyComments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="" />
                    <AvatarFallback>You</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Share your thoughts about this journey..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || isCommenting}
                        size="sm"
                      >
                        {isCommenting ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Post Comment
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {journeyComments.length > 0 ? (
                    journeyComments.map((comment) => (
                      <div key={comment.id} className="bg-gradient-to-r from-primary/5 to-transparent pl-4 rounded-r-lg">
                        <div className="flex gap-3 py-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.user.avatar} />
                            <AvatarFallback>
                              {comment.user.firstName} {comment.user.lastName}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {comment.user.firstName} {comment.user.lastName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground border-t">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No comments yet. Be the first to share your thoughts!</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Journey Stats */}
          <Card className="bg-surface-elevated">
            <CardHeader>
              <CardTitle>Journey Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">{formatDate(journey.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span className="font-medium">{formatDate(journey.updatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Author</span>
                  <span className="font-medium">{journey.author.firstName} {journey.author.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destinations</span>
                  <span className="font-medium">{journeyDestinations.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Difficulty</span>
                  <span className="font-medium capitalize">{journey.difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="font-medium">{journey.budget}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JourneyDetail;