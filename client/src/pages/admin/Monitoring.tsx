import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BusLocation, Bus, User, Shift } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import BusMap from "@/components/dashboard/BusMap";
import { RefreshCw, Clock, AlertTriangle } from "lucide-react";
import { useBusLocations } from "@/lib/websocket";
import { format } from "date-fns";

export default function Monitoring() {
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  
  // Real-time bus locations
  const { locations, connected } = useBusLocations();

  // Get buses for reference
  const { data: buses = [] } = useQuery<Bus[]>({
    queryKey: ['/api/buses'],
  });

  // Get drivers for reference
  const { data: drivers = [] } = useQuery<User[]>({
    queryKey: ['/api/users', { role: 'driver' }],
  });

  // Get active shifts
  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ['/api/shifts', { status: 'in-progress' }],
  });

  // Get formatted location status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'on-time':
        return <Badge variant="success">En horario</Badge>;
      case 'delayed':
        return <Badge variant="warning">Con retraso</Badge>;
      case 'incident':
        return <Badge variant="error">Incidente</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get bus details by ID
  const getBusDetails = (busId: number) => {
    return buses.find(bus => bus.id === busId);
  };

  // Get shift details by bus ID
  const getShiftDetails = (busId: number) => {
    return shifts.find(shift => shift.busId === busId);
  };

  // Get driver details by ID
  const getDriverDetails = (driverId: number) => {
    return drivers.find(driver => driver.id === driverId);
  };

  // Format timestamp
  const formatTime = (timestamp: Date) => {
    if (!timestamp) return 'N/A';
    return format(new Date(timestamp), 'HH:mm:ss');
  };

  // Handle refresh click
  const handleRefresh = () => {
    // Refresh queries
    window.location.reload();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium text-neutral-900">Monitoreo en Tiempo Real</h2>
        <div className="flex items-center space-x-4">
          {connected ? (
            <Badge variant="success" className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Conexión en tiempo real activa
            </Badge>
          ) : (
            <Badge variant="warning" className="flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Conectando...
            </Badge>
          )}
          <Button size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <BusMap />
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Buses Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {locations.length > 0 ? (
                  locations.map(location => {
                    const bus = getBusDetails(location.busId);
                    const shift = getShiftDetails(location.busId);
                    const driver = shift ? getDriverDetails(shift.driverId) : null;
                    
                    return (
                      <div 
                        key={location.id} 
                        className={`flex items-center p-3 rounded-lg cursor-pointer ${
                          selectedBusId === location.busId ? 'bg-primary-light bg-opacity-10' : 'hover:bg-neutral-50'
                        }`}
                        onClick={() => setSelectedBusId(location.busId)}
                      >
                        <div className="w-10 h-10 bg-primary-light text-white rounded-full flex items-center justify-center mr-3">
                          <span className="material-icons">directions_bus</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className="text-sm font-medium text-neutral-800">
                              Bus #{bus ? bus.busNumber : location.busId}
                            </h4>
                            {getStatusBadge(location.status)}
                          </div>
                          <div className="flex justify-between mt-1">
                            <p className="text-xs text-neutral-500">
                              {driver ? `${driver.firstName} ${driver.lastName}` : 'Sin asignar'}
                            </p>
                            <p className="text-xs text-neutral-600">
                              Actualizado: {formatTime(location.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6">
                    <p className="text-neutral-500">No hay buses reportando ubicación actualmente.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles de Ubicación</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bus</TableHead>
                <TableHead>Chofer</TableHead>
                <TableHead>Ruta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Última Actualización</TableHead>
                <TableHead>Coordenadas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.length > 0 ? (
                locations.map(location => {
                  const bus = getBusDetails(location.busId);
                  const shift = getShiftDetails(location.busId);
                  const driver = shift ? getDriverDetails(shift.driverId) : null;
                  
                  return (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">
                        #{bus ? bus.busNumber : location.busId}
                      </TableCell>
                      <TableCell>
                        {driver ? `${driver.firstName} ${driver.lastName}` : 'Sin asignar'}
                      </TableCell>
                      <TableCell>
                        {shift ? `Ruta #${shift.routeId}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(location.status)}
                      </TableCell>
                      <TableCell>
                        {formatTime(location.timestamp)}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-neutral-600">
                          Lat: {location.latitude.toFixed(4)}, Long: {location.longitude.toFixed(4)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No hay datos de ubicación disponibles.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
