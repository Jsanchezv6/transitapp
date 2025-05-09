import {
  activities, Activity, InsertActivity,
  buses, Bus, InsertBus,
  busLocations, BusLocation, InsertBusLocation,
  routes, Route, InsertRoute,
  routeStops, RouteStop, InsertRouteStop,
  schedules, Schedule, InsertSchedule,
  shifts, Shift, InsertShift,
  users, User, InsertUser
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  listUsers(role?: string): Promise<User[]>;
  
  // Bus operations
  getBus(id: number): Promise<Bus | undefined>;
  getBuses(): Promise<Bus[]>;
  getActiveBuses(): Promise<Bus[]>;
  createBus(bus: InsertBus): Promise<Bus>;
  updateBus(id: number, busData: Partial<Bus>): Promise<Bus | undefined>;
  
  // Route operations
  getRoute(id: number): Promise<Route | undefined>;
  getRoutes(): Promise<Route[]>;
  getActiveRoutes(): Promise<Route[]>;
  createRoute(route: InsertRoute): Promise<Route>;
  updateRoute(id: number, routeData: Partial<Route>): Promise<Route | undefined>;
  
  // Route Stops operations
  getRouteStops(routeId: number): Promise<RouteStop[]>;
  createRouteStop(stop: InsertRouteStop): Promise<RouteStop>;
  updateRouteStop(id: number, stopData: Partial<RouteStop>): Promise<RouteStop | undefined>;
  
  // Schedule operations
  getSchedule(id: number): Promise<Schedule | undefined>;
  getSchedules(routeId?: number): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, scheduleData: Partial<Schedule>): Promise<Schedule | undefined>;
  
  // Shift operations
  getShift(id: number): Promise<Shift | undefined>;
  getShifts(filters?: { 
    driverId?: number; 
    date?: string; 
    status?: string;
    routeId?: number;
    busId?: number;
  }): Promise<Shift[]>;
  getUpcomingShifts(limit?: number): Promise<Shift[]>;
  createShift(shift: InsertShift): Promise<Shift>;
  updateShift(id: number, shiftData: Partial<Shift>): Promise<Shift | undefined>;
  
  // Bus location operations
  getBusLocation(busId: number): Promise<BusLocation | undefined>;
  createBusLocation(location: InsertBusLocation): Promise<BusLocation>;
  
  // Activity operations
  getActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private buses: Map<number, Bus>;
  private routes: Map<number, Route>;
  private routeStops: Map<number, RouteStop>;
  private schedules: Map<number, Schedule>;
  private shifts: Map<number, Shift>;
  private busLocations: Map<number, BusLocation>;
  private activities: Activity[];
  
  private userIdCounter: number;
  private busIdCounter: number;
  private routeIdCounter: number;
  private routeStopIdCounter: number;
  private scheduleIdCounter: number;
  private shiftIdCounter: number;
  private busLocationIdCounter: number;
  private activityIdCounter: number;

  constructor() {
    this.users = new Map();
    this.buses = new Map();
    this.routes = new Map();
    this.routeStops = new Map();
    this.schedules = new Map();
    this.shifts = new Map();
    this.busLocations = new Map();
    this.activities = [];
    
    this.userIdCounter = 1;
    this.busIdCounter = 1;
    this.routeIdCounter = 1;
    this.routeStopIdCounter = 1;
    this.scheduleIdCounter = 1;
    this.shiftIdCounter = 1;
    this.busLocationIdCounter = 1;
    this.activityIdCounter = 1;
    
    // Add admin user by default
    this.createUser({
      username: "admin",
      password: "$2b$10$amiSRiUFxOmM07QRF1WNxeW.OWzHXDDe/R2VWTyVcqbHIx5w8yZSK", // "password"
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      active: true
    });
    
    // Add driver user by default
    this.createUser({
      username: "driver",
      password: "$2b$10$amiSRiUFxOmM07QRF1WNxeW.OWzHXDDe/R2VWTyVcqbHIx5w8yZSK", // "password"
      firstName: "Driver",
      lastName: "User",
      role: "driver",
      active: true
    });
    
    // Initialize with sample data for testing
    this.initializeTestData();
  }

  private initializeTestData() {
    // Create some buses
    this.createBus({ busNumber: "1042", status: "active", capacity: 40 });
    this.createBus({ busNumber: "987", status: "active", capacity: 40 });
    this.createBus({ busNumber: "2156", status: "active", capacity: 40 });
    this.createBus({ busNumber: "1365", status: "active", capacity: 40 });
    this.createBus({ busNumber: "754", status: "active", capacity: 40 });
    
    // Create some routes
    const route1 = this.createRoute({ 
      name: "Route 1 - Sur", 
      description: "Southern route through major city points",
      startPoint: "Terminal Sur",
      endPoint: "Terminal Norte",
      active: true
    });
    
    const route2 = this.createRoute({ 
      name: "Route 3 - Norte", 
      description: "Northern route through residential areas",
      startPoint: "Terminal Norte",
      endPoint: "Terminal Sur",
      active: true
    });
    
    const route3 = this.createRoute({ 
      name: "Route 5 - Centro", 
      description: "Central route through downtown",
      startPoint: "Terminal Oeste",
      endPoint: "Terminal Este",
      active: true
    });
    
    // Create schedules
    this.createSchedule({ 
      routeId: route1.id, 
      startTime: "08:00", 
      endTime: "16:00", 
      weekdays: "1,2,3,4,5"
    });
    
    this.createSchedule({ 
      routeId: route2.id, 
      startTime: "09:00", 
      endTime: "17:00", 
      weekdays: "1,2,3,4,5"
    });
    
    this.createSchedule({ 
      routeId: route3.id, 
      startTime: "10:00", 
      endTime: "18:00", 
      weekdays: "1,2,3,4,5,6"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...userData, id };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async listUsers(role?: string): Promise<User[]> {
    const users = Array.from(this.users.values());
    if (role) {
      return users.filter(user => user.role === role);
    }
    return users;
  }

  // Bus operations
  async getBus(id: number): Promise<Bus | undefined> {
    return this.buses.get(id);
  }

  async getBuses(): Promise<Bus[]> {
    return Array.from(this.buses.values());
  }

  async getActiveBuses(): Promise<Bus[]> {
    return Array.from(this.buses.values()).filter(bus => bus.status === "active");
  }

  async createBus(busData: InsertBus): Promise<Bus> {
    const id = this.busIdCounter++;
    const bus: Bus = { ...busData, id };
    this.buses.set(id, bus);
    return bus;
  }

  async updateBus(id: number, busData: Partial<Bus>): Promise<Bus | undefined> {
    const bus = this.buses.get(id);
    if (!bus) return undefined;
    
    const updatedBus = { ...bus, ...busData };
    this.buses.set(id, updatedBus);
    return updatedBus;
  }

  // Route operations
  async getRoute(id: number): Promise<Route | undefined> {
    return this.routes.get(id);
  }

  async getRoutes(): Promise<Route[]> {
    return Array.from(this.routes.values());
  }

  async getActiveRoutes(): Promise<Route[]> {
    return Array.from(this.routes.values()).filter(route => route.active);
  }

  async createRoute(routeData: InsertRoute): Promise<Route> {
    const id = this.routeIdCounter++;
    const route: Route = { ...routeData, id };
    this.routes.set(id, route);
    return route;
  }

  async updateRoute(id: number, routeData: Partial<Route>): Promise<Route | undefined> {
    const route = this.routes.get(id);
    if (!route) return undefined;
    
    const updatedRoute = { ...route, ...routeData };
    this.routes.set(id, updatedRoute);
    return updatedRoute;
  }

  // Route Stops operations
  async getRouteStops(routeId: number): Promise<RouteStop[]> {
    return Array.from(this.routeStops.values())
      .filter(stop => stop.routeId === routeId)
      .sort((a, b) => a.order - b.order);
  }

  async createRouteStop(stopData: InsertRouteStop): Promise<RouteStop> {
    const id = this.routeStopIdCounter++;
    const stop: RouteStop = { ...stopData, id };
    this.routeStops.set(id, stop);
    return stop;
  }

  async updateRouteStop(id: number, stopData: Partial<RouteStop>): Promise<RouteStop | undefined> {
    const stop = this.routeStops.get(id);
    if (!stop) return undefined;
    
    const updatedStop = { ...stop, ...stopData };
    this.routeStops.set(id, updatedStop);
    return updatedStop;
  }

  // Schedule operations
  async getSchedule(id: number): Promise<Schedule | undefined> {
    return this.schedules.get(id);
  }

  async getSchedules(routeId?: number): Promise<Schedule[]> {
    const schedules = Array.from(this.schedules.values());
    if (routeId !== undefined) {
      return schedules.filter(schedule => schedule.routeId === routeId);
    }
    return schedules;
  }

  async createSchedule(scheduleData: InsertSchedule): Promise<Schedule> {
    const id = this.scheduleIdCounter++;
    const schedule: Schedule = { ...scheduleData, id };
    this.schedules.set(id, schedule);
    return schedule;
  }

  async updateSchedule(id: number, scheduleData: Partial<Schedule>): Promise<Schedule | undefined> {
    const schedule = this.schedules.get(id);
    if (!schedule) return undefined;
    
    const updatedSchedule = { ...schedule, ...scheduleData };
    this.schedules.set(id, updatedSchedule);
    return updatedSchedule;
  }

  // Shift operations
  async getShift(id: number): Promise<Shift | undefined> {
    return this.shifts.get(id);
  }

  async getShifts(filters?: { 
    driverId?: number; 
    date?: string; 
    status?: string;
    routeId?: number;
    busId?: number;
  }): Promise<Shift[]> {
    let shifts = Array.from(this.shifts.values());
    
    if (filters) {
      if (filters.driverId !== undefined) {
        shifts = shifts.filter(shift => shift.driverId === filters.driverId);
      }
      
      if (filters.date !== undefined) {
        shifts = shifts.filter(shift => shift.date === filters.date);
      }
      
      if (filters.status !== undefined) {
        shifts = shifts.filter(shift => shift.status === filters.status);
      }
      
      if (filters.routeId !== undefined) {
        shifts = shifts.filter(shift => shift.routeId === filters.routeId);
      }
      
      if (filters.busId !== undefined) {
        shifts = shifts.filter(shift => shift.busId === filters.busId);
      }
    }
    
    return shifts;
  }

  async getUpcomingShifts(limit?: number): Promise<Shift[]> {
    // In a real implementation, we would filter by date > now
    // For this MVP, we'll return all shifts
    const shifts = Array.from(this.shifts.values());
    if (limit) {
      return shifts.slice(0, limit);
    }
    return shifts;
  }

  async createShift(shiftData: InsertShift): Promise<Shift> {
    const id = this.shiftIdCounter++;
    const shift: Shift = { ...shiftData, id };
    this.shifts.set(id, shift);
    return shift;
  }

  async updateShift(id: number, shiftData: Partial<Shift>): Promise<Shift | undefined> {
    const shift = this.shifts.get(id);
    if (!shift) return undefined;
    
    const updatedShift = { ...shift, ...shiftData };
    this.shifts.set(id, updatedShift);
    return updatedShift;
  }

  // Bus location operations
  async getBusLocation(busId: number): Promise<BusLocation | undefined> {
    // In a real implementation, we'd get the most recent location
    // For this MVP, we'll return any location for the bus
    for (const location of this.busLocations.values()) {
      if (location.busId === busId) {
        return location;
      }
    }
    return undefined;
  }

  async createBusLocation(locationData: InsertBusLocation): Promise<BusLocation> {
    const id = this.busLocationIdCounter++;
    const timestamp = new Date();
    const location: BusLocation = { ...locationData, id, timestamp };
    
    // In a real implementation, we would only track the most recent location
    // For this MVP, we'll just add it to the map
    this.busLocations.set(id, location);
    
    // Also log an activity for this location update
    this.createActivity({
      busId: locationData.busId,
      action: `Bus location updated`,
      details: `Status: ${locationData.status}`,
    });
    
    return location;
  }

  // Activity operations
  async getActivities(limit?: number): Promise<Activity[]> {
    // Return activities in reverse chronological order
    const sorted = [...this.activities].sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
    
    if (limit) {
      return sorted.slice(0, limit);
    }
    return sorted;
  }

  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const timestamp = new Date();
    const activity: Activity = { 
      ...activityData, 
      id, 
      timestamp,
      userId: activityData.userId || null,
      busId: activityData.busId || null,
      routeId: activityData.routeId || null,
      details: activityData.details || null,
    };
    
    this.activities.push(activity);
    return activity;
  }
}

export const storage = new MemStorage();
