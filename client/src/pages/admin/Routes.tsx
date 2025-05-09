import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Route as BusRoute, InsertRoute, RouteStop, InsertRouteStop } from "@/lib/types";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PlusCircle, Loader2, Edit, MapPin } from "lucide-react";

// Form validation schema
const routeFormSchema = z.object({
  name: z.string().min(1, "Route name is required"),
  description: z.string().min(1, "Description is required"),
  startPoint: z.string().min(1, "Start point is required"),
  endPoint: z.string().min(1, "End point is required"),
  active: z.boolean().default(true),
});

type RouteFormValues = z.infer<typeof routeFormSchema>;

// Stop validation schema
const stopFormSchema = z.object({
  name: z.string().min(1, "Stop name is required"),
  order: z.number().int().min(1, "Order is required"),
  arrivalTime: z.string().optional(),
});

type StopFormValues = z.infer<typeof stopFormSchema>;

export default function Routes() {
  const { toast } = useToast();
  const [isAddRouteOpen, setIsAddRouteOpen] = useState(false);
  const [isAddStopOpen, setIsAddStopOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(null);
  const [selectedRouteForStop, setSelectedRouteForStop] = useState<BusRoute | null>(null);

  // Get routes
  const { data: routes = [], isLoading: isLoadingRoutes } = useQuery<BusRoute[]>({
    queryKey: ['/api/routes'],
  });

  // Get route stops
  const { data: routeStops = {}, isLoading: isLoadingStops } = useQuery({
    queryKey: ['/api/routeStops'],
    queryFn: async () => {
      const result: Record<number, RouteStop[]> = {};
      
      for (const route of routes) {
        const response = await fetch(`/api/routes/${route.id}/stops`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          }
        });
        
        if (response.ok) {
          result[route.id] = await response.json();
        }
      }
      
      return result;
    },
    enabled: routes.length > 0,
  });

  // Route form
  const routeForm = useForm<RouteFormValues>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: {
      name: "",
      description: "",
      startPoint: "",
      endPoint: "",
      active: true,
    },
  });

  // Stop form
  const stopForm = useForm<StopFormValues>({
    resolver: zodResolver(stopFormSchema),
    defaultValues: {
      name: "",
      order: 1,
      arrivalTime: "",
    },
  });

  // Create route mutation
  const createRoute = useMutation({
    mutationFn: async (routeData: InsertRoute) => {
      const response = await apiRequest('POST', '/api/routes', routeData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
      toast({
        title: "Ruta creada",
        description: "La ruta ha sido creada exitosamente",
      });
      setIsAddRouteOpen(false);
      routeForm.reset();
    },
    onError: (error) => {
      console.error("Error creating route:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la ruta",
        variant: "destructive",
      });
    },
  });

  // Update route mutation
  const updateRoute = useMutation({
    mutationFn: async (data: { id: number; routeData: Partial<BusRoute> }) => {
      const response = await apiRequest('PATCH', `/api/routes/${data.id}`, data.routeData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
      toast({
        title: "Ruta actualizada",
        description: "La ruta ha sido actualizada exitosamente",
      });
      setSelectedRoute(null);
      routeForm.reset();
    },
    onError: (error) => {
      console.error("Error updating route:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la ruta",
        variant: "destructive",
      });
    },
  });

  // Create stop mutation
  const createStop = useMutation({
    mutationFn: async (data: { routeId: number; stopData: StopFormValues }) => {
      const response = await apiRequest('POST', `/api/routes/${data.routeId}/stops`, {
        ...data.stopData,
        routeId: data.routeId,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes', variables.routeId, 'stops'] });
      queryClient.invalidateQueries({ queryKey: ['/api/routeStops'] });
      toast({
        title: "Parada creada",
        description: "La parada ha sido añadida exitosamente",
      });
      setIsAddStopOpen(false);
      stopForm.reset();
    },
    onError: (error) => {
      console.error("Error creating stop:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la parada",
        variant: "destructive",
      });
    },
  });

  // Handle route form submission
  const onSubmitRoute = (data: RouteFormValues) => {
    if (selectedRoute) {
      updateRoute.mutate({ id: selectedRoute.id, routeData: data });
    } else {
      createRoute.mutate(data);
    }
  };

  // Handle stop form submission
  const onSubmitStop = (data: StopFormValues) => {
    if (selectedRouteForStop) {
      createStop.mutate({ routeId: selectedRouteForStop.id, stopData: data });
    }
  };

  // Edit route handler
  const handleEditRoute = (route: BusRoute) => {
    setSelectedRoute(route);
    routeForm.reset({
      name: route.name,
      description: route.description,
      startPoint: route.startPoint,
      endPoint: route.endPoint,
      active: route.active,
    });
    setIsAddRouteOpen(true);
  };

  // Add stop handler
  const handleAddStop = (route: BusRoute) => {
    setSelectedRouteForStop(route);
    
    // Set default order to next available
    const currentStops = routeStops[route.id] || [];
    const nextOrder = currentStops.length > 0 
      ? Math.max(...currentStops.map(stop => stop.order)) + 1 
      : 1;
    
    stopForm.reset({
      name: "",
      order: nextOrder,
      arrivalTime: "",
    });
    
    setIsAddStopOpen(true);
  };

  // Clear forms when dialogs close
  const handleRouteDialogChange = (open: boolean) => {
    setIsAddRouteOpen(open);
    if (!open) {
      setSelectedRoute(null);
      routeForm.reset();
    }
  };

  const handleStopDialogChange = (open: boolean) => {
    setIsAddStopOpen(open);
    if (!open) {
      setSelectedRouteForStop(null);
      stopForm.reset();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium text-neutral-900">Rutas</h2>
        <Dialog open={isAddRouteOpen} onOpenChange={handleRouteDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar Ruta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>
                {selectedRoute ? "Editar Ruta" : "Crear Nueva Ruta"}
              </DialogTitle>
              <DialogDescription>
                {selectedRoute
                  ? "Actualice los detalles de la ruta existente."
                  : "Complete los detalles para crear una nueva ruta."}
              </DialogDescription>
            </DialogHeader>
            <Form {...routeForm}>
              <form onSubmit={routeForm.handleSubmit(onSubmitRoute)} className="space-y-4">
                <FormField
                  control={routeForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Ruta</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Ruta 5 - Centro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={routeForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descripción de la ruta" 
                          {...field} 
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-4">
                  <FormField
                    control={routeForm.control}
                    name="startPoint"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Punto de Inicio</FormLabel>
                        <FormControl>
                          <Input placeholder="Punto de partida" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={routeForm.control}
                    name="endPoint"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Punto Final</FormLabel>
                        <FormControl>
                          <Input placeholder="Punto de llegada" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={routeForm.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Ruta Activa</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={createRoute.isPending || updateRoute.isPending}>
                    {(createRoute.isPending || updateRoute.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {selectedRoute ? "Actualizar" : "Crear"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modal for adding a stop */}
      <Dialog open={isAddStopOpen} onOpenChange={handleStopDialogChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Agregar Parada</DialogTitle>
            <DialogDescription>
              {selectedRouteForStop 
                ? `Añadir parada a la ruta: ${selectedRouteForStop.name}` 
                : "Añadir nueva parada a la ruta"}
            </DialogDescription>
          </DialogHeader>
          <Form {...stopForm}>
            <form onSubmit={stopForm.handleSubmit(onSubmitStop)} className="space-y-4">
              <FormField
                control={stopForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Parada</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Estación Central" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stopForm.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orden</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="Orden de la parada"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        min={1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stopForm.control}
                name="arrivalTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tiempo de Llegada (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: 10 mins desde inicio"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={createStop.isPending}>
                  {createStop.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Agregar Parada
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Rutas Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingRoutes ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {routes.map((route) => (
                <AccordionItem key={route.id} value={route.id.toString()}>
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
                    
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-medium">Paradas:</h4>
                      <Button size="sm" variant="outline" onClick={() => handleAddStop(route)}>
                        <PlusCircle className="h-3.5 w-3.5 mr-1" />
                        Agregar Parada
                      </Button>
                    </div>
                    
                    {isLoadingStops ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <>
                        {routeStops[route.id] && routeStops[route.id].length > 0 ? (
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
                      </>
                    )}
                    
                    <div className="mt-4 flex justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditRoute(route)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar Ruta
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
