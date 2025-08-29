import React, { useState, useEffect } from "react";
import { handleImageError } from "@/utils/imageUtils";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Users, Settings, Calendar, MapPin, Heart, MessageCircle, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { clubService, Club, ClubMember, ClubPost } from "@/services/clubService";
import mountainAdventure from "@/assets/mountain-adventure.jpg";
import heroBeach from "@/assets/hero-beach.jpg";
import travelCommunity from "@/assets/travel-community.jpg";

const ClubDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [club, setClub] = useState<Club | null>(null);
  const [posts, setPosts] = useState<ClubPost[]>([]);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoiningLeaving, setIsJoiningLeaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchClubDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const clubData = await clubService.getClubById(id);
        setClub(clubData);
      } catch (err) {
        setError('Failed to load club details');
        console.error('Error fetching club details:', err);
        toast({
          title: "Error",
          description: "Failed to load club details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const fetchClubData = async () => {
      if (!id) return;
      
      try {
        setIsLoadingPosts(true);
        const [postsData, membersData] = await Promise.all([
          clubService.getClubPosts(id),
          clubService.getClubMembers(id)
        ]);
        
        setPosts(postsData);
        setMembers(membersData);
        
        // TODO: Add events API when available
        setEvents([]);
      } catch (err) {
        console.error('Error fetching club data:', err);
        toast({
          title: "Error",
          description: "Failed to load some club data.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingPosts(false);
      }
    };


    if (id) {
      fetchClubDetails();
      fetchClubData();
    }
  }, [id, toast]);



  const handleJoinLeave = async () => {
    if (!id || !club) return;
    
    try {
      setIsJoiningLeaving(true);
      
      if (club.isJoined) {
        await clubService.leaveClub(id);
        toast({
          title: "Success",
          description: "You have left the club.",
        });
        setClub({ ...club, isJoined: false, members: club.members - 1 });
      } else {
        await clubService.joinClub(id);
        toast({
          title: "Success",
          description: "You have joined the club!",
        });
        setClub({ ...club, isJoined: true, members: club.members + 1 });
      }
    } catch (err) {
      console.error('Error joining/leaving club:', err);
      toast({
        title: "Error",
        description: "Failed to update club membership. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoiningLeaving(false);
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
                {club.members?.toLocaleString() || 0} members
              </div>
              {club.createdAt && (
                <span>Created {new Date(club.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              )}
            </div>
          </div>
          <div className="absolute top-6 right-6">
            <Button 
              onClick={handleJoinLeave} 
              className={club.isJoined ? "bg-secondary text-secondary-foreground" : "bg-gradient-primary text-white"}
              disabled={isJoiningLeaving}
            >
              {isJoiningLeaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {club.isJoined ? "Leaving..." : "Joining..."}
                </>
              ) : (
                club.isJoined ? "Leave Club" : "Join Club"
              )}
            </Button>
          </div>
        </div>
        <CardContent className="p-6">
          <p className="text-muted-foreground leading-relaxed">{club.description || 'No description available.'}</p>
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
                    <AvatarImage src={post.author?.avatar} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {post.author?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{post.author?.name || 'Unknown User'}</p>
                    <p className="text-sm text-muted-foreground">
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                </div>
                
                <p className="mb-4">{post.content}</p>
                
                {post.images && post.images.length > 0 && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img 
                  src={post.images[0]} 
                  alt="Post" 
                  className="w-full aspect-video object-cover" 
                  onError={(e) => handleImageError(e, "/images/hero-beach.jpg", `Failed to load club post image`)}
                />
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm">
                    <Heart className="w-4 h-4 mr-1" />
                    {post.likes || 0}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {post.comments || 0}
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
            <h3 className="text-lg font-semibold">Club Members ({club.members?.toLocaleString() || 0})</h3>
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
                          {member.name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.username || `@${member.name?.toLowerCase().replace(/\s+/g, '_')}`}</p>
                      </div>
                    </div>
                    <Badge variant={member.role === 'admin' ? 'default' : member.role === 'moderator' ? 'secondary' : 'outline'}>
                      {member.role?.charAt(0).toUpperCase() + member.role?.slice(1) || 'Member'}
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
            {events.length > 0 ? (
              events.map((event) => (
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
              ))
            ) : (
              <Card className="bg-surface-elevated">
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No events scheduled yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClubDetail;