import React, { useState } from "react";
import { 
  Bell, 
  Lock, 
  LogOut, 
  Globe, 
  CreditCard, 
  MapPin, 
  Trash2, 
  ChevronRight,
  Shield,
  Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currency, setCurrency] = useState("USD");
  const [distanceUnit, setDistanceUnit] = useState("km");
  const [language, setLanguage] = useState("en");
  
  const [notifications, setNotifications] = useState({
    tripAlerts: true,
    priceDrops: false,
    marketing: false
  });

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
      toast({
        title: "Logged out",
        description: "See you on your next adventure!",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">{title}</h3>
  );

  const SettingRow = ({ icon: Icon, title, description, action }: any) => (
    <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 mb-3 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-medium text-gray-900">{title}</h4>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      </div>
      <div>{action}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-20 px-4">
       <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your travel preferences</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* App Preferences */}
        <section>
          <SectionHeader title="App Preferences" />
          
          <SettingRow 
            icon={CreditCard} 
            title="Currency" 
            description="Preferred currency for pricing"
            action={
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            } 
          />
          
          <SettingRow 
            icon={MapPin} 
            title="Distance Units" 
            description="Kilometers or Miles"
            action={
               <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setDistanceUnit('km')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${distanceUnit === 'km' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
                  >
                    KM
                  </button>
                  <button 
                    onClick={() => setDistanceUnit('mi')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${distanceUnit === 'mi' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}
                  >
                    Miles
                  </button>
               </div>
            } 
          />

          <SettingRow 
             icon={Globe} 
             title="Language" 
             description="App language"
             action={
               <Select value={language} onValueChange={setLanguage}>
                 <SelectTrigger className="w-[110px]">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="en">English</SelectItem>
                   <SelectItem value="es">Español</SelectItem>
                   <SelectItem value="hi">Hindi</SelectItem>
                   <SelectItem value="fr">Français</SelectItem>
                 </SelectContent>
               </Select>
             } 
           />
        </section>

        {/* Notifications */}
        <section>
          <SectionHeader title="Notifications" />
          
          <SettingRow 
            icon={Bell} 
            title="Trip Alerts" 
            description="Gate changes, delays, reminders"
            action={
              <Switch 
                checked={notifications.tripAlerts} 
                onCheckedChange={(c) => setNotifications(prev => ({ ...prev, tripAlerts: c }))} 
              />
            } 
          />
          
          <SettingRow 
            icon={CreditCard} 
            title="Price Drops" 
            description="Alerts for saved trip discounts"
            action={
              <Switch 
                checked={notifications.priceDrops} 
                onCheckedChange={(c) => setNotifications(prev => ({ ...prev, priceDrops: c }))} 
              />
            } 
          />
        </section>

        {/* Account */}
        <section>
          <SectionHeader title="Account" />

          <div
            onClick={() => navigate('/settings/change-password')}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 mb-3 shadow-sm cursor-pointer hover:bg-gray-50"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-medium text-gray-900">Change Password</h4>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>
          
          <div
            onClick={() => navigate('/privacy')}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 mb-3 shadow-sm cursor-pointer hover:bg-gray-50"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="font-medium text-gray-900">Privacy Policy</h4>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>

          <div
            onClick={() => navigate('/data-policy')}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 mb-3 shadow-sm cursor-pointer hover:bg-gray-50"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="font-medium text-gray-900">Data Policy</h4>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>

          <div
            onClick={() => navigate('/account-deletion')}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 mb-3 shadow-sm cursor-pointer hover:bg-gray-50"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <h4 className="font-medium text-gray-900">Account Deletion Policy</h4>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </div>
          
          <div 
            onClick={handleLogout}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 mb-3 shadow-sm cursor-pointer hover:bg-gray-50"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                <LogOut className="w-5 h-5" />
              </div>
              <h4 className="font-medium text-red-600">Log Out</h4>
            </div>
          </div>
        </section>

        <div className="text-center text-gray-400 text-sm pb-8">
          WanderSphere v2.0.0 (Travel Core)
        </div>
      </div>
    </div>
  );
};

export default Settings;