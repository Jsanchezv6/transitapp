import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Schedule, InsertSchedule, Route as BusRoute } from "@/lib/types";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PlusCircle, Loader2, Edit, Calendar } from "lucide-react";

// Weekdays for checkbox selection
const weekdays = [
  { id: "1", label: "Lunes" },
  { id: "2", label: "Martes" },
  { id: "3", label: "Miércoles" },
  { id: "4", label: "Jueves" },
  { id: "5", label: "Viernes" },
  { id: "6", label: "Sábado" },
  { id: "7", label: "Domingo" },
];

// Form validation schema
const scheduleFormSchema = z.object({
  routeId: z.number().int().positive("Route is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  weekdays: z.array(z.string()).min(1, "At least one weekday must be selected"),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

export default function Schedules() {
  const { toast } = useToast();
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  // Get schedules
  const { data: schedules = [], isLoading: isLoadingSchedules } = useQuery<Schedule[]>({
    queryKey: ['/api/schedules'],
  });

  // Get routes for select
  const { data: routes = [], isLoading: isLoadingRoutes } = useQuery<BusRoute[]>({
    queryKey: ['/api/routes/active'],
  });

  // Form definition
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      routeId: 0,
      startTime: "",
      endTime: "",
      weekdays: [],
    },
  });

  // Create schedule mutation
  const createSchedule = useMutation({
    mutationFn: async (scheduleData: InsertSchedule) => {
      const response = await apiRequest('POST', '/api/schedules', scheduleData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      toast({
        title: "Horario creado",
        description: "El horario ha sido creado exitosamente",
      });
      setIsAddScheduleOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Error creating schedule:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el horario",
        variant: "destructive",
      });
    },
  });

  // Update schedule mutation
  const updateSchedule = useMutation({
    mutationFn: async (data: { id: number; scheduleData: Partial<Schedule> }) => {
      const response = await apiRequest('PATCH', `/api/schedules/${data.id}`, data.scheduleData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      toast({
        title: "Horario actualizado",
        description: "El horario ha sido actualizado exitosamente",
      });
      setSelectedSchedule(null);
      form.reset();
    },
    onError: (error) => {
      console.error("Error updating schedule:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el horario",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: ScheduleFormValues) => {
    // Convert weekdays array to string format "1,2,3,..."
    const weekdaysString = data.weekdays.join(",");
    
    const scheduleData = {
      ...data,
      weekdays: weekdaysString,
    };

    if (selectedSchedule) {
      updateSchedule.mutate({ id: selectedSchedule.id, scheduleData });
    } else {
      createSchedule.mutate(scheduleData);
    }
  };

  // Edit schedule handler
  const handleEditSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    
    // Parse weekdays string back to array
    const weekdaysArray = schedule.weekdays.split(",");
    
    form.reset({
      routeId: schedule.routeId,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      weekdays: weekdaysArray,
    });
    
    setIsAddScheduleOpen(true);
  };

  // Get route name by id
  const getRouteName = (routeId: number) => {
    const route = routes.find(r => r.id === routeId);
    return route ? route.name : 'Unknown Route';
  };

  // Format weekdays for display
  const formatWeekdays = (weekdaysString: string) => {
    const weekdayIds = weekdaysString.split(",");
    
    return weekdayIds.map(id => {
      const day = weekdays.find(d => d.id === id);
      return day ? day.label.substring(0, 3) : '';
    }).join(", ");
  };

  // Clear form when dialog closes
  const handleDialogChange = (open: boolean) => {
    setIsAddScheduleOpen(open);
    if (!open) {
      setSelectedSchedule(null);
      form.reset();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium text-neutral-900">Horarios</h2>
        <Dialog open={isAddScheduleOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar Horario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedSchedule ? "Editar Horario" : "Crear Nuevo Horario"}
              </DialogTitle>
              <DialogDescription>
                {selectedSchedule
                  ? "Actualice los detalles del horario existente."
                  : "Complete los detalles para crear un nuevo horario."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="routeId"
                  render={({ field }) => (
                    <FormItem>
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
                  name="weekdays"
                  render={() => (
                    <FormItem>
                      <FormLabel>Días de la Semana</FormLabel>
                      <div className="flex flex-wrap gap-4 mt-2">
                        {weekdays.map((day) => (
                          <FormField
                            key={day.id}
                            control={form.control}
                            name="weekdays"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={day.id}
                                  className="flex flex-row items-center space-x-2"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(day.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, day.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== day.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {day.label}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={createSchedule.isPending || updateSchedule.isPending}>
                    {(createSchedule.isPending || updateSchedule.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {selectedSchedule ? "Actualizar" : "Crear"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Horarios Programados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSchedules || isLoadingRoutes ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Ruta</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Días</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>{schedule.id}</TableCell>
                    <TableCell>{getRouteName(schedule.routeId)}</TableCell>
                    <TableCell>
                      {schedule.startTime} - {schedule.endTime}
                    </TableCell>
                    <TableCell>{formatWeekdays(schedule.weekdays)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSchedule(schedule)}
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
