/**
 * My Trips Dashboard
 * Manage created trips, joined trips, pending requests, and completed trips
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MapPin,
  Calendar,
  Users,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Settings,
  Eye,
  Search,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/utils/api';
import { apiConfig } from '@/config/api';
import { Trip } from '@/types/api';
import { handleImageError } from '@/utils/imageUtils';
import heroBeach from '@/assets/hero-beach.jpg';

interface TripRequest {
  id: string;
  trip_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  created_at: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    email?: string;
  };
  trip?: Trip;
}

const MyTrips = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('created');
  const [loading, setLoading] = useState(true);
  
  // State for different trip categories
  const [createdTrips, setCreatedTrips] = useState<Trip[]>([]);
  const [joinedTrips, setJoinedTrips] = useState<Trip[]>([]);
  const [pendingRequests, setPendingRequests] = useState<TripRequest[]>([]);
  const [completedTrips, setCompletedTrips] = useState<Trip[]>([]);
  
  // State for managing trip requests (for created trips)
  const [tripRequests, setTripRequests] = useState<{ [key: string]: TripRequest[] }>({});
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadCreatedTrips(),
        loadJoinedTrips(),
        loadPendingRequests(),
        loadCompletedTrips(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load trips data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCreatedTrips = async () => {
    try {
      // Get current user's trips
      const response = await apiRequest<any>(`${apiConfig.baseURL}/trips?sortBy=createdAt&sortOrder=desc`) as any;
      
      if (response.success && response.data?.trips) {
        const myTrips = response.data.trips.filter((trip: Trip) => trip.isOrganizer);
        setCreatedTrips(myTrips);
        
        // Load requests for each created trip
        const requestsMap: { [key: string]: TripRequest[] } = {};
        await Promise.all(
          myTrips.map(async (trip: Trip) => {
            try {
              const reqResponse = await apiRequest<any>(`${apiConfig.baseURL}/trips/${trip.id}/requests`) as any;
              if (reqResponse.success) {
                requestsMap[trip.id] = reqResponse.data || [];
              }
            } catch (err) {
              console.error(`Failed to load requests for trip ${trip.id}`, err);
            }
          })
        );
        setTripRequests(requestsMap);
      }
    } catch (error) {
      console.error('Error loading created trips:', error);
    }
  };

  const loadJoinedTrips = async () => {
    try {
      const response = await apiRequest<any>(`${apiConfig.baseURL}/trips`) as any;
      
      if (response.success && response.data?.trips) {
        const joined = response.data.trips.filter(
          (trip: Trip) => trip.isParticipant && !trip.isOrganizer
        );
        setJoinedTrips(joined);
      }
    } catch (error) {
      console.error('Error loading joined trips:', error);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const response = await apiRequest<any>(`${apiConfig.baseURL}/trips/requests/my`) as any;
      
      if (response.success && response.data) {
        setPendingRequests(response.data.filter((req: TripRequest) => req.status === 'pending'));
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const loadCompletedTrips = async () => {
    try {
      const response = await apiRequest<any>(`${apiConfig.baseURL}/trips?status=completed`) as any;
      
      if (response.success && response.data?.trips) {
        const completed = response.data.trips.filter(
          (trip: Trip) => trip.isOrganizer || trip.isParticipant
        );
        setCompletedTrips(completed);
      }
    } catch (error) {
      console.error('Error loading completed trips:', error);
    }
  };

  const handleApproveRequest = async (requestId: string, tripId: string) => {
    setProcessingRequest(requestId);
    try {
      const response = await apiRequest<any>(
        `${apiConfig.baseURL}/trips/requests/${requestId}/approve`,
        { method: 'POST' }
      ) as any;

      if (response.success) {
        toast({
          title: 'Request Approved',
          description: 'User has been added to the trip',
        });
        
        // Refresh data
        await loadCreatedTrips();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve request',
        variant: 'destructive',
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (requestId: string, tripId: string) => {
    setProcessingRequest(requestId);
    try {
      const response = await apiRequest<any>(
        `${apiConfig.baseURL}/trips/requests/${requestId}/reject`,
        { method: 'POST' }
      ) as any;

      if (response.success) {
        toast({
          title: 'Request Rejected',
          description: 'User request has been declined',
        });
        
        // Refresh data
        await loadCreatedTrips();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject request',
        variant: 'destructive',
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDestinationText = (destination: any): string => {
    if (typeof destination === 'string') return destination;
    if (destination?.city && destination?.country) {
      return `${destination.city}, ${destination.country}`;
    }
    return 'Unknown destination';
  };

  const TripCard = ({ trip, showRequests = false }: { trip: Trip; showRequests?: boolean }) => {
    const requests = showRequests ? (tripRequests[trip.id] || []).filter(r => r.status === 'pending') : [];
    
    return (
      <Card key={trip.id} className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-48 h-48 relative">
            <img
              src={trip.images?.[0] || heroBeach}
              alt={trip.title}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
            <Badge className="absolute top-2 right-2">{trip.status}</Badge>
          </div>
          
          <div className="flex-1 p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xl font-semibold">{trip.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4" />
                  {getDestinationText(trip.destination)}
                </div>
              </div>
              <Badge variant="outline">{trip.category}</Badge>
            </div>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {trip.description}
            </p>

            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {trip.dates?.startDate && formatDate(trip.dates.startDate)} - {trip.dates?.endDate && formatDate(trip.dates.endDate)}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {trip.participantCount || 0}/{trip.maxParticipants} travelers
              </div>
            </div>

            {showRequests && requests.length > 0 && (
              <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Pending Requests ({requests.length})
                </h4>
                <div className="space-y-2">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-2 bg-background rounded border"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={request.user?.avatar_url} />
                          <AvatarFallback>
                            {request.user?.first_name?.[0]}{request.user?.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {request.user?.first_name} {request.user?.last_name}
                          </p>
                          {request.message && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              "{request.message}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => handleApproveRequest(request.id, trip.id)}
                          disabled={processingRequest === request.id}
                        >
                          {processingRequest === request.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleRejectRequest(request.id, trip.id)}
                          disabled={processingRequest === request.id}
                        >
                          {processingRequest === request.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <Button asChild variant="outline" size="sm">
                <Link to={`/trips/${trip.id}`}>
                  <Eye className="w-4 h-4 mr-1" />
                  View Trip
                </Link>
              </Button>
              {showRequests && (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/trips/${trip.id}/edit`}>
                    <Settings className="w-4 h-4 mr-1" />
                    Manage
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Trips Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage your trips, view requests, and track your travel adventures
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="created" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Created ({createdTrips.length})
          </TabsTrigger>
          <TabsTrigger value="joined" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Joined ({joinedTrips.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Completed ({completedTrips.length})
          </TabsTrigger>
        </TabsList>

        {/* Created Trips Tab */}
        <TabsContent value="created" className="space-y-4">
          {createdTrips.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">You haven't created any trips yet</p>
                  <Button asChild>
                    <Link to="/find-trips">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Trip
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            createdTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} showRequests={true} />
            ))
          )}
        </TabsContent>

        {/* Joined Trips Tab */}
        <TabsContent value="joined" className="space-y-4">
          {joinedTrips.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">You haven't joined any trips yet</p>
                  <Button asChild>
                    <Link to="/find-trips">
                      <Search className="w-4 h-4 mr-2" />
                      Find Trips to Join
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            joinedTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))
          )}
        </TabsContent>

        {/* Pending Requests Tab */}
        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pending requests</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map((request) => (
              request.trip && <TripCard key={request.id} trip={request.trip} />
            ))
          )}
        </TabsContent>

        {/* Completed Trips Tab */}
        <TabsContent value="completed" className="space-y-4">
          {completedTrips.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No completed trips yet</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            completedTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyTrips;
