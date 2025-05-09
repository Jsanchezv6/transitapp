// Type definitions for the application

// User types
export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  active: boolean;
}

export interface InsertUser {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  active: boolean;
}

// Bus types
export interface Bus {
  id: number;
  busNumber: string;
  status: string;
  capacity: number;
}

export interface InsertBus {
  busNumber: string;
  status: string;
  capacity: number;
}

// Route types
export interface Route {
  id: number;
  name: string;
  description: string;
  startPoint: string;
  endPoint: string;
  active: boolean;
}

export interface InsertRoute {
  name: string;
  description: string;
  startPoint: string;
  endPoint: string;
  active: boolean;
}

// Route Stop types
export interface RouteStop {
  id: number;
  routeId: number;
  name: string;
  order: number;
  arrivalTime: string | null;
}

export interface InsertRouteStop {
  routeId: number;
  name: string;
  order: number;
  arrivalTime?: string;
}

// Schedule types
export interface Schedule {
  id: number;
  routeId: number;
  startTime: string;
  endTime: string;
  weekdays: string;
}

export interface InsertSchedule {
  routeId: number;
  startTime: string;
  endTime: string;
  weekdays: string;
}

// Shift types
export interface Shift {
  id: number;
  driverId: number;
  busId: number;
  routeId: number;
  scheduleId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

export interface InsertShift {
  driverId: number;
  busId: number;
  routeId: number;
  scheduleId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

// Bus Location types
export interface BusLocation {
  id: number;
  busId: number;
  shiftId: number;
  latitude: number;
  longitude: number;
  timestamp: Date;
  status: string;
  nextStopId?: number | null;
}

export interface InsertBusLocation {
  busId: number;
  shiftId: number;
  latitude: number;
  longitude: number;
  status: string;
  nextStopId?: number;
}

// Activity types
export interface Activity {
  id: number;
  userId: number | null;
  busId: number | null;
  routeId: number | null;
  action: string;
  details: string | null;
  timestamp: Date;
}

export interface InsertActivity {
  userId?: number;
  busId?: number;
  routeId?: number;
  action: string;
  details?: string;
}
