import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shift, Bus, Route } from '@/lib/types';
import { useAuth } from '@/lib/auth.tsx';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type IncidentType = 'traffic' | 'mechanical' | 'weather' | 'other';

export default function DriverMap() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incidentType, setIncidentType] = useState<IncidentType>('traffic');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [isReportOpen, setIsReportOpen] = useState(false);
  
  // Get driver's active shift
  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ['/api/shifts', { driverId: user?.id, status: 'in-progress' }],
  });
  
  const activeShift = shifts[0]; // Assume first in-progress shift is the active one
  
  // Get bus and route details
  const { data: bus } = useQuery<Bus>({
    queryKey: ['/api/buses', activeShift?.busId],
    enabled: !!activeShift?.busId,
  });
  
  const { data: route } = useQuery<Route>({
    queryKey: ['/api/routes', activeShift?.routeId],
    enabled: !!activeShift?.routeId,
  });
  
  const handleReportIncident = async () => {
    if (!activeShift) return;
    
    try {
      // Update shift status to 'incident'
      await apiRequest('PATCH', `/api/shifts/${activeShift.id}`, {
        status: 'incident'
      });
      
      // Report location with incident status
      await apiRequest('POST', '/api/bus-locations', {
        busId: activeShift.busId,
        shiftId: activeShift.id,
        latitude: 0, // In a real app, would use device location
        longitude: 0, // In a real app, would use device location
        status: 'incident',
        details: `${incidentType}: ${incidentDescription}`
      });
      
      toast({
        title: 'Incidente reportado',
        description: 'El incidente ha sido reportado con éxito',
        variant: 'default',
      });
      
      setIsReportOpen(false);
    } catch (error) {
      console.error('Error reporting incident:', error);
      toast({
        title: 'Error',
        description: 'No se pudo reportar el incidente',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-neutral-200">
        <h3 className="text-lg font-medium text-neutral-900">
          Mi ruta actual {route ? `- ${route.name}` : ''}
        </h3>
      </div>
      <div className="p-4">
        <div className="bg-neutral-200 h-80 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <span className="material-icons text-neutral-400 text-5xl">map</span>
            <p className="text-neutral-500 mt-2">
              {activeShift 
                ? `Ruta actual: ${route?.name || 'Cargando...'} - Bus #${bus?.busNumber || 'Cargando...'}`
                : 'No hay una ruta activa en este momento'}
            </p>
          </div>
        </div>
        
        <div className="mt-4">
          <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
            <DialogTrigger asChild>
              <Button 
                className="w-full flex items-center justify-center" 
                disabled={!activeShift}
              >
                <AlertTriangle className="mr-1 h-4 w-4" />
                Reportar incidente en la ruta
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reportar incidente</DialogTitle>
                <DialogDescription>
                  Proporcione detalles sobre el incidente que está experimentando.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de incidente</label>
                  <Select 
                    value={incidentType} 
                    onValueChange={(value) => setIncidentType(value as IncidentType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione el tipo de incidente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="traffic">Tráfico</SelectItem>
                      <SelectItem value="mechanical">Mecánico</SelectItem>
                      <SelectItem value="weather">Clima</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descripción</label>
                  <Textarea
                    placeholder="Describa el incidente en detalle..."
                    value={incidentDescription}
                    onChange={(e) => setIncidentDescription(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsReportOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleReportIncident}>
                  Reportar incidente
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
