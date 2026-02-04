import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2, Globe, Phone, Mail } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import AuthLayout from '@/components/AuthLayout';

type LoginMode = 'phone' | 'email';
type PhoneStep = 'PHONE' | 'OTP';

const Login = () => {
  // Mode toggle
  const [loginMode, setLoginMode] = useState<LoginMode>('phone');
  
  // Email login state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  // Phone login state
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [otp, setOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('PHONE');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Email login handler
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(formData.email, formData.password);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const redirectUrl = localStorage.getItem('redirectAfterAuth');
      if (redirectUrl) {
        localStorage.removeItem('redirectAfterAuth');
        navigate(redirectUrl, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
    }
  };

  // Phone OTP handlers
  const handleGetOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number with country code.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await authService.signInWithPhone(phoneNumber);
      
      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "OTP Sent",
        description: `Verification code sent to ${phoneNumber}`,
      });
      
      setPhoneStep('OTP');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await authService.verifyPhoneOtp(phoneNumber, otp);
      
      toast({
        title: "Success",
        description: "Login successful!",
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const redirectUrl = localStorage.getItem('redirectAfterAuth');
      if (redirectUrl) {
        localStorage.removeItem('redirectAfterAuth');
        navigate(redirectUrl, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneStep === 'PHONE') {
      handleGetOTP();
    } else {
      handleVerifyOTP();
    }
  };

  return (
    <AuthLayout type="login">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl border border-gray-200 shadow-2xl">
        {/* Logo and App Name */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex justify-center"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Globe className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">WanderSphere</h1>
            <p className="text-gray-600 mt-2">Welcome Back</p>
          </motion.div>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setLoginMode('phone');
              setPhoneStep('PHONE');
              setOtp('');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium transition-all ${
              loginMode === 'phone'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Phone className="w-4 h-4" />
            Phone
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('email')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium transition-all ${
              loginMode === 'email'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
        </div>

        {/* Phone Login Form */}
        {loginMode === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-6">
            {phoneStep === 'PHONE' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 text-sm font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 1234567890"
                    required
                    className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">Enter with country code (e.g., +91)</p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium shadow-lg transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    'Get OTP'
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-gray-700 text-sm font-medium">
                    Enter OTP
                  </Label>
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    required
                    className="h-12 bg-white border-gray-300 text-gray-900 text-center text-2xl tracking-widest placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">
                    OTP sent to {phoneNumber}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneStep('PHONE');
                        setOtp('');
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      Change
                    </button>
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium shadow-lg transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Login'
                  )}
                </Button>

                <button
                  type="button"
                  onClick={handleGetOTP}
                  disabled={isLoading}
                  className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </>
            )}
          </form>
        )}

        {/* Email Login Form */}
        {loginMode === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                  className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, rememberMe: checked === true }))
                  }
                  className="border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                >
                  Remember me
                </Label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium shadow-lg transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        )}

        {/* Sign Up Link */}
        <div className="text-center pt-4">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;