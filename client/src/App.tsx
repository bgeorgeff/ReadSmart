import { Route, Switch, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Home from "./pages/home";
import Landing from "./pages/landing";
import NotFound from "./pages/not-found";
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({error, resetErrorBoundary}: {error: Error, resetErrorBoundary: () => void}) {
  console.error("App Error:", error);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <button 
          onClick={resetErrorBoundary}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function App() {
  const [location] = useLocation();

  // Don't render React router for API routes
  if (location.startsWith('/api/')) {
    return null;
  }

  console.log("App component rendering...");

  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onError={(error) => console.error("React Error Boundary caught:", error)}
    >
      <QueryClientProvider client={queryClient}>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/app" component={Home} />
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;