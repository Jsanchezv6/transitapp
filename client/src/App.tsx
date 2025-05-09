import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import AuthLayout from "@/components/layout/AuthLayout";
import AppLayout from "@/components/layout/AppLayout";
import NotFound from "@/pages/not-found";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import Users from "@/pages/admin/Users";
import Buses from "@/pages/admin/Buses";
import Routes from "@/pages/admin/Routes";
import Schedules from "@/pages/admin/Schedules";
import Shifts from "@/pages/admin/Shifts";
import Monitoring from "@/pages/admin/Monitoring";

// Driver Pages
import DriverDashboard from "@/pages/driver/Dashboard";
import MyShifts from "@/pages/driver/MyShifts";
import MyRoutes from "@/pages/driver/MyRoutes";
import ReportLocation from "@/pages/driver/ReportLocation";

// Auth Pages
import LoginPage from "@/pages/LoginPage";

function Router() {
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/login">
        <AuthLayout requireAuth={false}>
          <LoginPage />
        </AuthLayout>
      </Route>
      
      {/* Admin Routes */}
      <Route path="/">
        <AuthLayout>
          <AppLayout>
            <AdminDashboard />
          </AppLayout>
        </AuthLayout>
      </Route>
      
      <Route path="/users">
        <AuthLayout>
          <AppLayout>
            <Users />
          </AppLayout>
        </AuthLayout>
      </Route>
      
      <Route path="/buses">
        <AuthLayout>
          <AppLayout>
            <Buses />
          </AppLayout>
        </AuthLayout>
      </Route>
      
      <Route path="/routes">
        <AuthLayout>
          <AppLayout>
            <Routes />
          </AppLayout>
        </AuthLayout>
      </Route>
      
      <Route path="/schedules">
        <AuthLayout>
          <AppLayout>
            <Schedules />
          </AppLayout>
        </AuthLayout>
      </Route>
      
      <Route path="/shifts">
        <AuthLayout>
          <AppLayout>
            <Shifts />
          </AppLayout>
        </AuthLayout>
      </Route>
      
      <Route path="/monitoring">
        <AuthLayout>
          <AppLayout>
            <Monitoring />
          </AppLayout>
        </AuthLayout>
      </Route>
      
      {/* Driver Routes */}
      <Route path="/driver">
        <AuthLayout>
          <AppLayout>
            <DriverDashboard />
          </AppLayout>
        </AuthLayout>
      </Route>
      
      <Route path="/driver/shifts">
        <AuthLayout>
          <AppLayout>
            <MyShifts />
          </AppLayout>
        </AuthLayout>
      </Route>
      
      <Route path="/driver/routes">
        <AuthLayout>
          <AppLayout>
            <MyRoutes />
          </AppLayout>
        </AuthLayout>
      </Route>
      
      <Route path="/driver/location">
        <AuthLayout>
          <AppLayout>
            <ReportLocation />
          </AppLayout>
        </AuthLayout>
      </Route>
      
      {/* Fallback to 404 */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
