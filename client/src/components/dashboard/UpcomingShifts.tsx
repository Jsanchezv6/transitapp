import { useQuery } from '@tanstack/react-query';
import { Shift, User, Bus, Route } from '@/lib/types';

export default function UpcomingShifts() {
  // Fetch upcoming shifts
  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ['/api/shifts/upcoming', { limit: 5 }],
  });
  
  // Fetch drivers, buses, and routes for displaying shift details
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users', { role: 'driver' }],
  });
  
  const { data: buses = [] } = useQuery<Bus[]>({
    queryKey: ['/api/buses'],
  });
  
  const { data: routes = [] } = useQuery<Route[]>({
    queryKey: ['/api/routes'],
  });
  
  // If data is not yet loaded, use mock data
  const displayShifts = shifts.length > 0
    ? shifts.map(shift => {
        const driver = users.find(u => u.id === shift.driverId);
        const bus = buses.find(b => b.id === shift.busId);
        const route = routes.find(r => r.id === shift.routeId);
        
        return {
          id: shift.id,
          driverName: driver ? `${driver.firstName} ${driver.lastName}` : 'Chofer no asignado',
          time: `${shift.startTime} - ${shift.endTime}`,
          details: `${route?.name || 'Ruta desconocida'} - Bus #${bus?.busNumber || 'N/A'}`
        };
      })
    : [
        { id: 1, driverName: 'Carlos Rodríguez', time: '08:00 - 16:00', details: 'Ruta 3 - Bus #754' },
        { id: 2, driverName: 'Ana Martínez', time: '09:00 - 17:00', details: 'Ruta 7 - Bus #1042' },
        { id: 3, driverName: 'Miguel López', time: '10:00 - 18:00', details: 'Ruta 5 - Bus #987' },
        { id: 4, driverName: 'Laura Gómez', time: '12:00 - 20:00', details: 'Ruta 1 - Bus #2156' },
        { id: 5, driverName: 'Pedro Ramírez', time: '14:00 - 22:00', details: 'Ruta 9 - Bus #1365' },
      ];

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-neutral-200">
        <h3 className="text-lg font-medium text-neutral-900">Próximos turnos</h3>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {displayShifts.map(shift => (
            <div key={shift.id} className="flex p-2 hover:bg-neutral-50 rounded-lg">
              <div className="bg-primary-light rounded p-2 mr-3">
                <span className="material-icons text-white">schedule</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h4 className="text-sm font-medium text-neutral-800">{shift.driverName}</h4>
                  <span className="text-xs text-neutral-600">{shift.time}</span>
                </div>
                <p className="text-xs text-neutral-500">{shift.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
