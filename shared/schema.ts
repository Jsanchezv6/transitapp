import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model - for both admins and drivers
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("driver"), // "admin" or "driver"
  active: boolean("active").notNull().default(true),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true
});

// Bus model
export const buses = pgTable("buses", {
  id: serial("id").primaryKey(),
  busNumber: text("bus_number").notNull().unique(),
  status: text("status").notNull().default("inactive"), // "active", "inactive", "maintenance"
  capacity: integer("capacity").notNull().default(40),
});

export const insertBusSchema = createInsertSchema(buses).omit({
  id: true
});

// Route model
export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  startPoint: text("start_point").notNull(),
  endPoint: text("end_point").notNull(),
  active: boolean("active").notNull().default(true),
});

export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true
});

// Route stops model
export const routeStops = pgTable("route_stops", {
  id: serial("id").primaryKey(),
  routeId: integer("route_id").notNull(),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  arrivalTime: text("arrival_time"), // In minutes from start
});

export const insertRouteStopSchema = createInsertSchema(routeStops).omit({
  id: true
});

// Schedule model
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  routeId: integer("route_id").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  weekdays: text("weekdays").notNull(), // "1,2,3,4,5,6,7" where 1=Monday, 7=Sunday
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true
});

// Shift model - assigns driver to bus and route on a specific date
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull(),
  busId: integer("bus_id").notNull(),
  routeId: integer("route_id").notNull(),
  scheduleId: integer("schedule_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  status: text("status").notNull().default("scheduled"), // "scheduled", "in-progress", "completed", "cancelled"
});

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true
});

// Bus location model
export const busLocations = pgTable("bus_locations", {
  id: serial("id").primaryKey(),
  busId: integer("bus_id").notNull(),
  shiftId: integer("shift_id").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  status: text("status").notNull().default("on-time"), // "on-time", "delayed", "incident"
  nextStopId: integer("next_stop_id"),
});

export const insertBusLocationSchema = createInsertSchema(busLocations).omit({
  id: true,
  timestamp: true
});

// Activity log
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  busId: integer("bus_id"),
  routeId: integer("route_id"),
  action: text("action").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true
});

// Types for our models
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Bus = typeof buses.$inferSelect;
export type InsertBus = z.infer<typeof insertBusSchema>;

export type Route = typeof routes.$inferSelect;
export type InsertRoute = z.infer<typeof insertRouteSchema>;

export type RouteStop = typeof routeStops.$inferSelect;
export type InsertRouteStop = z.infer<typeof insertRouteStopSchema>;

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

export type Shift = typeof shifts.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;

export type BusLocation = typeof busLocations.$inferSelect;
export type InsertBusLocation = z.infer<typeof insertBusLocationSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
