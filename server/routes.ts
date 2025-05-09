import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  authenticate, 
  authorize, 
  login, 
  hashPassword 
} from "./auth";
import { setupWebSocketServer } from "./websocket";
import { 
  insertUserSchema, 
  insertBusSchema, 
  insertRouteSchema, 
  insertRouteStopSchema,
  insertScheduleSchema,
  insertShiftSchema,
  insertBusLocationSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up WebSocket server
  setupWebSocketServer(httpServer);

  // Auth routes
  app.post('/api/auth/login', login);

  // User routes
  app.get('/api/users', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const role = req.query.role as string | undefined;
      const users = await storage.listUsers(role);
      
      // Don't send password in response
      const safeUsers = users.map(user => ({
        ...user,
        password: undefined
      }));
      
      res.json(safeUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.get('/api/users/:id', authenticate, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user is admin or requesting their own data
      const requestUser = (req as any).user;
      if (requestUser.role !== 'admin' && requestUser.userId !== userId) {
        return res.status(403).json({ message: 'Not authorized to access this user data' });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Don't send password in response
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  app.post('/api/users', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      // Hash password
      userData.password = await hashPassword(userData.password);
      
      const newUser = await storage.createUser(userData);
      
      // Log activity
      await storage.createActivity({
        userId: (req as any).user.userId,
        action: 'Create User',
        details: `Created user ${newUser.username} with role ${newUser.role}`
      });
      
      // Don't send password in response
      const { password, ...safeUser } = newUser;
      res.status(201).json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.patch('/api/users/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Make sure user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Validate fields that can be updated
      const updateSchema = insertUserSchema.partial();
      const updateData = updateSchema.parse(req.body);
      
      // If password is provided, hash it
      if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
      }
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      // Log activity
      await storage.createActivity({
        userId: (req as any).user.userId,
        action: 'Update User',
        details: `Updated user ${updatedUser?.username}`
      });
      
      // Don't send password in response
      const { password, ...safeUser } = updatedUser!;
      res.json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  // Bus routes
  app.get('/api/buses', authenticate, async (req, res) => {
    try {
      const buses = await storage.getBuses();
      res.json(buses);
    } catch (error) {
      console.error('Error fetching buses:', error);
      res.status(500).json({ message: 'Failed to fetch buses' });
    }
  });

  app.get('/api/buses/active', authenticate, async (req, res) => {
    try {
      const buses = await storage.getActiveBuses();
      res.json(buses);
    } catch (error) {
      console.error('Error fetching active buses:', error);
      res.status(500).json({ message: 'Failed to fetch active buses' });
    }
  });

  app.get('/api/buses/:id', authenticate, async (req, res) => {
    try {
      const busId = parseInt(req.params.id);
      const bus = await storage.getBus(busId);
      
      if (!bus) {
        return res.status(404).json({ message: 'Bus not found' });
      }
      
      res.json(bus);
    } catch (error) {
      console.error('Error fetching bus:', error);
      res.status(500).json({ message: 'Failed to fetch bus' });
    }
  });

  app.post('/api/buses', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const busData = insertBusSchema.parse(req.body);
      const newBus = await storage.createBus(busData);
      
      // Log activity
      await storage.createActivity({
        userId: (req as any).user.userId,
        action: 'Create Bus',
        details: `Created bus #${newBus.busNumber}`
      });
      
      res.status(201).json(newBus);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Error creating bus:', error);
      res.status(500).json({ message: 'Failed to create bus' });
    }
  });

  app.patch('/api/buses/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const busId = parseInt(req.params.id);
      
      // Make sure bus exists
      const bus = await storage.getBus(busId);
      if (!bus) {
        return res.status(404).json({ message: 'Bus not found' });
      }
      
      // Validate fields that can be updated
      const updateSchema = insertBusSchema.partial();
      const updateData = updateSchema.parse(req.body);
      
      const updatedBus = await storage.updateBus(busId, updateData);
      
      // Log activity
      await storage.createActivity({
        userId: (req as any).user.userId,
        busId: updatedBus?.id,
        action: 'Update Bus',
        details: `Updated bus #${updatedBus?.busNumber} status to ${updatedBus?.status}`
      });
      
      res.json(updatedBus);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Error updating bus:', error);
      res.status(500).json({ message: 'Failed to update bus' });
    }
  });

  // Route routes
  app.get('/api/routes', authenticate, async (req, res) => {
    try {
      const routes = await storage.getRoutes();
      res.json(routes);
    } catch (error) {
      console.error('Error fetching routes:', error);
      res.status(500).json({ message: 'Failed to fetch routes' });
    }
  });

  app.get('/api/routes/active', authenticate, async (req, res) => {
    try {
      const routes = await storage.getActiveRoutes();
      res.json(routes);
    } catch (error) {
      console.error('Error fetching active routes:', error);
      res.status(500).json({ message: 'Failed to fetch active routes' });
    }
  });

  app.get('/api/routes/:id', authenticate, async (req, res) => {
    try {
      const routeId = parseInt(req.params.id);
      const route = await storage.getRoute(routeId);
      
      if (!route) {
        return res.status(404).json({ message: 'Route not found' });
      }
      
      res.json(route);
    } catch (error) {
      console.error('Error fetching route:', error);
      res.status(500).json({ message: 'Failed to fetch route' });
    }
  });

  app.post('/api/routes', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const routeData = insertRouteSchema.parse(req.body);
      const newRoute = await storage.createRoute(routeData);
      
      // Log activity
      await storage.createActivity({
        userId: (req as any).user.userId,
        routeId: newRoute.id,
        action: 'Create Route',
        details: `Created route ${newRoute.name}`
      });
      
      res.status(201).json(newRoute);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Error creating route:', error);
      res.status(500).json({ message: 'Failed to create route' });
    }
  });

  app.patch('/api/routes/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const routeId = parseInt(req.params.id);
      
      // Make sure route exists
      const route = await storage.getRoute(routeId);
      if (!route) {
        return res.status(404).json({ message: 'Route not found' });
      }
      
      // Validate fields that can be updated
      const updateSchema = insertRouteSchema.partial();
      const updateData = updateSchema.parse(req.body);
      
      const updatedRoute = await storage.updateRoute(routeId, updateData);
      
      // Log activity
      await storage.createActivity({
        userId: (req as any).user.userId,
        routeId: updatedRoute?.id,
        action: 'Update Route',
        details: `Updated route ${updatedRoute?.name}`
      });
      
      res.json(updatedRoute);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Error updating route:', error);
      res.status(500).json({ message: 'Failed to update route' });
    }
  });

  // Route stops
  app.get('/api/routes/:routeId/stops', authenticate, async (req, res) => {
    try {
      const routeId = parseInt(req.params.routeId);
      
      // Make sure route exists
      const route = await storage.getRoute(routeId);
      if (!route) {
        return res.status(404).json({ message: 'Route not found' });
      }
      
      const stops = await storage.getRouteStops(routeId);
      res.json(stops);
    } catch (error) {
      console.error('Error fetching route stops:', error);
      res.status(500).json({ message: 'Failed to fetch route stops' });
    }
  });

  app.post('/api/routes/:routeId/stops', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const routeId = parseInt(req.params.routeId);
      
      // Make sure route exists
      const route = await storage.getRoute(routeId);
      if (!route) {
        return res.status(404).json({ message: 'Route not found' });
      }
      
      const stopData = insertRouteStopSchema.parse({
        ...req.body,
        routeId
      });
      
      const newStop = await storage.createRouteStop(stopData);
      
      // Log activity
      await storage.createActivity({
        userId: (req as any).user.userId,
        routeId,
        action: 'Create Stop',
        details: `Added stop ${newStop.name} to route ${route.name}`
      });
      
      res.status(201).json(newStop);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Error creating route stop:', error);
      res.status(500).json({ message: 'Failed to create route stop' });
    }
  });

  // Schedule routes
  app.get('/api/schedules', authenticate, async (req, res) => {
    try {
      const routeId = req.query.routeId ? parseInt(req.query.routeId as string) : undefined;
      const schedules = await storage.getSchedules(routeId);
      res.json(schedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      res.status(500).json({ message: 'Failed to fetch schedules' });
    }
  });

  app.get('/api/schedules/:id', authenticate, async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const schedule = await storage.getSchedule(scheduleId);
      
      if (!schedule) {
        return res.status(404).json({ message: 'Schedule not found' });
      }
      
      res.json(schedule);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      res.status(500).json({ message: 'Failed to fetch schedule' });
    }
  });

  app.post('/api/schedules', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const scheduleData = insertScheduleSchema.parse(req.body);
      
      // Make sure route exists
      const route = await storage.getRoute(scheduleData.routeId);
      if (!route) {
        return res.status(404).json({ message: 'Route not found' });
      }
      
      const newSchedule = await storage.createSchedule(scheduleData);
      
      // Log activity
      await storage.createActivity({
        userId: (req as any).user.userId,
        routeId: scheduleData.routeId,
        action: 'Create Schedule',
        details: `Created schedule for route ${route.name}`
      });
      
      res.status(201).json(newSchedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Error creating schedule:', error);
      res.status(500).json({ message: 'Failed to create schedule' });
    }
  });

  app.patch('/api/schedules/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      
      // Make sure schedule exists
      const schedule = await storage.getSchedule(scheduleId);
      if (!schedule) {
        return res.status(404).json({ message: 'Schedule not found' });
      }
      
      // Validate fields that can be updated
      const updateSchema = insertScheduleSchema.partial();
      const updateData = updateSchema.parse(req.body);
      
      const updatedSchedule = await storage.updateSchedule(scheduleId, updateData);
      
      // Log activity
      await storage.createActivity({
        userId: (req as any).user.userId,
        routeId: schedule.routeId,
        action: 'Update Schedule',
        details: `Updated schedule for route ID ${schedule.routeId}`
      });
      
      res.json(updatedSchedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Error updating schedule:', error);
      res.status(500).json({ message: 'Failed to update schedule' });
    }
  });

  // Shift routes
  app.get('/api/shifts', authenticate, async (req, res) => {
    try {
      const filters: any = {};
      
      // Parse query parameters for filtering
      if (req.query.driverId) {
        filters.driverId = parseInt(req.query.driverId as string);
      }
      
      if (req.query.date) {
        filters.date = req.query.date as string;
      }
      
      if (req.query.status) {
        filters.status = req.query.status as string;
      }
      
      if (req.query.routeId) {
        filters.routeId = parseInt(req.query.routeId as string);
      }
      
      if (req.query.busId) {
        filters.busId = parseInt(req.query.busId as string);
      }
      
      // If driver is requesting, only return their shifts
      if ((req as any).user.role === 'driver') {
        filters.driverId = (req as any).user.userId;
      }
      
      const shifts = await storage.getShifts(filters);
      res.json(shifts);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      res.status(500).json({ message: 'Failed to fetch shifts' });
    }
  });

  app.get('/api/shifts/upcoming', authenticate, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const shifts = await storage.getUpcomingShifts(limit);
      res.json(shifts);
    } catch (error) {
      console.error('Error fetching upcoming shifts:', error);
      res.status(500).json({ message: 'Failed to fetch upcoming shifts' });
    }
  });

  app.get('/api/shifts/:id', authenticate, async (req, res) => {
    try {
      const shiftId = parseInt(req.params.id);
      const shift = await storage.getShift(shiftId);
      
      if (!shift) {
        return res.status(404).json({ message: 'Shift not found' });
      }
      
      // If driver is requesting, only allow access to their own shifts
      if ((req as any).user.role === 'driver' && shift.driverId !== (req as any).user.userId) {
        return res.status(403).json({ message: 'Not authorized to access this shift' });
      }
      
      res.json(shift);
    } catch (error) {
      console.error('Error fetching shift:', error);
      res.status(500).json({ message: 'Failed to fetch shift' });
    }
  });

  app.post('/api/shifts', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const shiftData = insertShiftSchema.parse(req.body);
      
      // Validate that driver, bus, route, and schedule exist
      const driver = await storage.getUser(shiftData.driverId);
      if (!driver || driver.role !== 'driver') {
        return res.status(404).json({ message: 'Driver not found' });
      }
      
      const bus = await storage.getBus(shiftData.busId);
      if (!bus) {
        return res.status(404).json({ message: 'Bus not found' });
      }
      
      const route = await storage.getRoute(shiftData.routeId);
      if (!route) {
        return res.status(404).json({ message: 'Route not found' });
      }
      
      const schedule = await storage.getSchedule(shiftData.scheduleId);
      if (!schedule) {
        return res.status(404).json({ message: 'Schedule not found' });
      }
      
      const newShift = await storage.createShift(shiftData);
      
      // Log activity
      await storage.createActivity({
        userId: (req as any).user.userId,
        busId: shiftData.busId,
        routeId: shiftData.routeId,
        action: 'Create Shift',
        details: `Created shift for driver ${driver.firstName} ${driver.lastName} on bus #${bus.busNumber}`
      });
      
      res.status(201).json(newShift);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Error creating shift:', error);
      res.status(500).json({ message: 'Failed to create shift' });
    }
  });

  app.patch('/api/shifts/:id', authenticate, async (req, res) => {
    try {
      const shiftId = parseInt(req.params.id);
      
      // Make sure shift exists
      const shift = await storage.getShift(shiftId);
      if (!shift) {
        return res.status(404).json({ message: 'Shift not found' });
      }
      
      // If driver is updating, only allow status updates to their own shifts
      if ((req as any).user.role === 'driver') {
        if (shift.driverId !== (req as any).user.userId) {
          return res.status(403).json({ message: 'Not authorized to update this shift' });
        }
        
        // Drivers can only update status
        const updateSchema = z.object({ status: z.string() });
        const updateData = updateSchema.parse(req.body);
        
        const updatedShift = await storage.updateShift(shiftId, updateData);
        
        // Log activity
        await storage.createActivity({
          userId: (req as any).user.userId,
          busId: shift.busId,
          routeId: shift.routeId,
          action: 'Update Shift Status',
          details: `Driver updated shift status to ${updateData.status}`
        });
        
        return res.json(updatedShift);
      }
      
      // Admin can update any field
      const updateSchema = insertShiftSchema.partial();
      const updateData = updateSchema.parse(req.body);
      
      const updatedShift = await storage.updateShift(shiftId, updateData);
      
      // Log activity
      await storage.createActivity({
        userId: (req as any).user.userId,
        busId: shift.busId,
        routeId: shift.routeId,
        action: 'Update Shift',
        details: `Admin updated shift details`
      });
      
      res.json(updatedShift);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Error updating shift:', error);
      res.status(500).json({ message: 'Failed to update shift' });
    }
  });

  // Bus location routes
  app.post('/api/bus-locations', authenticate, async (req, res) => {
    try {
      const locationData = insertBusLocationSchema.parse(req.body);
      
      // If driver is submitting, validate they are assigned to this bus/shift
      if ((req as any).user.role === 'driver') {
        const shift = await storage.getShift(locationData.shiftId);
        if (!shift || shift.driverId !== (req as any).user.userId) {
          return res.status(403).json({ message: 'Not authorized to update this bus location' });
        }
      }
      
      const location = await storage.createBusLocation(locationData);
      
      res.status(201).json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Error creating bus location:', error);
      res.status(500).json({ message: 'Failed to create bus location' });
    }
  });

  app.get('/api/bus-locations/:busId', authenticate, async (req, res) => {
    try {
      const busId = parseInt(req.params.busId);
      const location = await storage.getBusLocation(busId);
      
      if (!location) {
        return res.status(404).json({ message: 'Bus location not found' });
      }
      
      res.json(location);
    } catch (error) {
      console.error('Error fetching bus location:', error);
      res.status(500).json({ message: 'Failed to fetch bus location' });
    }
  });

  // Activity routes
  app.get('/api/activities', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const activities = await storage.getActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      res.status(500).json({ message: 'Failed to fetch activities' });
    }
  });

  return httpServer;
}
