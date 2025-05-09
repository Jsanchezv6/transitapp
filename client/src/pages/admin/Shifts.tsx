import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Shift, InsertShift, User, Bus, Route as BusRoute, Schedule } from "@/lib/types";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PlusCircle, Loader2, Edit, CalendarIcon } from "lucide-react";
import { format } from "date-fns";

// Form validation schema
const shiftFormSchema = z.object({
  driverId: z.number().int().positive("Driver is required"),
  busId: z.number().int().positive("Bus is required"),
  routeId: z.number().int().positive("Route is required"),
  scheduleId: z.number().int().positive("Schedule is required"),
  date: z.date({ required_error: "Date is required" }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  status: z.enum(["scheduled", "in-progress", "completed", "cancelled"]),
});

type ShiftFormValues = z.infer<typeof shiftFormSchema>;

export default function Shifts() {
  const { toast } = useToast();
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);

  // Get shifts
  const { data: shifts = [], isLoading: isLoadingShifts } = useQuery<Shift[]>({
    queryKey: ['/api/shifts'],
  });

  // Get drivers (users with role 'driver')
  const { data: drivers = [], isLoading: isLoadingDrivers } = useQuery<User[]>({
    queryKey: ['/api/users', { role: 'driver' }],
  });

  // Get active buses
  const { data: buses = [], isLoading: isLoadingBuses } = useQuery<Bus[]>({
    queryKey: ['/api/buses/active'],
  });

  // Get active routes
  const { data: routes = [], isLoading: isLoadingRoutes } = useQuery<BusRoute[]>({
    queryKey: ['/api/routes/active'],
  });

  // Get schedules filtered by selected route
  const { data: schedules = [], isLoading: isLoadingSchedules } = useQuery<Schedule[]>({
    queryKey: ['/api/schedules', { routeId: selectedRoute }],
    enabled: selectedRoute !== null,
  });

  // Form definition
  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      driverId: 0,
      busId: 0,
      routeId: 0,
      scheduleId: 0,
      date: new Date(),
      startTime: "",
      endTime: "",
      status: "scheduled",
    },
  });

  // Watch for route changes to update schedules
  const watchedRouteId = form.watch("routeId");
  if (watchedRouteId !== selectedRoute && watchedRouteId > 0) {
    setSelectedRoute(watchedRouteId);
  }

  // Create shift mutation
  const createShift = useMutation({
    mutationFn: async (shiftData: InsertShift) => {
      const response = await apiRequest('POST', '/api/shifts', shiftData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      toast({
        title: "Turno creado",
        description: "El turno ha sido creado exitosamente",
      });
      setIsAddShiftOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Error creating shift:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el turno",
        variant: "destructive",
      });
    },
  });

  // Update shift mutation
  const updateShift = useMutation({
    mutationFn: async (data: { id: number; shiftData: Partial<Shift> }) => {
      const response = await apiRequest('PATCH', `/api/shifts/${data.id}`, data.shiftData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shifts'] });
      toast({
        title: "Turno actualizado",
        description: "El turno ha sido actualizado exitosamente",
      });
      setSelectedShift(null);
      form.reset();
    },
    onError: (error) => {
      console.error("Error updating shift:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el turno",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: ShiftFormValues) => {
    // Format date to YYYY-MM-DD
    const formattedDate = format(data.date, "yyyy-MM-dd");
    
    const shiftData = {
      ...data,
      date: formattedDate,
    };

    if (selectedShift) {
      updateShift.mutate({ id: selectedShift.id, shiftData });
    } else {
      createShift.mutate(shiftData as InsertShift);
    }
  };

  // Edit shift handler
  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    setSelectedRoute(shift.routeId);
    
    // Parse date string to Date object
    const shiftDate = new Date(shift.date);
    
    form.reset({
      driverId: shift.driverId,
      busId: shift.busId,
      routeId: shift.routeId,
      scheduleId: shift.scheduleId,
      date: shiftDate,
      startTime: shift.startTime,
      endTime: shift.endTime,
      status: shift.status as "scheduled" | "in-progress" | "completed" | "cancelled",
    });
    
    setIsAddShiftOpen(true);
  };

  // Get entity names by their IDs
  const getDriverName = (driverId: number) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? `${driver.firstName} ${driver.lastName}` : 'Unknown Driver';
  };

  const getBusNumber = (busId: number) => {
    const bus = buses.find(b => b.id === busId);
    return bus ? bus.busNumber : 'Unknown Bus';
  };

  const getRouteName = (routeId: number) => {
    const route = routes.find(r => r.id === routeId);
    return route ? route.name : 'Unknown Route';
  };

  // Get schedule times by id
  const getScheduleTimes = (scheduleId: number) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    return schedule ? `${schedule.startTime} - ${schedule.endTime}` : 'N/A';
  };

  // Format status for display
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="secondary">Programado</Badge>;
      case "in-progress":
        return <Badge variant="success">En progreso</Badge>;
      case "completed":
        return <Badge variant="default">Completado</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Clear form when dialog closes
  const handleDialogChange = (open: boolean) => {
    setIsAddShiftOpen(open);
    if (!open) {
      setSelectedShift(null);
      setSelectedRoute(null);
      form.reset();
    }
  };

  // Load default schedule times when a schedule is selected
  const handleScheduleChange = (scheduleId: number) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (schedule) {
      form.setValue("startTime", schedule.startTime);
      form.setValue("endTime", schedule.endTime);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium text-neutral-900">Turnos</h2>
        <Dialog open={isAddShiftOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Asignar Turno
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>
                {selectedShift ? "Editar Turno" : "Asignar Nuevo Turno"}
              </DialogTitle>
              <DialogDescription>
                {selectedShift
                  ? "Actualice los detalles del turno existente."
                  : "Complete los detalles para asignar un nuevo turno."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="driverId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chofer</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value ? field.value.toString() : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar chofer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {drivers.map((driver) => (
                            <SelectItem key={driver.id} value={driver.id.toString()}>
                              {driver.firstName} {driver.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-4">
                  <FormField
                    control={form.control}
                    name="busId"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Bus</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value ? field.value.toString() : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar bus" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {buses.map((bus) => (
                              <SelectItem key={bus.id} value={bus.id.toString()}>
                                Bus #{bus.busNumber}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="routeId"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Ruta</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value ? field.value.toString() : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar ruta" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {routes.map((route) => (
                              <SelectItem key={route.id} value={route.id.toString()}>
                                {route.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="scheduleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horario</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          const scheduleId = parseInt(value);
                          field.onChange(scheduleId);
                          handleScheduleChange(scheduleId);
                        }}
                        defaultValue={field.value ? field.value.toString() : undefined}
                        disabled={!selectedRoute || schedules.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              !selectedRoute 
                                ? "Seleccione una ruta primero" 
                                : schedules.length === 0
                                  ? "No hay horarios disponibles"
                                  : "Seleccionar horario"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {schedules.map((schedule) => (
                            <SelectItem key={schedule.id} value={schedule.id.toString()}>
                              {schedule.startTime} - {schedule.endTime} | {
                                schedule.weekdays.split(',').map(day => {
                                  const dayNum = parseInt(day);
                                  return ['', 'L', 'M', 'X', 'J', 'V', 'S', 'D'][dayNum];
                                }).join(', ')
                              }
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Seleccionar fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Hora de Inicio</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ej: 08:00" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Hora de Fin</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ej: 16:00" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="scheduled">Programado</SelectItem>
                          <SelectItem value="in-progress">En progreso</SelectItem>
                          <SelectItem value="completed">Completado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={createShift.isPending || updateShift.isPending}>
                    {(createShift.isPending || updateShift.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {selectedShift ? "Actualizar" : "Asignar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Turnos Asignados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingShifts || isLoadingDrivers || isLoadingBuses || isLoadingRoutes ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Chofer</TableHead>
                  <TableHead>Ruta</TableHead>
                  <TableHead>Bus</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>{shift.id}</TableCell>
                    <TableCell>{getDriverName(shift.driverId)}</TableCell>
                    <TableCell>{getRouteName(shift.routeId)}</TableCell>
                    <TableCell>#{getBusNumber(shift.busId)}</TableCell>
                    <TableCell>{shift.date}</TableCell>
                    <TableCell>
                      {shift.startTime} - {shift.endTime}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(shift.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditShift(shift)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
