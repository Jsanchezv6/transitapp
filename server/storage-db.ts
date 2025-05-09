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
import { db } from './db';
import { eq, and, desc, like, sql, isNull, inArray } from 'drizzle-orm';
import { hashPassword } from './auth';
import { IStorage } from './storage';

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Hash password before storing
    const hashedPassword = await hashPassword(userData.password);
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword
      })
      .returning();
    
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    // La contraseña ya viene hasheada desde routes.ts, así que no la hasheamos aquí
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser || undefined;
  }

  async listUsers(role?: string): Promise<User[]> {
    if (role) {
      return db.select().from(users).where(eq(users.role, role));
    }
    return db.select().from(users);
  }
  
  // Bus operations
  async getBus(id: number): Promise<Bus | undefined> {
    const [bus] = await db.select().from(buses).where(eq(buses.id, id));
    return bus || undefined;
  }

  async getBuses(): Promise<Bus[]> {
    return db.select().from(buses);
  }

  async getActiveBuses(): Promise<Bus[]> {
    return db.select().from(buses).where(eq(buses.status, 'active'));
  }

  async createBus(busData: InsertBus): Promise<Bus> {
    const [bus] = await db
      .insert(buses)
      .values(busData)
      .returning();
    
    return bus;
  }

  async updateBus(id: number, busData: Partial<Bus>): Promise<Bus | undefined> {
    const [updatedBus] = await db
      .update(buses)
      .set(busData)
      .where(eq(buses.id, id))
      .returning();
    
    return updatedBus || undefined;
  }
  
  // Route operations
  async getRoute(id: number): Promise<Route | undefined> {
    const [route] = await db.select().from(routes).where(eq(routes.id, id));
    return route || undefined;
  }

  async getRoutes(): Promise<Route[]> {
    return db.select().from(routes);
  }

  async getActiveRoutes(): Promise<Route[]> {
    return db.select().from(routes).where(eq(routes.active, true));
  }

  async createRoute(routeData: InsertRoute): Promise<Route> {
    const [route] = await db
      .insert(routes)
      .values(routeData)
      .returning();
    
    return route;
  }

  async updateRoute(id: number, routeData: Partial<Route>): Promise<Route | undefined> {
    const [updatedRoute] = await db
      .update(routes)
      .set(routeData)
      .where(eq(routes.id, id))
      .returning();
    
    return updatedRoute || undefined;
  }
  
  // Route Stops operations
  async getRouteStops(routeId: number): Promise<RouteStop[]> {
    return db
      .select()
      .from(routeStops)
      .where(eq(routeStops.routeId, routeId))
      .orderBy(routeStops.order);
  }

  async createRouteStop(stopData: InsertRouteStop): Promise<RouteStop> {
    const [stop] = await db
      .insert(routeStops)
      .values(stopData)
      .returning();
    
    return stop;
  }

  async updateRouteStop(id: number, stopData: Partial<RouteStop>): Promise<RouteStop | undefined> {
    const [updatedStop] = await db
      .update(routeStops)
      .set(stopData)
      .where(eq(routeStops.id, id))
      .returning();
    
    return updatedStop || undefined;
  }
  
  // Schedule operations
  async getSchedule(id: number): Promise<Schedule | undefined> {
    const [schedule] = await db.select().from(schedules).where(eq(schedules.id, id));
    return schedule || undefined;
  }

  async getSchedules(routeId?: number): Promise<Schedule[]> {
    if (routeId) {
      return db.select().from(schedules).where(eq(schedules.routeId, routeId));
    }
    return db.select().from(schedules);
  }

  async createSchedule(scheduleData: InsertSchedule): Promise<Schedule> {
    const [schedule] = await db
      .insert(schedules)
      .values(scheduleData)
      .returning();
    
    return schedule;
  }

  async updateSchedule(id: number, scheduleData: Partial<Schedule>): Promise<Schedule | undefined> {
    const [updatedSchedule] = await db
      .update(schedules)
      .set(scheduleData)
      .where(eq(schedules.id, id))
      .returning();
    
    return updatedSchedule || undefined;
  }
  
  // Shift operations
  async getShift(id: number): Promise<Shift | undefined> {
    const [shift] = await db.select().from(shifts).where(eq(shifts.id, id));
    return shift || undefined;
  }

  async getShifts(filters?: { 
    driverId?: number; 
    date?: string; 
    status?: string;
    routeId?: number;
    busId?: number;
  }): Promise<Shift[]> {
    let query = db.select().from(shifts);
    
    if (filters) {
      const conditions = [];
      
      if (filters.driverId !== undefined) {
        conditions.push(eq(shifts.driverId, filters.driverId));
      }
      
      if (filters.date !== undefined) {
        conditions.push(eq(shifts.date, filters.date));
      }
      
      if (filters.status !== undefined) {
        conditions.push(eq(shifts.status, filters.status));
      }
      
      if (filters.routeId !== undefined) {
        conditions.push(eq(shifts.routeId, filters.routeId));
      }
      
      if (filters.busId !== undefined) {
        conditions.push(eq(shifts.busId, filters.busId));
      }
      
      if (conditions.length > 0) {
        // Apply AND of all conditions
        let finalCondition = conditions[0];
        for (let i = 1; i < conditions.length; i++) {
          finalCondition = and(finalCondition, conditions[i]);
        }
        
        query = query.where(finalCondition);
      }
    }
    
    return await query;
  }

  async getUpcomingShifts(limit?: number): Promise<Shift[]> {
    const currentDate = new Date().toISOString().split('T')[0];
    
    let query = db
      .select()
      .from(shifts)
      .where(and(
        eq(shifts.status, 'scheduled'),
        sql`${shifts.date} >= ${currentDate}`
      ))
      .orderBy(shifts.date, shifts.startTime);
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }

  async createShift(shiftData: InsertShift): Promise<Shift> {
    const [shift] = await db
      .insert(shifts)
      .values(shiftData)
      .returning();
    
    return shift;
  }

  async updateShift(id: number, shiftData: Partial<Shift>): Promise<Shift | undefined> {
    const [updatedShift] = await db
      .update(shifts)
      .set(shiftData)
      .where(eq(shifts.id, id))
      .returning();
    
    return updatedShift || undefined;
  }
  
  // Bus location operations
  async getBusLocation(busId: number): Promise<BusLocation | undefined> {
    const [location] = await db
      .select()
      .from(busLocations)
      .where(eq(busLocations.busId, busId))
      .orderBy(desc(busLocations.timestamp))
      .limit(1);
    
    return location || undefined;
  }

  async createBusLocation(locationData: InsertBusLocation): Promise<BusLocation> {
    const [location] = await db
      .insert(busLocations)
      .values({
        ...locationData,
        timestamp: new Date()
      })
      .returning();
    
    return location;
  }
  
  // Activity operations
  async getActivities(limit?: number): Promise<Activity[]> {
    let query = db
      .select()
      .from(activities)
      .orderBy(desc(activities.timestamp));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }

  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values({
        ...activityData,
        timestamp: new Date(),
        userId: activityData.userId || null,
        busId: activityData.busId || null,
        routeId: activityData.routeId || null,
        details: activityData.details || null
      })
      .returning();
    
    return activity;
  }
}