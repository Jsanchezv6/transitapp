import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Form validation schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Form definition
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Form submission handler
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoggingIn(true);
    try {
      await login(data.username, data.password);
      
      toast({
        title: "Acceso exitoso",
        description: "Bienvenido al sistema de transporte público.",
      });
      
      // Redirect to dashboard based on role (handled in AuthLayout)
      setLocation("/");
    } catch (error) {
      console.error("Login error:", error);
      
      toast({
        title: "Error de inicio de sesión",
        description: "Usuario o contraseña incorrectos.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-neutral-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium text-neutral-900">
            Sistema de Gestión de Transporte Público
          </h1>
          <p className="text-neutral-600 mt-2">
            Ingrese sus credenciales para acceder
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuario</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ingrese su nombre de usuario"
                      {...field}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      disabled={isLoggingIn}
                    />
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
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Ingrese su contraseña"
                      {...field}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      disabled={isLoggingIn}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Iniciar sesión
            </Button>
          </form>
        </Form>

        <div className="mt-4 text-center">
          <a href="#" className="text-sm text-primary hover:text-primary-dark">
            ¿Olvidó su contraseña?
          </a>
        </div>
      </div>
    </div>
  );
}
