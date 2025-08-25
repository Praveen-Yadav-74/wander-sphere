import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, Search, MapPin, Tag, ArrowUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/utils/api";
import { apiConfig, endpoints } from "@/config/api";
import mountainAdventure from "@/assets/mountain-adventure.jpg";
import streetFood from "@/assets/street-food.jpg";
import castleEurope from "@/assets/castle-europe.jpg";
import travelCommunity from "@/assets/travel-community.jpg";
import heroBeach from "@/assets/hero-beach.jpg";

const Clubs = () => {
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchCategory, setSearchCategory] = useState("");
  const [searchCountry, setSearchCountry] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [isCreateClubOpen, setIsCreateClubOpen] = useState(false);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // TODO: Replace with actual API call
        // const response = await apiRequest(`${apiConfig.baseURL}${endpoints.clubs}`);
        // setClubs(response.data);
        
        // Temporary: Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setClubs([]); // Will show empty state until API is connected
      } catch (err) {
        setError('Failed to load clubs');
        console.error('Error fetching clubs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClubs();
  }, []);

  const handleJoinToggle = async (clubId) => {
    try {
      // TODO: Replace with actual API call
      // await apiRequest(`${apiConfig.baseURL}${endpoints.clubs}/${clubId}/join`, {
      //   method: 'POST'
      // });
      setClubs(clubs.map(club => 
        club.id === clubId ? { ...club, isJoined: !club.isJoined } : club
      ));
    } catch (err) {
      console.error('Error joining club:', err);
    }
  };

  const myClubs = clubs.filter(club => club.isJoined);

  const filteredClubs = clubs.filter(club =>
    (club.category.toLowerCase().includes(searchCategory.toLowerCase()) || 
     club.name.toLowerCase().includes(searchCategory.toLowerCase())) &&
    // Note: Country filtering would require country data in the club object. This is a UI demonstration.
    (searchCountry ? club.name.toLowerCase().includes(searchCountry.toLowerCase()) : true)
  );
  
  // Note: Sorting logic is for demonstration. "New", "Trending", "Active" would need backend data.
  const sortedClubs = [...filteredClubs].sort((a, b) => {
      switch(sortBy) {
          case 'members':
              return b.members - a.members;
          case 'new': // Needs creation date
              return b.id - a.id;
          case 'trending': // Needs trending score
          case 'active': // Needs activity score
          case 'popular':
          default:
              return b.members - a.members;
      }
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Discover Travel Clubs</h1>
            <p className="text-muted-foreground mt-1">Connect with travelers who share your passions.</p>
          </div>
          <Dialog open={isCreateClubOpen} onOpenChange={setIsCreateClubOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-white shadow-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create New Club
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Travel Club</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="club-name">Club Name</Label>
                  <Input id="club-name" placeholder="e.g., Adventure Seekers" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="club-description">Description</Label>
                  <Textarea id="club-description" placeholder="What is your club about?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="club-category">Category</Label>
                  <Input id="club-category" placeholder="e.g., Adventure, Food, Culture" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="club-country">Country</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="ca">Canada</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                      <SelectItem value="fr">France</SelectItem>
                      <SelectItem value="de">Germany</SelectItem>
                      <SelectItem value="it">Italy</SelectItem>
                      <SelectItem value="es">Spain</SelectItem>
                      <SelectItem value="jp">Japan</SelectItem>
                      <SelectItem value="au">Australia</SelectItem>
                      <SelectItem value="in">India</SelectItem>
                      <SelectItem value="br">Brazil</SelectItem>
                      <SelectItem value="mx">Mexico</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="club-state">State/Province</Label>
                  <Input id="club-state" placeholder="e.g., California, Ontario, etc." />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="club-image">Cover Image</Label>
                  <Input id="club-image" type="file" />
                </div>
                <Button className="w-full bg-gradient-primary text-white">Create Club</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative lg:col-span-1">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search by category..." value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)} className="pl-10" />
            </div>
            <div className="relative lg:col-span-1">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search by country..." value={searchCountry} onChange={(e) => setSearchCountry(e.target.value)} className="pl-10" />
            </div>
            <div className="lg:col-span-1">
                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                        <div className="flex items-center gap-2">
                            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                            <SelectValue />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="popular">Sort by: Popular</SelectItem>
                        <SelectItem value="new">Sort by: New</SelectItem>
                        <SelectItem value="members">Sort by: More Members</SelectItem>
                        <SelectItem value="trending">Sort by: Trending</SelectItem>
                        <SelectItem value="active">Sort by: Active</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="discover" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="my-clubs">My Clubs</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              // Loading skeleton
              [...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                  <div className="aspect-video overflow-hidden">
                    <div className="w-full h-full bg-gray-200 animate-pulse"></div>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="w-3/4 h-6 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-16 h-5 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full h-4 bg-gray-200 rounded animate-pulse mb-3"></div>
                    <div className="flex items-center justify-between">
                      <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : error ? (
              <div className="col-span-full text-center py-12">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : sortedClubs.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {clubs.length === 0 ? 'No clubs available' : 'No clubs match your filters'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {clubs.length === 0 
                    ? 'Be the first to create a travel club and connect with fellow travelers.'
                    : 'Try adjusting your search criteria or browse all clubs.'
                  }
                </p>
                <div className="flex gap-2 justify-center">
                  <Button className="bg-gradient-primary text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Club
                  </Button>
                  {clubs.length > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchCategory('');
                        setSearchCountry('');
                        setSortBy('popular');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              sortedClubs.map((club) => (
                <ClubCard key={club.id} club={club} onJoinToggle={handleJoinToggle} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-clubs" className="space-y-6">
          {myClubs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myClubs.map((club) => (
                <ClubCard key={club.id} club={club} onJoinToggle={handleJoinToggle} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No clubs joined yet</h3>
              <p className="text-muted-foreground">Discover and join clubs that match your travel interests!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ClubCard = ({ club, onJoinToggle }) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <Link to={`/clubs/${club.id}`} className="block">
        <div className="aspect-video overflow-hidden">
          <img src={club.image} alt={club.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg line-clamp-1">{club.name}</CardTitle>
            <Badge variant="secondary" className="text-xs">{club.category}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{club.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-muted-foreground"><Users className="w-4 h-4" />{club.members.toLocaleString()} members</div>
            <Button size="sm" variant={club.isJoined ? "secondary" : "default"} className={!club.isJoined ? "bg-gradient-primary text-white" : ""} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onJoinToggle(club.id); }}>
              {club.isJoined ? "Joined" : "Join"}
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

export default Clubs;
