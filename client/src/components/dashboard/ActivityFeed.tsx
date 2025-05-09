import { useQuery } from '@tanstack/react-query';
import { Activity } from '@/lib/types';

interface ActivityItem {
  id: number;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  time: string;
}

// Mock activity data (in a real app, would come from the API)
const mockActivities: ActivityItem[] = [
  { id: 1, type: 'success', message: 'El bus #1042 inició su ruta', time: 'Hace 10 minutos' },
  { id: 2, type: 'warning', message: 'El bus #987 reportó retraso', time: 'Hace 25 minutos' },
  { id: 3, type: 'error', message: 'El bus #1365 reportó un incidente', time: 'Hace 1 hora' },
  { id: 4, type: 'info', message: 'Se modificó el horario de la Ruta 5', time: 'Hace 3 horas' },
  { id: 5, type: 'info', message: 'Se registró un nuevo chofer', time: 'Hace 5 horas' },
];

export default function ActivityFeed() {
  // Fetch activities (limited to 5)
  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ['/api/activities', { limit: 5 }],
  });

  // If API returns activities, map them to our format
  // Otherwise, use mock data
  const displayActivities = activities.length > 0
    ? activities.map(activity => {
        // Determine type based on activity data
        let type: 'success' | 'warning' | 'error' | 'info' = 'info';
        if (activity.action.includes('inició')) type = 'success';
        else if (activity.action.includes('retraso')) type = 'warning';
        else if (activity.action.includes('incidente')) type = 'error';
        
        // Format timestamp
        const time = new Date(activity.timestamp).toLocaleString();
        
        return {
          id: activity.id,
          type,
          message: activity.action + (activity.details ? `: ${activity.details}` : ''),
          time: time
        };
      })
    : mockActivities;

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-neutral-200">
        <h3 className="text-lg font-medium text-neutral-900">Actividad reciente</h3>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          {displayActivities.map((activity, index) => (
            <div key={activity.id} className="flex">
              <div className="flex-shrink-0 w-8 flex flex-col items-center">
                <div className={`w-2 h-2 ${
                  activity.type === 'success' ? 'bg-success' :
                  activity.type === 'warning' ? 'bg-warning' :
                  activity.type === 'error' ? 'bg-error' : 'bg-info'
                } rounded-full`}></div>
                <div className={`w-0.5 h-full bg-neutral-200 ${
                  index === displayActivities.length - 1 ? 'hidden' : ''
                }`}></div>
              </div>
              <div className="ml-2">
                <p className="text-sm text-neutral-900">{activity.message}</p>
                <p className="text-xs text-neutral-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
