import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calendar } from "lucide-react";
import KeyMetrics from "@/components/dashboard/KeyMetrics";
import BusMap from "@/components/dashboard/BusMap";
import BusList from "@/components/dashboard/BusList";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import UpcomingShifts from "@/components/dashboard/UpcomingShifts";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect driver to driver dashboard
  useEffect(() => {
    if (user && user.role === "driver") {
      setLocation("/driver");
    }
  }, [user, setLocation]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium text-neutral-900">Dashboard</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="flex items-center">
            <Calendar className="mr-1 h-4 w-4" />
            Hoy
          </Button>
          <Button size="sm" className="flex items-center">
            <RefreshCw className="mr-1 h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <KeyMetrics />

      {/* Map and Buses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <BusMap />
        </div>
        <div>
          <BusList />
        </div>
      </div>

      {/* Recent Activity and Schedules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed />
        <UpcomingShifts />
      </div>
    </div>
  );
}
