import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Shift, Bus, Route, Schedule } from "@/lib/types";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar, CheckCircle, Clock, Info, Loader2 } from "lucide-react";

export default function MyShifts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Get all shifts for this driver
  const { data: shifts = [], isLoading: isLoadingShifts } = useQuery<Shift[]>({
    queryKey: ['/api/shifts', { driverId: user?.id }],
    enabled: !!user?.id,
  });

  // Reference data for buses and routes
  const { data: buses = [] } = useQuery<Bus[]>({
    queryKey: ['/api/buses'],
  });

  const { data: routes = [] } = useQuery<Route[]>({
    queryKey: ['/api/routes'],
  });

  const { data: schedules = [] } = useQuery<Schedule[]>({
    queryKey: ['/api/schedules'],
  });

  // Filter shifts by status
  const currentShifts = shifts.filter(shift => shift.status === 'in-progress');
  const upcomingShifts = shifts.filter(shift => shift.status === 'scheduled');
  const pastShifts = shifts.filter(shift => ['completed', 'cancelled'].includes(shift.status));

  // Helper functions to get related entity details
  const getBusDetails = (busId: number) => {
    return buses.find(bus => bus.id === busId);
  };

  const getRouteDetails = (routeId: number) => {
    return routes.find(route => route.id === routeId);
  };

  const getScheduleDetails = (scheduleId: number) => {
    return schedules.find(schedule => schedule.id === scheduleId);
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, 'dd/MM/yyyy');
    } catch {
      return dateStr;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary">Programado</Badge>;
      case 'in-progress':
        return <Badge variant="success">En progreso</Badge>;
      case 'completed':
        return <Badge variant="default">Completado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Handle "start shift" button
  const handleStartShift = async (shiftId: number) => {
    setUpdating(true);
    try {
      await apiRequest('PATCH', `/api/shifts/${shiftId}`, {
        status: 'in-progress'
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      
      toast({
        title: "Turno iniciado",
        description: "Ha comenzado su turno de manera exitosa",
      });
    } catch (error) {
      console.error("Error starting shift:", error);
      toast({
        title: "Error",
        description: "No se pudo iniciar el turno",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Handle "complete shift" button
  const handleCompleteShift = async (shiftId: number) => {
    setUpdating(true);
    try {
      await apiRequest('PATCH', `/api/shifts/${shiftId}`, {
        status: 'completed'
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      
      toast({
        title: "Turno completado",
        description: "Ha finalizado su turno de manera exitosa",
      });
    } catch (error) {
      console.error("Error completing shift:", error);
      toast({
        title: "Error",
        description: "No se pudo completar el turno",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Show shift details dialog
  const showShiftDetails = (shift: Shift) => {
    setSelectedShift(shift);
    setIsDetailsOpen(true);
  };

  // Render shift details
  const renderShiftDetails = () => {
    if (!selectedShift) return null;
    
    const bus = getBusDetails(selectedShift.busId);
    const route = getRouteDetails(selectedShift.routeId);
    const schedule = getScheduleDetails(selectedShift.scheduleId);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Fecha</p>
            <p className="text-sm text-neutral-600">{formatDate(selectedShift.date)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Horario</p>
            <p className="text-sm text-neutral-600">{selectedShift.startTime} - {selectedShift.endTime}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-primary"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 5l7 7-7 7" 
            />
          </svg>
          <div>
            <p className="font-medium">Bus</p>
            <p className="text-sm text-neutral-600">#{bus?.busNumber || selectedShift.busId}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-primary"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" 
            />
          </svg>
          <div>
            <p className="font-medium">Ruta</p>
            <p className="text-sm text-neutral-600">{route?.name || `Ruta #${selectedShift.routeId}`}</p>
          </div>
        </div>
        
        {schedule && (
          <div className="flex items-center space-x-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-primary"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <div>
              <p className="font-medium">Días programados</p>
              <p className="text-sm text-neutral-600">
                {schedule.weekdays.split(',').map(day => {
                  const dayNum = parseInt(day);
                  return ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][dayNum];
                }).join(', ')}
              </p>
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Info className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Estado</p>
            <div className="mt-1">{getStatusBadge(selectedShift.status)}</div>
          </div>
        </div>
        
        {selectedShift.status === 'scheduled' && (
          <Button 
            className="w-full mt-4" 
            onClick={() => handleStartShift(selectedShift.id)}
            disabled={updating}
          >
            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Iniciar Turno
          </Button>
        )}
        
        {selectedShift.status === 'in-progress' && (
          <Button 
            className="w-full mt-4" 
            onClick={() => handleCompleteShift(selectedShift.id)}
            disabled={updating}
          >
            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Completar Turno
          </Button>
        )}
      </div>
    );
  };

  // Render shift table
  const renderShiftTable = (shifts: Shift[]) => {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Horario</TableHead>
            <TableHead>Ruta</TableHead>
            <TableHead>Bus</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shifts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                No hay turnos en esta categoría
              </TableCell>
            </TableRow>
          ) : (
            shifts.map((shift) => {
              const route = getRouteDetails(shift.routeId);
              const bus = getBusDetails(shift.busId);
              
              return (
                <TableRow key={shift.id}>
                  <TableCell>{formatDate(shift.date)}</TableCell>
                  <TableCell>{shift.startTime} - {shift.endTime}</TableCell>
                  <TableCell>{route?.name || `Ruta #${shift.routeId}`}</TableCell>
                  <TableCell>#{bus?.busNumber || shift.busId}</TableCell>
                  <TableCell>{getStatusBadge(shift.status)}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => showShiftDetails(shift)}
                        >
                          Ver detalles
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium text-neutral-900">Mis Turnos</h2>
      </div>

      {isLoadingShifts ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {currentShifts.length > 0 && (
            <Card className="mb-6">
              <CardHeader className="bg-success bg-opacity-5 border-b">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-success mr-2" />
                  <CardTitle>Turno Actual</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {currentShifts.map(shift => {
                  const route = getRouteDetails(shift.routeId);
                  const bus = getBusDetails(shift.busId);
                  
                  return (
                    <div key={shift.id} className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-neutral-500">Ruta</p>
                        <p className="text-lg font-semibold">{route?.name || `Ruta #${shift.routeId}`}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-neutral-500">Bus</p>
                        <p className="text-lg font-semibold">#{bus?.busNumber || shift.busId}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-neutral-500">Horario</p>
                        <p className="text-lg font-semibold">{shift.startTime} - {shift.endTime}</p>
                      </div>
                      
                      <div className="md:col-span-3 flex justify-end">
                        <Button
                          variant="outline"
                          onClick={() => showShiftDetails(shift)}
                          className="mr-2"
                        >
                          Ver detalles
                        </Button>
                        
                        <Button
                          onClick={() => handleCompleteShift(shift.id)}
                          disabled={updating}
                        >
                          {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Completar Turno
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="upcoming">
                <TabsList className="mb-4">
                  <TabsTrigger value="upcoming">Próximos</TabsTrigger>
                  <TabsTrigger value="past">Completados</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upcoming">
                  {renderShiftTable(upcomingShifts)}
                </TabsContent>
                
                <TabsContent value="past">
                  {renderShiftTable(pastShifts)}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {/* Shift Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles del Turno</DialogTitle>
            <DialogDescription>
              Información completa sobre el turno seleccionado
            </DialogDescription>
          </DialogHeader>
          
          {renderShiftDetails()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
