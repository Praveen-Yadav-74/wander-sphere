import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2, Globe, Check, X, Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import AuthLayout from '@/components/AuthLayout';

interface PasswordRequirement {
  regex: RegExp;
  label: string;
}

const passwordRequirements: PasswordRequirement[] = [
  { regex: /.{8,}/, label: 'At least 8 characters' },
  { regex: /[A-Z]/, label: 'At least one uppercase letter' },
  { regex: /[a-z]/, label: 'At least one lowercase letter' },
  { regex: /[0-9]/, label: 'At least one number' },
  { regex: /[^A-Za-z0-9]/, label: 'At least one special character' },
];

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({...prev, [name]: ''}));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordRequirements.every(req => req.regex.test(formData.password))) {
      newErrors.password = 'Password does not meet all requirements';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the Terms of Service';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({ 
        title: "Validation Error", 
        description: "Please fix the errors in the form.", 
        variant: "destructive" 
      });
      return;
    }

    setIsLoading(true);
    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        username: formData.username.trim() || undefined,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });
      
      // Wait a moment for auth state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if there's a redirect URL stored
      const redirectUrl = localStorage.getItem('redirectAfterAuth');
      if (redirectUrl) {
        localStorage.removeItem('redirectAfterAuth');
        navigate(redirectUrl, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Registration failed:', error);
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout type="register">
      <motion.div 
        className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl border border-gray-200 shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo and App Name */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex justify-center"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg relative">
              <Globe className="w-8 h-8 text-white z-10" />
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-400"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Join WanderSphere</h1>
            <p className="text-gray-600 mt-2">Start your travel adventure today</p>
          </motion.div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Label htmlFor="firstName" className="text-gray-700 text-sm font-medium">
                First Name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className={`h-12 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                disabled={isLoading}
              />
              {errors.firstName && (
                <p className="text-xs text-red-500">{errors.firstName}</p>
              )}
            </motion.div>
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Label htmlFor="lastName" className="text-gray-700 text-sm font-medium">
                Last Name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className={`h-12 ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                disabled={isLoading}
              />
              {errors.lastName && (
                <p className="text-xs text-red-500">{errors.lastName}</p>
              )}
            </motion.div>
          </div>

          {/* Email Field */}
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Label htmlFor="email" className="text-gray-700 text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={handleInputChange}
              required
              className={`h-12 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email}</p>
            )}
          </motion.div>

          {/* Username Field */}
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Label htmlFor="username" className="text-gray-700 text-sm font-medium">
              Username <span className="text-gray-400 text-xs">(Optional)</span>
            </Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="your_username"
              value={formData.username}
              onChange={handleInputChange}
              className="h-12 border-gray-300"
              disabled={isLoading}
            />
          </motion.div>

          {/* Password Field */}
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Label htmlFor="password" className="text-gray-700 text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleInputChange}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required
                className={`h-12 pr-10 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            
            {/* Password Requirements */}
            <AnimatePresence>
              {(passwordFocused || formData.password) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100"
                >
                  <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Password requirements:
                  </p>
                  <div className="space-y-1.5">
                    {passwordRequirements.map((req, index) => {
                      const isValid = req.regex.test(formData.password);
                      return (
                        <motion.div
                          key={index}
                          className="flex items-center space-x-2"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          {isValid ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-gray-400" />
                          )}
                          <span className={`text-xs transition-colors ${
                            isValid ? 'text-green-600 font-medium' : 'text-gray-500'
                          }`}>
                            {req.label}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password}</p>
            )}
          </motion.div>

          {/* Confirm Password Field */}
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Label htmlFor="confirmPassword" className="text-gray-700 text-sm font-medium">
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className={`h-12 pr-10 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <motion.p 
                className="text-xs text-red-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Passwords do not match
              </motion.p>
            )}
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">{errors.confirmPassword}</p>
            )}
          </motion.div>

          {/* Terms Agreement */}
          <motion.div 
            className="flex items-start space-x-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Checkbox
              id="agreeToTerms"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, agreeToTerms: checked as boolean }))
              }
              disabled={isLoading}
              className={`mt-1 ${errors.agreeToTerms ? 'border-red-500' : ''}`}
            />
            <Label htmlFor="agreeToTerms" className="text-sm font-normal leading-5 text-gray-700 cursor-pointer">
              I agree to the{' '}
              <Link to="/terms" className="text-blue-600 hover:text-blue-700 font-medium">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
                Privacy Policy
              </Link>
            </Label>
          </motion.div>
          {errors.agreeToTerms && (
            <p className="text-xs text-red-500">{errors.agreeToTerms}</p>
          )}

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium shadow-lg transition-all duration-200 relative overflow-hidden group"
              disabled={isLoading}
            >
              <span className="relative z-10 flex items-center justify-center">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500"
                initial={{ x: '-100%' }}
                animate={isLoading ? { x: '100%' } : {}}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </Button>
          </motion.div>
        </form>

        {/* Sign In Link */}
        <motion.div 
          className="text-center pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </AuthLayout>
  );
};

export default Register;
