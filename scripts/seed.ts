import { db } from '../server/db';
import { users, routes, buses, schedules, shifts } from '../shared/schema';
import { hashPassword } from '../server/auth';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Iniciando sembrado de datos...');
  
  // Crear usuarios de prueba
  const adminPassword = await hashPassword('password');
  const driverPassword = await hashPassword('password');
  
  try {
    console.log('Creando usuarios de prueba...');
    
    // Verificar si el usuario admin ya existe
    const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin'));
    if (existingAdmin.length === 0) {
      await db.insert(users).values({
        username: 'admin',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        active: true
      });
      console.log('✅ Usuario admin creado');
    } else {
      console.log('ℹ️ Usuario admin ya existe');
    }
    
    // Verificar si el usuario driver ya existe
    const existingDriver = await db.select().from(users).where(eq(users.username, 'driver'));
    if (existingDriver.length === 0) {
      await db.insert(users).values({
        username: 'driver',
        password: driverPassword,
        firstName: 'Driver',
        lastName: 'User',
        role: 'driver',
        active: true
      });
      console.log('✅ Usuario driver creado');
    } else {
      console.log('ℹ️ Usuario driver ya existe');
    }
    
    // Crear datos de prueba para buses
    const busesData = await db.select().from(buses);
    if (busesData.length === 0) {
      console.log('Creando buses de prueba...');
      await db.insert(buses).values([
        { busNumber: 'B001', status: 'active', capacity: 40 },
        { busNumber: 'B002', status: 'active', capacity: 35 },
        { busNumber: 'B003', status: 'maintenance', capacity: 40 }
      ]);
      console.log('✅ Buses creados');
    } else {
      console.log('ℹ️ Buses ya existen');
    }
    
    // Crear datos de prueba para rutas
    const routesData = await db.select().from(routes);
    if (routesData.length === 0) {
      console.log('Creando rutas de prueba...');
      await db.insert(routes).values([
        { 
          name: 'Ruta Norte-Sur', 
          description: 'Ruta principal que conecta el norte y sur de la ciudad', 
          startPoint: 'Terminal Norte', 
          endPoint: 'Terminal Sur', 
          active: true 
        },
        { 
          name: 'Ruta Este-Oeste', 
          description: 'Ruta que conecta el este y oeste de la ciudad', 
          startPoint: 'Estación Este', 
          endPoint: 'Estación Oeste', 
          active: true 
        },
        { 
          name: 'Ruta Circular', 
          description: 'Ruta circular que recorre el centro de la ciudad', 
          startPoint: 'Plaza Central', 
          endPoint: 'Plaza Central', 
          active: true 
        }
      ]);
      console.log('✅ Rutas creadas');
    } else {
      console.log('ℹ️ Rutas ya existen');
    }
    
    // Crear horarios
    const schedulesData = await db.select().from(schedules);
    if (schedulesData.length === 0) {
      console.log('Creando horarios de prueba...');
      
      // Obtener IDs de rutas
      const availableRoutes = await db.select().from(routes);
      if (availableRoutes.length > 0) {
        await db.insert(schedules).values([
          { 
            routeId: availableRoutes[0].id, 
            startTime: '06:00', 
            endTime: '22:00', 
            weekdays: '1,2,3,4,5' 
          },
          { 
            routeId: availableRoutes[0].id, 
            startTime: '07:00', 
            endTime: '20:00', 
            weekdays: '6,7' 
          },
          { 
            routeId: availableRoutes.length > 1 ? availableRoutes[1].id : availableRoutes[0].id, 
            startTime: '06:30', 
            endTime: '21:30', 
            weekdays: '1,2,3,4,5' 
          }
        ]);
        console.log('✅ Horarios creados');
      }
    } else {
      console.log('ℹ️ Horarios ya existen');
    }
    
    // Crear turnos para el conductor
    const shiftsData = await db.select().from(shifts);
    if (shiftsData.length === 0) {
      console.log('Creando turnos de prueba...');
      
      // Obtener IDs necesarios
      const driver = await db.select().from(users).where(eq(users.role, 'driver')).limit(1);
      const availableBuses = await db.select().from(buses).where(eq(buses.status, 'active'));
      const availableRoutes = await db.select().from(routes).where(eq(routes.active, true));
      const availableSchedules = await db.select().from(schedules);
      
      if (driver.length > 0 && availableBuses.length > 0 && 
          availableRoutes.length > 0 && availableSchedules.length > 0) {
        
        // Fecha actual
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        
        const dateFormatted = (date: Date) => {
          return date.toISOString().split('T')[0];
        };
        
        await db.insert(shifts).values([
          { 
            driverId: driver[0].id, 
            busId: availableBuses[0].id, 
            routeId: availableRoutes[0].id, 
            scheduleId: availableSchedules[0].id, 
            date: dateFormatted(today), 
            startTime: '08:00', 
            endTime: '16:00', 
            status: 'scheduled' 
          },
          { 
            driverId: driver[0].id, 
            busId: availableBuses.length > 1 ? availableBuses[1].id : availableBuses[0].id, 
            routeId: availableRoutes.length > 1 ? availableRoutes[1].id : availableRoutes[0].id, 
            scheduleId: availableSchedules.length > 1 ? availableSchedules[1].id : availableSchedules[0].id, 
            date: dateFormatted(tomorrow), 
            startTime: '09:00', 
            endTime: '17:00', 
            status: 'scheduled' 
          }
        ]);
        console.log('✅ Turnos creados');
      }
    } else {
      console.log('ℹ️ Turnos ya existen');
    }
    
    console.log('✅ Sembrado de datos completado con éxito!');
  } catch (error) {
    console.error('❌ Error en el sembrado de datos:', error);
  } finally {
    process.exit(0);
  }
}

seed();