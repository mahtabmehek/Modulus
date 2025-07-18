'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/local-auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, ShieldCheck, User, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { UserRole } from '@/types';

export default function LocalAuth() {
    const { signIn, signUp, isLoading: authLoading } = useAuth();

    // Form states
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [currentFlow, setCurrentFlow] = useState<'signin' | 'signup'>('signin');

    // Form data
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        role: 'student' as UserRole,
        accessCode: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
        setSuccess('');
    };

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
            role: 'student',
            accessCode: ''
        });
        setError('');
        setSuccess('');
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (!formData.email || !formData.password) {
                throw new Error('Email and password are required');
            }

            await signIn(formData.email, formData.password);
            setSuccess('Successfully signed in!');
        } catch (err: any) {
            setError(err.message || 'Sign in failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Validation
            if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
                throw new Error('All fields are required');
            }

            if (formData.password !== formData.confirmPassword) {
                throw new Error('Passwords do not match');
            }

            if (formData.password.length < 8) {
                throw new Error('Password must be at least 8 characters long');
            }

            if (!formData.accessCode) {
                throw new Error('Access code is required');
            }

            await signUp({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                role: formData.role,
                accessCode: formData.accessCode
            });

            setSuccess('Account created successfully! You can now sign in.');
            setCurrentFlow('signin');
            resetForm();
        } catch (err: any) {
            setError(err.message || 'Sign up failed');
        } finally {
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const switchFlow = (flow: 'signin' | 'signup') => {
        setCurrentFlow(flow);
        resetForm();
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                    <p className="mt-2 text-sm text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4">
                        <img 
                            src="/logo.svg" 
                            alt="Modulus Logo" 
                            className="h-16 w-16 mx-auto"
                        />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                        Modulus LMS
                    </CardTitle>
                    <CardDescription>
                        {currentFlow === 'signin' ? 'Sign in to your account' : 'Create a new account'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={currentFlow} onValueChange={(value) => switchFlow(value as 'signin' | 'signup')}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="signin" data-state="signin">Sign In</TabsTrigger>
                            <TabsTrigger value="signup" data-state="signup">Sign Up</TabsTrigger>
                        </TabsList>

                        {/* Alerts */}
                        {error && (
                            <Alert className="mt-4 border-red-200 bg-red-50">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-700">{error}</AlertDescription>
                            </Alert>
                        )}

                        {success && (
                            <Alert className="mt-4 border-green-200 bg-green-50">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-700">{success}</AlertDescription>
                            </Alert>
                        )}

                        {/* Sign In Form */}
                        <TabsContent value="signin">
                            <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="signin-email" className="flex items-center">
                                        <Mail className="h-4 w-4 mr-2" />
                                        Email
                                    </Label>
                                    <Input
                                        id="signin-email"
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="signin-password" className="flex items-center">
                                        <Lock className="h-4 w-4 mr-2" />
                                        Password
                                    </Label>
                                    <Input
                                        id="signin-password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={togglePasswordVisibility}
                                        className="w-full mt-2"
                                    >
                                        {showPassword ? (
                                            <>
                                                <EyeOff className="h-4 w-4 mr-2" />
                                                Hide password
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="h-4 w-4 mr-2" />
                                                Show password
                                            </>
                                        )}
                                    </Button>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
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
                        </TabsContent>

                        {/* Sign Up Form */}
                        <TabsContent value="signup">
                            <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input
                                            id="firstName"
                                            name="firstName"
                                            type="text"
                                            required
                                            placeholder="First name"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input
                                            id="lastName"
                                            name="lastName"
                                            type="text"
                                            required
                                            placeholder="Last name"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="signup-email" className="flex items-center">
                                        <Mail className="h-4 w-4 mr-2" />
                                        Email
                                    </Label>
                                    <Input
                                        id="signup-email"
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role" className="flex items-center">
                                        <User className="h-4 w-4 mr-2" />
                                        Role
                                    </Label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="student">Student</option>
                                        <option value="instructor">Instructor</option>
                                        <option value="staff">Staff</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="accessCode">Access Code</Label>
                                    <Input
                                        id="accessCode"
                                        name="accessCode"
                                        type="text"
                                        required
                                        placeholder="Enter access code for your role"
                                        value={formData.accessCode}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="signup-password" className="flex items-center">
                                        <Lock className="h-4 w-4 mr-2" />
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="signup-password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            placeholder="Create a password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={togglePasswordVisibility}
                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        placeholder="Confirm your password"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating account...
                                        </>
                                    ) : (
                                        'Create Account'
                                    )}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        <p className="mb-2">Access codes by role:</p>
                        <div className="text-xs space-y-1">
                            <p><strong>Student:</strong> student2025</p>
                            <p><strong>Instructor:</strong> instructor2025</p>
                            <p><strong>Staff:</strong> staff2025</p>
                            <p><strong>Admin:</strong> mahtabmehek1337</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
