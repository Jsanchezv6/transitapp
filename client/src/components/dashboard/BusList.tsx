import { useQuery } from '@tanstack/react-query';
import { Bus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Mock bus status data (in a real app, this would come from the API)
interface BusStatus {
  busId: number;
  status: 'on-time' | 'delayed' | 'incident';
  route: string;
  updatedAgo: string;
}

const mockBusStatuses: Record<string, BusStatus> = {
  '1042': { busId: 1, status: 'on-time', route: 'Ruta 5 - Centro', updatedAgo: '2 min' },
  '987': { busId: 2, status: 'delayed', route: 'Ruta 3 - Norte', updatedAgo: '5 min' },
  '2156': { busId: 3, status: 'on-time', route: 'Ruta 7 - Este', updatedAgo: '1 min' },
  '1365': { busId: 4, status: 'incident', route: 'Ruta 1 - Sur', updatedAgo: '15 min' },
  '754': { busId: 5, status: 'on-time', route: 'Ruta 9 - Oeste', updatedAgo: '3 min' },
};

export default function BusList() {
  // Fetch all buses
  const { data: buses = [] } = useQuery<Bus[]>({
    queryKey: ['/api/buses'],
  });
  
  // Filter to active buses only
  const activeBuses = buses.filter(bus => bus.status === 'active');

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-neutral-900">Buses activos</h3>
        <Button variant="ghost" size="sm" className="text-primary text-sm hover:text-primary-dark">
          Ver todos
        </Button>
      </div>
      <div className="p-4">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activeBuses.map(bus => {
            const busStatus = mockBusStatuses[bus.busNumber] || {
              status: 'on-time',
              route: 'Ruta desconocida',
              updatedAgo: 'N/A'
            };
            
            return (
              <div key={bus.id} className="flex items-center p-2 hover:bg-neutral-50 rounded-lg">
                <div className="w-10 h-10 bg-primary-light text-white rounded-full flex items-center justify-center mr-3">
                  <span className="material-icons">directions_bus</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h4 className="text-sm font-medium text-neutral-800">Bus #{bus.busNumber}</h4>
                    <Badge
                      variant={
                        busStatus.status === 'on-time' 
                          ? 'success' 
                          : busStatus.status === 'delayed'
                            ? 'warning'
                            : 'error'
                      }
                      className="text-xs font-medium px-2 py-0.5"
                    >
                      {busStatus.status === 'on-time' 
                        ? 'En ruta' 
                        : busStatus.status === 'delayed'
                          ? 'Con retraso'
                          : 'Incidente'
                      }
                    </Badge>
                  </div>
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-neutral-500">{busStatus.route}</p>
                    <p className="text-xs text-neutral-600">Actualizado: {busStatus.updatedAgo}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
