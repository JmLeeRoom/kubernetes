import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageSkeleton } from '@/components/common/PageSkeleton';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';

const ClusterOverviewPage = lazy(
  () => import('@/features/monitoring/pages/ClusterOverviewPage')
);
const MetricsExplorerPage = lazy(
  () => import('@/features/monitoring/pages/MetricsExplorerPage')
);
const LogViewerPage = lazy(() => import('@/features/monitoring/pages/LogViewerPage'));
const TraceExplorerPage = lazy(
  () => import('@/features/monitoring/pages/TraceExplorerPage')
);
const AlertsPage = lazy(() => import('@/features/monitoring/pages/AlertsPage'));

const ConnectionsPage = lazy(() => import('@/features/pipeline/pages/ConnectionsPage'));
const FlowsPage = lazy(() => import('@/features/pipeline/pages/FlowsPage'));
const SparkJobsPage = lazy(() => import('@/features/pipeline/pages/SparkJobsPage'));

const InferenceServicesPage = lazy(
  () => import('@/features/serving/pages/InferenceServicesPage')
);
const DeployModelPage = lazy(() => import('@/features/serving/pages/DeployModelPage'));
const TrafficSplitPage = lazy(() => import('@/features/serving/pages/TrafficSplitPage'));

const ExperimentsPage = lazy(() => import('@/features/mlops/pages/ExperimentsPage'));
const ModelRegistryPage = lazy(() => import('@/features/mlops/pages/ModelRegistryPage'));
const DAGListPage = lazy(() => import('@/features/mlops/pages/DAGListPage'));

const LoginPage = lazy(() => import('@/features/auth/LoginPage'));

function wrap(element: React.ReactNode) {
  return <Suspense fallback={<PageSkeleton />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/monitoring/cluster" replace /> },
      // Monitoring
      { path: 'monitoring/cluster', element: wrap(<ClusterOverviewPage />) },
      { path: 'monitoring/metrics', element: wrap(<MetricsExplorerPage />) },
      { path: 'monitoring/logs', element: wrap(<LogViewerPage />) },
      { path: 'monitoring/traces', element: wrap(<TraceExplorerPage />) },
      { path: 'monitoring/alerts', element: wrap(<AlertsPage />) },
      // Pipeline
      { path: 'pipeline/connections', element: wrap(<ConnectionsPage />) },
      { path: 'pipeline/flows', element: wrap(<FlowsPage />) },
      { path: 'pipeline/jobs', element: wrap(<SparkJobsPage />) },
      // Serving
      { path: 'serving/models', element: wrap(<InferenceServicesPage />) },
      { path: 'serving/deploy', element: wrap(<DeployModelPage />) },
      { path: 'serving/traffic', element: wrap(<TrafficSplitPage />) },
      // MLOps
      { path: 'mlops/experiments', element: wrap(<ExperimentsPage />) },
      { path: 'mlops/registry', element: wrap(<ModelRegistryPage />) },
      { path: 'mlops/pipelines', element: wrap(<DAGListPage />) },
    ],
  },
  { path: '/login', element: wrap(<LoginPage />) },
  { path: '*', element: <Navigate to="/" replace /> },
]);
