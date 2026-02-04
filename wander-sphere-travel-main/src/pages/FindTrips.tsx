import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, MapPin, Calendar, Users, Search, Filter, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/utils/api";
import { endpoints, apiConfig, buildUrl } from "@/config/api";
import { handleImageError } from "@/utils/imageUtils";
import { ApiResponse, Trip, TripsListResponse, CreateTripRequest, CreateTripResponse } from "@/types/api";
import TripRequestButton from "@/components/TripRequestButton";
import heroBeach from "@/assets/hero-beach.jpg";
import MyTrips from "@/pages/MyTrips";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SimpleAutocomplete } from "@/components/ui/search-autocomplete";
import { DatePicker } from "@/components/ui/date-picker";
import { popularCities } from "@/data/suggestions";

const FindTrips = () => {
  const [searchDestination, setSearchDestination] = useState("");
  const [selectedDates, setSelectedDates] = useState("");
  const [tripType, setTripType] = useState("any");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateTripOpen, setIsCreateTripOpen] = useState(false);
  const [newTrip, setNewTrip] = useState({
    title: "",
    destination: "",
    startDate: "",
    endDate: "",
    maxParticipants: "",
    budget: "",
    type: "",
    description: "",
    tags: ""
  });
  const { toast } = useToast();

  // Fetch trips from API
  const fetchTrips = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiRequest<ApiResponse<TripsListResponse>>(buildUrl(endpoints.trips.list));
      if (response.success && response.data) {
        setTrips(response.data.trips || []);
      } else {
        setTrips([]);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      toast({
        title: "Error",
        description: "Failed to load trips. Please try again.",
        variant: "destructive"
      });
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // Handle create trip
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Parse destination to extract country and city
      const destinationParts = newTrip.destination.split(',').map(part => part.trim());
      const city = destinationParts[0] || newTrip.destination;
      const country = destinationParts[1] || 'Unknown';

      // Validate required fields
      if (!newTrip.title || newTrip.title.length < 3) {
        toast({
          title: "Validation Error",
          description: "Title must be at least 3 characters long.",
          variant: "destructive"
        });
        return;
      }

      if (!newTrip.description || newTrip.description.length < 10) {
        toast({
          title: "Validation Error",
          description: "Description must be at least 10 characters long.",
          variant: "destructive"
        });
        return;
      }

      if (!newTrip.startDate || !newTrip.endDate) {
        toast({
          title: "Validation Error",
          description: "Please select both start and end dates.",
          variant: "destructive"
        });
        return;
      }

      if (!newTrip.maxParticipants || parseInt(newTrip.maxParticipants) < 1 || parseInt(newTrip.maxParticipants) > 50) {
        toast({
          title: "Validation Error",
          description: "Max participants must be between 1 and 50.",
          variant: "destructive"
        });
        return;
      }

      if (!newTrip.type) {
        toast({
          title: "Validation Error",
          description: "Please select a trip category.",
          variant: "destructive"
        });
        return;
      }

      // Format dates to ISO8601
      const startDate = new Date(newTrip.startDate).toISOString();
      const endDate = new Date(newTrip.endDate).toISOString();

      const tripData: CreateTripRequest = {
        title: newTrip.title.trim(),
        description: newTrip.description.trim(),
        destination: {
          country: country.trim(),
          city: city.trim(),
          coordinates: {
            latitude: 0, // Default coordinates - should be enhanced with geocoding
            longitude: 0
          }
        },
        dates: {
          startDate: startDate,
          endDate: endDate
        },
        budget: {
          total: parseFloat(newTrip.budget.replace(/[^\d.]/g, '')) || 0,
          currency: 'USD'
        },
        maxParticipants: parseInt(newTrip.maxParticipants) || 1,
        category: newTrip.type,
        tags: newTrip.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        visibility: 'public'
      };

      const response = await apiRequest<ApiResponse<CreateTripResponse>>(buildUrl(endpoints.trips.create), {
        method: 'POST',
        body: tripData
      });
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Trip created successfully!",
        });
        
        setIsCreateTripOpen(false);
        setNewTrip({
          title: "",
          destination: "",
          startDate: "",
          endDate: "",
          maxParticipants: "",
          budget: "",
          type: "",
          description: "",
          tags: ""
        });
        
        // Refresh trips list
        fetchTrips();
      } else {
        throw new Error(response.message || 'Failed to create trip');
      }
    } catch (error: any) {
      console.error('Error creating trip:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create trip. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open": return "bg-success text-success-foreground";
      case "Seeking Buddies": return "bg-warning text-warning-foreground";
      case "Almost Full": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };


// ... existing code ...

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Hero Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
              Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Next Adventure</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl">
              Discover curated trips, join like-minded travelers, and create unforgettable memories.
            </p>
          </div>
          
          <div className="flex gap-3">
             <Button 
                onClick={() => setIsCreateTripOpen(true)}
                className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl px-6 h-12 shadow-lg shadow-gray-200 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-5 h-5 mr-2" />
                Post a Trip
              </Button>
          </div>
        </div>

        <Tabs defaultValue="find" className="w-full space-y-8">
          <TabsList className="bg-white/50 backdrop-blur-sm p-1 rounded-2xl border border-gray-200/50 w-full md:w-auto inline-flex">
            <TabsTrigger 
              value="find" 
              className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
            >
              Explore Trips
            </TabsTrigger>
            <TabsTrigger 
              value="my-trips"
              className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
            >
              My Trips
            </TabsTrigger>
          </TabsList>

          <TabsContent value="find" className="space-y-8 animate-in fade-in-50 duration-500 glide-in-5">
            {/* Create Trip Dialog (Hidden) */}
            <Dialog open={isCreateTripOpen} onOpenChange={setIsCreateTripOpen}>
               <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Create New Trip</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTrip} className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Trip Title</Label>
                    <Input
                      id="title"
                      value={newTrip.title}
                      onChange={(e) => setNewTrip({...newTrip, title: e.target.value})}
                      placeholder="e.g., Bali Paradise Escape"
                      required
                      className="rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destination" className="text-sm font-semibold text-gray-700">Destination</Label>
                    <Input
                      id="destination"
                      value={newTrip.destination}
                      onChange={(e) => setNewTrip({...newTrip, destination: e.target.value})}
                      placeholder="e.g., Bali, Indonesia"
                      required
                      className="rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-sm font-semibold text-gray-700">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newTrip.startDate}
                      onChange={(e) => setNewTrip({...newTrip, startDate: e.target.value})}
                      required
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-sm font-semibold text-gray-700">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newTrip.endDate}
                      onChange={(e) => setNewTrip({...newTrip, endDate: e.target.value})}
                      required
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants" className="text-sm font-semibold text-gray-700">Group Size</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      value={newTrip.maxParticipants}
                      onChange={(e) => setNewTrip({...newTrip, maxParticipants: e.target.value})}
                      placeholder="e.g., 8"
                      required
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="text-sm font-semibold text-gray-700">Budget (Approx)</Label>
                    <Input
                      id="budget"
                      value={newTrip.budget}
                      onChange={(e) => setNewTrip({...newTrip, budget: e.target.value})}
                      placeholder="e.g., 1500"
                      required
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-semibold text-gray-700">Trip Style</Label>
                   <Select value={newTrip.type} onValueChange={(value) => setNewTrip({...newTrip, type: value})}>
                    <SelectTrigger className="rounded-xl border-gray-200">
                      <SelectValue placeholder="Select trip type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adventure">Adventure</SelectItem>
                      <SelectItem value="beach">Beach & Coastal</SelectItem>
                      <SelectItem value="city">City Break</SelectItem>
                      <SelectItem value="cultural">Cultural</SelectItem>
                      <SelectItem value="food">Food & Drink</SelectItem>
                      <SelectItem value="backpacking">Backpacking</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                      <SelectItem value="budget">Budget Friendly</SelectItem>
                      <SelectItem value="relaxation">Relaxation</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                      <SelectItem value="romantic">Romantic</SelectItem>
                      <SelectItem value="solo">Solo Travel</SelectItem>
                      <SelectItem value="group">Group Tour</SelectItem>
                      <SelectItem value="nature">Nature & Wildlife</SelectItem>
                      <SelectItem value="roadtrip">Road Trip</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Description</Label>
                  <Textarea
                    id="description"
                    value={newTrip.description}
                    onChange={(e) => setNewTrip({...newTrip, description: e.target.value})}
                    placeholder="Tell everyone what this trip is about..."
                    rows={4}
                    required
                    className="rounded-xl border-gray-200 resize-none"
                  />
                </div>
                
                 <div className="space-y-2">
                  <Label htmlFor="tags" className="text-sm font-semibold text-gray-700">Tags</Label>
                  <Input
                    id="tags"
                    value={newTrip.tags}
                    onChange={(e) => setNewTrip({...newTrip, tags: e.target.value})}
                    placeholder="hiking, photography, food (comma separated)"
                    className="rounded-xl border-gray-200"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsCreateTripOpen(false)} className="rounded-xl hover:bg-gray-100">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl px-8">
                    Create Trip
                  </Button>
                </div>
              </form>
               </DialogContent>
            </Dialog>

            <div className="bg-white rounded-3xl p-1 shadow-sm border border-gray-100 flex flex-col md:flex-row shadow-lg shadow-gray-200/50 relative z-10">
               <div className="flex-1 px-5 py-3 md:border-r border-gray-100 relative group transition-colors hover:bg-gray-50/50 rounded-2xl">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block group-hover:text-blue-600 transition-colors">Where</label>
                   <div className="relative flex items-center">
                     <MapPin className="w-4 h-4 text-gray-400 mr-2 group-hover:text-blue-500 transition-colors" />
                     <SimpleAutocomplete 
                        suggestions={popularCities}
                        value={searchDestination}
                        onChange={setSearchDestination}
                        placeholder="Search destinations"
                        className="border-none shadow-none focus-visible:ring-0 p-0 h-auto font-medium text-gray-900 placeholder:text-gray-400 w-full bg-transparent"
                        icon={<></>} 
                      />
                   </div>
               </div>
               
               <div className="flex-1 px-5 py-3 md:border-r border-gray-100 relative group transition-colors hover:bg-gray-50/50 rounded-2xl">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block group-hover:text-blue-600 transition-colors">When</label>
                   <div className="relative flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2 group-hover:text-blue-500 transition-colors" />
                      <DatePicker 
                        date={selectedDates ? new Date(selectedDates) : undefined}
                        setDate={(date) => setSelectedDates(date ? date.toISOString() : "")}
                        placeholder="Add dates"
                        className="p-0 h-auto font-medium text-gray-900"
                      />
                   </div>
               </div>

                <div className="flex-1 px-5 py-3 relative group transition-colors hover:bg-gray-50/50 rounded-2xl">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block group-hover:text-blue-600 transition-colors">Type</label>
                   <div className="relative flex items-center">
                      <Filter className="w-4 h-4 text-gray-400 mr-2 group-hover:text-blue-500 transition-colors" />
                      <Select value={tripType} onValueChange={setTripType}>
                        <SelectTrigger className="border-none shadow-none focus:ring-0 p-0 h-auto font-medium text-gray-900 w-full bg-transparent gap-1 hover:bg-transparent">
                          <SelectValue placeholder="Any Type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                          <SelectItem value="any">Any Type</SelectItem>
                          <SelectItem value="adventure">Adventure</SelectItem>
                          <SelectItem value="beach">Beach</SelectItem>
                          <SelectItem value="city">City Break</SelectItem>
                          <SelectItem value="culture">Cultural</SelectItem>
                          <SelectItem value="backpacking">Backpacking</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
               </div>
               
               <div className="p-1.5">
                 <Button className="w-full md:w-auto h-full rounded-2xl bg-gray-900 hover:bg-black text-white px-8 shadow-md shadow-gray-200 transition-all hover:scale-[1.02] active:scale-95 text-base font-medium">
                    Search
                 </Button>
               </div>
            </div>

            {/* Trips Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl h-[400px] animate-pulse border border-gray-100" />
                ))
              ) : !trips || trips.length === 0 ? (
                 <div className="col-span-full py-20 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                       <MapPin className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No trips found</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mb-6">We couldn't find any trips matching your search. Try adjusting your filters or be the first to create one!</p>
                    <Button onClick={() => setIsCreateTripOpen(true)} className="bg-gray-900 text-white rounded-xl">
                      Create a Trip
                    </Button>
                 </div>
              ) : (
                trips.map((trip) => {
                  const startDate = new Date(trip.dates?.startDate || '');
                  const endDate = new Date(trip.dates?.endDate || '');
                  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                  
                  // Safely extract organizer
                  const organizerName = typeof trip.organizer === 'object' ? `${trip.organizer?.first_name || 'Traveler'} ${trip.organizer?.last_name || ''}` : 'Traveler';
                  const organizerAvatar = typeof trip.organizer === 'object' ? trip.organizer?.avatar_url : undefined;
                  const initials = organizerName.slice(0, 2).toUpperCase();

                  return (
                    <Link to={`/trips/${trip.id}`} key={trip.id} className="group">
                      <Card className="rounded-3xl border-none shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden h-[420px] flex flex-col bg-white ring-1 ring-gray-100 group-hover:ring-blue-100">
                        {/* Image Section */}
                        <div className="h-[240px] relative overflow-hidden">
                           <img 
                              src={trip.images?.[0] || heroBeach} 
                              alt={trip.title} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              onError={handleImageError}
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                           
                           {/* Badges on Image */}
                           <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                              <Badge className="bg-white/90 text-gray-900 hover:bg-white border-none shadow-sm backdrop-blur-sm px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wide">
                                 {trip.category || 'Adventure'}
                              </Badge>
                              <div className="bg-gray-900/40 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium border border-white/20">
                                 {days} Days
                              </div>
                           </div>

                           <div className="absolute bottom-4 left-4 text-white">
                              <h3 className="font-bold text-xl leading-tight mb-1 drop-shadow-md">{trip.title}</h3>
                              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-100">
                                 <MapPin className="w-3.5 h-3.5" />
                                 {typeof trip.destination === 'string' ? trip.destination : trip.destination?.city}
                              </div>
                           </div>
                        </div>

                        {/* Content Section */}
                        <CardContent className="flex-1 p-5 flex flex-col justify-between bg-white relative">
                             {/* Organizer overlap */}
                             <div className="absolute -top-6 right-5 border-4 border-white rounded-full shadow-sm">
                                <Avatar className="w-10 h-10">
                                   <AvatarImage src={organizerAvatar} />
                                   <AvatarFallback className="bg-blue-100 text-blue-600 font-bold">{initials}</AvatarFallback>
                                </Avatar>
                             </div>

                             <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed mb-4">
                                {trip.description}
                             </p>

                             <div className="space-y-3 mt-auto">
                                <div className="flex items-center justify-between text-sm">
                                   <div className="flex items-center gap-2 text-gray-600">
                                      <Calendar className="w-4 h-4 text-blue-500" />
                                      {startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                   </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <Users className="w-4 h-4 text-purple-500" />
                                      {trip.participantCount || 0}/{trip.maxParticipants}
                                   </div>
                                </div>
                                
                                <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                                   <div>
                                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Estimated Cost</p>
                                      <p className="text-lg font-bold text-gray-900">{trip.budget?.currency || '$'}{trip.budget?.total}</p>
                                   </div>
                                   <Button size="sm" className="rounded-xl px-5 bg-gray-50 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors border-none shadow-none font-semibold">
                                      View Details
                                   </Button>
                                </div>
                             </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-trips">
            <MyTrips />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FindTrips;