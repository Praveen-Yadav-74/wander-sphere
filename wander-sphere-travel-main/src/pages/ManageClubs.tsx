import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Edit2, Trash2, Users, Eye, Settings, TrendingUp, Calendar, Award, Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import clubService, { Club, CreateClubData, UpdateClubData } from '@/services/clubService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { handleImageError } from "@/utils/imageUtils";
import mountainAdventure from "@/assets/mountain-adventure.jpg";
import { countries } from "@/data/suggestions";

const ManageClubs = () => {
  const [myCreatedClubs, setMyCreatedClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<CreateClubData>({
    name: '',
    description: '',
    category: '',
    country: '',
    state: ''
  });

  const [clubToDelete, setClubToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyCreatedClubs();
  }, []);

  const fetchMyCreatedClubs = async () => {
    try {
      setIsLoading(true);
      const response = await clubService.getMyCreatedClubs();
      
      let clubsData: Club[] = [];
      if (response && response.success) {
        clubsData = Array.isArray(response.data) 
          ? response.data 
          : ((response.data as any)?.clubs as Club[]) || [];
      }
      
      setMyCreatedClubs(clubsData);
    } catch (err) {
      console.error('Error fetching created clubs:', err);
      toast({
        title: "Error",
        description: "Failed to load your clubs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      country: '',
      state: ''
    });
    setSelectedClubId(null);
    setIsEditing(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (club: Club) => {
    setFormData({
      name: club.name,
      description: club.description,
      category: club.category,
      country: club.country,
      state: club.state || ''
    });
    setSelectedClubId(club.id);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.description || !formData.category || !formData.country) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (isEditing && selectedClubId) {
        // Update Logic
        const updateData: UpdateClubData = {
          id: selectedClubId,
          ...formData
        };
        
        await clubService.updateClub(updateData);
        
        // Optimistic Update
        setMyCreatedClubs(prev => prev.map(c => 
          c.id === selectedClubId ? { ...c, ...formData } : c
        ));
        
        toast({ title: "Success", description: "Club updated successfully!" });
      } else {
        // Create Logic
        const clubDataForBackend = {
            name: formData.name,
            description: formData.description,
            isPrivate: false,
            tags: formData.category ? [formData.category] : [],
            category: formData.category, // Backend often expects this at top level too depending on implementation
            country: formData.country,
            state: formData.state,
            rules: []
          };

        const createdClub = await clubService.createClub(clubDataForBackend);
        
        if (createdClub) {
           setMyCreatedClubs(prev => [createdClub, ...prev]);
           toast({ title: "Success", description: "Club created successfully!" });
        }
      }
      
      setIsDialogOpen(false);
      resetForm();

    } catch (err) {
      console.error(isEditing ? 'Error updating club:' : 'Error creating club:', err);
      toast({
        title: "Error",
        description: isEditing ? "Failed to update club." : "Failed to create club.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClub = async (clubId: string) => {
    try {
      await clubService.deleteClub(clubId);
      setMyCreatedClubs(prev => prev.filter(club => club.id !== clubId));
      setClubToDelete(null);
      toast({
        title: "Success",
        description: "Club deleted successfully.",
      });
    } catch (err) {
      console.error('Error deleting club:', err);
      toast({
        title: "Error",
        description: "Failed to delete club. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted" />
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 p-6 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <Button 
                variant="ghost" 
                className="mb-2 pl-0 hover:bg-transparent hover:text-indigo-600 transition-colors"
                onClick={() => navigate(-1)}
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back
              </Button>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
                Manage Your Clubs
              </h1>
              <p className="text-muted-foreground mt-2">
                Monitor and manage all the travel communities you've created
              </p>
            </div>
            <Button 
              onClick={handleOpenCreate}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Club
            </Button>
          </div>

          {/* Stats Cards */}
          {myCreatedClubs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-100 text-sm">Total Clubs</p>
                      <h3 className="text-3xl font-bold mt-1">{myCreatedClubs.length}</h3>
                    </div>
                    <Award className="w-10 h-10 opacity-80" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm">Total Members</p>
                      <h3 className="text-3xl font-bold mt-1">
                        {myCreatedClubs.reduce((sum, club) => sum + (club.members || 0), 0)}
                      </h3>
                    </div>
                    <Users className="w-10 h-10 opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-none">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-sm">Engagement Rate</p>
                      <h3 className="text-3xl font-bold mt-1">
                        {Math.round(myCreatedClubs.reduce((sum, club) => sum + (club.members || 0), 0) / (myCreatedClubs.length || 1))}
                      </h3>
                    </div>
                    <TrendingUp className="w-10 h-10 opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Clubs Grid */}
        {myCreatedClubs.length === 0 ? (
          <Card className="border-2 border-dashed border-muted-foreground/20">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950 dark:to-purple-950 rounded-full flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No clubs created yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Start building your travel community by creating your first club. Connect with fellow adventurers!
              </p>
              <Button 
                onClick={handleOpenCreate}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Club
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCreatedClubs.map((club) => (
              <Card 
                key={club.id} 
                className="group hover:shadow-2xl transition-all duration-300 overflow-hidden border-none shadow-md"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={club.image || mountainAdventure} 
                    alt={club.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={handleImageError}
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Badge className="bg-black/50 backdrop-blur-sm text-white border-none">
                      <Users className="w-3 h-3 mr-1" />
                      {club.members || 0}
                    </Badge>
                    {club.category && (
                      <Badge className="bg-indigo-600/90 backdrop-blur-sm text-white border-none">
                        {club.category}
                      </Badge>
                    )}
                  </div>
                </div>

                <CardHeader>
                  <CardTitle className="text-lg line-clamp-1">{club.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {club.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    <Link to={`/clubs/${club.id}`} className="w-full">
                      <Button variant="outline" className="w-full" size="sm">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenEdit(club)}
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setClubToDelete(club.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(club.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Active
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Club Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>{isEditing ? 'Edit Club' : 'Create a New Travel Club'}</DialogTitle>
             </DialogHeader>
             <div className="space-y-4 py-4">
               <div className="space-y-2">
                 <Label htmlFor="club-name">Club Name</Label>
                 <Input 
                   id="club-name" 
                   placeholder="e.g., Adventure Seekers" 
                   value={formData.name}
                   onChange={(e) => setFormData({...formData, name: e.target.value})}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="club-description">Description</Label>
                 <Textarea 
                   id="club-description" 
                   placeholder="What is your club about?" 
                   value={formData.description}
                   onChange={(e) => setFormData({...formData, description: e.target.value})}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="club-category">Category</Label>
                 <Input 
                   id="club-category" 
                   placeholder="e.g., Adventure, Food, Culture" 
                   value={formData.category}
                   onChange={(e) => setFormData({...formData, category: e.target.value})}
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="club-country">Country</Label>
                 <Select value={formData.country} onValueChange={(value) => setFormData({...formData, country: value})}>
                   <SelectTrigger>
                     <SelectValue placeholder="Select country" />
                   </SelectTrigger>
                   <SelectContent>
                     {countries.map((country) => (
                       <SelectItem key={country} value={country.toLowerCase()}>
                         {country}
                       </SelectItem>
                     ))}
                     <SelectItem value="other">Other</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="club-state">State/Province</Label>
                 <Input 
                   id="club-state" 
                   placeholder="e.g., California, Ontario, etc." 
                   value={formData.state || ''}
                   onChange={(e) => setFormData({...formData, state: e.target.value})}
                 />
               </div>
               <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button 
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white" 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {isEditing ? 'Saving...' : 'Creating...'}
                        </>
                        ) : (
                        isEditing ? 'Save Changes' : 'Create Club'
                        )}
                    </Button>
               </DialogFooter>
             </div>
           </DialogContent>
         </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!clubToDelete} onOpenChange={() => setClubToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Club</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this club? This action cannot be undone and all members will be removed.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setClubToDelete(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => clubToDelete && handleDeleteClub(clubToDelete)}
              >
                Delete Club
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ManageClubs;
