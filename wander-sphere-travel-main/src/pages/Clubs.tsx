import { useState, useEffect, useCallback } from "react";
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
import { useToast } from "@/hooks/use-toast";
import clubService, { Club, CreateClubData } from '@/services/clubService';
import { handleImageError } from "@/utils/imageUtils";
import mountainAdventure from "@/assets/mountain-adventure.jpg";
import { SimpleAutocomplete } from "@/components/ui/search-autocomplete";
import { clubCategories, countries } from "@/data/suggestions";

const Clubs = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchCategory, setSearchCategory] = useState("");
  const [searchCountry, setSearchCountry] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [isCreateClubOpen, setIsCreateClubOpen] = useState(false);
  const [isCreatingClub, setIsCreatingClub] = useState(false);
  const [newClub, setNewClub] = useState<CreateClubData>({
    name: '',
    description: '',
    category: '',
    country: '',
    state: ''
  });
  const { toast } = useToast();

  // Safely fetch clubs with error handling
  const fetchClubs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await clubService.getClubs();
      
      // Defensive check: Ensure data is an array
      if (response && response.success && Array.isArray(response.data)) {
        setClubs(response.data);
      } else {
        console.warn("Invalid clubs response format", response);
        setClubs([]);
      }
    } catch (err: any) {
      setError('Failed to load clubs');
      console.error('Error fetching clubs:', err);
      setClubs([]);
      
      // Avoid passing 'err' directly if it causes issues, use primitive message
      toast({
        title: "Error",
        description: "Failed to load clubs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  const handleJoinToggle = async (clubId: string) => {
    try {
      const club = clubs.find(c => c.id === clubId);
      if (!club) return;

      if (club.isJoined) {
        await clubService.leaveClub(clubId);
        toast({
          title: "Success",
          description: "You have left the club.",
        });
      } else {
        await clubService.joinClub(clubId);
        toast({
          title: "Success",
          description: "You have joined the club!",
        });
      }

      // Update local state safely
      setClubs(prevClubs => prevClubs.map(c => 
        c.id === clubId ? { ...c, isJoined: !c.isJoined, members: c.isJoined ? (c.members || 0) - 1 : (c.members || 0) + 1 } : c
      ));
    } catch (err) {
      console.error('Error toggling club membership:', err);
      toast({
        title: "Error",
        description: "Failed to update club membership. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateClub = async () => {
    if (!newClub.name || !newClub.description || !newClub.category || !newClub.country) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingClub(true);
      
      const clubDataForBackend = {
        name: newClub.name,
        description: newClub.description,
        isPrivate: false,
        tags: newClub.category ? [newClub.category] : [],
        rules: []
      };
      
      const createdClub = await clubService.createClub(clubDataForBackend);
      
      if (createdClub) {
        setClubs(prev => [createdClub, ...prev]);
        setIsCreateClubOpen(false);
        setNewClub({
          name: '',
          description: '',
          category: '',
          country: '',
          state: ''
        });
        toast({
          title: "Success",
          description: "Club created successfully!",
        });
      }
    } catch (err) {
      console.error('Error creating club:', err);
      toast({
        title: "Error",
        description: "Failed to create club. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingClub(false);
    }
  };

  // Safe filtering
  const myClubs = Array.isArray(clubs) ? clubs.filter(club => club?.isJoined) : [];

  const filteredClubs = Array.isArray(clubs) ? clubs.filter(club => {
    if (!club) return false;
    const matchesCategory = (club.category?.toLowerCase() || '').includes(searchCategory.toLowerCase()) || 
                            (club.name?.toLowerCase() || '').includes(searchCategory.toLowerCase());
    const matchesCountry = searchCountry ? (club.name?.toLowerCase() || '').includes(searchCountry.toLowerCase()) : true;
    return matchesCategory && matchesCountry;
  }) : [];
  
  const sortedClubs = [...filteredClubs].sort((a, b) => {
      switch(sortBy) {
          case 'members':
              return (b.members || 0) - (a.members || 0);
          case 'new': 
              return (b.id || '').localeCompare(a.id || '');
          case 'trending': 
          case 'active': 
          case 'popular':
          default:
              return (b.members || 0) - (a.members || 0);
      }
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
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
                  <Input 
                    id="club-name" 
                    placeholder="e.g., Adventure Seekers" 
                    value={newClub.name}
                    onChange={(e) => setNewClub({...newClub, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="club-description">Description</Label>
                  <Textarea 
                    id="club-description" 
                    placeholder="What is your club about?" 
                    value={newClub.description}
                    onChange={(e) => setNewClub({...newClub, description: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="club-category">Category</Label>
                  <Input 
                    id="club-category" 
                    placeholder="e.g., Adventure, Food, Culture" 
                    value={newClub.category}
                    onChange={(e) => setNewClub({...newClub, category: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="club-country">Country</Label>
                  <Select value={newClub.country} onValueChange={(value) => setNewClub({...newClub, country: value})}>
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
                  <Input 
                    id="club-state" 
                    placeholder="e.g., California, Ontario, etc." 
                    value={newClub.state || ''}
                    onChange={(e) => setNewClub({...newClub, state: e.target.value})}
                  />
                </div>
                <Button 
                  className="w-full bg-gradient-primary text-white" 
                  onClick={handleCreateClub}
                  disabled={isCreatingClub}
                >
                  {isCreatingClub ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Club'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative lg:col-span-1">
                <SimpleAutocomplete
                    suggestions={clubCategories}
                    value={searchCategory}
                    onChange={setSearchCategory}
                    placeholder="Search by category..."
                    icon={<Tag className="w-4 h-4" />}
                />
            </div>
            <div className="relative lg:col-span-1">
                <SimpleAutocomplete
                    suggestions={countries}
                    value={searchCountry}
                    onChange={setSearchCountry}
                    placeholder="Search by country..."
                    icon={<MapPin className="w-4 h-4" />}
                />
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

      <Tabs defaultValue="discover" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="my-clubs">My Clubs</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <Card key={`loading-skeleton-${i}`} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
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
              (sortedClubs || []).map((club) => (
                <ClubCard key={club.id} club={club} onJoinToggle={handleJoinToggle} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-clubs" className="space-y-6">
          {myClubs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(myClubs || []).map((club) => (
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

const ClubCard = ({ club, onJoinToggle }: { club: Club; onJoinToggle: (clubId: string) => void }) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <Link to={`/clubs/${club.id}`} className="block">
        <div className="aspect-video overflow-hidden">
          <img 
            src={club.image || mountainAdventure} 
            alt={club.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
          />
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
            <div className="flex items-center gap-1 text-sm text-muted-foreground"><Users className="w-4 h-4" />{(club.members || 0).toLocaleString()} members</div>
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
