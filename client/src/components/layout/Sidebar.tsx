import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth.tsx';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobile: boolean;
}

interface SidebarItemProps {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ href, icon, label, active, onClick }: SidebarItemProps) => (
  <Link 
    href={href}
    onClick={onClick}
    className={cn(
      "flex items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 pl-5",
      active && "bg-primary bg-opacity-8 text-primary border-l-3 border-primary"
    )}
  >
    <span className="material-icons mr-3 text-neutral-500">{icon}</span>
    {label}
  </Link>
);

export default function Sidebar({ isOpen, setIsOpen, isMobile }: SidebarProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [activeItem, setActiveItem] = useState('/');

  useEffect(() => {
    setActiveItem(location);
  }, [location]);

  const closeSidebarIfMobile = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <aside 
      className={cn(
        "bg-white shadow-md z-10 flex-shrink-0 transition-all duration-300 transform",
        isOpen ? "w-64" : "w-0",
        isMobile && !isOpen && "-translate-x-full",
        isMobile && isOpen && "fixed h-full"
      )}
    >
      <nav className="h-full flex flex-col overflow-y-auto pt-2">
        {user?.role === 'admin' ? (
          <>
            {/* Admin Navigation */}
            <div>
              <div className="px-4 py-2">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Panel de administración
                </p>
              </div>
              
              <SidebarItem 
                href="/"
                icon="dashboard"
                label="Dashboard"
                active={activeItem === '/'}
                onClick={closeSidebarIfMobile}
              />
              
              <SidebarItem 
                href="/users"
                icon="people"
                label="Usuarios"
                active={activeItem === '/users'}
                onClick={closeSidebarIfMobile}
              />
              
              <div className="px-4 py-2 mt-2">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Gestión de operaciones
                </p>
              </div>
              
              <SidebarItem 
                href="/buses"
                icon="directions_bus"
                label="Buses"
                active={activeItem === '/buses'}
                onClick={closeSidebarIfMobile}
              />
              
              <SidebarItem 
                href="/routes"
                icon="alt_route"
                label="Rutas"
                active={activeItem === '/routes'}
                onClick={closeSidebarIfMobile}
              />
              
              <SidebarItem 
                href="/schedules"
                icon="schedule"
                label="Horarios"
                active={activeItem === '/schedules'}
                onClick={closeSidebarIfMobile}
              />
              
              <SidebarItem 
                href="/shifts"
                icon="access_time"
                label="Turnos"
                active={activeItem === '/shifts'}
                onClick={closeSidebarIfMobile}
              />
              
              <SidebarItem 
                href="/monitoring"
                icon="location_on"
                label="Monitoreo"
                active={activeItem === '/monitoring'}
                onClick={closeSidebarIfMobile}
              />
            </div>
          </>
        ) : (
          <>
            {/* Driver Navigation */}
            <div>
              <div className="px-4 py-2">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Panel de chofer
                </p>
              </div>
              
              <SidebarItem 
                href="/driver"
                icon="dashboard"
                label="Dashboard"
                active={activeItem === '/driver'}
                onClick={closeSidebarIfMobile}
              />
              
              <SidebarItem 
                href="/driver/shifts"
                icon="access_time"
                label="Mis turnos"
                active={activeItem === '/driver/shifts'}
                onClick={closeSidebarIfMobile}
              />
              
              <SidebarItem 
                href="/driver/routes"
                icon="alt_route"
                label="Mis rutas"
                active={activeItem === '/driver/routes'}
                onClick={closeSidebarIfMobile}
              />
              
              <SidebarItem 
                href="/driver/location"
                icon="location_on"
                label="Reportar ubicación"
                active={activeItem === '/driver/location'}
                onClick={closeSidebarIfMobile}
              />
            </div>
          </>
        )}
        
        <div className="mt-auto p-4 border-t border-neutral-200">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-neutral-300 flex items-center justify-center">
              <User className="h-4 w-4 text-neutral-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-neutral-700">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-neutral-500">
                {user?.role === 'admin' ? 'Administrador' : 'Chofer'}
              </p>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}
