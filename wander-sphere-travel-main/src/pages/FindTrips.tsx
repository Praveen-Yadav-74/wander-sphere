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
import heroBeach from "@/assets/hero-beach.jpg";

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Find Your Next Adventure</h1>
            <p className="text-muted-foreground mt-1">Looking for a travel buddy or planning a new adventure?</p>
          </div>
          <Dialog open={isCreateTripOpen} onOpenChange={setIsCreateTripOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-adventure text-white shadow-primary">
                <Plus className="w-4 h-4 mr-2" />
                Post Your Trip
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Trip</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTrip} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Trip Title</Label>
                    <Input
                      id="title"
                      value={newTrip.title}
                      onChange={(e) => setNewTrip({...newTrip, title: e.target.value})}
                      placeholder="e.g., Bali Adventure"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="destination">Destination</Label>
                    <Input
                      id="destination"
                      value={newTrip.destination}
                      onChange={(e) => setNewTrip({...newTrip, destination: e.target.value})}
                      placeholder="e.g., Bali, Indonesia"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newTrip.startDate}
                      onChange={(e) => setNewTrip({...newTrip, startDate: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newTrip.endDate}
                      onChange={(e) => setNewTrip({...newTrip, endDate: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxParticipants">Max Participants</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      value={newTrip.maxParticipants}
                      onChange={(e) => setNewTrip({...newTrip, maxParticipants: e.target.value})}
                      placeholder="e.g., 8"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget">Budget Range</Label>
                    <Input
                      id="budget"
                      value={newTrip.budget}
                      onChange={(e) => setNewTrip({...newTrip, budget: e.target.value})}
                      placeholder="e.g., $1000 - $1500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="type">Trip Type</Label>
                  <Select value={newTrip.type} onValueChange={(value) => setNewTrip({...newTrip, type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trip type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adventure">Adventure</SelectItem>
                      <SelectItem value="beach">Beach</SelectItem>
                      <SelectItem value="city">City Break</SelectItem>
                      <SelectItem value="culture">Cultural</SelectItem>
                      <SelectItem value="food">Food & Drink</SelectItem>
                      <SelectItem value="backpacking">Backpacking</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                      <SelectItem value="budget">Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTrip.description}
                    onChange={(e) => setNewTrip({...newTrip, description: e.target.value})}
                    placeholder="Describe your trip..."
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={newTrip.tags}
                    onChange={(e) => setNewTrip({...newTrip, tags: e.target.value})}
                    placeholder="e.g., Adventure, Beach, Culture"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateTripOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-primary text-white">
                    Create Trip
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Filters */}
        <Card className="bg-surface-elevated">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="e.g., Bali, Indonesia"
                    value={searchDestination}
                    onChange={(e) => setSearchDestination(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Dates</label>
                <Input
                  placeholder="Select dates"
                  value={selectedDates}
                  onChange={(e) => setSelectedDates(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Trip Type</label>
                <Select value={tripType} onValueChange={setTripType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="adventure">Adventure</SelectItem>
                    <SelectItem value="beach">Beach</SelectItem>
                    <SelectItem value="city">City Break</SelectItem>
                    <SelectItem value="culture">Cultural</SelectItem>
                    <SelectItem value="food">Food & Drink</SelectItem>
                    <SelectItem value="backpacking">Backpacking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full bg-gradient-primary text-white">
                  <Search className="w-4 h-4 mr-2" />
                  Search Trips
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trip Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading trips...</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No trips found</h3>
            <p className="text-muted-foreground mb-4">Be the first to create a trip!</p>
            <Button 
              onClick={() => setIsCreateTripOpen(true)}
              className="bg-gradient-primary text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Trip
            </Button>
          </div>
        ) : (
          trips.map((trip) => {
            const destinationText = typeof trip.destination === 'string' 
              ? trip.destination 
              : `${trip.destination.city}, ${trip.destination.country}`;
            
            const startDate = new Date(trip.dates?.startDate || '');
            const endDate = new Date(trip.dates?.endDate || '');
            const dateText = startDate.toLocaleDateString() + ' - ' + endDate.toLocaleDateString();
            
            // Safely extract organizer name with defensive coding
            const organizerName = (() => {
              if (!trip.organizer) return 'Nomad Admin';
              if (typeof trip.organizer === 'string') return trip.organizer;
              if (typeof trip.organizer === 'object' && trip.organizer.name) return trip.organizer.name;
              return 'Nomad Admin';
            })();
            const budgetText = trip.budget ? `$${trip.budget.total} ${trip.budget.currency}` : 'Budget TBD';
            
            // Safely get initials from organizer name
            const getInitials = (name: string): string => {
              if (!name || typeof name !== 'string') return 'NA';
              const parts = name.trim().split(' ').filter(Boolean);
              if (parts.length === 0) return 'NA';
              return parts.map(n => n[0]?.toUpperCase() || '').join('').slice(0, 2);
            };
            
            return (
              <Card key={trip.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group">
                <Link to={`/trips/${trip.id}`}>
                  <div className="aspect-video overflow-hidden relative">
                    <img 
                      src={trip.images?.[0] || heroBeach} 
                      alt={trip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={handleImageError}
                    />
                    <Badge className={`absolute top-3 right-3 ${getStatusColor(trip.status || 'planning')}`}>
                      {trip.status || 'Planning'}
                    </Badge>
                  </div>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl line-clamp-1">{trip.title}</CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {trip.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={trip.organizerAvatar} />
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {getInitials(organizerName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">by {organizerName}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {trip.description}
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{destinationText}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{dateText}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-primary" />
                        <span>{trip.participantCount || 0}/{trip.maxParticipants} travelers</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-4 mb-4">
                      {(trip.tags || []).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-3 bg-muted/10 rounded-lg px-3 mt-3">
                      <span className="font-semibold text-sm">{budgetText}</span>
                      <Button 
                        size="sm" 
                        className="bg-gradient-primary text-white"
                        onClick={(e) => {
                          e.preventDefault();
                          console.log('Express interest in trip:', trip.title);
                        }}
                      >
                        I'm Interested
                      </Button>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FindTrips;