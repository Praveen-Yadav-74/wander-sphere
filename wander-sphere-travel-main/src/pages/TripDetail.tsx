import React, { useState, useEffect } from 'react';
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Users, DollarSign, MessageCircle, Heart, Share2, Loader2 } from "lucide-react";
import { apiRequest } from '@/utils/api';
import { apiConfig, endpoints } from '@/config/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import castleEurope from "@/assets/castle-europe.jpg";

const TripDetail = () => {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState("");
  const [isInterested, setIsInterested] = useState(false);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // TODO: Replace with actual API call
        // const response = await apiRequest(`${apiConfig.baseURL}${endpoints.trips}/${id}`);
        // setTrip(response.data);
        
        // Temporary: Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setTrip(null); // Will show empty state until API is connected
      } catch (err) {
        setError('Failed to load trip details');
        console.error('Error fetching trip details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchTripDetails();
    }
  }, [id]);

  const participants = [
    { id: 1, name: "Maria Lopez", username: "@maria_lopez", avatar: "", role: "Organizer" },
    { id: 2, name: "Alessandro R.", username: "@alessandro_r", avatar: "", role: "Participant" },
    { id: 3, name: "Sophie Chen", username: "@sophie_travels", avatar: "", role: "Participant" },
  ];

  const comments = [
    {
      id: 1,
      user: "alex_explorer",
      avatar: "",
      content: "This looks amazing! I've always wanted to visit the Amalfi Coast. Is there still space available?",
      time: "2h ago",
      likes: 3,
    },
    {
      id: 2,
      user: "travel_junkie",
      avatar: "",
      content: "The itinerary looks perfect! Quick question - what's the accommodation situation? Are we sharing rooms?",
      time: "5h ago", 
      likes: 1,
    },
    {
      id: 3,
      user: "foodie_explorer",
      avatar: "",
      content: "Count me in! I'm especially excited about the food experiences. Maria, do you have any specific restaurants in mind?",
      time: "1d ago",
      likes: 5,
    },
  ];

  const handleInterest = async () => {
    try {
      // TODO: Replace with actual API call
      // await apiRequest(`${apiConfig.baseURL}${endpoints.trips}/${id}/interest`, {
      //   method: isInterested ? 'DELETE' : 'POST'
      // });
      setIsInterested(!isInterested);
    } catch (err) {
      console.error('Error expressing interest:', err);
    }
  };

  const handleAddComment = async () => {
    if (comment.trim()) {
      try {
        // TODO: Replace with actual API call
        // await apiRequest(`${apiConfig.baseURL}${endpoints.trips}/${id}/comments`, {
        //   method: 'POST',
        //   body: JSON.stringify({ content: comment })
        // });
        console.log("Adding comment:", comment);
        setComment("");
      } catch (err) {
        console.error('Error adding comment:', err);
      }
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
          <img src={trip.image} alt={trip.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute top-4 right-4">
            <Badge className={`${trip.status === "Open" ? "bg-success" : trip.status === "Seeking Buddies" ? "bg-warning" : "bg-destructive"} text-white`}>
              {trip.status}
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
                {trip.dates}
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {trip.participants}/{trip.maxParticipants} travelers
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
                  <AvatarImage src={trip.organizerAvatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {trip.organizer.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{trip.organizer}</h3>
                  <p className="text-muted-foreground text-sm mb-3">{trip.organizerBio}</p>
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
                <Button onClick={handleAddComment} size="sm" className="bg-gradient-primary text-white">
                  Add Comment
                </Button>
              </div>

              <Separator />

              {/* Comments List */}
              <div className="space-y-6">
                {comments.map((commentItem) => (
                  <div key={commentItem.id} className="flex gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={commentItem.avatar} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {commentItem.user.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{commentItem.user}</span>
                        <span className="text-xs text-muted-foreground">{commentItem.time}</span>
                      </div>
                      <p className="text-sm mb-2">{commentItem.content}</p>
                      <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                          <Heart className="w-3 h-3 mr-1" />
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
                <div>
                  <p className="font-medium mb-1">Meeting Point</p>
                  <p className="text-muted-foreground">{trip.meetingPoint}</p>
                </div>
                <div>
                  <p className="font-medium mb-1">Requirements</p>
                  <ul className="text-muted-foreground space-y-1">
                    {trip.requirements.map((req, index) => (
                      <li key={index} className="text-xs">• {req}</li>
                    ))}
                  </ul>
                </div>
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
                {participants.map((participant) => (
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
                    {participant.role === "Organizer" && (
                      <Badge variant="outline" className="text-xs">
                        Organizer
                      </Badge>
                    )}
                  </div>
                ))}
                <div className="text-center pt-2">
                  <p className="text-xs text-muted-foreground">
                    {trip.maxParticipants - trip.participants} spots remaining
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