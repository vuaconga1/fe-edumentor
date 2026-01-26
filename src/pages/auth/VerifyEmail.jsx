import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import authAPI from '../../api/authAPI';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading'); // loading, success, error, already_verified
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');
            const email = searchParams.get('email');

            if (!token || !email) {
                setStatus('error');
                setMessage('Invalid verification link. Missing token or email.');
                return;
            }

            try {
                const response = await authAPI.verifyEmail({ token, email });
                setStatus('success');
                setMessage(response?.data?.message || 'Your email has been verified successfully.');

                // Auto redirect after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (err) {
                const errorMessage = err?.response?.data?.message || err?.response?.data?.Message || '';

                if (errorMessage.toLowerCase().includes('already')) {
                    // Email was already verified - this is actually a success case
                    setStatus('already_verified');
                    setMessage('Your email has already been verified.');
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                } else if (errorMessage.toLowerCase().includes('expired')) {
                    setStatus('error');
                    setMessage('This verification link has expired. Please request a new one from the login page.');
                } else if (errorMessage) {
                    setStatus('error');
                    setMessage(errorMessage);
                } else {
                    setStatus('error');
                    setMessage('Verification failed. The link may have expired or is invalid.');
                }
            }
        };

        verifyEmail();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo - Centered */}
                <div className="flex items-center justify-center mb-8">
                    <img
                        src="/edumentor-logo.png"
                        alt="EduMentor Logo"
                        className="w-12 h-12 object-contain mr-3"
                    />
                    <span className="text-3xl font-normal text-gray-700">
                        EduMentor
                    </span>
                </div>

                {/* Verification Card */}
                <div className="bg-white border border-gray-200 rounded-lg p-10 shadow-sm overflow-hidden">
                        {status === 'loading' && (
                            <div className="text-center">
                                <div className="w-12 h-12 mx-auto mb-5 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <h1 className="text-xl font-semibold text-gray-900 mb-2">
                                    Verifying your email
                                </h1>
                                <p className="text-gray-500 text-sm">
                                    Please wait a moment...
                                </p>
                            </div>
                        )}

                        {(status === 'success' || status === 'already_verified') && (
                            <div className="text-center">
                                <div className="w-14 h-14 mx-auto mb-5 bg-green-50 rounded-full flex items-center justify-center">
                                    <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h1 className="text-xl font-semibold text-gray-900 mb-2">
                                    {status === 'already_verified' ? 'Already Verified' : 'Email Verified'}
                                </h1>
                                <p className="text-gray-500 text-sm mb-6">
                                    {message}
                                </p>
                                <p className="text-xs text-gray-400 mb-5">
                                    Redirecting to login...
                                </p>
                                <Link
                                    to="/login"
                                    className="inline-block w-full bg-white text-blue-600 font-medium py-3 px-6 rounded-md border-2 border-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                    Continue to Login
                                </Link>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="text-center">
                                <div className="w-14 h-14 mx-auto mb-5 bg-red-50 rounded-full flex items-center justify-center">
                                    <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <h1 className="text-xl font-semibold text-gray-900 mb-2">
                                    Verification Failed
                                </h1>
                                <p className="text-gray-500 text-sm mb-6">
                                    {message}
                                </p>
                                <Link
                                    to="/login"
                                    className="inline-block w-full bg-white text-blue-600 font-medium py-3 px-6 rounded-md border-2 border-blue-600 hover:bg-blue-50 transition-colors mb-3"
                                >
                                    Go to Login
                                </Link>
                                <p className="text-xs text-gray-400">
                                    You can request a new verification email from the login page
                                </p>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
