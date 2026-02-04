import { useState } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, Clock, ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

// Type definitions (extend as needed)
type NotificationType = 'booking' | 'payment' | 'trip' | 'system';

interface UtilityNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
  priority: 'low' | 'medium' | 'high';
}

const mockNotifications: UtilityNotification[] = [
  {
    id: '1',
    type: 'booking',
    title: 'Booking Confirmed',
    message: 'Your trip to Bali is confirmed! Check your email for details.',
    timestamp: new Date().toISOString(),
    read: false,
    link: '/booking',
    priority: 'high'
  },
  {
    id: '2',
    type: 'payment',
    title: 'Payment Successful',
    message: 'Successfully added $500 to your wallet.',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    read: false,
    link: '/wallet',
    priority: 'medium'
  },
  {
    id: '3',
    type: 'trip',
    title: 'Trip Reminder',
    message: 'Your "Alpine Adventure" starts in 3 days. Pack your bags!',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    read: true,
    link: '/trips/123',
    priority: 'high'
  },
  {
    id: '4',
    type: 'system',
    title: 'Welcome to WanderSphere',
    message: 'We\'ve updated our privacy policy. Please review.',
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
    read: true,
    link: '/settings',
    priority: 'low'
  }
];

const Notifications = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<UtilityNotification[]>(mockNotifications);
  
  const filteredNotifications = notifications.filter(n => activeFilter === 'all' || !n.read);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'booking': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'payment': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'trip': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'system': return <Info className="w-5 h-5 text-gray-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        <div className="flex items-center justify-between mb-8">
           <div>
             <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
             <p className="text-gray-500 mt-1">Updates about your trips and account.</p>
           </div>
           
           <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
              <button 
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeFilter === 'all' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                All
              </button>
              <button 
                onClick={() => setActiveFilter('unread')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeFilter === 'unread' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </button>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           <Card className="rounded-2xl border-none shadow-sm bg-blue-50/50 border-blue-100">
              <CardContent className="p-6">
                 <div className="flex justify-between items-start">
                    <div className="bg-blue-100 p-2 rounded-xl">
                       <Bell className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-4xl font-bold text-blue-900">{unreadCount}</span>
                 </div>
                 <p className="mt-4 text-sm font-medium text-blue-800">Unread Updates</p>
                 <p className="text-xs text-blue-600/80">Requires your attention</p>
              </CardContent>
           </Card>
           
           <Card className="rounded-2xl border-none shadow-sm bg-green-50/50 border-green-100">
              <CardContent className="p-6">
                 <div className="flex justify-between items-start">
                    <div className="bg-green-100 p-2 rounded-xl">
                       <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-4xl font-bold text-green-900">
                       {notifications.filter(n => n.type === 'booking').length}
                    </span>
                 </div>
                 <p className="mt-4 text-sm font-medium text-green-800">Active Bookings</p>
                 <p className="text-xs text-green-600/80">Confirmed trips</p>
              </CardContent>
           </Card>
           
            <Card className="rounded-2xl border-none shadow-sm bg-amber-50/50 border-amber-100">
              <CardContent className="p-6">
                 <div className="flex justify-between items-start">
                    <div className="bg-amber-100 p-2 rounded-xl">
                       <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-4xl font-bold text-amber-900">
                       {notifications.filter(n => n.priority === 'high').length}
                    </span>
                 </div>
                 <p className="mt-4 text-sm font-medium text-amber-800">Important</p>
                 <p className="text-xs text-amber-600/80">Priority alerts</p>
              </CardContent>
           </Card>
        </div>

        {/* Action Header */}
        <div className="flex justify-between items-center mb-4">
           <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
           {unreadCount > 0 && (
             <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-gray-500 hover:text-gray-900">
               Mark all as read
             </Button>
           )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
           {filteredNotifications.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
                 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-gray-300" />
                 </div>
                 <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
                 <p className="text-gray-500">You're all caught up!</p>
              </div>
           ) : (
             filteredNotifications.map((notification) => (
                <div 
                   key={notification.id} 
                   className={`bg-white rounded-2xl p-4 flex items-start gap-4 transition-all hover:shadow-md border ${notification.read ? 'border-gray-100' : 'border-blue-100 shadow-sm ring-1 ring-blue-50/50'}`}
                   onClick={() => markAsRead(notification.id)}
                >
                   <div className={`p-3 rounded-full flex-shrink-0 ${notification.read ? 'bg-gray-50' : 'bg-blue-50'}`}>
                      {getIcon(notification.type)}
                   </div>
                   
                   <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex justify-between items-start mb-1">
                         <h3 className={`text-base ${notification.read ? 'font-medium text-gray-900' : 'font-bold text-blue-900'}`}>
                            {notification.title}
                         </h3>
                         <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                            {new Date(notification.timestamp).toLocaleDateString()}
                         </span>
                      </div>
                      <p className={`text-sm leading-relaxed mb-3 ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                         {notification.message}
                      </p>
                      
                      {notification.link && (
                         <Link to={notification.link} className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                            View Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                         </Link>
                      )}
                   </div>
                   
                   {!notification.read && (
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-2"></div>
                   )}
                </div>
             ))
           )}
        </div>

        <div className="mt-8 text-center">
            <Link to="/notifications-social" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
               View Social Notifications <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
        </div>

      </div>
    </div>
  );
};

export default Notifications;
