import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, User as AuthServiceUser } from '@/services/authService';
import { User } from '@/types/auth';
import { toast } from '@/components/ui/use-toast';

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
        // Create a timeout promise (increased to 8 seconds for slower connections)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth initialization timeout')), 8000);
        });

        // Race between session retrieval and timeout
        const session = await Promise.race([
          authService.getSession(),
          timeoutPromise
        ]) as any;

        console.log('📋 Session retrieved:', session ? 'Found' : 'None');
        
        if (session?.user && session?.access_token) {
          console.log('👤 Validating session and getting user profile...');
          try {
            // Validate session by trying to get user profile
            const userProfile = await authService.getProfile();
            const convertedUser = convertAuthServiceUser(userProfile);
            setUser(convertedUser);
            console.log('✅ User profile validated and set successfully');
          } catch (profileError) {
            console.error('❌ Session validation failed, clearing invalid session:', profileError);
            // Clear invalid session
            await authService.logout();
            setUser(null);
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

    // Listen to auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const userProfile = await authService.getProfile();
          setUser(convertAuthServiceUser(userProfile));
        } catch (error) {
          console.error('Error getting user profile:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        authService.clearAuthData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Supabase handles token refresh automatically, so we don't need a manual refresh interval

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authService.login({ email, password });
      setUser(convertAuthServiceUser(response.user));
      
      toast({
        title: "Welcome back!",
        description: `Hello ${response.user.name}, you're successfully logged in.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
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
      
      // Force a page reload to clear any cached state
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
      
      // Still redirect to login
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