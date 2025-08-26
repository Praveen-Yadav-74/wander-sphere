import supabase from '../config/supabase.js';
import jwt from 'jsonwebtoken';

class AuthService {
  // Register a new user with Supabase Auth
  async register(userData) {
    const { firstName, lastName, email, password } = userData;
    
    try {
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      // Insert additional user data into our users table
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          email: email.toLowerCase(),
          is_email_verified: false
        })
        .select()
        .single();

      if (dbError) {
        // If user creation in our table fails, we should clean up the auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(dbError.message);
      }

      return {
        user: userData,
        session: authData.session
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  // Login user with Supabase Auth
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new Error(error.message);
      }

      // Get user data from our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        throw new Error('User data not found');
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id);

      return {
        user: userData,
        session: data.session
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  // Refresh session
  async refreshSession(refreshToken) {
    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      throw new Error(`Session refresh failed: ${error.message}`);
    }
  }

  // Logout user
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(error.message);
      }

      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  // Update user profile
  async updateProfile(userId, updateData) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      throw new Error(`Profile update failed: ${error.message}`);
    }
  }

  // Verify JWT token and get user
  async verifyToken(token) {
    try {
      // Verify the token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        throw new Error('Invalid token');
      }

      // Get full user data from our users table
      const userData = await this.getUserById(user.id);
      
      return userData;
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  // Send password reset email
  async sendPasswordReset(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`
      });

      if (error) {
        throw new Error(error.message);
      }

      return { message: 'Password reset email sent' };
    } catch (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  // Update password
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw new Error(error.message);
      }

      return { message: 'Password updated successfully' };
    } catch (error) {
      throw new Error(`Password update failed: ${error.message}`);
    }
  }
}

export default new AuthService();