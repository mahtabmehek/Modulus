'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CognitoAuth() {
  const { signIn, signUp, confirmSignUp, resendConfirmationCode, forgotPassword, forgotPasswordSubmit } = useAuth();
  
  // Form states
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentFlow, setCurrentFlow] = useState<'signin' | 'signup' | 'confirm' | 'forgot' | 'reset'>('signin');
  const [resetAttempts, setResetAttempts] = useState(0);
  const [lastResetAttempt, setLastResetAttempt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [devMode, setDevMode] = useState(false); // Development mode toggle

  // Reset attempts after 30 minutes
  useEffect(() => {
    if (lastResetAttempt) {
      const resetTimer = setTimeout(() => {
        const now = new Date();
        if (now.getTime() - lastResetAttempt.getTime() > 30 * 60 * 1000) { // 30 minutes
          setResetAttempts(0);
          setLastResetAttempt(null);
        }
      }, 30 * 60 * 1000); // Check after 30 minutes

      return () => clearTimeout(resetTimer);
    }
  }, [lastResetAttempt]);

  // Countdown timer for rate limiting
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  // Form data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    confirmationCode: '',
    newPassword: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signIn(formData.username, formData.password);
      toast.success('Welcome back!');
    } catch (error: any) {
      console.error('Sign in error:', error);
      if (error.code === 'UserNotConfirmedException') {
        setError('Please check your email and confirm your account first.');
        setCurrentFlow('confirm');
      } else if (error.code === 'NotAuthorizedException') {
        setError('Invalid username or password.');
      } else if (error.code === 'UserNotFoundException') {
        setError('User not found. Please check your username or sign up.');
      } else {
        setError(error.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }

    try {
      await signUp(
        formData.username,
        formData.password,
        formData.email,
        formData.firstName,
        formData.lastName
      );
      
      setSuccess('Account created! Please check your email for a confirmation code.');
      setCurrentFlow('confirm');
      toast.success('Please check your email for confirmation code');
    } catch (error: any) {
      console.error('Sign up error:', error);
      if (error.code === 'UsernameExistsException') {
        setError('An account with this username already exists.');
      } else if (error.code === 'InvalidPasswordException') {
        setError('Password must contain uppercase, lowercase, numbers and be at least 8 characters.');
      } else {
        setError(error.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await confirmSignUp(formData.username, formData.confirmationCode);
      setSuccess('Account confirmed! You can now sign in.');
      setCurrentFlow('signin');
      toast.success('Account confirmed successfully!');
    } catch (error: any) {
      console.error('Confirmation error:', error);
      if (error.code === 'CodeMismatchException') {
        setError('Invalid confirmation code. Please try again.');
      } else if (error.code === 'ExpiredCodeException') {
        setError('Confirmation code has expired. Please request a new one.');
      } else {
        setError(error.message || 'Failed to confirm account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      await resendConfirmationCode(formData.username);
      setSuccess('Confirmation code sent! Please check your email.');
      toast.success('New confirmation code sent');
    } catch (error: any) {
      setError(error.message || 'Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Development mode - shorter countdown
    if (countdown > 0 && !devMode) {
      setError(`Please wait ${countdown} more seconds before trying again.`);
      setIsLoading(false);
      return;
    }

    try {
      await forgotPassword(formData.username);
      setResetAttempts(prev => prev + 1);
      setLastResetAttempt(new Date());
      setSuccess(`Password reset code sent to your email. (Attempt ${resetAttempts + 1})`);
      setCurrentFlow('reset');
      toast.success('Reset code sent! Check your email (including spam folder)');
    } catch (error: any) {
      console.error('Forgot password error:', error);
      setResetAttempts(prev => prev + 1);
      setLastResetAttempt(new Date());
      
      if (error.name === 'LimitExceededException' || error.message?.includes('limit exceeded')) {
        // In dev mode, use shorter timeout
        const timeout = devMode ? 30 : 300; // 30 seconds in dev mode, 5 minutes in production
        setCountdown(timeout);
        setError(`AWS rate limit exceeded. Please wait ${devMode ? '30 seconds' : '5 minutes'} before trying again. (Attempt ${resetAttempts + 1})`);
      } else {
        setError(error.message || `Failed to send reset code. (Attempt ${resetAttempts + 1})`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await forgotPasswordSubmit(formData.username, formData.confirmationCode, formData.newPassword);
      setSuccess('Password reset successfully! You can now sign in.');
      setCurrentFlow('signin');
      toast.success('Password reset successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSignInForm = () => (
    <form onSubmit={handleSignIn} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username or Email</Label>
        <Input
          id="username"
          type="text"
          value={formData.username}
          onChange={(e) => handleInputChange('username', e.target.value)}
          required
          placeholder="Enter your username or email"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            required
            placeholder="Enter your password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
        Sign In
      </Button>

      <div className="text-center">
        <Button
          type="button"
          variant="link"
          onClick={() => setCurrentFlow('forgot')}
          className="text-sm"
        >
          Forgot your password?
        </Button>
      </div>
    </form>
  );

  const renderSignUpForm = () => (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            required
            placeholder="John"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            required
            placeholder="Doe"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          required
          placeholder="john.doe@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signupUsername">Username</Label>
        <Input
          id="signupUsername"
          value={formData.username}
          onChange={(e) => handleInputChange('username', e.target.value)}
          required
          placeholder="Choose a username"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signupPassword">Password</Label>
        <div className="relative">
          <Input
            id="signupPassword"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            required
            placeholder="Min 8 chars, uppercase, lowercase, number"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          required
          placeholder="Confirm your password"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Create Account
      </Button>
    </form>
  );

  const renderConfirmForm = () => (
    <form onSubmit={handleConfirmSignUp} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="confirmationCode">Confirmation Code</Label>
        <Input
          id="confirmationCode"
          value={formData.confirmationCode}
          onChange={(e) => handleInputChange('confirmationCode', e.target.value)}
          required
          placeholder="Enter the code from your email"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Confirm Account
      </Button>

      <div className="text-center">
        <Button
          type="button"
          variant="link"
          onClick={handleResendCode}
          className="text-sm"
        >
          Resend Code
        </Button>
      </div>
    </form>
  );

  if (currentFlow === 'confirm') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Confirm Your Account</CardTitle>
            <CardDescription>
              Please enter the confirmation code sent to your email
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mb-4">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            {renderConfirmForm()}
            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => setCurrentFlow('signin')}
                className="text-sm"
              >
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render forgot password form
  const renderForgotPasswordForm = () => (
    <form onSubmit={handleForgotPassword} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username or Email</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => handleInputChange('username', e.target.value)}
          placeholder="Enter your username or email"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || countdown > 0}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending Reset Code...
          </>
        ) : countdown > 0 ? (
          countdown > 60 ? `Wait ${Math.ceil(countdown / 60)}m ${countdown % 60}s` : `Wait ${countdown}s before retry`
        ) : (
          'Send Reset Code'
        )}
      </Button>

      <div className="text-center">
        <Button
          type="button"
          variant="link"
          onClick={() => setCurrentFlow('signin')}
          className="text-sm"
        >
          Back to Sign In
        </Button>
        {resetAttempts > 0 && (
          <div className="mt-2 space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setResetAttempts(0);
                setLastResetAttempt(null);
                setCountdown(0);
                setError('');
                setSuccess('');
              }}
              className="text-xs"
            >
              Clear Attempts ({resetAttempts})
            </Button>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="devMode"
                checked={devMode}
                onChange={(e) => setDevMode(e.target.checked)}
                className="w-3 h-3"
              />
              <label htmlFor="devMode" className="text-xs text-gray-600 dark:text-gray-400">
                Dev Mode (30s timeout)
              </label>
            </div>
          </div>
        )}
      </div>
    </form>
  );

  // Render reset password form
  const renderResetPasswordForm = () => (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="confirmationCode">Reset Code</Label>
        <Input
          id="confirmationCode"
          value={formData.confirmationCode}
          onChange={(e) => handleInputChange('confirmationCode', e.target.value)}
          placeholder="Enter the code from your email"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showPassword ? 'text' : 'password'}
            value={formData.newPassword}
            onChange={(e) => handleInputChange('newPassword', e.target.value)}
            placeholder="Enter your new password"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Resetting Password...
          </>
        ) : (
          'Reset Password'
        )}
      </Button>

      <div className="text-center">
        <Button
          type="button"
          variant="link"
          onClick={() => setCurrentFlow('forgot')}
          className="text-sm"
        >
          Didn't receive a code? Send again
        </Button>
      </div>
    </form>
  );

  // Handle forgot password flow
  if (currentFlow === 'forgot') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your username or email to receive a reset code
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mb-4">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            {renderForgotPasswordForm()}
            
            {/* Helpful reminder about email delivery */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                📧 <strong>Email not arriving?</strong> Check your spam/junk folder. 
                Reset codes are sometimes filtered by email providers.
              </p>
              {resetAttempts > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Reset attempts: {resetAttempts}
                </p>
              )}
              {countdown > 60 && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                  ⚠️ <strong>Rate limited by AWS:</strong> For immediate testing, you can create a new user account or contact an admin.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle reset password flow
  if (currentFlow === 'reset') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Enter New Password</CardTitle>
            <CardDescription>
              Enter the code from your email and your new password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mb-4">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            {renderResetPasswordForm()}
            
            {/* Helpful reminder about email codes */}
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                💡 <strong>Can't find the code?</strong> Check your spam folder or request a new code.
              </p>
              {resetAttempts > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Total attempts: {resetAttempts}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Modulus LMS</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Tabs value={currentFlow === 'signin' ? 'signin' : 'signup'} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin" onClick={() => setCurrentFlow('signin')}>
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" onClick={() => setCurrentFlow('signup')}>
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="mt-4">
              {renderSignInForm()}
            </TabsContent>
            
            <TabsContent value="signup" className="mt-4">
              {renderSignUpForm()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
