import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Shift, Bus, Route } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useBusLocations } from "@/lib/websocket";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MapPin, Loader2, AlertTriangle, CheckCircle, Info } from "lucide-react";

type LocationStatus = 'on-time' | 'delayed' | 'incident';

interface MockLocation {
  latitude: number;
  longitude: number;
}

export default function ReportLocation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<LocationStatus>('on-time');
  const [isReporting, setIsReporting] = useState(false);
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
  const [mockLocation, setMockLocation] = useState<MockLocation>({
    latitude: 40.7128,
    longitude: -74.0060
  });
  const [locationUpdateHistory, setLocationUpdateHistory] = useState<Array<{
    time: Date;
    status: LocationStatus;
    coordinates: string;
  }>>([]);
  
  // WebSocket connection for real-time updates
  const { updateLocation, connected } = useBusLocations();

  // Get active and upcoming shifts for this driver
  const { data: shifts = [], isLoading: isLoadingShifts } = useQuery<Shift[]>({
    queryKey: ['/api/shifts', { driverId: user?.id, status: 'in-progress' }],
    enabled: !!user?.id,
  });
  
  const { data: upcomingShifts = [] } = useQuery<Shift[]>({
    queryKey: ['/api/shifts', { driverId: user?.id, status: 'scheduled' }],
    enabled: !!user?.id,
  });
  
  // Get bus and route details
  const { data: buses = [] } = useQuery<Bus[]>({
    queryKey: ['/api/buses'],
  });
  
  const { data: routes = [] } = useQuery<Route[]>({
    queryKey: ['/api/routes'],
  });

  // Set the first active shift as selected by default
  useEffect(() => {
    if (shifts.length > 0 && !selectedShift) {
      setSelectedShift(shifts[0]);
    }
  }, [shifts, selectedShift]);

  // Get bus details
  const getBusDetails = (busId: number) => {
    return buses.find(bus => bus.id === busId);
  };

  // Get route details
  const getRouteDetails = (routeId: number) => {
    return routes.find(route => route.id === routeId);
  };

  // Generate a random nearby location (simulating GPS movement)
  const generateRandomLocation = () => {
    const baseLatitude = 40.7128;  // New York City latitude
    const baseLongitude = -74.0060; // New York City longitude
    
    return {
      latitude: baseLatitude + (Math.random() * 0.02 - 0.01),  // Random offset +/- 0.01
      longitude: baseLongitude + (Math.random() * 0.02 - 0.01) // Random offset +/- 0.01
    };
  };

  // Handle automatic location reporting
  const handleReportLocation = async () => {
    if (!selectedShift) {
      toast({
        title: "Error",
        description: "Seleccione un turno activo para reportar ubicación",
        variant: "destructive",
      });
      return;
    }
    
    setIsReporting(true);
    
    try {
      // In a real app, this would use the browser's geolocation API
      // For this example, we'll use mock coordinates
      const coordinates = generateRandomLocation();
      
      if (connected) {
        // Send via WebSocket for real-time updates
        updateLocation({
          busId: selectedShift.busId,
          shiftId: selectedShift.id,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          status: selectedStatus,
        });
      } else {
        // Fallback to REST API
        await apiRequest('POST', '/api/bus-locations', {
          busId: selectedShift.busId,
          shiftId: selectedShift.id,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          status: selectedStatus,
        });
      }
      
      // Add to local history
      setLocationUpdateHistory(prev => [
        {
          time: new Date(),
          status: selectedStatus,
          coordinates: `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`
        },
        ...prev
      ]);

      toast({
        title: "Ubicación reportada",
        description: "Su ubicación ha sido reportada exitosamente",
      });
    } catch (error) {
      console.error("Error reporting location:", error);
      toast({
        title: "Error",
        description: "No se pudo reportar la ubicación",
        variant: "destructive",
      });
    } finally {
      setIsReporting(false);
    }
  };

  // Handle manual location reporting
  const handleManualReportLocation = async () => {
    if (!selectedShift) {
      toast({
        title: "Error",
        description: "Seleccione un turno activo para reportar ubicación",
        variant: "destructive",
      });
      return;
    }
    
    setIsReporting(true);
    
    try {
      if (connected) {
        // Send via WebSocket for real-time updates
        updateLocation({
          busId: selectedShift.busId,
          shiftId: selectedShift.id,
          latitude: mockLocation.latitude,
          longitude: mockLocation.longitude,
          status: selectedStatus,
        });
      } else {
        // Fallback to REST API
        await apiRequest('POST', '/api/bus-locations', {
          busId: selectedShift.busId,
          shiftId: selectedShift.id,
          latitude: mockLocation.latitude,
          longitude: mockLocation.longitude,
          status: selectedStatus,
        });
      }
      
      // Add to local history
      setLocationUpdateHistory(prev => [
        {
          time: new Date(),
          status: selectedStatus,
          coordinates: `${mockLocation.latitude.toFixed(4)}, ${mockLocation.longitude.toFixed(4)}`
        },
        ...prev
      ]);
      
      toast({
        title: "Ubicación reportada",
        description: "Su ubicación ha sido reportada exitosamente",
      });
      
      setIsManualDialogOpen(false);
    } catch (error) {
      console.error("Error reporting location:", error);
      toast({
        title: "Error",
        description: "No se pudo reportar la ubicación",
        variant: "destructive",
      });
    } finally {
      setIsReporting(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: LocationStatus) => {
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

  // Format timestamp for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium text-neutral-900">Reportar Ubicación</h2>
        
        <div className="flex items-center space-x-4">
          {connected ? (
            <Badge variant="success" className="flex items-center">
              <span className="material-icons mr-1" style={{ fontSize: '14px' }}>wifi</span>
              Conexión en tiempo real
            </Badge>
          ) : (
            <Badge variant="warning" className="flex items-center">
              <span className="material-icons mr-1" style={{ fontSize: '14px' }}>wifi_off</span>
              Modo fuera de línea
            </Badge>
          )}
        </div>
      </div>

      {isLoadingShifts ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : shifts.length === 0 && upcomingShifts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Info className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-800 mb-2">No hay turnos activos o próximos</h3>
            <p className="text-neutral-600">
              Actualmente no tiene turnos programados. Contacte a un administrador si cree que esto es un error.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Enviar Actualización de Ubicación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shifts.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-start">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">No hay turnos activos</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          No tiene turnos en progreso en este momento. Debe iniciar un turno programado para reportar su ubicación.
                        </p>
                        {upcomingShifts.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
                            }}
                          >
                            Ver turnos programados
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-neutral-700">
                          Seleccionar Turno
                        </label>
                        <Select
                          value={selectedShift ? selectedShift.id.toString() : ''}
                          onValueChange={(value) => {
                            const shift = shifts.find(s => s.id === parseInt(value));
                            setSelectedShift(shift || null);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar turno activo" />
                          </SelectTrigger>
                          <SelectContent>
                            {shifts.map(shift => {
                              const bus = getBusDetails(shift.busId);
                              const route = getRouteDetails(shift.routeId);
                              
                              return (
                                <SelectItem key={shift.id} value={shift.id.toString()}>
                                  {route?.name || `Ruta #${shift.routeId}`} - Bus #{bus?.busNumber || shift.busId}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-neutral-700">
                          Estado Actual
                        </label>
                        <Select
                          value={selectedStatus}
                          onValueChange={(value) => setSelectedStatus(value as LocationStatus)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="on-time">En horario</SelectItem>
                            <SelectItem value="delayed">Con retraso</SelectItem>
                            <SelectItem value="incident">Incidente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="bg-neutral-200 h-48 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <MapPin className="h-12 w-12 text-neutral-400 mx-auto" />
                          <p className="text-neutral-500 mt-2">Mapa de ubicación actual</p>
                        </div>
                      </div>
                      
                      <div className="pt-4 space-x-3 flex">
                        <Button
                          className="flex-1"
                          onClick={handleReportLocation}
                          disabled={isReporting || !selectedShift}
                        >
                          {isReporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Reportar Ubicación Actual
                        </Button>
                        
                        <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline">
                              Coordenadas Manuales
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reportar Coordenadas Manuales</DialogTitle>
                              <DialogDescription>
                                Introduzca las coordenadas GPS manualmente
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Latitud</label>
                                  <input
                                    type="number"
                                    step="0.0001"
                                    value={mockLocation.latitude}
                                    onChange={(e) => setMockLocation({
                                      ...mockLocation,
                                      latitude: parseFloat(e.target.value) || 0
                                    })}
                                    className="w-full p-2 border border-neutral-300 rounded-md"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Longitud</label>
                                  <input
                                    type="number"
                                    step="0.0001"
                                    value={mockLocation.longitude}
                                    onChange={(e) => setMockLocation({
                                      ...mockLocation,
                                      longitude: parseFloat(e.target.value) || 0
                                    })}
                                    className="w-full p-2 border border-neutral-300 rounded-md"
                                  />
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Estado</label>
                                <Select
                                  value={selectedStatus}
                                  onValueChange={(value) => setSelectedStatus(value as LocationStatus)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar estado" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="on-time">En horario</SelectItem>
                                    <SelectItem value="delayed">Con retraso</SelectItem>
                                    <SelectItem value="incident">Incidente</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <DialogFooter>
                              <Button type="submit" onClick={handleManualReportLocation} disabled={isReporting}>
                                {isReporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Reportar Ubicación
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Información del Turno</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedShift ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm text-neutral-500">Ruta</p>
                      <p className="font-medium">
                        {getRouteDetails(selectedShift.routeId)?.name || `Ruta #${selectedShift.routeId}`}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-neutral-500">Bus</p>
                      <p className="font-medium">
                        #{getBusDetails(selectedShift.busId)?.busNumber || selectedShift.busId}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-neutral-500">Horario</p>
                      <p className="font-medium">
                        {selectedShift.startTime} - {selectedShift.endTime}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-neutral-500">Estado de Reporte</p>
                      <div>{getStatusBadge(selectedStatus)}</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6">
                    <Info className="h-8 w-8 text-neutral-400 mb-2" />
                    <p className="text-neutral-500 text-center">
                      Seleccione un turno para ver la información
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Historial de Actualizaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="today">
                <TabsList className="mb-4">
                  <TabsTrigger value="today">Hoy</TabsTrigger>
                  <TabsTrigger value="all">Todo</TabsTrigger>
                </TabsList>
                
                <TabsContent value="today">
                  {locationUpdateHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-neutral-500">No hay actualizaciones hoy</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {locationUpdateHistory.map((update, index) => (
                        <div key={index} className="flex items-start border-b border-neutral-200 pb-4 last:border-0">
                          <div className="flex-shrink-0 w-8 flex flex-col items-center">
                            <div className={`w-2 h-2 rounded-full ${
                              update.status === 'on-time' ? 'bg-success' :
                              update.status === 'delayed' ? 'bg-warning' : 'bg-error'
                            }`}></div>
                            <div className={`w-0.5 h-full bg-neutral-200 ${
                              index === locationUpdateHistory.length - 1 ? 'hidden' : ''
                            }`}></div>
                          </div>
                          <div className="ml-2 flex-1">
                            <div className="flex justify-between">
                              <div className="flex items-center">
                                <p className="text-sm font-medium text-neutral-900">
                                  Ubicación reportada
                                </p>
                                <div className="ml-2">
                                  {getStatusBadge(update.status)}
                                </div>
                              </div>
                              <p className="text-xs text-neutral-500">{formatTime(update.time)}</p>
                            </div>
                            <p className="text-xs text-neutral-600 mt-1">
                              Coordenadas: {update.coordinates}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="all">
                  {locationUpdateHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-neutral-500">No hay historial de actualizaciones</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {locationUpdateHistory.map((update, index) => (
                        <div key={index} className="flex items-start border-b border-neutral-200 pb-4 last:border-0">
                          <div className="flex-shrink-0 w-8 flex flex-col items-center">
                            <div className={`w-2 h-2 rounded-full ${
                              update.status === 'on-time' ? 'bg-success' :
                              update.status === 'delayed' ? 'bg-warning' : 'bg-error'
                            }`}></div>
                            <div className={`w-0.5 h-full bg-neutral-200 ${
                              index === locationUpdateHistory.length - 1 ? 'hidden' : ''
                            }`}></div>
                          </div>
                          <div className="ml-2 flex-1">
                            <div className="flex justify-between">
                              <div className="flex items-center">
                                <p className="text-sm font-medium text-neutral-900">
                                  Ubicación reportada
                                </p>
                                <div className="ml-2">
                                  {getStatusBadge(update.status)}
                                </div>
                              </div>
                              <p className="text-xs text-neutral-500">{formatTime(update.time)}</p>
                            </div>
                            <p className="text-xs text-neutral-600 mt-1">
                              Coordenadas: {update.coordinates}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
