import React, { useState, useEffect } from 'react';
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Users, DollarSign, MessageCircle, Heart, Share2, Loader2 } from "lucide-react";
import { tripService, Trip, TripComment } from '@/services/tripService';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import castleEurope from "@/assets/castle-europe.jpg";

const TripDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [comments, setComments] = useState<TripComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [isInterested, setIsInterested] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    const fetchTripDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch trip details and comments in parallel
        const [tripData, commentsData] = await Promise.all([
          tripService.getTripById(id),
          tripService.getTripComments(id)
        ]);
        
        setTrip(tripData);
        setComments(commentsData);
      } catch (err: any) {
        setError(err.message || 'Failed to load trip details');
        console.error('Error fetching trip details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTripDetails();
  }, [id]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return '1d ago';
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleInterest = async () => {
    if (!id) return;
    
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('user') !== null;
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in or sign up to join this trip.",
      });
      // Store the current page URL to redirect back after login
      localStorage.setItem('redirectAfterAuth', window.location.pathname);
      window.location.href = '/login';
      return;
    }
    
    try {
      if (isInterested) {
        await tripService.leaveTrip(id);
        toast({
          title: "Interest removed",
          description: "You're no longer interested in this trip.",
        });
      } else {
        await tripService.joinTrip(id);
        toast({
          title: "Interest expressed!",
          description: "The organizer will be notified of your interest.",
        });
      }
      setIsInterested(!isInterested);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to update interest',
        variant: "destructive",
      });
      console.error('Error expressing interest:', err);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !id || isSubmittingComment) return;
    
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('user') !== null;
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in or sign up to comment on this trip.",
      });
      // Store the current page URL to redirect back after login
      localStorage.setItem('redirectAfterAuth', window.location.pathname);
      window.location.href = '/login';
      return;
    }
    
    try {
      setIsSubmittingComment(true);
      const newComment = await tripService.addTripComment(id, comment.trim());
      setComments(prev => [newComment, ...prev]);
      setComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to add comment',
        variant: "destructive",
      });
      console.error('Error adding comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading trip details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Trip not found</h2>
            <p className="text-muted-foreground mb-4">The trip you're looking for doesn't exist or has been removed.</p>
            <Button asChild variant="outline">
              <Link to="/find-trips">Browse Trips</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-4">
        <Link to="/find-trips">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Find Trips
        </Link>
      </Button>

      {/* Trip Header */}
      <Card className="bg-surface-elevated mb-8 overflow-hidden">
        <div className="aspect-video relative">
          <img src={trip.images?.[0] || castleEurope} alt={trip.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute top-4 right-4">
            <Badge className={`${trip.status === "open" ? "bg-green-500" : trip.status === "full" ? "bg-yellow-500" : "bg-red-500"} text-white`}>
              {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
            </Badge>
          </div>
          <div className="absolute bottom-6 left-6 text-white">
            <h1 className="text-3xl font-bold mb-4">{trip.title}</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {trip.destination}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {trip.currentParticipants}/{trip.maxParticipants} travelers
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                {trip.budget}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Organizer */}
          <Card className="bg-surface-elevated">
            <CardHeader>
              <CardTitle>Organized by</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={trip.organizer.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {trip.organizer.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{trip.organizer.name}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{trip.organizer.bio || 'Travel enthusiast'}</p>
                  <Button size="sm" variant="outline">
                    View Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="bg-surface-elevated">
            <CardHeader>
              <CardTitle>About This Trip</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {trip.description.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-3 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-6">
                {trip.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card className="bg-surface-elevated">
            <CardHeader>
              <CardTitle>Discussion ({comments.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Comment */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Ask a question or share your thoughts about this trip..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-20"
                />
                <Button 
                  onClick={handleAddComment} 
                  size="sm" 
                  className="bg-gradient-primary text-white"
                  disabled={isSubmittingComment || !comment.trim()}
                >
                  {isSubmittingComment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Comment'
                  )}
                </Button>
              </div>

              <Separator />

              {/* Comments List */}
              <div className="space-y-6">
                {comments.map((commentItem) => (
                  <div key={commentItem.id} className="flex gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={commentItem.user.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {commentItem.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{commentItem.user.name}</span>
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(commentItem.createdAt)}</span>
                      </div>
                      <p className="text-sm mb-2">{commentItem.content}</p>
                      <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                          <Heart className={`w-3 h-3 mr-1 ${commentItem.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                          {commentItem.likes}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Join Trip */}
          <Card className="bg-surface-elevated">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-primary">{trip.budget}</p>
                  <p className="text-sm text-muted-foreground">per person</p>
                </div>
                <Button 
                  onClick={handleInterest}
                  className={`w-full ${isInterested ? 'bg-secondary text-secondary-foreground' : 'bg-gradient-primary text-white'}`}
                  size="lg"
                >
                  {isInterested ? "Interest Sent!" : "I'm Interested"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  You can contact the organizer directly after expressing interest
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Trip Details */}
          <Card className="bg-surface-elevated">
            <CardHeader>
              <CardTitle className="text-lg">Trip Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-1">Duration</p>
                  <p className="text-muted-foreground">{trip.duration}</p>
                </div>
                <div>
                  <p className="font-medium mb-1">Trip Type</p>
                  <p className="text-muted-foreground">{trip.type}</p>
                </div>
                {trip.meetingPoint && (
                  <div>
                    <p className="font-medium mb-1">Meeting Point</p>
                    <p className="text-muted-foreground">{trip.meetingPoint}</p>
                  </div>
                )}
                {trip.requirements && trip.requirements.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">Requirements</p>
                    <ul className="text-muted-foreground space-y-1">
                      {trip.requirements.map((req, index) => (
                        <li key={index} className="text-xs">• {req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card className="bg-surface-elevated">
            <CardHeader>
              <CardTitle className="text-lg">Who's Going</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trip.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={participant.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {participant.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{participant.name}</p>
                      <p className="text-xs text-muted-foreground">{participant.username}</p>
                    </div>
                    {participant.role === "organizer" && (
                      <Badge variant="outline" className="text-xs">
                        Organizer
                      </Badge>
                    )}
                  </div>
                ))}
                <div className="text-center pt-2">
                  <p className="text-xs text-muted-foreground">
                    {trip.maxParticipants - trip.currentParticipants} spots remaining
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share */}
          <Card className="bg-surface-elevated">
            <CardContent className="p-4">
              <Button variant="outline" className="w-full">
                <Share2 className="w-4 h-4 mr-2" />
                Share Trip
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TripDetail;