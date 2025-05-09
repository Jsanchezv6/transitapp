import { useState, useEffect } from 'react';
import { useBusLocations } from '@/lib/websocket';
import { Button } from '@/components/ui/button';
import { Maximize2 } from 'lucide-react';

interface BusMapProps {
  expandable?: boolean;
}

export default function BusMap({ expandable = true }: BusMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { locations, connected } = useBusLocations();

  // Toggle fullscreen view
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // For a real implementation, this would integrate with a mapping library
  // like Leaflet, Google Maps, or Mapbox to show actual bus locations
  return (
    <div className={`bg-white rounded-lg shadow-sm ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="p-4 border-b border-neutral-200">
        <h3 className="text-lg font-medium text-neutral-900">Monitoreo en tiempo real</h3>
      </div>
      <div className="p-4">
        {/* Map placeholder - would be replaced with actual map component */}
        <div className="bg-neutral-200 h-96 rounded-lg flex items-center justify-center">
          <div className="text-center">
            {connected ? (
              <>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-16 w-16 text-neutral-400 mx-auto"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" 
                  />
                </svg>
                <p className="text-neutral-500 mt-2">
                  {locations.length > 0 
                    ? `Mostrando ubicaciones de ${locations.length} buses`
                    : "Mapa de monitoreo en tiempo real"}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Conexión en tiempo real establecida
                </p>
              </>
            ) : (
              <>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-16 w-16 text-neutral-400 mx-auto"
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <p className="text-neutral-500 mt-2">Conectando al servicio de monitoreo...</p>
              </>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex justify-between">
          <div className="flex space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-success rounded-full mr-2"></div>
              <span className="text-sm text-neutral-600">En horario</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-warning rounded-full mr-2"></div>
              <span className="text-sm text-neutral-600">Con retraso</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-error rounded-full mr-2"></div>
              <span className="text-sm text-neutral-600">Incidente</span>
            </div>
          </div>
          
          {expandable && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleFullscreen}
              className="text-primary text-sm hover:text-primary-dark flex items-center"
            >
              <Maximize2 className="mr-1 h-4 w-4" />
              Ver pantalla completa
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
