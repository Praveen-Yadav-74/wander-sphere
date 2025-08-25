import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Camera, Heart, MessageCircle, Share2, Map, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/utils/api';
import { apiConfig, endpoints } from '@/config/api';
import streetFood from "@/assets/street-food.jpg";
import heroBeach from "@/assets/hero-beach.jpg";
import mountainAdventure from "@/assets/mountain-adventure.jpg";
import castleEurope from "@/assets/castle-europe.jpg";

const JourneyDetail = () => {
  const { id } = useParams();
  const [journey, setJourney] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const fetchJourneyData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // TODO: Replace with actual API calls
        // const response = await apiRequest(`${apiConfig.baseURL}${endpoints.journeys}/${id}`);
        // setJourney(response.data);
        // setIsLiked(response.data.isLiked);
        
        // Temporary: Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // TODO: Replace with actual API integration
        // For now, set journey to null to show "not found" state
        setJourney(null);
        setIsLiked(false);
      } catch (err) {
        setError('Failed to load journey details');
        console.error('Error fetching journey data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchJourneyData();
    }
  }, [id]);

  const handleLike = async () => {
    try {
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      
      // TODO: Replace with actual API call
      // await apiRequest(`${apiConfig.baseURL}${endpoints.journeys}/${id}/like`, {
      //   method: newLikedState ? 'POST' : 'DELETE'
      // });
      
      console.log('Like status updated:', newLikedState);
    } catch (err) {
      // Revert on error
      setIsLiked(!isLiked);
      console.error('Error updating like status:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading journey details...</h2>
          <p className="text-gray-600">Please wait while we fetch the journey information.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error loading journey</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
            <Link to="/map">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Travel Map
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Journey not found</h2>
          <p className="text-gray-600 mb-4">The journey you're looking for doesn't exist.</p>
          <Link to="/map">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Travel Map
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const photos = [
    {
      id: 1,
      image: streetFood,
      title: "Bangkok Street Food Market",
      location: "Bangkok, Thailand",
      date: "Jan 20, 2023",
      description: "Amazing pad thai from a local street vendor",
      likes: 89,
      comments: 12,
    },
    {
      id: 2,
      image: castleEurope,
      title: "Angkor Wat Sunrise",
      location: "Siem Reap, Cambodia", 
      date: "Feb 10, 2023",
      description: "Worth waking up at 4:30am for this incredible sunrise",
      likes: 156,
      comments: 23,
    },
    {
      id: 3,
      image: heroBeach,
      title: "Ha Long Bay Cruise",
      location: "Ha Long Bay, Vietnam",
      date: "Mar 5, 2023",
      description: "Floating through limestone karsts at golden hour",
      likes: 134,
      comments: 18,
    },
    {
      id: 4,
      image: mountainAdventure,
      title: "Mekong Delta Boat Trip",
      location: "Mekong Delta, Vietnam",
      date: "Mar 20, 2023", 
      description: "Exploring the floating markets and river life",
      likes: 67,
      comments: 8,
    },
    {
      id: 5,
      image: streetFood,
      title: "Temple Meditation",
      location: "Chiang Mai, Thailand",
      date: "Jan 28, 2023",
      description: "Finding peace in this beautiful mountain temple",
      likes: 112,
      comments: 15,
    },
    {
      id: 6,
      image: heroBeach,
      title: "Beach Paradise",
      location: "Koh Phi Phi, Thailand",
      date: "Feb 5, 2023",
      description: "Crystal clear waters and perfect white sand",
      likes: 189,
      comments: 31,
    },
  ];

  const logEntries = [
    {
      id: 1,
      date: "January 15, 2023",
      location: "Bangkok, Thailand",
      title: "Journey Begins!",
      content: "Finally landed in Bangkok after 20+ hours of travel. The heat and humidity hit me like a wall, but I'm so excited to start this adventure. The city is absolutely buzzing with energy!",
    },
    {
      id: 2,
      date: "February 10, 2023", 
      location: "Siem Reap, Cambodia",
      title: "Angkor Wat Sunrise",
      content: "Woke up at 4:30am to catch the sunrise at Angkor Wat. It was worth every minute of lost sleep. The temples are even more magnificent than I imagined. Spent the entire day exploring the complex.",
    },
    {
      id: 3,
      date: "March 5, 2023",
      location: "Ha Long Bay, Vietnam", 
      title: "Ha Long Bay Magic",
      content: "The cruise through Ha Long Bay today was absolutely magical. The limestone karsts rising from emerald waters create such a mystical atmosphere. Had amazing seafood dinner on the boat.",
    },
  ];

  const routePoints = [
    { city: "Bangkok", country: "Thailand", coordinates: [100.5018, 13.7563] },
    { city: "Chiang Mai", country: "Thailand", coordinates: [98.9817, 18.7883] },
    { city: "Siem Reap", country: "Cambodia", coordinates: [103.8448, 13.3671] },
    { city: "Ho Chi Minh City", country: "Vietnam", coordinates: [106.6297, 10.8231] },
    { city: "Ha Long Bay", country: "Vietnam", coordinates: [107.0431, 20.9101] },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-4">
        <Link to="/map">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Travel Map
        </Link>
      </Button>

      {/* Journey Header */}
      <Card className="bg-surface-elevated mb-8">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-4">{journey.title}</h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{journey.countries.length}</p>
                  <p className="text-sm text-muted-foreground">Countries</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">{journey.duration}</p>
                  <p className="text-sm text-muted-foreground">Duration</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning">{journey.totalPhotos}</p>
                  <p className="text-sm text-muted-foreground">Photos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-accent">{journey.totalDistance}</p>
                  <p className="text-sm text-muted-foreground">Traveled</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {journey.countries.map((country) => (
                  <Badge key={country} variant="secondary">
                    {country}
                  </Badge>
                ))}
              </div>

              <div className="prose prose-sm max-w-none text-muted-foreground">
                {journey.description.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-3 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <div className="lg:w-80">
              {/* Route Map Placeholder */}
              <Card className="bg-gradient-ocean text-white">
                <CardContent className="p-6 text-center">
                  <Map className="w-16 h-16 mx-auto mb-4 opacity-80" />
                  <h3 className="text-lg font-semibold mb-2">Journey Route</h3>
                  <p className="text-sm opacity-90 mb-4">Interactive map showing the complete travel route</p>
                  <div className="space-y-2 text-left">
                    {routePoints.map((point, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                        {point.city}, {point.country}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Photo Gallery */}
          <Card className="bg-surface-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Photo Gallery ({photos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {photos.map((photo) => (
                  <div key={photo.id} className="group cursor-pointer">
                    <div className="aspect-video overflow-hidden rounded-lg mb-3">
                      <img 
                        src={photo.image} 
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">{photo.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {photo.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {photo.date}
                      </div>
                      <p className="text-sm text-muted-foreground">{photo.description}</p>
                      <div className="flex items-center gap-4 pt-2">
                        <Button variant="ghost" size="sm">
                          <Heart className="w-4 h-4 mr-1" />
                          {photo.likes}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {photo.comments}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Journey Stats */}
          <Card className="bg-surface-elevated">
            <CardHeader>
              <CardTitle>Journey Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date</span>
                  <span className="font-medium">{journey.startDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End Date</span>
                  <span className="font-medium">{journey.endDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Distance</span>
                  <span className="font-medium">{journey.totalDistance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Countries Visited</span>
                  <span className="font-medium">{journey.countries.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Highlights */}
          <Card className="bg-surface-elevated">
            <CardHeader>
              <CardTitle>Trip Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {journey.highlights.map((highlight, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    {highlight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Travel Log */}
          <Card className="bg-surface-elevated">
            <CardHeader>
              <CardTitle>Travel Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logEntries.map((entry) => (
                  <div key={entry.id} className="bg-gradient-to-r from-primary/5 to-transparent pl-4 rounded-r-lg">
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm">{entry.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {entry.date}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {entry.location}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {entry.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JourneyDetail;