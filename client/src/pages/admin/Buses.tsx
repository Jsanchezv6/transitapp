import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bus, InsertBus } from "@/lib/types";
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
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PlusCircle, Loader2, Edit } from "lucide-react";

// Form validation schema
const busFormSchema = z.object({
  busNumber: z.string().min(1, "Bus number is required"),
  status: z.enum(["active", "inactive", "maintenance"]),
  capacity: z.number().int().min(1, "Capacity must be at least 1"),
});

type BusFormValues = z.infer<typeof busFormSchema>;

export default function Buses() {
  const { toast } = useToast();
  const [isAddBusOpen, setIsAddBusOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

  // Get buses
  const { data: buses = [], isLoading } = useQuery<Bus[]>({
    queryKey: ['/api/buses'],
  });

  // Create bus mutation
  const createBus = useMutation({
    mutationFn: async (busData: InsertBus) => {
      const response = await apiRequest('POST', '/api/buses', busData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/buses'] });
      toast({
        title: "Bus creado",
        description: "El bus ha sido creado exitosamente",
      });
      setIsAddBusOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Error creating bus:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el bus",
        variant: "destructive",
      });
    },
  });

  // Update bus mutation
  const updateBus = useMutation({
    mutationFn: async (data: { id: number; busData: Partial<Bus> }) => {
      const response = await apiRequest('PATCH', `/api/buses/${data.id}`, data.busData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/buses'] });
      toast({
        title: "Bus actualizado",
        description: "El bus ha sido actualizado exitosamente",
      });
      setSelectedBus(null);
      form.reset();
    },
    onError: (error) => {
      console.error("Error updating bus:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el bus",
        variant: "destructive",
      });
    },
  });

  // Form definition
  const form = useForm<BusFormValues>({
    resolver: zodResolver(busFormSchema),
    defaultValues: {
      busNumber: "",
      status: "inactive",
      capacity: 40,
    },
  });

  // Handle form submission
  const onSubmit = (data: BusFormValues) => {
    if (selectedBus) {
      updateBus.mutate({ id: selectedBus.id, busData: data });
    } else {
      createBus.mutate(data);
    }
  };

  // Edit bus handler
  const handleEditBus = (bus: Bus) => {
    setSelectedBus(bus);
    form.reset({
      busNumber: bus.busNumber,
      status: bus.status as "active" | "inactive" | "maintenance",
      capacity: bus.capacity,
    });
    setIsAddBusOpen(true);
  };

  // Clear form when dialog closes
  const handleDialogChange = (open: boolean) => {
    setIsAddBusOpen(open);
    if (!open) {
      setSelectedBus(null);
      form.reset();
    }
  };

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "inactive":
        return "secondary";
      case "maintenance":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Activo";
      case "inactive":
        return "Inactivo";
      case "maintenance":
        return "En mantenimiento";
      default:
        return status;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium text-neutral-900">Buses</h2>
        <Dialog open={isAddBusOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar Bus
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {selectedBus ? "Editar Bus" : "Registrar Nuevo Bus"}
              </DialogTitle>
              <DialogDescription>
                {selectedBus
                  ? "Actualice los detalles del bus existente."
                  : "Complete los detalles para registrar un nuevo bus."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="busNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Bus</FormLabel>
                      <FormControl>
                        <Input placeholder="Número de identificación" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="inactive">Inactivo</SelectItem>
                          <SelectItem value="maintenance">En mantenimiento</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidad</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Capacidad de pasajeros" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          min={1}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={createBus.isPending || updateBus.isPending}>
                    {(createBus.isPending || updateBus.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {selectedBus ? "Actualizar" : "Crear"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flota de Buses</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buses.map((bus) => (
                  <TableRow key={bus.id}>
                    <TableCell>{bus.id}</TableCell>
                    <TableCell className="font-medium">#{bus.busNumber}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(bus.status)}>
                        {getStatusLabel(bus.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{bus.capacity} pasajeros</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditBus(bus)}
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
