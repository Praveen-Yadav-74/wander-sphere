import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Globe, Heart, Luggage, MessageCircle, User, UserPlus, LogOut, Settings, UserCircle } from "lucide-react";
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
import NetworkStatus from "./NetworkStatus";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeNotificationTab, setActiveNotificationTab] = useState("all");

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getNotifications(1, 5); // Get first 5 for dropdown
      if (response.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Fallback to empty array if API fails
      setNotifications([]);
    }
  };

  const fetchUnreadCount = async () => {
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
      image: notification.data?.image
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md shadow-sm">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-lg sm:text-xl font-bold">
          <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">WanderSphere</span>
        </Link>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Network Status */}
          <NetworkStatus className="hidden sm:flex" />
          
          {/* Pack Your Bags Button */}
          <Button 
            asChild
            size="sm"
            className="bg-gradient-to-r from-primary to-primary/80 text-white shadow-sm hover:shadow-md transition-all duration-300 hidden md:flex rounded-lg"
          >
            <Link to="/booking" className="flex items-center gap-2">
              <Luggage className="w-4 h-4" />
              <span className="text-sm">Pack Your Bags</span>
            </Link>
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-xs rounded-full">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 p-0">
              <div className="p-3 bg-muted/30 rounded-t-lg">
                <h3 className="font-semibold text-lg">Notifications</h3>
              </div>
              
              <Tabs defaultValue="all" className="w-full" onValueChange={setActiveNotificationTab}>
                <div className="px-2 pt-2">
                  <TabsList className="w-full grid grid-cols-4">
                    <TabsTrigger value="all" className="text-xs">
                      All
                    </TabsTrigger>
                    <TabsTrigger value="likes" className="text-xs">
                      <Heart className="h-3 w-3 mr-1" /> Likes
                    </TabsTrigger>
                    <TabsTrigger value="comments" className="text-xs">
                      <MessageCircle className="h-3 w-3 mr-1" /> Comments
                    </TabsTrigger>
                    <TabsTrigger value="follows" className="text-xs">
                      <UserPlus className="h-3 w-3 mr-1" /> Follows
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="all" className="mt-0 max-h-[400px] overflow-y-auto">
                  <div className="py-2">
                    {/* Today Section */}
                    <div className="px-3 py-1">
                      <h4 className="text-xs font-medium text-muted-foreground">Today</h4>
                    </div>
                    
                    {displayNotifications.map((notification) => (
                      <div key={notification.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-start gap-3 p-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="/avatars/user.png" alt="Avatar" />
                            <AvatarFallback>{notification.user.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="grid gap-1 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm">
                                <span className="font-medium">{notification.user}</span> {notification.content}
                              </p>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">{notification.time}</span>
                            </div>
                            {notification.comment && (
                              <p className="text-xs text-muted-foreground">
                                "{notification.comment}"
                              </p>
                            )}
                          </div>
                          {notification.image && (
                            <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0">
                              <img src={notification.image} alt="Post" className="h-full w-full object-cover" />
                            </div>
                          )}
                          {notification.type === "follow" && (
                            <Button size="sm" variant="outline" className="h-8 flex-shrink-0">
                              Follow
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="likes" className="mt-0 max-h-[400px] overflow-y-auto">
                  <div className="py-2">
                    {displayNotifications.filter(n => n.type === "like").map((notification) => (
                      <div key={notification.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-start gap-3 p-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="/avatars/user.png" alt="Avatar" />
                            <AvatarFallback>{notification.user.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="grid gap-1 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm">
                                <span className="font-medium">{notification.user}</span> {notification.content}
                              </p>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">{notification.time}</span>
                            </div>
                          </div>
                          {notification.image && (
                            <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0">
                              <img src={notification.image} alt="Post" className="h-full w-full object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="comments" className="mt-0 max-h-[400px] overflow-y-auto">
                  <div className="py-2">
                    {displayNotifications.filter(n => n.type === "comment").map((notification) => (
                      <div key={notification.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-start gap-3 p-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="/avatars/user.png" alt="Avatar" />
                            <AvatarFallback>{notification.user.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="grid gap-1 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm">
                                <span className="font-medium">{notification.user}</span> {notification.content}
                              </p>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">{notification.time}</span>
                            </div>
                            {notification.comment && (
                              <p className="text-xs">
                                "{notification.comment}"
                              </p>
                            )}
                          </div>
                          {notification.image && (
                            <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0">
                              <img src={notification.image} alt="Post" className="h-full w-full object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="follows" className="mt-0 max-h-[400px] overflow-y-auto">
                  <div className="py-2">
                    {displayNotifications.filter(n => n.type === "follow").map((notification) => (
                      <div key={notification.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-start gap-3 p-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="/avatars/user.png" alt="Avatar" />
                            <AvatarFallback>{notification.user.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="grid gap-1 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm">
                                <span className="font-medium">{notification.user}</span> {notification.content}
                              </p>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">{notification.time}</span>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="h-8 flex-shrink-0">
                            Follow
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="p-2 bg-muted/20 rounded-b-lg">
                <Button 
                  variant="ghost" 
                  className="w-full text-primary text-sm"
                  onClick={() => navigate('/notifications')}
                >
                  View all notifications
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user?.avatar} alt={user?.firstName} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center">
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => logout()}
                className="flex items-center text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;