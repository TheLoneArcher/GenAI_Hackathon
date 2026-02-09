import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-8 font-sans">
                    <h1 className="text-3xl font-bold text-red-500 mb-4">Something went wrong.</h1>
                    <p className="text-gray-400 mb-8 max-w-lg text-center">
                        The application encountered a critical error. Please check the console for details.
                    </p>
                    <div className="bg-black/50 p-4 rounded-lg border border-red-500/20 overflow-auto max-w-2xl w-full">
                        <code className="text-sm font-mono text-red-300">
                            {this.state.error && this.state.error.toString()}
                        </code>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-8 px-6 py-2 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
