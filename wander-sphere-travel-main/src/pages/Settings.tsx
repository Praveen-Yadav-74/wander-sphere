import { useState } from "react";
import { User, Lock, Shield, Bell, LogOut, Camera, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    name: "Alex Wanderer",
    username: "alex_wanderers",
    email: "alex@example.com",
    bio: "Chasing sunsets and street food around the globe. ✈️🍜 Currently exploring: Bali, Indonesia 🌴",
    location: "San Francisco, CA",
    avatar: "",
  });

  const [notifications, setNotifications] = useState({
    likes: true,
    comments: true,
    follows: true,
    trips: true,
    clubs: false,
    email: true,
    push: true,
  });

  const [privacy, setPrivacy] = useState({
    privateAccount: false,
    showLocation: true,
    showTravelStats: true,
    allowTagging: true,
  });

  const handleSaveProfile = () => {
    console.log("Saving profile:", profile);
    toast({
      title: "Profile updated",
      description: "Your profile has been successfully updated.",
    });
  };

  const handleSaveNotifications = () => {
    console.log("Saving notifications:", notifications);
    toast({
      title: "Notifications updated",
      description: "Your notification preferences have been saved.",
    });
  };

  const handleSavePrivacy = () => {
    console.log("Saving privacy:", privacy);
    toast({
      title: "Privacy settings updated",
      description: "Your privacy preferences have been saved.",
    });
  };

  const handleLogout = () => {
    console.log("Logging out...");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {profile.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Change Photo
                </Button>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profile.username}
                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="min-h-24"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleSaveProfile} className="bg-gradient-primary text-white">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </div>
              <Button className="bg-gradient-primary text-white">
                Update Password
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Private Account</Label>
                    <p className="text-sm text-muted-foreground">
                      Only approved followers can see your posts
                    </p>
                  </div>
                  <Switch
                    checked={privacy.privateAccount}
                    onCheckedChange={(checked) => 
                      setPrivacy({ ...privacy, privateAccount: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Location</Label>
                    <p className="text-sm text-muted-foreground">
                      Display your location on your profile
                    </p>
                  </div>
                  <Switch
                    checked={privacy.showLocation}
                    onCheckedChange={(checked) => 
                      setPrivacy({ ...privacy, showLocation: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Travel Stats</Label>
                    <p className="text-sm text-muted-foreground">
                      Display your travel achievements publicly
                    </p>
                  </div>
                  <Switch
                    checked={privacy.showTravelStats}
                    onCheckedChange={(checked) => 
                      setPrivacy({ ...privacy, showTravelStats: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Tagging</Label>
                    <p className="text-sm text-muted-foreground">
                      Let others tag you in their posts
                    </p>
                  </div>
                  <Switch
                    checked={privacy.allowTagging}
                    onCheckedChange={(checked) => 
                      setPrivacy({ ...privacy, allowTagging: checked })
                    }
                  />
                </div>
              </div>
              <Button onClick={handleSavePrivacy} className="bg-gradient-primary text-white">
                <Save className="w-4 h-4 mr-2" />
                Save Privacy Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Likes</Label>
                    <p className="text-sm text-muted-foreground">
                      When someone likes your posts
                    </p>
                  </div>
                  <Switch
                    checked={notifications.likes}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, likes: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Comments</Label>
                    <p className="text-sm text-muted-foreground">
                      When someone comments on your posts
                    </p>
                  </div>
                  <Switch
                    checked={notifications.comments}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, comments: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Followers</Label>
                    <p className="text-sm text-muted-foreground">
                      When someone starts following you
                    </p>
                  </div>
                  <Switch
                    checked={notifications.follows}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, follows: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Trip Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Updates about trips you're interested in
                    </p>
                  </div>
                  <Switch
                    checked={notifications.trips}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, trips: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Club Activity</Label>
                    <p className="text-sm text-muted-foreground">
                      Activity in travel clubs you've joined
                    </p>
                  </div>
                  <Switch
                    checked={notifications.clubs}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, clubs: checked })
                    }
                  />
                </div>
              </div>
              <Button onClick={handleSaveNotifications} className="bg-gradient-primary text-white">
                <Save className="w-4 h-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;