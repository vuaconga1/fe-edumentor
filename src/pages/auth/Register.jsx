import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import registerAPI from '../../api/registerApi';
import { HiEye, HiEyeOff } from "react-icons/hi";

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [success, setSuccess] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check for Google OAuth error from URL
  React.useEffect(() => {
    const urlError = searchParams.get('error');
    const cancelled = searchParams.get('cancelled');

    if (cancelled === 'true') {
      setGoogleError('Google sign up was cancelled. Please try again.');
    } else if (urlError) {
      setGoogleError(decodeURIComponent(urlError));
    }
  }, [searchParams]);

  const handleGoogleSignup = () => {
    setGoogleError('');
    // Redirect to backend Google OAuth endpoint for registration
    window.location.href = 'https://localhost:7082/api/Auth/google-login?mode=register';
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { strength, label: 'Fair', color: 'bg-yellow-500' };
    if (strength <= 4) return { strength, label: 'Good', color: 'bg-blue-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email format');
      return;
    }

    if (!password) {
      setError('Please enter a password');
      return;
    }

    // Updated validation to match strength meter recommendations
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError('Password must contain uppercase, lowercase, and number');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        fullName: name,
        email,
        password,
        confirmPassword,
        role: 0 // Always register as Student first
      };

      const res = await registerAPI.register(payload);

      // Show success message
      setSuccess('Registration successful! Please check your email to verify your account before logging in.');

      // Clear form
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      const message = err?.response?.data?.message || err?.response?.data?.Message;
      const errors = err?.response?.data?.errors;

      if (status === 400) {
        if (message?.toLowerCase().includes('email') && message?.toLowerCase().includes('exist')) {
          setError('This email is already registered. Please use a different email or sign in.');
        } else if (errors && errors.length > 0) {
          setError(errors[0]);
        } else if (message) {
          setError(message);
        } else {
          setError('Invalid data. Please check your inputs.');
        }
      } else if (message) {
        setError(message);
      } else {
        setError('Registration failed. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/background.png')`,
        }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-xs sm:max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <img
              src="/edumentor-logo.png"
              alt="EduMentor Logo"
              className="w-10 h-10 object-contain mr-3"
            />
            <span className="text-2xl font-bold text-white drop-shadow-lg">
              EduMentor
            </span>
          </div>

          {/* Register Form Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8">
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">
              Create your account
            </h1>

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 flex items-start">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{success}</span>
                </p>
                <p className="text-xs text-green-600 mt-2 ml-6">
                  Redirecting to login page...
                </p>
              </div>
            )}

            {/* Google Signup Button */}
            <div className="mb-4">
              <button
                type="button"
                onClick={handleGoogleSignup}
                className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-3 bg-white hover:bg-gray-50 transition font-medium text-gray-700 shadow-sm"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Sign up with Google
              </button>
            </div>

            {/* Google Error Message */}
            {googleError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {googleError}
                </p>
              </div>
            )}

            <div className="flex items-center mb-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="px-3 text-gray-400 text-sm">Or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={loading || success}
                />
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={loading || success}
                />
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition pr-10"
                    disabled={loading || success}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <HiEyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <HiEye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>

                {/* Strength Meter */}
                {password && (
                  <div className="mt-2 text-xs">
                    <div className="flex gap-1 h-1 mb-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`flex-1 rounded-full ${level <= passwordStrength.strength
                            ? passwordStrength.color
                            : 'bg-gray-200'
                            }`}
                        />
                      ))}
                    </div>
                    <span className={`${passwordStrength.strength <= 2 ? 'text-red-500' :
                      passwordStrength.strength <= 3 ? 'text-yellow-500' :
                        passwordStrength.strength <= 4 ? 'text-blue-500' : 'text-green-500'
                      }`}>
                      Strength: {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition pr-10"
                    disabled={loading || success}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <HiEyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <HiEye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Account Error Message - Below Confirm Password */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {error}
                  </p>
                </div>
              )}

              {/* Terms and Privacy Checkbox */}
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  required
                  disabled={loading || success}
                />
                <label htmlFor="terms" className="ml-2 text-sm text-gray-700 cursor-pointer">
                  I agree to the{' '}
                  <Link to="/terms" className="text-blue-600 hover:underline">Terms and Conditions</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                </label>
              </div>



              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || success}
                className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : 'Create Account'}
              </button>

              {/* Login Link */}
              <div className="text-center">
                <a href="/login" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Already have an account? Sign in
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
