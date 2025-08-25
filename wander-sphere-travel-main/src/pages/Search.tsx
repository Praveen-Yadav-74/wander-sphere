import React, { useState } from "react";
import { handleImageError } from "@/utils/imageHandling";
import { Search as SearchIcon, Users, MapPin, Hash, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import heroBeach from "@/assets/hero-beach.jpg";
import mountainAdventure from "@/assets/mountain-adventure.jpg";
import streetFood from "@/assets/street-food.jpg";
import castleEurope from "@/assets/castle-europe.jpg";

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const trendingHashtags = [
    { tag: "#bali", posts: 15234 },
    { tag: "#solotravel", posts: 8945 },
    { tag: "#foodie", posts: 7623 },
    { tag: "#backpacking", posts: 6891 },
    { tag: "#adventure", posts: 5432 },
  ];

  const users = [
    {
      id: 1,
      name: "Sarah Chen",
      username: "@sarah_travels",
      bio: "Adventure seeker • 🏔️ Mountain lover • 📸 Travel photographer",
      followers: 15600,
      avatar: "",
      isFollowing: false,
    },
    {
      id: 2,
      name: "Alex Explorer",
      username: "@alex_explorer",
      bio: "Digital nomad • 🌍 Visiting all 7 continents • Currently in Bali",
      followers: 12300,
      avatar: "",
      isFollowing: true,
    },
    {
      id: 3,
      name: "Maria Lopez",
      username: "@maria_wanders",
      bio: "Foodie traveler • 🍜 Street food expert • Culture enthusiast",
      followers: 9800,
      avatar: "",
      isFollowing: false,
    },
  ];

  const posts = [
    {
      id: 1,
      user: "sarah_travels",
      image: heroBeach,
      caption: "Paradise found in the Maldives! The water is so clear you can see your toes ✨ #maldives #paradise #beachlife",
      likes: 247,
      location: "Maldives",
    },
    {
      id: 2,
      user: "alex_explorer", 
      image: mountainAdventure,
      caption: "Conquered my first 4000m peak today! The view from the Swiss Alps is absolutely breathtaking 🏔️ #swissalps #mountaineering #adventure",
      likes: 189,
      location: "Swiss Alps, Switzerland",
    },
    {
      id: 3,
      user: "maria_wanders",
      image: streetFood,
      caption: "This ramen in Tokyo is life-changing! 🍜 The perfect end to an amazing day exploring the city #tokyo #ramen #foodie",
      likes: 156,
      location: "Tokyo, Japan",
    },
  ];

  const clubs = [
    {
      id: 1,
      name: "Adventure Seekers",
      description: "For thrill-seekers and outdoor enthusiasts",
      members: 2847,
      image: mountainAdventure,
      category: "Adventure",
    },
    {
      id: 2,
      name: "Foodie Explorers",
      description: "Discover the world's best cuisine together",
      members: 1923,
      image: streetFood,
      category: "Food",
    },
    {
      id: 3,
      name: "Historic Wanderers",
      description: "Explore ancient sites and cultural landmarks",
      members: 1456,
      image: castleEurope,
      category: "Culture",
    },
  ];

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPosts = posts.filter(post =>
    post.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClubs = clubs.filter(club =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Search</h1>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Search for places, people, or posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
      </div>

      {/* Trending Section - Show when no search query */}
      {!searchQuery && (
        <Card className="bg-surface-elevated mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Trending Hashtags</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingHashtags.map((hashtag, index) => (
                <Button
                  key={index}
                  variant="secondary"
                  className="h-auto p-3 flex flex-col items-start"
                  onClick={() => setSearchQuery(hashtag.tag)}
                >
                  <span className="font-semibold text-primary">{hashtag.tag}</span>
                  <span className="text-xs text-muted-foreground">
                    {hashtag.posts.toLocaleString()} posts
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchQuery && (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="clubs">Clubs</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-8">
            {/* Users Results */}
            {filteredUsers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  People
                </h3>
                <div className="space-y-4">
                  {filteredUsers.slice(0, 3).map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              </div>
            )}

            {/* Posts Results */}
            {filteredPosts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  Posts
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPosts.slice(0, 6).map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )}

            {/* Clubs Results */}
            {filteredClubs.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Clubs
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredClubs.slice(0, 3).map((club) => (
                    <ClubCard key={club.id} club={club} />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users">
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="posts">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="clubs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClubs.map((club) => (
                <ClubCard key={club.id} club={club} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* No Results */}
      {searchQuery && filteredUsers.length === 0 && filteredPosts.length === 0 && filteredClubs.length === 0 && (
        <div className="text-center py-12">
          <SearchIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No results found</h3>
          <p className="text-muted-foreground">
            Try searching for different keywords or check your spelling
          </p>
        </div>
      )}
    </div>
  );
};

const UserCard = ({ user }: { user: any }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-semibold">{user.name}</h4>
            <p className="text-sm text-muted-foreground">{user.username}</p>
            <p className="text-sm text-muted-foreground line-clamp-1">{user.bio}</p>
            <p className="text-xs text-muted-foreground">
              {user.followers.toLocaleString()} followers
            </p>
          </div>
        </div>
        <Button size="sm" variant={user.isFollowing ? "secondary" : "default"}>
          {user.isFollowing ? "Following" : "Follow"}
        </Button>
      </div>
    </CardContent>
  </Card>
);

const PostCard = ({ post }: { post: any }) => (
  <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
    <div className="aspect-square overflow-hidden">
      <img 
                    src={post.image} 
                    alt="Post" 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                    onError={(e) => handleImageError(e, "/images/hero-beach.jpg", `Failed to load post image`)}
                  />
    </div>
    <CardContent className="p-3">
      <p className="text-sm font-medium">@{post.user}</p>
      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{post.caption}</p>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          {post.location}
        </div>
        <span className="text-xs text-muted-foreground">{post.likes} likes</span>
      </div>
    </CardContent>
  </Card>
);

const ClubCard = ({ club }: { club: any }) => (
  <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
    <div className="aspect-video overflow-hidden">
      <img src={club.image} alt={club.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
    </div>
    <CardContent className="p-4">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold line-clamp-1">{club.name}</h4>
        <Badge variant="secondary" className="text-xs">
          {club.category}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{club.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {club.members.toLocaleString()} members
        </span>
        <Button size="sm" variant="outline">
          Join
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default Search;