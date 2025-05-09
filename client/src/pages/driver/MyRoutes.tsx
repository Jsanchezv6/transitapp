import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Shift, Route as BusRoute, RouteStop } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Map, MapPin, Info } from "lucide-react";

export default function MyRoutes() {
  const { user } = useAuth();
  const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Get shifts for this driver to determine assigned routes
  const { data: shifts = [], isLoading: isLoadingShifts } = useQuery<Shift[]>({
    queryKey: ['/api/shifts', { driverId: user?.id }],
    enabled: !!user?.id,
  });

  // Extract unique route IDs from shifts
  const routeIds = [...new Set(shifts.map(shift => shift.routeId))];

  // Get route details for each unique route ID
  const { data: routes = [], isLoading: isLoadingRoutes } = useQuery<BusRoute[]>({
    queryKey: ['/api/routes'],
    select: (routes) => routes.filter(route => routeIds.includes(route.id)),
    enabled: routeIds.length > 0,
  });

  // State to track expanded routes and their loaded stops
  const [routeStops, setRouteStops] = useState<Record<number, RouteStop[]>>({});
  const [loadingStops, setLoadingStops] = useState<Record<number, boolean>>({});

  // Load route stops when a route is expanded
  const handleLoadStops = async (routeId: number) => {
    // If already loaded, don't fetch again
    if (routeStops[routeId]) return;
    
    setLoadingStops(prev => ({ ...prev, [routeId]: true }));
    
    try {
      const response = await fetch(`/api/routes/${routeId}/stops`, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        }
      });
      
      if (response.ok) {
        const stops = await response.json();
        setRouteStops(prev => ({ ...prev, [routeId]: stops }));
      }
    } catch (error) {
      console.error('Error loading route stops:', error);
    } finally {
      setLoadingStops(prev => ({ ...prev, [routeId]: false }));
    }
  };

  // Show route details dialog
  const showRouteDetails = (route: BusRoute) => {
    setSelectedRoute(route);
    setIsDetailsOpen(true);
    
    // Ensure stops are loaded
    handleLoadStops(route.id);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium text-neutral-900">Mis Rutas</h2>
      </div>

      {isLoadingShifts || isLoadingRoutes ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : routes.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Info className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-800 mb-2">No hay rutas asignadas</h3>
            <p className="text-neutral-600">
              Actualmente no tiene rutas asignadas. Las rutas se asignarán cuando se le programen turnos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Rutas Asignadas</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {routes.map((route) => (
                <AccordionItem 
                  key={route.id} 
                  value={route.id.toString()} 
                  onFocus={() => handleLoadStops(route.id)}
                >
                  <AccordionTrigger className="hover:bg-neutral-50 px-4">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center">
                        <Badge variant={route.active ? "success" : "secondary"} className="mr-3">
                          {route.active ? "Activa" : "Inactiva"}
                        </Badge>
                        <span className="font-medium">{route.name}</span>
                      </div>
                      <div className="flex items-center text-sm text-neutral-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        {route.startPoint} → {route.endPoint}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-1">Descripción:</h4>
                      <p className="text-sm text-neutral-600">{route.description}</p>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Paradas:</h4>
                      
                      {loadingStops[route.id] ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : routeStops[route.id] && routeStops[route.id].length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Orden</TableHead>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Tiempo Llegada</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {routeStops[route.id]
                              .sort((a, b) => a.order - b.order)
                              .map((stop) => (
                              <TableRow key={stop.id}>
                                <TableCell>{stop.order}</TableCell>
                                <TableCell>{stop.name}</TableCell>
                                <TableCell>{stop.arrivalTime || 'N/A'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-neutral-500 py-2">
                          No hay paradas definidas para esta ruta.
                        </p>
                      )}
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => showRouteDetails(route)}
                        className="flex items-center"
                      >
                        <Map className="h-4 w-4 mr-1" />
                        Ver mapa completo
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Route Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedRoute?.name || 'Detalles de la Ruta'}</DialogTitle>
            <DialogDescription>
              Mapa y detalles completos de la ruta seleccionada
            </DialogDescription>
          </DialogHeader>
          
          {selectedRoute && (
            <div className="space-y-4">
              <div className="bg-neutral-200 h-72 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Map className="h-16 w-16 text-neutral-400 mx-auto" />
                  <p className="text-neutral-500 mt-2">Mapa de la ruta: {selectedRoute.name}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium">Descripción:</h4>
                  <p className="text-sm text-neutral-600">{selectedRoute.description}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium">Punto de inicio:</h4>
                  <p className="text-sm text-neutral-600">{selectedRoute.startPoint}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium">Punto final:</h4>
                  <p className="text-sm text-neutral-600">{selectedRoute.endPoint}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Paradas en orden:</h4>
                
                {loadingStops[selectedRoute.id] ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : routeStops[selectedRoute.id] && routeStops[selectedRoute.id].length > 0 ? (
                  <div className="space-y-2">
                    {routeStops[selectedRoute.id]
                      .sort((a, b) => a.order - b.order)
                      .map((stop, index) => (
                        <div 
                          key={stop.id} 
                          className="flex items-center p-2 rounded-md bg-neutral-100"
                        >
                          <div className="h-6 w-6 rounded-full flex items-center justify-center bg-primary text-white mr-3">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{stop.name}</p>
                            {stop.arrivalTime && (
                              <p className="text-xs text-neutral-500">
                                Tiempo estimado: {stop.arrivalTime}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500 py-2">
                    No hay paradas definidas para esta ruta.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
