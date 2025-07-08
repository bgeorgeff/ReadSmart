import { Route, Switch, useLocation } from "wouter";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";

function App() {
  const [location] = useLocation();

  // Don't render React router for API routes
  if (location.startsWith('/api/')) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </QueryClientProvider>
  );
}