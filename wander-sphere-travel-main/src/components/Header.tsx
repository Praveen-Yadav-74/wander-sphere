
import { useState, useEffect, useRef } from "react";
import { getAvatarUrl } from "@/utils/imageHandling";
import { getRandomAvatar } from "@/utils/avatars";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Globe, User, LogOut, Settings, UserCircle, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notificationService, Notification } from "@/services/notificationService";
import { supabase } from "@/config/supabase";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeNotificationTab, setActiveNotificationTab] = useState("all");
  
  // 🛑 CACHE: Prevent refetch on tab switch
  const lastFetchTime = useRef<number>(0);
  const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  // ✨ Animated text for mobile booking button
  const bookingPhrases = [
    { text: "Book", icon: "📅" },
    { text: "Travel", icon: "✈️" },
    { text: "Enjoy", icon: "🏖️" }
  ];
  const [phraseIndex, setPhraseIndex] = useState(0);

  // Avatar Logic
  const displayAvatar = user?.avatar ? getAvatarUrl(user.avatar) : getRandomAvatar(user?.id || 'default');

  useEffect(() => {
    // Cycle through phrases every 2 seconds
    const timer = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % bookingPhrases.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Only fetch notifications if user is authenticated AND cache is stale
    if (user) {
      const now = Date.now();
      const shouldFetch = now - lastFetchTime.current > CACHE_DURATION;
      
      if (shouldFetch) {
        // console.log('[Header] Cache stale, fetching notifications');
        fetchNotifications();
        fetchUnreadCount();
        lastFetchTime.current = now;
      }

      // Subscribe to realtime notifications
      const channel = supabase
        .channel('header_notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            fetchNotifications();
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return; 
    try {
      const response = await notificationService.getNotifications(1, 5); 
      if (response.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  };

  const formatNotificationForDisplay = (notification: Notification) => {
    const timeAgo = formatTime(notification.createdAt);
    return {
      id: notification.id,
      type: notification.type,
      user: notification.data?.followerName || notification.data?.likerName || notification.data?.commenterName || 'Someone',
      content: notification.message,
      time: timeAgo,
      comment: notification.data?.comment,
      image: notification.data?.image,
       // Use random avatar for notification users if no image available? 
       // For now stick to default placeholder or initials
    };
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`;
    return date.toLocaleDateString();
  };

  const displayNotifications = notifications.map(formatNotificationForDisplay);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md shadow-sm pt-[env(safe-area-inset-top)]">
      <div className="container flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
               <Globe className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">WanderSphere</span>
          </Link>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          
          {/* Notifications Utility (New) */}
           <Link to="/notifications">
              <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-gray-900 hover:bg-gray-100/50">
                 <Bell className="w-5 h-5" />
                 {/* Logic for meaningful utility notifications count needed here later */}
              </Button>
           </Link>




          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 ml-1 border border-gray-100 shadow-sm p-0 overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all">
                <Avatar className="h-full w-full">
                  <AvatarImage src={displayAvatar} alt={user?.firstName} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white font-bold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-gray-100 p-1">
              <DropdownMenuLabel className="font-normal p-3 bg-gray-50/50 rounded-lg mb-1">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs leading-none text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuItem asChild className="rounded-lg cursor-pointer my-0.5">
                <Link to="/profile" className="flex items-center py-2 px-3">
                  <UserCircle className="mr-2 h-4 w-4 text-gray-500" />
                  <span className="font-medium">Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-lg cursor-pointer my-0.5">
                <Link to="/booking" className="flex items-center py-2 px-3">
                  <Briefcase className="mr-2 h-4 w-4 text-gray-500" />
                  <span className="font-medium">My Bookings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-lg cursor-pointer my-0.5">
                <Link to="/settings" className="flex items-center py-2 px-3">
                  <Settings className="mr-2 h-4 w-4 text-gray-500" />
                  <span className="font-medium">Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-100 my-1" />
              <DropdownMenuItem 
                onClick={() => logout()}
                className="flex items-center text-red-600 focus:text-red-700 rounded-lg cursor-pointer py-2 px-3 focus:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span className="font-medium">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
