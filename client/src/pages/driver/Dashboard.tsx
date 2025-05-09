import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Shift, Bus, Route } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Locate } from "lucide-react";
import DriverMap from "@/components/driver/DriverMap";
import RouteStops from "@/components/driver/RouteStops";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useBusLocations } from "@/lib/websocket";
import { useToast } from "@/hooks/use-toast";

export default function DriverDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { updateLocation, connected } = useBusLocations();

  // Redirect admin to admin dashboard
  useEffect(() => {
    if (user && user.role === "admin") {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Get driver's active shift
  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ['/api/shifts', { driverId: user?.id, status: 'in-progress' }],
  });
  
  const activeShift = shifts[0]; // Assume first in-progress shift is the active one
  
  // Get bus and route details
  const { data: bus } = useQuery<Bus>({
    queryKey: ['/api/buses', activeShift?.busId],
    enabled: !!activeShift?.busId,
  });
  
  const { data: route } = useQuery<Route>({
    queryKey: ['/api/routes', activeShift?.routeId],
    enabled: !!activeShift?.routeId,
  });

  // Calculate remaining time (in a real app would be more precise)
  const calculateRemainingTime = () => {
    if (!activeShift) return "00:00:00";
    
    const now = new Date();
    const [hours, minutes] = activeShift.endTime.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(hours, minutes, 0);
    
    if (endTime < now) return "00:00:00";
    
    const diff = endTime.getTime() - now.getTime();
    const hours2 = Math.floor(diff / (1000 * 60 * 60));
    const minutes2 = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours2.toString().padStart(2, '0')}:${minutes2.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format time range
  const getTimeRange = () => {
    if (!activeShift) return "N/A";
    return `${activeShift.startTime} - ${activeShift.endTime}`;
  };

  // Update driver's location
  const handleUpdateLocation = async () => {
    if (!activeShift) {
      toast({
        title: "Error",
        description: "No hay un turno activo para reportar ubicación",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would use the browser's geolocation API
    // For this example, we'll use mock coordinates
    try {
      // Mock location - would be replaced with navigator.geolocation in a real app
      const mockCoordinates = {
        latitude: 40.7128 + (Math.random() * 0.01 - 0.005),
        longitude: -74.0060 + (Math.random() * 0.01 - 0.005),
      };

      if (connected) {
        // Send via WebSocket for real-time updates
        updateLocation({
          busId: activeShift.busId,
          shiftId: activeShift.id,
          latitude: mockCoordinates.latitude,
          longitude: mockCoordinates.longitude,
          status: 'on-time',
        });
      } else {
        // Fallback to REST API
        await apiRequest('POST', '/api/bus-locations', {
          busId: activeShift.busId,
          shiftId: activeShift.id,
          latitude: mockCoordinates.latitude,
          longitude: mockCoordinates.longitude,
          status: 'on-time',
        });
      }

      toast({
        title: "Ubicación actualizada",
        description: "Su ubicación ha sido reportada exitosamente",
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
    } catch (error) {
      console.error("Error updating location:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la ubicación",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium text-neutral-900">Mi Dashboard</h2>
        <Button onClick={handleUpdateLocation} disabled={!activeShift}>
          <Locate className="mr-2 h-4 w-4" />
          Actualizar ubicación
        </Button>
      </div>

      {/* Driver Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-neutral-500 mb-1">Estado actual</p>
              <h3 className="text-2xl font-medium text-neutral-900">
                {activeShift ? 'En ruta' : 'Sin turno activo'}
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                {activeShift 
                  ? `Bus #${bus?.busNumber || '...'} - ${route?.name || '...'}`
                  : 'No hay un turno asignado en este momento'}
              </p>
            </div>
            <div className="bg-success-light bg-opacity-10 p-2 rounded-lg">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6 text-success"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-neutral-500 mb-1">Tiempo de turno</p>
              <h3 className="text-2xl font-medium text-neutral-900">
                {calculateRemainingTime()}
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                {getTimeRange()}
              </p>
            </div>
            <div className="bg-info-light bg-opacity-10 p-2 rounded-lg">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6 text-info"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-neutral-500 mb-1">Próxima parada</p>
              <h3 className="text-2xl font-medium text-neutral-900">
                {activeShift ? 'Estación Central' : 'N/A'}
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                {activeShift ? 'Tiempo estimado: 5 min' : 'No hay ruta activa'}
              </p>
            </div>
            <div className="bg-warning-light bg-opacity-10 p-2 rounded-lg">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6 text-warning"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Driver Map and Route Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <DriverMap />
        </div>
        <div>
          <RouteStops />
        </div>
      </div>
    </div>
  );
}
