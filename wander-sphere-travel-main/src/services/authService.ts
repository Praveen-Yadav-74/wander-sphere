/**
 * Authentication Service
 * Handles user authentication, registration, and session management using Supabase
 */

import { supabase } from '@/config/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
  location?: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  name: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

class AuthService {
  private userKey = 'user';

  /**
   * Convert Supabase user to our User interface
   */
  private async convertSupabaseUser(supabaseUser: SupabaseUser): Promise<User> {
    // Get additional user data from our users table
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      // Only log non-PGRST116 errors (PGRST116 means no rows found, which is expected for new users)
      if (error.code !== 'PGRST116') {
        console.error('Error fetching user data:', error);
      }
      // Fallback to basic user data from Supabase auth
      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        username: supabaseUser.user_metadata?.username || '',
        name: supabaseUser.user_metadata?.name || '',
        avatar: supabaseUser.user_metadata?.avatar_url,
        bio: '',
        location: '',
        verified: supabaseUser.email_confirmed_at !== null,
        createdAt: supabaseUser.created_at,
        updatedAt: supabaseUser.updated_at || supabaseUser.created_at
      };
    }

    return {
      id: userData.id,
      email: userData.email,
      username: userData.username || '',
      name: `${userData.first_name} ${userData.last_name}`.trim(),
      avatar: userData.avatar_url,
      bio: userData.bio || '',
      location: userData.location || '',
      verified: userData.email_verified || false,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at
    };
  }

  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error('Login failed - no user or session returned');
    }

    const user = await this.convertSupabaseUser(data.user);
    this.setUser(user);

    return {
      user,
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in || 3600
    };
  }

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    if (userData.password !== userData.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const [firstName, ...lastNameParts] = userData.name.split(' ');
    const lastName = lastNameParts.join(' ');

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          username: userData.username,
          name: userData.name,
          first_name: firstName,
          last_name: lastName
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Registration failed - no user returned');
    }

    // Insert additional user data into our users table
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: userData.email,
        username: userData.username,
        first_name: firstName,
        last_name: lastName,
        email_verified: false,
        is_active: true
      });

    if (insertError) {
      console.error('Error inserting user data:', insertError);
      // Don't throw here as the auth user was created successfully
    }

    const user = await this.convertSupabaseUser(data.user);
    
    if (data.session) {
      this.setUser(user);
      return {
        user,
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in || 3600
      };
    }

    // If no session (email confirmation required), still return user data
    return {
      user,
      token: '',
      refreshToken: '',
      expiresIn: 0
    };
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      console.log('🔄 Signing out from Supabase...');
      // Use signOut with scope 'global' to clear all sessions
      await supabase.auth.signOut({ scope: 'global' });
      console.log('✅ Supabase signout completed');
    } catch (error) {
      console.error('❌ Supabase logout error:', error);
      // Continue with cleanup even if signOut fails
    } finally {
      console.log('🧹 Clearing local auth data...');
      this.clearAuthData();
      console.log('✅ Local auth data cleared');
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.refreshSession();

    if (error || !data.session || !data.user) {
      throw new Error(error?.message || 'Token refresh failed');
    }

    const user = await this.convertSupabaseUser(data.user);
    this.setUser(user);

    return {
      user,
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in || 3600
    };
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error(error?.message || 'Failed to get user profile');
    }

    const userProfile = await this.convertSupabaseUser(user);
    this.setUser(userProfile);
    return userProfile;
  }

  /**
   * Request password reset
   */
  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordData): Promise<void> {
    if (data.password !== data.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    const { error } = await supabase.auth.updateUser({
      password: data.password
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const user = this.getUser();
    return !!user;
  }

  /**
   * Get stored authentication token
   */
  getToken(): string | null {
    // With Supabase, we get the token from the session
    return supabase.auth.getSession().then(({ data }) => 
      data.session?.access_token || null
    ) as any; // This is a temporary workaround for the async nature
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    // With Supabase, we get the refresh token from the session
    return supabase.auth.getSession().then(({ data }) => 
      data.session?.refresh_token || null
    ) as any; // This is a temporary workaround for the async nature
  }

  /**
   * Get stored user data
   */
  getUser(): User | null {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Store user data
   */
  private setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    // Update auth metadata if needed
    const authUpdates: any = {};
    if (data.name) {
      const [firstName, ...lastNameParts] = data.name.split(' ');
      authUpdates.data = {
        ...user.user_metadata,
        name: data.name,
        first_name: firstName,
        last_name: lastNameParts.join(' ')
      };
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: updateError } = await supabase.auth.updateUser(authUpdates);
      if (updateError) {
        throw new Error(updateError.message);
      }
    }

    // Update user data in our users table
    const updateData: any = {};
    if (data.username) updateData.username = data.username;
    if (data.bio) updateData.bio = data.bio;
    if (data.location) updateData.location = data.location;
    if (data.avatar) updateData.avatar_url = data.avatar;
    if (data.name) {
      const [firstName, ...lastNameParts] = data.name.split(' ');
      updateData.first_name = firstName;
      updateData.last_name = lastNameParts.join(' ');
    }

    if (Object.keys(updateData).length > 0) {
      const { error: dbError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (dbError) {
        throw new Error(dbError.message);
      }
    }

    // Get updated user profile
    const updatedUser = await this.convertSupabaseUser(user);
    this.setUser(updatedUser);
    return updatedUser;
  }

  /**
   * Clear all authentication data
   */
  clearAuthData(): void {
    console.log('🧹 Clearing all authentication data...');
    localStorage.removeItem(this.userKey);
    
    // Clear any other auth-related localStorage items
    const authKeys = ['supabase.auth.token', 'sb-auth-token', 'sb-refresh-token'];
    authKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Clear any Supabase session storage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });
    
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('✅ All authentication data cleared');
  }

  /**
   * Get current session
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Error getting session:', error);
        return null;
      }
      
      const session = data.session;
      
      // Validate session if it exists
      if (session) {
        const isValid = await this.validateSession(session);
        if (!isValid) {
          console.warn('⚠️ Invalid session detected, clearing...');
          await this.logout();
          return null;
        }
      }
      
      return session;
    } catch (error) {
      console.error('❌ Failed to get session:', error);
      return null;
    }
  }
  
  /**
   * Validate if the current session is still valid
   */
  private async validateSession(session: Session): Promise<boolean> {
    try {
      // Check if session is expired
      if (session.expires_at && session.expires_at * 1000 < Date.now()) {
        console.log('⏰ Session expired');
        return false;
      }
      
      // Try to get user info to validate session
      const { data: user, error } = await supabase.auth.getUser();
      
      if (error || !user.user) {
        console.log('❌ Session validation failed:', error?.message || 'No user');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Session validation error:', error);
      return false;
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;