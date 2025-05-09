import { useQuery } from '@tanstack/react-query';
import { RouteStop, Shift } from '@/lib/types';
import { useAuth } from '@/lib/auth.tsx';
import { cn } from '@/lib/utils';

export default function RouteStops() {
  const { user } = useAuth();
  
  // Get driver's active shift
  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ['/api/shifts', { driverId: user?.id, status: 'in-progress' }],
  });
  
  const activeShift = shifts[0]; // Assume first in-progress shift is the active one
  
  // Get route stops for the active route
  const { data: stops = [] } = useQuery<RouteStop[]>({
    queryKey: ['/api/routes', activeShift?.routeId, 'stops'],
    enabled: !!activeShift?.routeId,
  });
  
  // Sort stops by order
  const sortedStops = [...stops].sort((a, b) => a.order - b.order);
  
  // Mock current stop (in a real app, this would be determined by GPS location and API)
  const currentStopIndex = Math.min(2, sortedStops.length - 1);
  
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-neutral-200">
        <h3 className="text-lg font-medium text-neutral-900">Paradas de la ruta</h3>
      </div>
      <div className="p-4">
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {activeShift ? (
            sortedStops.length > 0 ? (
              sortedStops.map((stop, index) => {
                const isCompleted = index < currentStopIndex;
                const isCurrent = index === currentStopIndex;
                const isPending = index > currentStopIndex;
                
                return (
                  <div key={stop.id} className="flex items-center">
                    <div className="flex-shrink-0 flex flex-col items-center mr-3">
                      <div className={cn(
                        "w-3 h-3 rounded-full border-2 border-white",
                        isCompleted ? "bg-success" : 
                        isCurrent ? "bg-primary" :
                        "bg-neutral-300"
                      )}></div>
                      <div className={cn(
                        "w-0.5 h-12 bg-neutral-200",
                        index === sortedStops.length - 1 && "hidden"
                      )}></div>
                    </div>
                    <div className={cn(
                      "rounded-lg p-3 flex-1",
                      isCurrent ? "bg-primary bg-opacity-5" : "bg-neutral-100"
                    )}>
                      <p className="text-sm font-medium text-neutral-900">{stop.name}</p>
                      <p className={cn(
                        "text-xs",
                        isCompleted ? "text-neutral-500" :
                        isCurrent ? "text-primary" :
                        "text-neutral-500"
                      )}>
                        {stop.arrivalTime && `${stop.arrivalTime} - `}
                        {isCompleted ? "Completada" :
                         isCurrent ? "En camino" :
                         "Pendiente"}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4">
                <p className="text-neutral-500">No hay paradas definidas para esta ruta</p>
              </div>
            )
          ) : (
            <div className="text-center py-4">
              <p className="text-neutral-500">No hay una ruta activa en este momento</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
