import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, CheckCircle, XCircle, Clock, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { tripService, Trip } from '@/services/tripService';

interface TripRequest {
  id: string;
  trip_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  created_at: string;
  trip?: {
    id: string;
    title: string;
    destination: any;
    start_date: string;
    end_date: string;
    images: string[];
    organizer: {
      id: string;
      first_name: string;
      last_name: string;
      avatar_url: string;
    };
  };
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
    username: string;
  };
}

const TripDashboard = () => {
  const { toast } = useToast();
  const [myInterests, setMyInterests] = useState<TripRequest[]>([]);
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [tripRequests, setTripRequests] = useState<{[key: string]: TripRequest[]}>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('interests');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [interests, trips] = await Promise.all([
        tripService.getMyTripRequests(),
        tripService.getTrips(),
      ]);
      
      setMyInterests(interests);
      setMyTrips(trips.data || []);

      // Load requests for each of user's trips
      if (trips.data && trips.data.length > 0) {
        const requestsMap: {[key: string]: TripRequest[]} = {};
        await Promise.all(
          trips.data.map(async (trip: Trip) => {
            try {
              const requests = await tripService.getTripRequests(trip.id);
              requestsMap[trip.id] = requests.filter((r: TripRequest) => r.status === 'pending');
            } catch (err) {
              console.error(`Failed to load requests for trip ${trip.id}:`, err);
            }
          })
        );
        setTripRequests(requestsMap);
      }
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, tripId: string) => {
    try {
      await tripService.approveTripRequest(requestId);
      toast({
        title: 'Success',
        description: 'Request approved! User has been notified.',
      });
      // Refresh data
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve request',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (requestId: string, tripId: string) => {
    try {
      await tripService.rejectTripRequest(requestId);
      toast({
        title: 'Success',
        description: 'Request rejected',
      });
      // Refresh data
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject request',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Trip Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage your trips and travel requests</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="interests" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            My Interests ({myInterests.length})
          </TabsTrigger>
          <TabsTrigger value="trips" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            My Trips ({myTrips.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Trip Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {myInterests.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No trip requests yet</p>
                  <Button asChild className="mt-4">
                    <Link to="/find-trips">
                      <Plus className="w-4 h-4 mr-2" />
                      Find Trips
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myInterests.map((request) => (
                    <Card key={request.id} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        {request.trip?.images && request.trip.images[0] && (
                          <div className="md:w-48 h-48 bg-muted">
                            <img
                              src={request.trip.images[0]}
                              alt={request.trip.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{request.trip?.title}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <MapPin className="w-4 h-4" />
                                {typeof request.trip?.destination === 'object' 
                                  ? `${request.trip.destination.city}, ${request.trip.destination.country}`
                                  : request.trip?.destination}
                              </div>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>
                          {request.message && (
                            <p className="text-sm text-muted-foreground mb-2">
                              Message: &quot;{request.message}&quot;
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {request.trip?.start_date && formatDate(request.trip.start_date)} - {request.trip?.end_date && formatDate(request.trip.end_date)}
                            </div>
                          </div>
                          {request.trip && (
                            <Button asChild variant="outline" size="sm" className="mt-3">
                              <Link to={`/trips/${request.trip.id}`}>View Trip</Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trips" className="space-y-4">
          {myTrips.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">You haven't created any trips yet</p>
                  <Button asChild className="mt-4">
                    <Link to="/create-trip">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Trip
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            myTrips.map((trip) => (
              <Card key={trip.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{trip.title}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <MapPin className="w-4 h-4" />
                        {trip.destination ?? 'Unknown destination'}
                      </div>
                    </div>
                    <Badge>{trip.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {trip.currentParticipants}/{trip.maxParticipants} participants
                      </div>
                    </div>

                    {tripRequests[trip.id] && tripRequests[trip.id].length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Pending Requests ({tripRequests[trip.id].length})
                        </h4>
                        <div className="space-y-3">
                          {tripRequests[trip.id].map((request) => (
                            <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={request.user?.avatar_url} />
                                  <AvatarFallback>
                                    {request.user?.first_name?.[0]}{request.user?.last_name?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {request.user?.first_name} {request.user?.last_name}
                                  </p>
                                  {request.message && (
                                    <p className="text-sm text-muted-foreground">
                                      &quot;{request.message}&quot;
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                  onClick={() => handleApprove(request.id, trip.id)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                  onClick={() => handleReject(request.id, trip.id)}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/trips/${trip.id}`}>View Trip</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TripDashboard;
