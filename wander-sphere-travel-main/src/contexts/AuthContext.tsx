import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, User as AuthServiceUser } from '@/services/authService';
import { User } from '@/types/auth';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/config/supabase';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username?: string;
  confirmPassword: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Helper function to convert AuthService User to App User
  const convertAuthServiceUser = (authUser: AuthServiceUser): User => {
    const [firstName = '', lastName = ''] = authUser.name.split(' ');
    return {
      id: authUser.id,
      email: authUser.email,
      username: authUser.username,
      firstName,
      lastName,
      avatar: authUser.avatar,
      bio: authUser.bio,
      location: authUser.location,
      isVerified: authUser.verified,
      isOnline: true,
      lastSeen: new Date().toISOString(),
      createdAt: authUser.createdAt,
      updatedAt: authUser.updatedAt,
      preferences: {
        language: 'en',
        currency: 'USD',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          sms: false,
          tripUpdates: true,
          friendRequests: true,
          messages: true,
          promotions: false
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false,
          showLocation: true,
          allowFriendRequests: true,
          allowMessages: true
        },
        travelPreferences: {
          budgetRange: { min: 0, max: 5000 },
          preferredDestinations: [],
          travelStyle: 'mid-range',
          accommodationType: [],
          transportModes: [],
          interests: []
        }
      },
      stats: {
        tripsCompleted: 0,
        countriesVisited: 0,
        citiesVisited: 0,
        totalDistance: 0,
        totalSpent: 0,
        friendsCount: 0,
        followersCount: 0,
        followingCount: 0,
        reviewsCount: 0,
        averageRating: 0
      }
    };
  };

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔄 Starting auth initialization...');
      
      // Check for development bypass
      if (import.meta.env.DEV && localStorage.getItem('dev-bypass-auth') === 'true') {
        console.log('🚀 Development bypass detected');
        const devUser = localStorage.getItem('dev-user');
        if (devUser) {
          try {
            const parsedUser = JSON.parse(devUser);
            setUser(parsedUser);
            console.log('✅ Development user set successfully');
            setIsLoading(false);
            return;
          } catch (error) {
            console.error('❌ Failed to parse dev user:', error);
          }
        }
      }
      
      try {
        // Create a timeout promise (30 seconds for better reliability)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth initialization timeout')), 30000);
        });

        // Race between session retrieval and timeout
        const session = await Promise.race([
          authService.getSession(),
          timeoutPromise
        ]) as any;

        console.log('📋 Session retrieved:', session ? 'Found' : 'None');
        
        if (session?.user && session?.access_token) {
          console.log('👤 Session found, getting user profile...');
          try {
            // Get user profile with timeout protection
            const profilePromise = authService.getProfile();
            const profileTimeout = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Profile fetch timeout')), 25000);
            });
            
            const userProfile = await Promise.race([profilePromise, profileTimeout]) as any;
            const convertedUser = convertAuthServiceUser(userProfile);
            setUser(convertedUser);
            console.log('✅ User profile validated and set successfully');
          } catch (profileError) {
            console.error('❌ Profile fetch failed:', profileError);
            // For timeout errors, set a basic user from session data
            if (profileError.message.includes('timeout')) {
              console.log('⚡ Using fallback user data from session');
              const fallbackUser: User = {
                id: session.user.id,
                email: session.user.email || '',
                username: session.user.user_metadata?.username || '',
                firstName: session.user.user_metadata?.name?.split(' ')[0] || session.user.email?.split('@')[0] || '',
                lastName: session.user.user_metadata?.name?.split(' ')[1] || '',
                avatar: session.user.user_metadata?.avatar_url,
                bio: '',
                location: '',
                isVerified: session.user.email_confirmed_at !== null,
                isOnline: true,
                lastSeen: new Date().toISOString(),
                createdAt: session.user.created_at,
                updatedAt: session.user.updated_at || session.user.created_at,
                preferences: {
                  language: 'en',
                  currency: 'USD',
                  timezone: 'UTC',
                  notifications: {
                    email: true,
                    push: true,
                    sms: false,
                    tripUpdates: true,
                    friendRequests: true,
                    messages: true,
                    promotions: false
                  },
                  privacy: {
                    profileVisibility: 'public',
                    showEmail: false,
                    showPhone: false,
                    showLocation: true,
                    allowFriendRequests: true,
                    allowMessages: true
                  },
                  travelPreferences: {
                    budgetRange: { min: 0, max: 5000 },
                    preferredDestinations: [],
                    travelStyle: 'mid-range',
                    accommodationType: [],
                    transportModes: [],
                    interests: []
                  }
                },
                stats: {
                  tripsCompleted: 0,
                  countriesVisited: 0,
                  citiesVisited: 0,
                  totalDistance: 0,
                  totalSpent: 0,
                  friendsCount: 0,
                  followersCount: 0,
                  followingCount: 0,
                  reviewsCount: 0,
                  averageRating: 0
                }
              };
              setUser(fallbackUser);
            } else {
              // For other errors, clear invalid session
              await authService.logout();
              setUser(null);
            }
          }
        } else {
          console.log('❌ No valid session found');
          // Ensure any stale data is cleared
          authService.clearAuthData();
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        
        // If it's a timeout or connection error, allow app to continue without auth
        if (error.message.includes('timeout') || error.message.includes('network') || error.message.includes('fetch')) {
          console.log('🌐 Network/timeout error detected, continuing without authentication');
          console.log('💡 User can try logging in manually or use development bypass');
        } else {
          // For other errors, try to clean up
          try {
            await authService.logout();
          } catch (logoutError) {
            console.error('❌ Cleanup logout failed:', logoutError);
          }
        }
        
        authService.clearAuthData();
        setUser(null);
      } finally {
        console.log('🏁 Auth initialization complete, setting loading to false');
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen to auth state changes - PERSISTENT LISTENER
    // This ensures session persists across navigation
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session ? 'Session exists' : 'No session');
      
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          console.log('✅ User signed in, fetching profile...');
          setIsLoading(true);
          
          // Add timeout for profile fetch to prevent hanging
          const profilePromise = authService.getProfile();
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Profile fetch timeout')), 10000);
          });
          
          const userProfile = await Promise.race([profilePromise, timeoutPromise]) as any;
          setUser(convertAuthServiceUser(userProfile));
          setIsLoading(false);
          console.log('✅ User profile set successfully');
        } catch (error) {
          console.error('❌ Error getting user profile:', error);
          setIsLoading(false); // Ensure loading is false even on error
          
          // Use fallback user data from session
          if (session?.user) {
            const fallbackUser: User = {
              id: session.user.id,
              email: session.user.email || '',
              username: session.user.user_metadata?.username || '',
              firstName: session.user.user_metadata?.name?.split(' ')[0] || session.user.email?.split('@')[0] || '',
              lastName: session.user.user_metadata?.name?.split(' ')[1] || '',
              avatar: session.user.user_metadata?.avatar_url,
              bio: '',
              location: '',
              isVerified: session.user.email_confirmed_at !== null,
              isOnline: true,
              lastSeen: new Date().toISOString(),
              createdAt: session.user.created_at,
              updatedAt: session.user.updated_at || session.user.created_at,
              preferences: {
                language: 'en',
                currency: 'USD',
                timezone: 'UTC',
                notifications: {
                  email: true,
                  push: true,
                  sms: false,
                  tripUpdates: true,
                  friendRequests: true,
                  messages: true,
                  promotions: false
                },
                privacy: {
                  profileVisibility: 'public',
                  showEmail: false,
                  showPhone: false,
                  showLocation: true,
                  allowFriendRequests: true,
                  allowMessages: true
                },
                travelPreferences: {
                  budgetRange: { min: 0, max: 5000 },
                  preferredDestinations: [],
                  travelStyle: 'mid-range',
                  accommodationType: [],
                  transportModes: [],
                  interests: []
                }
              },
              stats: {
                tripsCompleted: 0,
                countriesVisited: 0,
                citiesVisited: 0,
                totalDistance: 0,
                totalSpent: 0,
                friendsCount: 0,
                followersCount: 0,
                followingCount: 0,
                reviewsCount: 0,
                averageRating: 0
              }
            };
            setUser(fallbackUser);
            setIsLoading(false); // Ensure loading is false when using fallback
          } else {
            setIsLoading(false); // Ensure loading is false even if no fallback
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setUser(null);
        authService.clearAuthData();
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('🔄 Token refreshed, updating user state');
        try {
          const userProfile = await authService.getProfile();
          setUser(convertAuthServiceUser(userProfile));
        } catch (error) {
          console.error('Error updating user after token refresh:', error);
        }
      } else if (event === 'USER_UPDATED' && session?.user) {
        console.log('👤 User updated, refreshing profile');
        try {
          const userProfile = await authService.getProfile();
          setUser(convertAuthServiceUser(userProfile));
        } catch (error) {
          console.error('Error updating user:', error);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Automatic token refresh mechanism to keep users logged in
  useEffect(() => {
    if (!user) return;

    // Check and refresh token every 5 minutes
    const refreshInterval = setInterval(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          return;
        }
        
        if (session) {
          // Check if token expires in less than 10 minutes
          const expiresAt = session.expires_at ? session.expires_at * 1000 : Date.now() + 3600000;
          const timeUntilExpiry = expiresAt - Date.now();
          const tenMinutes = 10 * 60 * 1000;

          if (timeUntilExpiry < tenMinutes) {
            console.log('🔄 Token expiring soon, refreshing...');
            try {
              await authService.refreshToken();
              console.log('✅ Token refreshed successfully');
            } catch (refreshError) {
              console.error('❌ Token refresh failed:', refreshError);
              // If refresh fails, try to get new session
              const { data: { session: newSession } } = await supabase.auth.getSession();
              if (!newSession) {
                console.log('⚠️ No valid session, user may need to re-login');
              }
            }
          }
        } else {
          console.log('⚠️ No active session found');
        }
      } catch (error) {
        console.error('❌ Error checking session:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Also set up a listener for token refresh events
    const { data: { subscription: refreshSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('✅ Token automatically refreshed by Supabase');
          try {
            const userProfile = await authService.getProfile();
            setUser(convertAuthServiceUser(userProfile));
          } catch (error) {
            console.error('Error updating user after token refresh:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
        }
      }
    );

    return () => {
      clearInterval(refreshInterval);
      refreshSubscription.unsubscribe();
    };
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('🔐 Starting login process...');
      
      const response = await authService.login({ email, password });
      console.log('✅ Login successful, converting user...');
      
      const convertedUser = convertAuthServiceUser(response.user);
      
      // Set user first
      setUser(convertedUser);
      
      // Force a small delay to ensure state updates propagate
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Ensure loading is set to false immediately after setting user
      setIsLoading(false);
      console.log('✅ User set, loading complete, isAuthenticated should be true');
      
      toast({
        title: "Welcome back!",
        description: `Hello ${response.user.name || email}, you're successfully logged in.`,
      });
      
      // Return success to allow navigation
      return convertedUser;
    } catch (error) {
      console.error('❌ Login failed:', error);
      setIsLoading(false); // Ensure loading is false on error
      
      const message = error instanceof Error ? error.message : 'Login failed';
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      // Transform the data to match authService expectations
      const registerData = {
        email: userData.email,
        password: userData.password,
        name: `${userData.firstName} ${userData.lastName}`.trim(),
        username: userData.username || '',
        confirmPassword: userData.password
      };
      const response = await authService.register(registerData);
      setUser(convertAuthServiceUser(response.user));
      
      toast({
        title: "Account Created!",
        description: `Welcome to WanderSphere, ${response.user.name}!`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      toast({
        title: "Registration Failed",
        description: message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Starting logout process...');
      setIsLoading(true);
      
      // Clear user state immediately
      setUser(null);
      
      // Clear development bypass if active
      if (import.meta.env.DEV) {
        localStorage.removeItem('dev-bypass-auth');
        localStorage.removeItem('dev-user');
      }
      
      // Logout from Supabase
      await authService.logout();
      
      console.log('✅ Logout completed successfully');
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      
      // Navigate to login - use window.location only for logout to ensure clean state
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force logout even if API call fails
      authService.clearAuthData();
      setUser(null);
      
      // Clear development data
      if (import.meta.env.DEV) {
        localStorage.removeItem('dev-bypass-auth');
        localStorage.removeItem('dev-user');
      }
      
      // Still redirect to login on error
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      await authService.refreshToken();
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
      throw error;
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    // Convert User data to AuthService format
    const authServiceData: Partial<AuthServiceUser> = {
      name: data.firstName && data.lastName ? `${data.firstName} ${data.lastName}`.trim() : undefined,
      email: data.email,
      username: data.username,
      avatar: data.avatar,
      bio: data.bio,
      location: data.location
    };
    // Remove undefined values
    Object.keys(authServiceData).forEach(key => 
      authServiceData[key as keyof AuthServiceUser] === undefined && delete authServiceData[key as keyof AuthServiceUser]
    );
    try {
      const updatedUser = await authService.updateProfile(authServiceData);
      setUser(convertAuthServiceUser(updatedUser));
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profile update failed';
      toast({
        title: "Update Failed",
        description: message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Higher-order component for protected routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // Redirect to login page
      window.location.href = '/login';
      return null;
    }

    return <Component {...props} />;
  };
}