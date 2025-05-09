import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { User, InsertUser } from "@/lib/types";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { PlusCircle, Loader2, Edit, UserCog } from "lucide-react";

// Form validation schema
const userFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["admin", "driver"]),
  active: z.boolean().default(true),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function Users() {
  const { toast } = useToast();
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Get users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Create user mutation
  const createUser = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const response = await apiRequest('POST', '/api/users', userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente",
      });
      setIsAddUserOpen(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el usuario",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUser = useMutation({
    mutationFn: async (data: { id: number; userData: Partial<User> }) => {
      const response = await apiRequest('PATCH', `/api/users/${data.id}`, data.userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado exitosamente",
      });
      setSelectedUser(null);
      form.reset();
    },
    onError: (error) => {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el usuario",
        variant: "destructive",
      });
    },
  });

  // Form definition
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "driver",
      active: true,
    },
  });

  // Handle form submission
  const onSubmit = (data: UserFormValues) => {
    if (selectedUser) {
      updateUser.mutate({ id: selectedUser.id, userData: data });
    } else {
      createUser.mutate(data);
    }
  };

  // Edit user handler
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    form.reset({
      username: user.username,
      password: "", // Don't populate password for security reasons
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as "admin" | "driver",
      active: user.active,
    });
    setIsAddUserOpen(true);
  };

  // Clear form when dialog closes
  const handleDialogChange = (open: boolean) => {
    setIsAddUserOpen(open);
    if (!open) {
      setSelectedUser(null);
      form.reset();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium text-neutral-900">Usuarios</h2>
        <Dialog open={isAddUserOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Agregar Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {selectedUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
              </DialogTitle>
              <DialogDescription>
                {selectedUser
                  ? "Actualice los detalles del usuario existente."
                  : "Complete los detalles para crear un nuevo usuario."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuario</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de usuario" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {selectedUser ? "Nueva Contraseña (opcional)" : "Contraseña"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Contraseña"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Apellido</FormLabel>
                        <FormControl>
                          <Input placeholder="Apellido" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="driver">Chofer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Usuario Activo</FormLabel>
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
                  <Button type="submit" disabled={createUser.isPending || updateUser.isPending}>
                    {(createUser.isPending || updateUser.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {selectedUser ? "Actualizar" : "Crear"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
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
                  <TableHead>Usuario</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.firstName} {user.lastName}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "info"}>
                        {user.role === "admin" ? "Administrador" : "Chofer"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.active ? "success" : "destructive"}>
                        {user.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
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
