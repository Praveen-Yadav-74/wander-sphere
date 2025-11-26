import supabase from '../config/supabase.js';
import jwt from 'jsonwebtoken';

class AuthService {
  // Test Supabase connection
  async testConnection() {
    try {
      // Test basic connection
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) {
        return { 
          success: false, 
          message: `Users table error: ${error.message}`,
          details: error
        };
      }
      
      return { 
        success: true, 
        message: 'Supabase connection and users table accessible',
        tableExists: true
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Supabase connection failed: ${error.message}`,
        tableExists: false
      };
    }
  }
  // Register a new user with Supabase Auth
  async register(userData) {
    const { firstName, lastName, username, email, password } = userData;
    
    try {
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            username: username
          }
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      // Manually confirm the user's email for testing purposes
      const { error: updateUserError } = await supabase.auth.admin.updateUserById(
        authData.user.id,
        { email_confirm: true }
      );

      if (updateUserError) {
        // If email confirmation fails, clean up the auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(updateUserError.message);
      }

      // Insert additional user data into our users table
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          username: username,
          email: email.toLowerCase(),
          role: 'user',
          is_verified: true
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

      const userData = await this.getUserById(data.user.id);

      if (!userData) {
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
        .maybeSingle();

      if (error) {
        console.error('Database error in getUserById:', error);
        throw new Error(error.message);
      }

      // If no user found, try to get from Supabase Auth and create in users table
      if (!data) {
        console.log(`User not found in users table, attempting to create: ${userId}`);
        
        try {
          // Get user from Supabase Auth
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
          
          if (authError || !authUser.user) {
            console.log(`User not found in Supabase Auth: ${userId}`);
            return null;
          }
          
          // Create user in users table
          const { data: newUserData, error: createError } = await supabase
            .from('users')
            .insert({
              id: userId,
              first_name: authUser.user.user_metadata?.first_name || '',
              last_name: authUser.user.user_metadata?.last_name || '',
              username: authUser.user.user_metadata?.username || authUser.user.email?.split('@')[0] || '',
              email: authUser.user.email?.toLowerCase() || '',
              role: 'user',
              is_verified: authUser.user.email_confirmed_at ? true : false,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (createError) {
            console.error('Failed to create user in users table:', createError);
            return null;
          }
          
          console.log('Successfully created user in users table:', userId);
          return newUserData;
        } catch (createUserError) {
          console.error('Error creating user:', createUserError);
          return null;
        }
      }

      return data;
    } catch (error) {
      console.error('Error in getUserById:', error);
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