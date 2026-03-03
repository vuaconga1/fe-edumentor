import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Cập nhật state để render fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Có thể gửi error log đến dịch vụ tracking ở đây (Sentry, LogRocket...)
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // Giao diện fallback gọn gàng
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100">
                        <h1 className="text-4xl font-extrabold text-red-500 mb-4">
                            Oops!
                        </h1>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                            Something went wrong.
                        </h2>
                        <p className="text-gray-500 mb-6">
                            The application encountered an unexpected error while rendering. Please try reloading the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-primary text-white font-medium py-3 px-6 rounded-lg shadow-md hover:bg-primary-dark transition-all duration-300 w-full"
                        >
                            Reload Page
                        </button>
                        {import.meta.env.DEV && this.state.error && (
                            <div className="mt-6 text-left w-full">
                                <p className="text-xs font-bold text-gray-600 mb-1">Error Details (DEV mode only):</p>
                                <div className="bg-gray-100 p-3 rounded-lg overflow-x-auto text-xs text-red-600 border border-gray-200">
                                    <span className="font-semibold block break-words mb-2">{this.state.error.toString()}</span>
                                    <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
