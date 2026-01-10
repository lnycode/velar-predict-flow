import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ErrorBoundary } from "./components/errors/ErrorBoundary";
import { PageErrorBoundary } from "./components/errors/PageErrorBoundary";
import { PageLoader } from "./components/ui/page-loader";

// Lazy load all page components for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DiaryPage = lazy(() => import("./pages/DiaryPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const ForecastPage = lazy(() => import("./pages/ForecastPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const InsightsPage = lazy(() => import("./pages/InsightsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AuthPage = lazy(() => import("./pages/AuthPage"));

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppLayout>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={
                    <ProtectedRoute>
                      <PageErrorBoundary>
                        <Dashboard />
                      </PageErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="/auth" element={
                    <PageErrorBoundary>
                      <AuthPage />
                    </PageErrorBoundary>
                  } />
                  <Route path="/diary" element={
                    <ProtectedRoute>
                      <PageErrorBoundary>
                        <DiaryPage />
                      </PageErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="/calendar" element={
                    <ProtectedRoute>
                      <PageErrorBoundary>
                        <CalendarPage />
                      </PageErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="/history" element={
                    <ProtectedRoute>
                      <PageErrorBoundary>
                        <HistoryPage />
                      </PageErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="/forecast" element={
                    <ProtectedRoute>
                      <PageErrorBoundary>
                        <ForecastPage />
                      </PageErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="/analytics" element={
                    <ProtectedRoute>
                      <PageErrorBoundary>
                        <AnalyticsPage />
                      </PageErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="/insights" element={
                    <ProtectedRoute>
                      <PageErrorBoundary>
                        <InsightsPage />
                      </PageErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <PageErrorBoundary>
                        <SettingsPage />
                      </PageErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="/subscription-success" element={
                    <ProtectedRoute>
                      <PageErrorBoundary>
                        <Dashboard />
                      </PageErrorBoundary>
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={
                    <PageErrorBoundary>
                      <NotFound />
                    </PageErrorBoundary>
                  } />
                </Routes>
              </Suspense>
            </AppLayout>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
