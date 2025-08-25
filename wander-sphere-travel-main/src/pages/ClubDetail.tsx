import React, { useState, useEffect } from "react";
import { handleImageError } from "@/utils/imageHandling";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Users, Settings, Calendar, MapPin, Heart, MessageCircle, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/utils/api";
import { apiConfig, endpoints } from "@/config/api";
import mountainAdventure from "@/assets/mountain-adventure.jpg";
import heroBeach from "@/assets/hero-beach.jpg";
import travelCommunity from "@/assets/travel-community.jpg";

const ClubDetail = () => {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [error, setError] = useState(null);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    const fetchClubDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // TODO: Replace with actual API call
        // const response = await apiRequest(`${apiConfig.baseURL}${endpoints.clubs}/${id}`);
        // setClub(response.data);
        
        // Temporary: Simulate API call with mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        setClub({
          id: 1,
          name: "Adventure Seekers",
          description: "Connect with travelers who share your passion for outdoor adventures and extreme sports. We organize group trips, share tips, and inspire each other to push boundaries and explore the world's most thrilling destinations.",
          image: mountainAdventure,
          members: 2847,
          category: "Adventure",
          created: "March 2023",
          isPrivate: false,
          rules: [
            "Be respectful to all members",
            "Share your adventures with photos and stories",
            "Help fellow travelers with advice and tips",
            "No spam or promotional content",
          ]
        });
      } catch (err) {
        setError('Failed to load club details');
        console.error('Error fetching club details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchClubData = async () => {
      try {
        setIsLoadingPosts(true);
        // TODO: Replace with actual API calls
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Set mock data temporarily
        setPosts([
          {
            id: 1,
            user: "sarah_adventures",
            avatar: "",
            content: "Just completed the Annapurna Circuit! 🏔️ 21 days of pure adventure. The views were absolutely incredible and the challenge was worth every step. Who's planning their next mountain adventure?",
            image: mountainAdventure,
            likes: 89,
            comments: 23,
            time: "2h ago",
          },
          {
            id: 2,
            user: "mike_climber",
            avatar: "",
            content: "Anyone interested in a group climb in the Dolomites this summer? Looking for 4-6 experienced climbers for a 10-day expedition. DM me if interested! 🧗‍♂️",
            image: null,
            likes: 42,
            comments: 18,
            time: "5h ago",
          },
          {
            id: 3,
            user: "adventure_squad",
            avatar: "",
            content: "Epic sunrise at Matterhorn basecamp this morning! Sometimes you have to wake up at 4am for views like this ☀️ #worth it",
            image: heroBeach,
            likes: 156,
            comments: 34,
            time: "1d ago",
          },
        ]);
        
        setMembers([
          { id: 1, name: "Sarah Chen", username: "@sarah_adventures", avatar: "", role: "Admin" },
          { id: 2, name: "Mike Rodriguez", username: "@mike_climber", avatar: "", role: "Moderator" },
          { id: 3, name: "Emily Johnson", username: "@emily_explorer", avatar: "", role: "Member" },
          { id: 4, name: "Adventure Squad", username: "@adventure_squad", avatar: "", role: "Member" },
          { id: 5, name: "Alex Kim", username: "@alex_mountains", avatar: "", role: "Member" },
        ]);
        
        setEvents([
          {
            id: 1,
            title: "Dolomites Climbing Expedition",
            date: "June 15-25, 2024",
            location: "Dolomites, Italy",
            attendees: 12,
            maxAttendees: 15,
          },
          {
            id: 2,
            title: "Virtual Gear Review Session", 
            date: "March 20, 2024",
            location: "Online",
            attendees: 45,
            maxAttendees: 50,
          },
          {
            id: 3,
            title: "Patagonia Trek Planning",
            date: "April 5, 2024", 
            location: "San Francisco, CA",
            attendees: 8,
            maxAttendees: 20,
          },
        ]);
      } catch (err) {
        console.error('Error fetching club data:', err);
      } finally {
        setIsLoadingPosts(false);
      }
    };

    if (id) {
      fetchClubDetails();
      fetchClubData();
    }
  }, [id]);



  const handleJoinLeave = async () => {
    try {
      // TODO: Replace with actual API call
      // await apiRequest(`${apiConfig.baseURL}${endpoints.clubs}/${id}/join`, {
      //   method: isJoined ? 'DELETE' : 'POST'
      // });
      setIsJoined(!isJoined);
    } catch (err) {
      console.error('Error joining/leaving club:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading club details...</p>
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

  if (!club) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Club not found</h2>
            <p className="text-muted-foreground mb-4">The club you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => window.history.back()} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-4">
        <Link to="/clubs">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clubs
        </Link>
      </Button>

      {/* Club Header */}
      <Card className="bg-surface-elevated mb-8 overflow-hidden">
        <div className="aspect-video relative">
          <img src={club.image} alt={club.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute bottom-6 left-6 text-white">
            <Badge className="mb-2 bg-white/20 text-white">
              {club.category}
            </Badge>
            <h1 className="text-3xl font-bold mb-2">{club.name}</h1>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {club.members.toLocaleString()} members
              </div>
              <span>Created {club.created}</span>
            </div>
          </div>
          <div className="absolute top-6 right-6">
            <Button onClick={handleJoinLeave} className={isJoined ? "bg-secondary text-secondary-foreground" : "bg-gradient-primary text-white"}>
              {isJoined ? "Leave Club" : "Join Club"}
            </Button>
          </div>
        </div>
        <CardContent className="p-6">
          <p className="text-muted-foreground leading-relaxed">{club.description}</p>
        </CardContent>
      </Card>

      {/* Club Content */}
      <Tabs defaultValue="feed" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-6">
          {isLoadingPosts ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Loading posts...</p>
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            posts.map((post) => (
            <Card key={post.id} className="bg-surface-elevated">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={post.avatar} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {post.user.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{post.user}</p>
                    <p className="text-sm text-muted-foreground">{post.time}</p>
                  </div>
                </div>
                
                <p className="mb-4">{post.content}</p>
                
                {post.image && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img 
                  src={post.image} 
                  alt="Post" 
                  className="w-full aspect-video object-cover" 
                  onError={(e) => handleImageError(e, "/images/hero-beach.jpg", `Failed to load club post image`)}
                />
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm">
                    <Heart className="w-4 h-4 mr-1" />
                    {post.likes}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {post.comments}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
          )}
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Club Members ({club.members.toLocaleString()})</h3>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Manage
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {members.map((member) => (
              <Card key={member.id} className="bg-surface-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.username}</p>
                      </div>
                    </div>
                    <Badge variant={member.role === 'Admin' ? 'default' : member.role === 'Moderator' ? 'secondary' : 'outline'}>
                      {member.role}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Upcoming Events</h3>
            <Button className="bg-gradient-primary text-white">
              <Calendar className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </div>

          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.id} className="bg-surface-elevated hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-2">{event.title}</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {event.date}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {event.attendees}/{event.maxAttendees} attending
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Join Event
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClubDetail;