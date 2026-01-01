import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { MapPin, Calendar, Camera, Globe, Navigation, Map, Loader2, ArrowLeft, X, ChevronLeft, ChevronRight, Trophy, Locate, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { handleImageError } from "@/utils/imageUtils";
import { userService } from "@/services/userService";
import { journeyService } from "@/services/journeyService";
import { storyService } from "@/services/storyService";
import { clusterData, extractJourneyPoints, extractStoryPoints, type Cluster } from "@/utils/mapClustering";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import heroBeach from "@/assets/hero-beach.jpg";

// Fix Leaflet default icon
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

// Enhanced cluster icon with pulse animation
function createClusterIcon(count: number) {
  return L.divIcon({
    className: 'custom-cluster-icon',
    html: `
      <div class="relative flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full shadow-2xl border-3 border-white font-bold text-base">
        ${count}
        <span class="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30"></span>
      </div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24]
  });
}

// Stunning photo marker for memories
function createPhotoIcon(photoUrl: string) {
  return L.divIcon({
    className: 'photo-marker',
    html: `
      <div class="w-14 h-14 rounded-full border-3 border-white shadow-2xl overflow-hidden bg-white transform transition-transform hover:scale-110">
        <img src="${photoUrl}" class="w-full h-full object-cover" alt="Memory" />
      </div>`,
    iconSize: [56, 56],
    iconAnchor: [28, 28]
  });
}

// Current location icon (user's real position)
function createUserLocationIcon() {
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        <div class="absolute w-8 h-8 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
        <div class="w-4 h-4 bg-blue-500 border-2 border-white rounded-full shadow-lg z-10"></div>
      </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

// Zoom tracker
function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => onZoomChange(map.getZoom()),
    moveend: () => onZoomChange(map.getZoom())
  });
  return null;
}

// Component to fly to user location
function LocationButton({ onLocate }: { onLocate: () => void }) {
  return (
    <Button
      onClick={onLocate}
      size="sm"
      variant="secondary"
      className="absolute bottom-24 right-4 z-[1000] shadow-2xl rounded-full w-12 h-12 p-0"
    >
      <Locate className="w-5 h-5" />
    </Button>
  );
}

const TravelMap = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [journeys, setJourneys] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [currentZoom, setCurrentZoom] = useState(3);
  const [mapMode, setMapMode] = useState<'journeys' | 'memories'>('journeys');
  const [spiderifiedCluster, setSpiderifiedCluster] = useState<string | null>(null);
  const [selectedGallery, setSelectedGallery] = useState<{ photos: string[]; title: string } | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { toast } = useToast();

  // Scroll helper functions for mobile
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  // Get user's real-time location
  const getUserLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setLocationError(null);
          toast({
            title: "📍 Location Found",
            description: `Your current position: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            duration: 3000,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationError(error.message);
          toast({
            title: "⚠️ Location Access Denied",
            description: "Please enable location services to see your current position on the map.",
            variant: "destructive",
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      toast({
        title: "❌ Geolocation Not Supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Fetch all travel data
  const fetchAllData = useCallback(async () => {
    if (!user || !isAuthenticated) return;
    setLoading(true);
    try {
      const [stats, journeysRes, storiesRes] = await Promise.all([
        userService.getUserStats(),
        journeyService.getMyJourneys(),
        storyService.getStories()
      ]);

      setAchievements([
        { icon: Globe, value: stats.countriesVisited || 0, label: "Countries", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/30" },
        { icon: MapPin, value: stats.citiesVisited || 0, label: "Cities", color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/30" },
        { icon: Navigation, value: `${Math.round((stats.totalDistance || 0) / 1000)}k`, label: "KM Traveled", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/30" },
        { icon: Trophy, value: stats.totalTrips || 0, label: "Trips", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/30" }
      ]);

      setJourneys(Array.isArray(journeysRes.data?.journeys) ? journeysRes.data.journeys : []);
      setStories(Array.isArray(storiesRes.data?.stories) ? storiesRes.data.stories : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({ title: "Failed to load data", description: "Please try refreshing the page.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, toast]);

  useEffect(() => {
    fetchAllData();
    getUserLocation(); // Get location on mount
  }, [fetchAllData, getUserLocation]);

  const mapPoints = useMemo(() => 
    mapMode === 'journeys' ? extractJourneyPoints(journeys) : extractStoryPoints(stories)
  , [mapMode, journeys, stories]);

  const clusters = useMemo(() => clusterData(mapPoints, currentZoom), [mapPoints, currentZoom]);

  const mapCenter: [number, number] = useMemo(() => {
    // Use user's location if available
    if (userLocation) return userLocation;
    
    // Otherwise calculate center from travel points
    if (mapPoints.length === 0) return [20, 0];
    const lats = mapPoints.map(p => p.lat);
    const lngs = mapPoints.map(p => p.lng);
    return [(Math.max(...lats) + Math.min(...lats)) / 2, (Math.max(...lngs) + Math.min(...lngs)) / 2];
  }, [mapPoints, userLocation]);

  const handleClusterClick = useCallback((clusterId: string) => {
    setSpiderifiedCluster(prev => prev === clusterId ? null : clusterId);
  }, []);

  const handleMarkerClick = useCallback((cluster: Cluster) => {
    if (mapMode === 'memories' && cluster.points.length > 0) {
      const allPhotos = cluster.points
        .flatMap(p => p.photos || (p.photo ? [p.photo] : []))
        .filter(Boolean);
      
      if (allPhotos.length > 0) {
        setSelectedGallery({ photos: allPhotos, title: cluster.label });
        setGalleryIndex(0);
      }
    }
  }, [mapMode]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your travel map...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Elegant Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Your Travel World
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Explore your journey across the globe</p>
            </div>
          </div>
          <Button 
            onClick={() => { fetchAllData(); getUserLocation(); }} 
            variant="outline" 
            size="sm"
            className="shadow-md hover:shadow-lg transition-all"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </motion.div>

        {/* Beautiful Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {achievements.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, type: "spring" }}
            >
              <Card className="overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-default">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${item.bg}`}>
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{item.value}</div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">{item.label}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Stunning Map Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden border-none shadow-2xl">
            {/* Floating Mode Toggle */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-xs px-4">
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200 dark:border-slate-700 shadow-2xl rounded-full p-1.5 flex gap-1.5">
                <Button
                  className="flex-1 rounded-full text-xs h-10 font-semibold transition-all"
                  variant={mapMode === 'journeys' ? 'default' : 'ghost'}
                  onClick={() => setMapMode('journeys')}
                >
                  <Map className="w-4 h-4 mr-2" /> Journeys
                </Button>
                <Button
                  className="flex-1 rounded-full text-xs h-10 font-semibold transition-all"
                  variant={mapMode === 'memories' ? 'default' : 'ghost'}
                  onClick={() => setMapMode('memories')}
                >
                  <Camera className="w-4 h-4 mr-2" /> Memories
                </Button>
              </div>
            </div>

            <div className="h-[700px] w-full relative">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <MapContainer
                    center={mapCenter}
                    zoom={userLocation ? 12 : currentZoom}
                    className="h-full w-full"
                    zoomControl={true}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                      attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    />
                    <ZoomTracker onZoomChange={setCurrentZoom} />
                    
                    {/* User's current location marker */}
                    {userLocation && (
                      <Marker position={userLocation} icon={createUserLocationIcon()}>
                        <Popup>
                          <div className="text-center font-semibold">
                            📍 You are here
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Travel markers */}
                    {clusters.map((cluster) => {
                      const isSpiderified = spiderifiedCluster === cluster.id;
                      
                      if (mapMode === 'memories') {
                        const photo = cluster.points[0]?.photo || cluster.points[0]?.photos?.[0];
                        return photo ? (
                          <Marker
                            key={cluster.id}
                            position={[cluster.lat, cluster.lng]}
                            icon={createPhotoIcon(photo)}
                            eventHandlers={{ click: () => handleMarkerClick(cluster) }}
                          />
                        ) : null;
                      }

                      if (isSpiderified && cluster.count > 1) {
                        const angleStep = (2 * Math.PI) / cluster.points.length;
                        return (
                          <div key={cluster.id}>
                            {cluster.points.map((p, idx) => (
                              <Marker 
                                key={p.id}
                                position={[
                                  cluster.lat + 0.01 * Math.cos(idx * angleStep),
                                  cluster.lng + 0.01 * Math.sin(idx * angleStep)
                                ]}
                              >
                                <Popup className="font-medium">{p.title || p.placeName}</Popup>
                              </Marker>
                            ))}
                            <Marker 
                              position={[cluster.lat, cluster.lng]} 
                              icon={createClusterIcon(cluster.count)} 
                              eventHandlers={{ click: () => handleClusterClick(cluster.id) }} 
                            />
                          </div>
                        );
                      }

                      return (
                        <Marker
                          key={cluster.id}
                          position={[cluster.lat, cluster.lng]}
                          icon={cluster.count > 1 ? createClusterIcon(cluster.count) : DefaultIcon}
                          eventHandlers={{ click: () => cluster.count > 1 && handleClusterClick(cluster.id) }}
                        >
                          {cluster.count === 1 && (
                            <Popup>
                              <div className="font-semibold">{cluster.points[0].title || cluster.points[0].placeName}</div>
                            </Popup>
                          )}
                        </Marker>
                      );
                    })}
                  </MapContainer>
                  
                  {/* Locate Me Button */}
                  <LocationButton onLocate={getUserLocation} />
                  
                  {/* Mobile Scroll Control Buttons - Always visible */}
                  <div className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 z-[999] flex flex-col gap-3">
                    {/* Scroll Up Button */}
                    <Button
                      onClick={scrollToTop}
                      size="icon"
                      className="w-12 h-12 rounded-full shadow-2xl bg-white/95 dark:bg-slate-900/95 hover:bg-white dark:hover:bg-slate-800 border-2 border-blue-500 text-blue-600 dark:text-blue-400"
                    >
                      <ChevronUp className="w-6 h-6" />
                    </Button>
                    
                    {/* Scroll Down Button */}
                    <Button
                      onClick={scrollToBottom}
                      size="icon"
                      className="w-12 h-12 rounded-full shadow-2xl bg-white/95 dark:bg-slate-900/95 hover:bg-white dark:hover:bg-slate-800 border-2 border-blue-500 text-blue-600 dark:text-blue-400"
                    >
                      <ChevronDown className="w-6 h-6" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Gallery Modal */}
      <AnimatePresence>
        {selectedGallery && (
          <Dialog open={!!selectedGallery} onOpenChange={() => setSelectedGallery(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{selectedGallery.title}</DialogTitle>
              </DialogHeader>
              {selectedGallery.photos.length > 0 && (
                <div className="relative">
                  <motion.div 
                    key={galleryIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden"
                  >
                    <img
                      src={selectedGallery.photos[galleryIndex]}
                      alt={`Memory ${galleryIndex + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => handleImageError(e, heroBeach, 'Gallery image error')}
                    />
                  </motion.div>
                  
                  {selectedGallery.photos.length > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setGalleryIndex(p => p === 0 ? selectedGallery.photos.length - 1 : p - 1)}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <span className="text-sm font-medium">
                        {galleryIndex + 1} / {selectedGallery.photos.length}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setGalleryIndex(p => (p + 1) % selectedGallery.photos.length)}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TravelMap;
