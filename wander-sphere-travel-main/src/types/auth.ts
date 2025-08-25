export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  preferences: UserPreferences;
  stats: UserStats;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  language: string;
  currency: string;
  timezone: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  travelPreferences: TravelPreferences;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  tripUpdates: boolean;
  friendRequests: boolean;
  messages: boolean;
  promotions: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  allowFriendRequests: boolean;
  allowMessages: boolean;
}

export interface TravelPreferences {
  budgetRange: {
    min: number;
    max: number;
  };
  preferredDestinations: string[];
  travelStyle: 'budget' | 'mid-range' | 'luxury';
  accommodationType: string[];
  transportModes: string[];
  interests: string[];
}

export interface UserStats {
  tripsCompleted: number;
  countriesVisited: number;
  citiesVisited: number;
  totalDistance: number;
  totalSpent: number;
  friendsCount: number;
  followersCount: number;
  followingCount: number;
  reviewsCount: number;
  averageRating: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenRefreshRequest {
  refreshToken: string;
}

export interface TokenRefreshResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  location?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  avatar?: File;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

// Social authentication
export interface SocialAuthRequest {
  provider: 'google' | 'facebook' | 'apple';
  token: string;
  userData?: {
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

// Session management
export interface Session {
  id: string;
  userId: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    location?: string;
  };
  isActive: boolean;
  lastActivity: string;
  createdAt: string;
  expiresAt: string;
}

export interface ActiveSession {
  current: Session;
  others: Session[];
}

// Auth state
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth errors
export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Two-factor authentication
export interface TwoFactorSetupRequest {
  password: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerifyRequest {
  code: string;
  backupCode?: string;
}

export interface TwoFactorLoginRequest extends LoginRequest {
  twoFactorCode?: string;
  backupCode?: string;
}

// Account security
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  activeSessions: number;
  loginHistory: LoginAttempt[];
}

export interface LoginAttempt {
  id: string;
  success: boolean;
  ip: string;
  userAgent: string;
  location?: string;
  timestamp: string;
  failureReason?: string;
}