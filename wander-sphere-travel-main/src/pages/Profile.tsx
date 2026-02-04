import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  MapPin, 
  Settings, 
  CreditCard, 
  Heart, 
  LifeBuoy, 
  LogOut, 
  ChevronRight,
  Ticket,
  Briefcase,
  Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/config/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useApi } from "@/hooks/useApi";
import { endpoints } from "@/config/api";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  // Fetch user stats with caching (5 minutes TTL)
  const { data: statsData } = useApi<any>(endpoints.users.stats, {
    cache: { ttl: 5 * 60 * 1000, key: 'user_profile_stats' }
  });
  const stats = statsData?.data;

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      // Changed 'profiles' to 'users'
      const { data, error } = await supabase
        .from('users') 
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
    } catch (error: any) {
      console.error("Error loading profile:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update User Profile
      await handleUpdateAvatar(publicUrl);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload image",
        variant: "destructive"
      });
    }
  };

  const handleUpdateAvatar = async (avatarUrl: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Changed 'profiles' to 'users'
      const { error } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (error) throw error;

      setProfile({ ...profile, avatar_url: avatarUrl });
      toast({
        title: "Avatar Updated",
        description: "Your new look is awesome!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update avatar.",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast({
        title: "Logged out successfully",
        description: "Come back soon!",
      });
    } catch (error: any) {
      toast({
        title: "Error logging out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const MenuOption = ({ icon: Icon, label, onClick, color = "text-gray-700", bg = "bg-gray-50" }: any) => (
    <div 
        onClick={onClick}
        className="flex items-center justify-between p-4 rounded-xl cursor-pointer hover:bg-gray-50 active:scale-[0.99] transition-all border border-transparent hover:border-gray-100"
    >
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <span className={`font-medium ${color === "text-red-500" ? "text-red-600" : "text-gray-900"}`}>
                {label}
            </span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300" />
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header / Identity Card */}
      <div className="bg-white pb-6 pt-12 px-6 rounded-b-[2.5rem] shadow-sm border-b border-gray-100 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-50 to-white z-0"></div>
        
        <div className="relative z-10 flex flex-col items-center">
            <div className="relative group">
                <div 
                   onClick={() => document.getElementById('avatar-upload')?.click()}
                   className="relative cursor-pointer transition-transform active:scale-95"
                >
                   <Avatar className="w-28 h-28 border-4 border-white shadow-lg mb-4 group-hover:brightness-90 transition-all">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="text-2xl bg-gray-100 text-gray-400">
                          <User />
                      </AvatarFallback>
                   </Avatar>
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-full mb-4">
                      <Camera className="w-8 h-8 text-white drop-shadow-md" />
                   </div>
                   <div className="absolute bottom-4 right-0 bg-green-500 w-5 h-5 rounded-full border-[3px] border-white"></div>
                </div>
                <input 
                   type="file" 
                   id="avatar-upload" 
                   className="hidden" 
                   accept="image/*"
                   onChange={handleFileUpload}
                />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {profile?.full_name || "Traveler"}
            </h1>
            <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-6">
                <MapPin className="w-4 h-4" />
                <span>{profile?.location || "Global Citizen"}</span>
            </div>

            <Button 
                variant="outline" 
                className="rounded-full px-6 border-gray-200 hover:bg-gray-50 hover:text-primary transition-colors h-9 text-sm font-medium"
                onClick={() => document.getElementById('avatar-upload')?.click()}
            >
                Upload Photo
            </Button>
        </div>
      </div>

      <div className="px-4 mt-6">
        {/* Section B: Travel Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-1">
                <span className="text-2xl font-bold text-primary">{stats?.trips_count || 0}</span>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Trips</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-1">
                <span className="text-2xl font-bold text-purple-600">{stats?.clubs_count || 0}</span>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Clubs</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-1">
                <span className="text-2xl font-bold text-orange-500">{stats?.saved_count || 0}</span>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Saved</span>
            </div>
        </div>

        {/* Section C: Utility Menu */}
        <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 space-y-1">
            <MenuOption 
                icon={Ticket} 
                label="My Bookings" 
                onClick={() => navigate('/bookings')}
                color="text-blue-600"
                bg="bg-blue-50"
            />
            <MenuOption 
                icon={CreditCard} 
                label="My Wallet" 
                onClick={() => navigate('/wallet')}
                color="text-emerald-600"
                bg="bg-emerald-50"
            />
            <MenuOption 
                icon={Heart} 
                label="Saved Trips" 
                onClick={() => navigate('/saved')}
                color="text-pink-600"
                bg="bg-pink-50"
            />
            <div className="h-px bg-gray-100 mx-4 my-2"></div>
            <MenuOption 
                icon={Settings} 
                label="Preferences" 
                onClick={() => navigate('/settings')} 
            />
            <MenuOption 
                icon={LifeBuoy} 
                label="Help & Support" 
                onClick={() => {}} 
            />
             <div className="h-px bg-gray-100 mx-4 my-2"></div>
            <MenuOption 
                icon={LogOut} 
                label="Logout" 
                onClick={handleLogout} 
                color="text-red-500"
                bg="bg-red-50"
            />
        </div>
      </div>
    </div>
  );
};

export default Profile;
