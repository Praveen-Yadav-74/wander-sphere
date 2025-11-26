import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar, Camera, Globe, Navigation, Map, Loader2, ArrowLeft, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { handleImageError } from "@/utils/imageUtils";
import { userService } from "@/services/userService";
import { journeyService } from "@/services/journeyService";
import { storyService } from "@/services/storyService";
import { clusterData, extractJourneyPoints, extractStoryPoints, type Cluster } from "@/utils/mapClustering";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import heroBeach from "@/assets/hero-beach.jpg";

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom cluster icon
function createClusterIcon(count: number) {
  return L.divIcon({
    className: 'custom-cluster-icon',
    html: `<div class="cluster-marker"><span>${count}</span></div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
}

// Custom photo thumbnail icon
function createPhotoIcon(photoUrl: string) {
  return L.divIcon({
    className: 'photo-marker',
    html: `<div class="photo-thumbnail"><img src="${photoUrl}" alt="Memory" /></div>`,
    iconSize: [50, 50],
    iconAnchor: [25, 25]
  });
}

// Component to track zoom level
function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
    moveend: () => {
      onZoomChange(map.getZoom());
    }
  });
  
  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);
  
  return null;
}

const TravelMap = () => {
  const [isLocating, setIsLocating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState([]);
  const [journeys, setJourneys] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [currentZoom, setCurrentZoom] = useState(3);
  const [mapMode, setMapMode] = useState<'journeys' | 'memories'>('journeys');
  const [spiderifiedCluster, setSpiderifiedCluster] = useState<string | null>(null);
  const [selectedGallery, setSelectedGallery] = useState<{ photos: string[]; title: string } | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const { toast } = useToast();

  // Fetch user achievements
  const fetchAchievements = useCallback(async () => {
    try {
      const stats = await userService.getUserStats();
      
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
      const response = await journeyService.getMyJourneys('published');
      const journeysData = response.data?.journeys || [];
      setJourneys(journeysData);
    } catch (error) {
      console.error('Error fetching journeys:', error);
      setJourneys([]);
      toast({
        title: "Error",
        description: "Failed to load journeys",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Fetch user stories
  const fetchStories = useCallback(async () => {
    try {
      const response = await storyService.getStories();
      const storiesData = response.data?.stories || [];
      setStories(storiesData);
    } catch (error) {
      console.error('Error fetching stories:', error);
      setStories([]);
      toast({
        title: "Error",
        description: "Failed to load stories",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    getUserLocation();
    fetchAchievements();
    fetchJourneys();
    fetchStories();
    setLoading(false);
  }, [fetchAchievements, fetchJourneys, fetchStories]);

  // Simulate getting user location
  const getUserLocation = () => {
    setIsLocating(true);
    setTimeout(() => {
      setIsLocating(false);
    }, 1000);
  };

  // Extract and cluster map points based on mode
  const mapPoints = useMemo(() => {
    if (mapMode === 'journeys') {
      return extractJourneyPoints(journeys);
    } else {
      return extractStoryPoints(stories);
    }
  }, [mapMode, journeys, stories]);

  // Cluster data based on zoom level
  const clusters = useMemo(() => {
    return clusterData(mapPoints, currentZoom);
  }, [mapPoints, currentZoom]);

  // Handle cluster click (spiderify)
  const handleClusterClick = useCallback((clusterId: string) => {
    if (spiderifiedCluster === clusterId) {
      setSpiderifiedCluster(null);
    } else {
      setSpiderifiedCluster(clusterId);
    }
  }, [spiderifiedCluster]);

  // Handle marker click (open gallery for memories)
  const handleMarkerClick = useCallback((cluster: Cluster) => {
    if (mapMode === 'memories' && cluster.points.length > 0) {
      const allPhotos = cluster.points
        .flatMap(p => p.photos || (p.photo ? [p.photo] : []))
        .filter(Boolean);
      
      if (allPhotos.length > 0) {
        setSelectedGallery({
          photos: allPhotos,
          title: cluster.label
        });
        setGalleryIndex(0);
      }
    }
  }, [mapMode]);

  // Get center point for map
  const mapCenter: [number, number] = useMemo(() => {
    if (mapPoints.length === 0) return [20, 0]; // Default center
    
    const lats = mapPoints.map(p => p.lat);
    const lngs = mapPoints.map(p => p.lng);
    
    return [
      (Math.max(...lats) + Math.min(...lats)) / 2,
      (Math.max(...lngs) + Math.min(...lngs)) / 2
    ];
  }, [mapPoints]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/" className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-elevated hover:bg-surface-elevated/80 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Your Travel Map</h1>
            <p className="text-muted-foreground">Track your adventures and relive your memories.</p>
          </div>
        </div>
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

          {/* Interactive Map */}
          <Card className="bg-surface-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Interactive Map</CardTitle>
                {/* Mode Toggle */}
                <div className="flex items-center gap-3">
                  <Label htmlFor="map-mode" className="text-sm font-medium">
                    {mapMode === 'journeys' ? 'Journey Mapping' : 'Memories'}
                  </Label>
                  <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                    <Button
                      variant={mapMode === 'journeys' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setMapMode('journeys')}
                      className="text-xs"
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      Journeys
                    </Button>
                    <Button
                      variant={mapMode === 'memories' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setMapMode('memories')}
                      className="text-xs"
                    >
                      <Camera className="w-3 h-3 mr-1" />
                      Memories
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Zoom Level: {currentZoom.toFixed(1)} | {clusters.length} {clusters.length === 1 ? 'location' : 'locations'} shown
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative h-[600px] w-full rounded-lg overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <MapContainer
                    center={mapCenter}
                    zoom={currentZoom}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ZoomTracker onZoomChange={setCurrentZoom} />
                    
                    {/* Render clusters/markers */}
                    {clusters.map((cluster) => {
                      const isSpiderified = spiderifiedCluster === cluster.id;
                      
                      if (mapMode === 'memories' && cluster.points.length > 0) {
                        // Memories mode: Show photo thumbnails
                        const firstPhoto = cluster.points[0].photo || cluster.points[0].photos?.[0];
                        
                        if (firstPhoto) {
                          return (
                            <Marker
                              key={cluster.id}
                              position={[cluster.lat, cluster.lng]}
                              icon={createPhotoIcon(firstPhoto)}
                              eventHandlers={{
                                click: () => handleMarkerClick(cluster)
                              }}
                            >
                              <Popup>
                                <div className="text-center">
                                  <p className="font-semibold">{cluster.label}</p>
                                  {cluster.count > 1 && (
                                    <p className="text-sm text-muted-foreground">{cluster.count} photos</p>
                                  )}
                                </div>
                              </Popup>
                            </Marker>
                          );
                        }
                      }
                      
                      // Journey mode or cluster marker
                      if (cluster.count === 1) {
                        // Single marker
                        const point = cluster.points[0];
                        return (
                          <Marker
                            key={cluster.id}
                            position={[cluster.lat, cluster.lng]}
                            eventHandlers={{
                              click: () => handleMarkerClick(cluster)
                            }}
                          >
                            <Popup>
                              <div>
                                <p className="font-semibold">{point.title || point.placeName || 'Location'}</p>
                                {point.city && <p className="text-sm text-muted-foreground">{point.city}, {point.country}</p>}
                              </div>
                            </Popup>
                          </Marker>
                        );
                      } else {
                        // Cluster marker - show all points if spiderified
                        if (isSpiderified && cluster.type === 'local') {
                          // Render individual markers in spiral pattern
                          const angleStep = (2 * Math.PI) / cluster.points.length;
                          const radius = 0.01; // ~1km
                          
                          return (
                            <>
                              {cluster.points.map((point, index) => {
                                const angle = index * angleStep;
                                const offsetLat = radius * Math.cos(angle);
                                const offsetLng = radius * Math.sin(angle) / Math.cos(cluster.lat * Math.PI / 180);
                                
                                return (
                                  <Marker
                                    key={`${cluster.id}-${point.id}`}
                                    position={[cluster.lat + offsetLat, cluster.lng + offsetLng]}
                                    eventHandlers={{
                                      click: () => handleMarkerClick({ ...cluster, points: [point], count: 1 })
                                    }}
                                  >
                                    <Popup>
                                      <div>
                                        <p className="font-semibold">{point.title || point.placeName || 'Location'}</p>
                                        {point.city && <p className="text-sm text-muted-foreground">{point.city}, {point.country}</p>}
                                      </div>
                                    </Popup>
                                  </Marker>
                                );
                              })}
                              {/* Center marker to collapse */}
                              <Marker
                                key={`${cluster.id}-center`}
                                position={[cluster.lat, cluster.lng]}
                                icon={createClusterIcon(cluster.count)}
                                eventHandlers={{
                                  click: () => handleClusterClick(cluster.id)
                                }}
                              >
                                <Popup>
                                  <div className="text-center">
                                    <p className="font-semibold">{cluster.label}</p>
                                    <p className="text-sm text-muted-foreground">{cluster.count} locations</p>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="mt-2"
                                      onClick={() => handleClusterClick(cluster.id)}
                                    >
                                      Collapse
                                    </Button>
                                  </div>
                                </Popup>
                              </Marker>
                            </>
                          );
                        }
                        
                        // Regular cluster marker
                        return (
                          <Marker
                            key={cluster.id}
                            position={[cluster.lat, cluster.lng]}
                            icon={createClusterIcon(cluster.count)}
                            eventHandlers={{
                              click: () => handleClusterClick(cluster.id)
                            }}
                          >
                            <Popup>
                              <div className="text-center">
                                <p className="font-semibold">{cluster.label}</p>
                                <p className="text-sm text-muted-foreground">{cluster.count} locations</p>
                                {cluster.type === 'local' && cluster.count > 1 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-2"
                                    onClick={() => handleClusterClick(cluster.id)}
                                  >
                                    Expand
                                  </Button>
                                )}
                              </div>
                            </Popup>
                          </Marker>
                        );
                      }
                    })}
                  </MapContainer>
                )}
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
                        src={journey.images?.[0] || heroBeach} 
                        alt={journey.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => handleImageError(e, heroBeach, 'Journey image error')}
                      />
                      <Badge className="absolute top-3 right-3 bg-surface-elevated/90 text-foreground">
                        {new Date(journey.createdAt).getFullYear()}
                      </Badge>
                    </div>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg line-clamp-1">{journey.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {journey.duration || 'Unknown duration'}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-1">Destinations:</p>
                          <div className="flex flex-wrap gap-1">
                            {journey.destinations?.slice(0, 3).map((dest: string) => (
                              <Badge key={dest} variant="secondary" className="text-xs">
                                {dest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 bg-muted/10 rounded-lg px-3 mt-3">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Camera className="w-4 h-4" />
                            {journey.images?.length || 0} photos
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

      {/* Gallery Modal for Memories */}
      <Dialog open={!!selectedGallery} onOpenChange={(open) => !open && setSelectedGallery(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedGallery?.title}</DialogTitle>
          </DialogHeader>
          {selectedGallery && selectedGallery.photos.length > 0 && (
            <div className="relative">
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={selectedGallery.photos[galleryIndex]}
                  alt={`Memory ${galleryIndex + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => handleImageError(e, heroBeach, 'Gallery image error')}
                />
                
                {selectedGallery.photos.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                      onClick={() => setGalleryIndex((prev) => 
                        prev === 0 ? selectedGallery.photos.length - 1 : prev - 1
                      )}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                      onClick={() => setGalleryIndex((prev) => 
                        prev === selectedGallery.photos.length - 1 ? 0 : prev + 1
                      )}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
              
              {selectedGallery.photos.length > 1 && (
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  {galleryIndex + 1} of {selectedGallery.photos.length}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TravelMap;
