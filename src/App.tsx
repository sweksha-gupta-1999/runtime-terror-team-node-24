import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { RouteErrorBoundary } from '@/components/ErrorBoundary';
import { AppShell } from '@/components/layout/AppShell';
import { SkeletonCard } from '@/components/ui/Skeleton';

// Code-split each page to keep the initial JS bundle small.
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Generate = lazy(() => import('@/pages/Generate'));
const Workflow = lazy(() => import('@/pages/Workflow'));
const Learning = lazy(() => import('@/pages/Learning'));
const Knowledge = lazy(() => import('@/pages/Knowledge'));
const Chat = lazy(() => import('@/pages/Chat'));
const Health = lazy(() => import('@/pages/Health'));
const Team = lazy(() => import('@/pages/Team'));
const Settings = lazy(() => import('@/pages/Settings'));
const Artifacts = lazy(() => import('@/pages/Artifacts'));
const ArtifactDetail = lazy(() => import('@/pages/ArtifactDetail'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function RouteFallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteErrorBoundary>
        <Routes>
          <Route element={<AppShell />}>
            <Route
              path="/"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route
              path="/generate"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <Generate />
                </Suspense>
              }
            />
            <Route
              path="/workflow"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <Workflow />
                </Suspense>
              }
            />
            <Route
              path="/learning"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <Learning />
                </Suspense>
              }
            />
            <Route
              path="/learning/:repoId"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <Learning />
                </Suspense>
              }
            />
            <Route
              path="/knowledge"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <Knowledge />
                </Suspense>
              }
            />
            <Route
              path="/chat"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <Chat />
                </Suspense>
              }
            />
            <Route
              path="/health"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <Health />
                </Suspense>
              }
            />
            <Route
              path="/health/:repoId"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <Health />
                </Suspense>
              }
            />
            <Route
              path="/team"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <Team />
                </Suspense>
              }
            />
            <Route
              path="/team/:repoId"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <Team />
                </Suspense>
              }
            />
            <Route
              path="/artifacts"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <Artifacts />
                </Suspense>
              }
            />
            <Route
              path="/artifacts/:repoId"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <ArtifactDetail />
                </Suspense>
              }
            />
            <Route
              path="/settings"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <Settings />
                </Suspense>
              }
            />
            <Route
              path="*"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <NotFound />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </RouteErrorBoundary>
    </BrowserRouter>
  );
}
