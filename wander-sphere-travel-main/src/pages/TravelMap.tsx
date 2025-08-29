import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar, Camera, Globe, Navigation, Map, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { handleImageError } from "@/utils/imageUtils";
import { userService } from "@/services/userService";
import { journeyService } from "@/services/journeyService";
import heroBeach from "@/assets/hero-beach.jpg";

// Map imports removed due to dependency issues

const TravelMap = () => {
  // State for simulating user location (simplified without actual geolocation)
  const [isLocating, setIsLocating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState([]);
  const [journeys, setJourneys] = useState([]);
  const { toast } = useToast();

  // Simulate getting user location
  const getUserLocation = () => {
    setIsLocating(true);
    // Simulate a delay in getting location
    setTimeout(() => {
      setIsLocating(false);
    }, 1000);
  };

  // Fetch user achievements
  const fetchAchievements = useCallback(async () => {
    try {
      const stats = await userService.getUserStats();
      
      // Transform stats into achievement format
      const achievementData = [
        {
          icon: Globe,
          value: stats.countriesVisited || 0,
          label: "Countries Visited",
          color: "text-blue-500"
        },
        {
          icon: MapPin,
          value: stats.citiesVisited || 0,
          label: "Cities Explored",
          color: "text-green-500"
        },
        {
          icon: Navigation,
          value: `${Math.round((stats.totalDistance || 0) / 1000)}k`,
          label: "KM Traveled",
          color: "text-purple-500"
        },
        {
          icon: Camera,
          value: stats.totalTrips || 0,
          label: "Trips Completed",
          color: "text-orange-500"
        }
      ];
      
      setAchievements(achievementData);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setAchievements([]);
      toast({
        title: "Error",
        description: "Failed to load achievements",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Fetch user journeys
  const fetchJourneys = useCallback(async () => {
    try {
      setLoading(true);
      const response = await journeyService.getMyJourneys('published');
      
      // Transform journeys data for map display
      const journeysData = (response.data?.journeys || []).map(journey => ({
        id: journey.id,
        title: journey.title,
        image: journey.images?.[0] || heroBeach,
        year: new Date(journey.createdAt).getFullYear(),
        duration: journey.duration || 'Unknown duration',
        countries: journey.destinations || [],
        highlights: journey.tags || [],
        photos: journey.images?.length || 0
      }));
      
      setJourneys(journeysData);
    } catch (error) {
      console.error('Error fetching journeys:', error);
      setJourneys([]);
      toast({
        title: "Error",
        description: "Failed to load journeys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // Simulate getting location on mount
    getUserLocation();
    fetchAchievements();
    fetchJourneys();
  }, [fetchAchievements, fetchJourneys]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Your Travel Map</h1>
        <p className="text-muted-foreground">Track your adventures and relive your memories.</p>
      </div>

      <Tabs defaultValue="map" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="map">Map</TabsTrigger>
          <TabsTrigger value="journeys">Journeys</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-6">
          {/* Achievements */}
          <Card className="bg-surface-elevated">
            <CardHeader>
              <CardTitle>Your Travel Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="text-center animate-pulse">
                      <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-3"></div>
                      <div className="h-6 bg-muted rounded mb-1"></div>
                      <div className="h-4 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : achievements.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="text-center">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-3 ${achievement.color}`}>
                        <achievement.icon className="w-8 h-8" />
                      </div>
                      <div className="text-2xl font-bold text-foreground mb-1">{achievement.value}</div>
                      <div className="text-sm text-muted-foreground">{achievement.label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Start your travel journey to unlock achievements!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interactive Map Placeholder */}
          <Card className="bg-surface-elevated">
            <CardContent className="p-0">
              <div className="relative">
                {/* Map Container */}
                <div className="h-96 rounded-lg overflow-hidden bg-muted/30 flex flex-col items-center justify-center">
                  <div className="text-center p-6 max-w-md">
                    <Map className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Interactive Map</h3>
                    <p className="text-muted-foreground mb-4">
                      View your travel journey on an interactive map. Track where you've been and plan where to go next.
                    </p>
                    
                    {/* Journey Markers Preview */}
                    {journeys.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {journeys.slice(0, 4).map((journey) => (
                          <div key={journey.id} className="bg-background p-2 rounded-md text-left">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium truncate">{journey.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground ml-6">{journey.countries[0]}{journey.countries.length > 1 ? ` +${journey.countries.length - 1}` : ''}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 mb-4">
                        <p className="text-sm text-muted-foreground">No journeys recorded yet</p>
                      </div>
                    )}
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={getUserLocation}
                      disabled={isLocating}
                    >
                      <Navigation className={`w-4 h-4 mr-2 ${isLocating ? 'animate-spin' : ''}`} />
                      {isLocating ? 'Locating...' : 'Find My Location'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journeys" className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, index) => (
                <Card key={index} className="overflow-hidden animate-pulse">
                  <div className="aspect-video bg-muted"></div>
                  <CardHeader className="pb-3">
                    <div className="h-6 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-8 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : journeys.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {journeys.map((journey) => (
                <Card key={journey.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group">
                  <Link to={`/journeys/${journey.id}`}>
                    <div className="aspect-video overflow-hidden relative">
                      <img 
                        src={journey.image} 
                        alt={journey.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={handleImageError}
                      />
                      <Badge className="absolute top-3 right-3 bg-surface-elevated/90 text-foreground">
                        {journey.year}
                      </Badge>
                    </div>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg line-clamp-1">{journey.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {journey.duration}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-1">Countries Visited:</p>
                          <div className="flex flex-wrap gap-1">
                            {journey.countries.map((country) => (
                              <Badge key={country} variant="secondary" className="text-xs">
                                {country}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium mb-1">Highlights:</p>
                          <ul className="text-sm text-muted-foreground">
                            {journey.highlights.slice(0, 2).map((highlight, index) => (
                              <li key={index}>• {highlight}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex items-center justify-between pt-3 bg-muted/10 rounded-lg px-3 mt-3">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Camera className="w-4 h-4" />
                            {journey.photos} photos
                          </div>
                          <Button size="sm" variant="secondary">
                            View Journey
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Map className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Journeys Yet</h3>
              <p className="text-muted-foreground mb-6">Start documenting your travel adventures!</p>
              <Button asChild>
                <Link to="/trips">Explore Trips</Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TravelMap;