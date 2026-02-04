import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, Search, MapPin, Tag, ArrowUpDown, Loader2, Settings } from "lucide-react";
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
      
      console.log("Clubs API Response:", response);
      
      // Handle different response formats (Array vs Nested Object)
      let clubsData: Club[] = [];
      
      if (response && response.success) {
        if (Array.isArray(response.data)) {
          clubsData = response.data;
        } else if (response.data && Array.isArray((response.data as any).clubs)) {
          clubsData = (response.data as any).clubs;
        } else if (response.data && typeof response.data === 'object') {
             // Fallback: try to find any array property or use data itself if it turns out to be an object-wrapped list?
             // Actually, the user says it's { data: { clubs: [...] } } or similar.
             // Let's stick to the user's suggestion plus safety.
             clubsData = (response.data as any).clubs || [];
        }
      }

      setClubs(clubsData);
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
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Hero Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
          <div>
             <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
              Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Travel Clubs</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl">
              Connect with communities, find your tribe, and share local experiences.
            </p>
          </div>
          
           <div className="flex gap-3">
             <Link to="/manage-clubs">
              <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl h-12 shadow-sm">
                <Settings className="w-5 h-5 mr-2" />
                Manage
              </Button>
            </Link>
            
            <Dialog open={isCreateClubOpen} onOpenChange={setIsCreateClubOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl px-6 h-12 shadow-lg shadow-teal-900/10 transition-all hover:scale-105 active:scale-95">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Club
                </Button>
              </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Create a New Travel Club</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="club-name" className="text-xs font-bold uppercase text-gray-500 tracking-wide">Club Name</Label>
                  <Input 
                    id="club-name" 
                    placeholder="e.g., Adventure Seekers" 
                    value={newClub.name}
                    onChange={(e) => setNewClub({...newClub, name: e.target.value})}
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="club-description" className="text-xs font-bold uppercase text-gray-500 tracking-wide">Description</Label>
                  <Textarea 
                    id="club-description" 
                    placeholder="What is your club about?" 
                    value={newClub.description}
                    onChange={(e) => setNewClub({...newClub, description: e.target.value})}
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="club-category" className="text-xs font-bold uppercase text-gray-500 tracking-wide">Category</Label>
                      <Input 
                        id="club-category" 
                        placeholder="e.g., Adventure" 
                        value={newClub.category}
                        onChange={(e) => setNewClub({...newClub, category: e.target.value})}
                        className="rounded-xl border-gray-200"
                      />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="club-state" className="text-xs font-bold uppercase text-gray-500 tracking-wide">State/Province</Label>
                      <Input 
                        id="club-state" 
                        placeholder="e.g., California" 
                        value={newClub.state || ''}
                        onChange={(e) => setNewClub({...newClub, state: e.target.value})}
                        className="rounded-xl border-gray-200"
                      />
                    </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="club-country" className="text-xs font-bold uppercase text-gray-500 tracking-wide">Country</Label>
                  <Select value={newClub.country} onValueChange={(value) => setNewClub({...newClub, country: value})}>
                    <SelectTrigger className="rounded-xl border-gray-200">
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
                
                <Button 
                  className="w-full bg-gray-900 text-white hover:bg-gray-800 rounded-xl py-6 mt-2" 
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
        </div>

        {/* Filters */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 mb-8">
            <div className="relative flex-1">
                 <SimpleAutocomplete
                    suggestions={clubCategories}
                    value={searchCategory}
                    onChange={setSearchCategory}
                    placeholder="Search category (e.g. Hiking)"
                    icon={<Tag className="w-4 h-4 text-teal-500" />}
                    className="border-none bg-gray-50 rounded-xl h-11 focus-visible:ring-0 focus-visible:bg-white transition-colors"
                />
            </div>
            <div className="relative flex-1">
                <SimpleAutocomplete
                    suggestions={countries}
                    value={searchCountry}
                    onChange={setSearchCountry}
                    placeholder="Search country (e.g. Japan)"
                    icon={<MapPin className="w-4 h-4 text-teal-500" />}
                    className="border-none bg-gray-50 rounded-xl h-11 focus-visible:ring-0 focus-visible:bg-white transition-colors"
                />
            </div>
            <div className="lg:w-48">
                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="border-none bg-gray-50 rounded-xl h-11">
                        <div className="flex items-center gap-2 text-gray-700">
                            <ArrowUpDown className="w-4 h-4 text-teal-500" />
                            <SelectValue />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="popular">Popular</SelectItem>
                        <SelectItem value="new">Newest</SelectItem>
                        <SelectItem value="members">Most Members</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>


        <Tabs defaultValue="discover" className="space-y-8">
          <TabsList className="bg-white/50 backdrop-blur-sm p-1 rounded-2xl border border-gray-200/50 w-full md:w-auto inline-flex">
            <TabsTrigger 
              value="discover"
               className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm transition-all text-gray-500"
            >
              Discover Clubs
            </TabsTrigger>
            <TabsTrigger 
              value="my-clubs"
               className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm transition-all text-gray-500"
            >
              My Clubs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Clubs List */}
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                   <div key={i} className="bg-white rounded-3xl h-[320px] animate-pulse border border-gray-100" />
                ))
              ) : error ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-red-500 mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : sortedClubs.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-50 flex items-center justify-center">
                    <Users className="w-8 h-8 text-teal-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {clubs.length === 0 ? 'No clubs yet' : 'No matching clubs'}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    {clubs.length === 0 
                      ? 'Be the first to create a travel community!'
                      : 'Try adjusting your filters.'
                    }
                  </p>
                  <Button className="bg-teal-600 text-white rounded-xl hover:bg-teal-700" onClick={() => setIsCreateClubOpen(true)}>
                    Start a Club
                  </Button>
                </div>
              ) : (
                (sortedClubs || [])
                  .filter(club => club && (club.id || (club as any)._id)) // Filter out invalid clubs
                  .map((club) => {
                    // Ensure ID is valid string
                    const clubId = club.id || (club as any)._id;
                    const clubWithId = { ...club, id: clubId };
                    
                    return (
                      <ClubCard 
                        key={clubId} 
                        club={clubWithId} 
                        onJoinToggle={(id) => id && handleJoinToggle(id)} // Safeguard join toggle
                      />
                    );
                  })
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-clubs" className="space-y-6">
            {myClubs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(myClubs || [])
                  .filter(club => club && (club.id || (club as any)._id))
                  .map((club) => {
                    const clubId = club.id || (club as any)._id;
                    const clubWithId = { ...club, id: clubId };
                    return (
                       <ClubCard 
                         key={clubId} 
                         club={clubWithId} 
                         onJoinToggle={(id) => id && handleJoinToggle(id)} 
                       />
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No clubs joined yet</h3>
                <p className="text-gray-500 max-w-sm mx-auto">Discover and join clubs that match your travel interests!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

function ClubCard({ club, onJoinToggle }: { club: Club; onJoinToggle: (clubId: string) => void }) {
  return (
    <Card className="rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 group border-none shadow-sm h-full flex flex-col bg-white ring-1 ring-gray-100 group-hover:ring-teal-100">
      <Link to={`/clubs/${club.id}`} className="block flex-1 flex flex-col">
        <div className="h-48 overflow-hidden relative">
          <img 
            src={club.image || mountainAdventure} 
            alt={club.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            onError={handleImageError}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>
          
          <div className="absolute top-4 right-4">
             <Badge className="bg-white/90 backdrop-blur text-teal-800 hover:bg-white border-0 py-1 px-3 shadow-sm font-semibold">
                {club.category}
             </Badge>
          </div>
          
          <div className="absolute bottom-3 left-4 text-white">
             <h3 className="text-xl font-bold leading-tight drop-shadow-sm">{club.name}</h3>
          </div>
        </div>
        
        <CardContent className="p-5 flex flex-col flex-1">
          <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed mb-4 flex-1">
             {club.description}
          </p>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
               <Users className="w-4 h-4 text-teal-500" />
               {(club.members || 0).toLocaleString()} members
            </div>
            
            <Button 
                size="sm" 
                variant={club.isJoined ? "outline" : "default"} 
                className={`rounded-xl px-5 transition-all ${!club.isJoined ? "bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-100" : "border-gray-200 text-green-600 bg-green-50 hover:bg-green-100"}`}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onJoinToggle(club.id); }}
            >
              {club.isJoined ? "Joined" : "Join Club"}
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
};

export default Clubs;
