import React, { useState, useEffect, useCallback } from "react";
import { ExternalLink, Plane, Hotel, Car, Calendar, MapPin, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { bookingService, BookingPartner, BookingFeature } from "@/services/bookingService";
import { handleImageError } from "@/utils/imageUtils";

const BookingSpace = () => {
  const [bookingPartners, setBookingPartners] = useState<BookingPartner[]>([]);
  const [features, setFeatures] = useState<BookingFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchBookingPartners = useCallback(async () => {
    try {
      const response = await bookingService.getBookingPartners({ isActive: true });
      if (response.success) {
        setBookingPartners(response.data);
      } else {
        setBookingPartners([]);
      }
    } catch (error) {
      console.error('Error fetching booking partners:', error);
      setBookingPartners([]);
      toast({
        title: "Error",
        description: "Failed to load booking partners",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchFeatures = useCallback(async () => {
    try {
      const response = await bookingService.getBookingFeatures();
      if (response.success) {
        setFeatures(response.data.filter(feature => feature.isActive));
      } else {
        setFeatures([]);
      }
    } catch (error) {
      console.error('Error fetching features:', error);
      setFeatures([]);
      toast({
        title: "Error",
        description: "Failed to load features",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = 'none';
    e.currentTarget.parentElement?.classList.add('hidden');
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchBookingPartners(), fetchFeatures()]);
      setLoading(false);
    };
    
    loadData();
  }, [fetchBookingPartners, fetchFeatures]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="bg-gradient-primary rounded-2xl p-8 text-white mb-8">
          <h1 className="text-4xl font-bold mb-4">Ready to Book?</h1>
          <p className="text-xl opacity-90 mb-6">
            Book your next adventure with our trusted travel partners
          </p>
          <div className="flex justify-center">
            <div className="bg-white/20 backdrop-blur rounded-lg p-6 max-w-md">
              <p className="text-sm opacity-80 mb-2">Coming Soon</p>
              <h3 className="text-lg font-semibold mb-2">Integrated Booking Platform</h3>
              <p className="text-sm opacity-90">
                We're working on a seamless booking experience that will be integrated directly into WanderSphere.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="text-center bg-surface-elevated">
              <CardContent className="p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4 animate-pulse" />
                <div className="h-5 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))
        ) : features.length > 0 ? (
          features.map((feature, index) => {
            // Map icon names to actual icon components
            const getIcon = (iconName: string) => {
              const iconMap: { [key: string]: any } = {
                'plane': Plane,
                'hotel': Hotel,
                'car': Car,
                'calendar': Calendar,
                'map-pin': MapPin,
                'star': Star,
                'external-link': ExternalLink,
              };
              return iconMap[iconName] || ExternalLink;
            };
            const IconComponent = getIcon(feature.icon);
            
            return (
              <Card key={feature.id} className="text-center bg-surface-elevated">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                    <IconComponent className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">No features available at the moment.</p>
          </div>
        )}
      </div>

      {/* Booking Partners */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-center mb-8">Book with Our Trusted Partners</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="overflow-hidden bg-surface-elevated">
                <CardHeader className="text-center pb-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-full mb-4 mx-auto animate-pulse" />
                  <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </CardHeader>
                <CardContent className="text-center">
                  <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse" />
                  <div className="h-12 bg-gray-200 rounded mb-6 animate-pulse" />
                  <div className="h-10 bg-gray-200 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))
          ) : bookingPartners.length > 0 ? (
            bookingPartners.map((partner) => {
              // Map partner type to icon
              const getPartnerIcon = (type: string) => {
                const iconMap: { [key: string]: any } = {
                  'flights': Plane,
                  'hotels': Hotel,
                  'cars': Car,
                  'activities': MapPin,
                  'packages': Star,
                };
                return iconMap[type] || ExternalLink;
              };
              const IconComponent = getPartnerIcon(partner.type);
              
              const handlePartnerClick = async () => {
                try {
                  // Track the visit for analytics
                  await bookingService.trackPartnerVisit(partner.id);
                } catch (error) {
                  console.error('Error tracking partner visit:', error);
                }
                // Open partner URL
                window.open(partner.url, '_blank');
              };
              
              return (
                <Card key={partner.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 bg-surface-elevated">
                  <CardHeader className="text-center pb-4">
                    {partner.logo ? (
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-white">
                        <img 
                          src={partner.logo} 
                          alt={`${partner.name} logo`}
                          className="w-full h-full object-contain"
                          onError={handleImageError}
                        />
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4 mx-auto">
                        <IconComponent className="w-10 h-10 text-primary" />
                      </div>
                    )}
                    <CardTitle className="text-xl">{partner.name}</CardTitle>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <Star className="w-4 h-4 text-warning fill-current" />
                      <span className="text-sm font-medium">{partner.rating.toFixed(1)}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-primary font-medium mb-2 capitalize">{partner.type}</p>
                    <p className="text-muted-foreground text-sm mb-6">{partner.description}</p>
                    <Button 
                      className="w-full bg-gradient-primary text-white shadow-primary hover:shadow-glow transition-all duration-300"
                      onClick={handlePartnerClick}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Visit {partner.name}
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Booking Partners Available</h3>
                <p className="text-muted-foreground">We're working on adding trusted booking partners to help you plan your trips.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <Card className="bg-gradient-ocean text-white">
        <CardContent className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Start Planning Your Dream Trip</h2>
          <p className="text-lg opacity-90 mb-6">
            Connect with fellow travelers, discover amazing destinations, and create unforgettable memories
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="secondary" 
              size="lg" 
              onClick={() => navigate('/find-trips')}
            >
              <MapPin className="w-5 h-5 mr-2" />
              Find Travel Buddies
            </Button>
            <Button 
              variant="secondary" 
              size="lg" 
              onClick={() => navigate('/map')}
            >
              <Star className="w-5 h-5 mr-2" />
              Explore Travel Maps
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingSpace;