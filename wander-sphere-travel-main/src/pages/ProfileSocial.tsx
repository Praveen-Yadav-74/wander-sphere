import React, { useState, useEffect, useRef } from "react";
import { handleImageError, getAvatarUrl } from "@/utils/imageHandling";
import { Link } from "react-router-dom";
import { Settings, MapPin, Calendar, Users, Heart, MessageCircle, Grid3X3, Bookmark, UserCheck, Loader2, Lock, Camera, Wallet, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { userService, UserProfile, FollowUser } from "@/services/userService";
import { journeyService, Journey } from "@/services/journeyService";
import WalletPage from "@/pages/WalletPage";
import heroBeach from "@/assets/hero-beach.jpg";
import mountainAdventure from "@/assets/mountain-adventure.jpg";
import streetFood from "@/assets/street-food.jpg";
import castleEurope from "@/assets/castle-europe.jpg";
import travelCommunity from "@/assets/travel-community.jpg";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [isFollowersOpen, setIsFollowersOpen] = useState(false);
  const [isFollowingOpen, setIsFollowingOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [userJourneys, setUserJourneys] = useState<Journey[]>([]);
  const [journeysLoading, setJourneysLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // userService is already imported as an instance

  // Fetch user journeys/posts
  const fetchUserJourneys = async () => {
    if (journeysLoading) return;
    
    try {
      setJourneysLoading(true);
      const response = await journeyService.getMyJourneys('published');
      setUserJourneys(response.data?.journeys || []);
    } catch (error) {
      console.error('Failed to fetch user journeys:', error);
      setUserJourneys([]);
    } finally {
      setJourneysLoading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    try {
      setAvatarUploading(true);
      const response = await userService.uploadAvatar(file);
      
      // Update global auth state
      await updateProfile({ avatar: response.avatarUrl });

      // Update local state
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          avatar: response.avatarUrl
        });
      }

      toast({
        title: "Success",
        description: "Profile photo updated successfully!"
      });
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      toast({
        title: "Upload failed",
        description: "Failed to update profile photo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAvatarUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Trigger file input click
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const savedPosts = [
    { id: 1, image: mountainAdventure, user: "sarah_travels" },
    { id: 2, image: streetFood, user: "foodie_explorer" },
    { id: 3, image: castleEurope, user: "historic_wanderer" },
  ];

  const taggedPosts = [
    { id: 1, image: travelCommunity, user: "travel_squad", location: "Bali, Indonesia" },
    { id: 2, image: heroBeach, user: "sunset_chasers", location: "Maldives" },
  ];

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const profile = await userService.getProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // Fallback to auth context user data
        if (user) {
          setUserProfile({
            ...user,
            name: `${user.firstName} ${user.lastName}`.trim(),
            verified: user.isVerified || false,
            followersCount: user.stats?.followersCount || 0,
            followingCount: user.stats?.followingCount || 0,
            tripsCount: user.stats?.tripsCompleted || 0,
            journeysCount: 0,
            stats: {
              countriesVisited: user.stats?.countriesVisited || 0,
              citiesVisited: user.stats?.citiesVisited || 0,
              totalDistance: user.stats?.totalDistance || 0,
              totalTrips: user.stats?.tripsCompleted || 0,
            },
            preferences: {
              travelStyle: user.preferences?.travelPreferences?.travelStyle ? [user.preferences.travelPreferences.travelStyle] : [],
              budget: 'mid-range',
              interests: user.preferences?.travelPreferences?.interests || [],
              languages: ['English'],
            },
            socialLinks: {},
          } as UserProfile);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
    fetchUserJourneys();
  }, [user]);

  // Fetch followers when dialog opens
  const fetchFollowers = async () => {
    if (followersLoading || followers.length > 0) return;
    
    try {
      setFollowersLoading(true);
      const response = await userService.getFollowers();
      setFollowers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch followers:', error);
    } finally {
      setFollowersLoading(false);
    }
  };

  // Fetch following when dialog opens
  const fetchFollowing = async () => {
    if (followingLoading || following.length > 0) return;
    
    try {
      setFollowingLoading(true);
      const response = await userService.getFollowing();
      setFollowing(response.data || []);
    } catch (error) {
      console.error('Failed to fetch following:', error);
    } finally {
      setFollowingLoading(false);
    }
  };

  // Handle follow/unfollow actions
  const handleFollowToggle = async (userId: string, isCurrentlyFollowing: boolean) => {
    try {
      if (isCurrentlyFollowing) {
        await userService.unfollowUser(userId);
      } else {
        await userService.followUser(userId);
      }
      
      // Update local state
      setFollowers(prev => prev.map(user => 
        user.id === userId ? { ...user, isFollowing: !isCurrentlyFollowing } : user
      ));
      setFollowing(prev => prev.map(user => 
        user.id === userId ? { ...user, isFollowing: !isCurrentlyFollowing } : user
      ));
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  // Format join date
  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return `Joined ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
  };

  if (isLoading || !userProfile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }



  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Profile Header */}
      {/* Profile Header */}
      <div className="bg-surface-elevated rounded-xl overflow-hidden shadow-sm mb-6 pb-4">
        {/* Cover Photo - Gradient or Image */}
        <div className="h-32 sm:h-48 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 relative">
          {/* Optional: Add actual cover photo if available */}
        </div>

        <div className="px-4 relative">
          {/* Avatar - Overlapping Cover */}
          <div className="flex justify-center -mt-12 sm:-mt-16 mb-3">
            <div className="relative group">
              <Avatar className="w-24 h-24 sm:w-32 sm:h-32 cursor-pointer ring-4 ring-background shadow-xl" onClick={handleAvatarClick}>
                <AvatarImage src={getAvatarUrl(userProfile.avatar)} className="object-cover" />
                <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                  {userProfile.name ? userProfile.name.split(' ').map(n => n[0]).join('') : 'U'}
                </AvatarFallback>
              </Avatar>
              {avatarUploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* User Info - Centered */}
          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{userProfile.name || `${user?.firstName} ${user?.lastName}`.trim()}</h1>
            <p className="text-muted-foreground text-sm">@{userProfile.username || user?.username}</p>
            {userProfile.bio && (
              <p className="text-foreground mt-2 max-w-sm mx-auto text-sm">{userProfile.bio}</p>
            )}
            
            <div className="flex flex-wrap justify-center gap-3 mt-3 text-xs text-muted-foreground">
              {userProfile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {userProfile.location}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatJoinDate(userProfile.createdAt || user?.createdAt || new Date().toISOString())}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3 mb-6">
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[100px]">
              <Link to="/settings">
                Edit Profile
              </Link>
            </Button>
            <Button asChild variant="outline" className="min-w-[100px]">
              <div className="cursor-pointer flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </div>
            </Button>
          </div>

          {/* Stats Row - Clean Grid */}
          <div className="grid grid-cols-3 gap-0 border-t border-b py-3 mb-2">
            <div className="text-center px-2 cursor-pointer hover:bg-muted/30 transition-colors py-1 rounded-lg">
              <p className="text-lg font-bold text-foreground">{userJourneys.length}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            
            <Dialog open={isFollowersOpen} onOpenChange={(open) => {
              setIsFollowersOpen(open);
              if (open) fetchFollowers();
            }}>
              <DialogTrigger asChild>
                <div className="text-center px-2 cursor-pointer hover:bg-muted/30 transition-colors py-1 rounded-lg border-l border-r border-border/50">
                  <p className="text-lg font-bold text-foreground">{userProfile.followersCount?.toLocaleString() || '0'}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Followers</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {followersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : followers.length > 0 ? (
                    (followers || []).map((follower) => (
                      <div key={follower.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={getAvatarUrl(follower.avatar)} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {follower.name ? follower.name.split(' ').map(n => n[0]).join('') : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{follower.name}</p>
                            <p className="text-sm text-muted-foreground">@{follower.username}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant={follower.isFollowing ? "secondary" : "default"}
                          onClick={() => handleFollowToggle(follower.id, follower.isFollowing)}
                        >
                          {follower.isFollowing ? "Following" : "Follow"}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No followers yet
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isFollowingOpen} onOpenChange={(open) => {
              setIsFollowingOpen(open);
              if (open) fetchFollowing();
            }}>
              <DialogTrigger asChild>
                <div className="text-center px-2 cursor-pointer hover:bg-muted/30 transition-colors py-1 rounded-lg">
                  <p className="text-lg font-bold text-foreground">{userProfile.followingCount?.toLocaleString() || '0'}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Following</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {followingLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : following.length > 0 ? (
                    (following || []).map((followedUser) => (
                      <div key={followedUser.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={getAvatarUrl(followedUser.avatar)} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {followedUser.name ? followedUser.name.split(' ').map(n => n[0]).join('') : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{followedUser.name}</p>
                            <p className="text-sm text-muted-foreground">@{followedUser.username}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleFollowToggle(followedUser.id, true)}
                        >
                          Following
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Not following anyone yet
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Posts Tabs */}
      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="wallet" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Wallet
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <Bookmark className="w-4 h-4" />
            Saved
          </TabsTrigger>
          <TabsTrigger value="tagged" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Tagged
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallet">
          <WalletPage embedded />
        </TabsContent>

        <TabsContent value="posts">
          <div className="grid grid-cols-3 gap-1">
            {journeysLoading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="aspect-square bg-gray-200 animate-pulse" />
              ))
            ) : userJourneys.length > 0 ? (
              (userJourneys || []).map((journey) => (
                <div key={journey.id} className="aspect-square relative group cursor-pointer overflow-hidden">
                  <img 
                    src={journey.images?.[0] || heroBeach} 
                    alt={journey.title} 
                    className="w-full h-full object-cover" 
                    onError={(e) => handleImageError(e, "/images/hero-beach.jpg", `Failed to load journey image for ${journey.title}`)}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <div className="flex items-center gap-4 text-white">
                       <div className="flex items-center gap-1">
                         <Heart className={`w-5 h-5 fill-current ${journey.isLiked ? 'text-red-500' : ''}`} />
                         <span className="font-medium">{journey.likeCount || 0}</span>
                       </div>
                       <div className="flex items-center gap-1">
                         <MessageCircle className="w-5 h-5 fill-current" />
                         <span className="font-medium">{journey.commentCount || 0}</span>
                       </div>
                     </div>
                   </div>
                   {!journey.isPublic && (
                     <div className="absolute top-2 right-2">
                       <Lock className="w-4 h-4 text-white drop-shadow-lg" />
                     </div>
                   )}
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <div className="text-muted-foreground">
                  <Grid3X3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No posts yet</p>
                  <p className="text-sm">Start sharing your travel journeys!</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="saved">
          {savedPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {savedPosts.map((post) => (
                <div key={post.id} className="aspect-square relative group cursor-pointer overflow-hidden">
                  <img 
                  src={post.image} 
                  alt="Saved post" 
                  className="w-full h-full object-cover" 
                  onError={(e) => handleImageError(e, "/images/hero-beach.jpg", `Failed to load saved post image`)}
                />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-white text-center">
                      <p className="font-medium">@{post.user}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bookmark className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No saved posts yet</h3>
              <p className="text-muted-foreground">Save posts you want to revisit later</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="tagged">
          {taggedPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {taggedPosts.map((post) => (
                <div key={post.id} className="aspect-square relative group cursor-pointer overflow-hidden">
                  <img 
                  src={post.image} 
                  alt="Tagged post" 
                  className="w-full h-full object-cover" 
                  onError={(e) => handleImageError(e, "/images/hero-beach.jpg", `Failed to load tagged post image`)}
                />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-white text-center">
                      <p className="font-medium">@{post.user}</p>
                      <p className="text-sm opacity-80">{post.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <UserCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tagged posts yet</h3>
              <p className="text-muted-foreground">Posts you're tagged in will appear here</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;