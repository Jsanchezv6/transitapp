import { useQuery } from '@tanstack/react-query';
import { Bus, Route, User, Shift } from '@/lib/types';
import { 
  AlertTriangle, 
  Users, 
  MapPin,
  Bus as BusIcon
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: string;
  icon: React.ReactNode;
  iconBgColor: string;
  changeTextColor?: string;
}

const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon, 
  iconBgColor,
  changeTextColor = 'text-success'
}: MetricCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-neutral-500 mb-1">{title}</p>
          <h3 className="text-2xl font-medium text-neutral-900">{value}</h3>
          {change && (
            <p className={`text-xs ${changeTextColor} flex items-center mt-1`}>
              <span className="material-icons mr-1" style={{ fontSize: '14px' }}>
                {changeTextColor === 'text-success' ? 'arrow_upward' : 
                 changeTextColor === 'text-error' ? 'arrow_downward' : 'remove'}
              </span>
              {change}
            </p>
          )}
        </div>
        <div className={`${iconBgColor} bg-opacity-10 p-2 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default function KeyMetrics() {
  // Fetch active buses
  const { data: activeBuses = [] } = useQuery<Bus[]>({
    queryKey: ['/api/buses/active'],
  });

  // Fetch drivers (users with role 'driver')
  const { data: drivers = [] } = useQuery<User[]>({
    queryKey: ['/api/users', { role: 'driver' }],
  });

  // Fetch active routes
  const { data: activeRoutes = [] } = useQuery<Route[]>({
    queryKey: ['/api/routes/active'],
  });

  // Calculate drivers on shift (this would be more accurate with a specific API)
  const driversOnShift = Math.floor(drivers.length * 0.7); // Placeholder logic

  // Alerts data (this would come from a real API in a production app)
  const alertCount = 3;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard
        title="Buses activos"
        value={activeBuses.length}
        change="8% desde ayer"
        icon={<BusIcon className="text-primary" />}
        iconBgColor="bg-primary-light"
      />
      
      <MetricCard
        title="Choferes en turno"
        value={driversOnShift}
        change="Sin cambios"
        icon={<Users className="text-secondary" />}
        iconBgColor="bg-secondary-light"
        changeTextColor="text-neutral-500"
      />
      
      <MetricCard
        title="Rutas activas"
        value={activeRoutes.length}
        change="2 menos que ayer"
        icon={<MapPin className="text-info" />}
        iconBgColor="bg-info-light"
        changeTextColor="text-error"
      />
      
      <MetricCard
        title="Alertas"
        value={alertCount}
        change="1 crítica"
        icon={<AlertTriangle className="text-error" />}
        iconBgColor="bg-error-light"
        changeTextColor="text-error"
      />
    </div>
  );
}
