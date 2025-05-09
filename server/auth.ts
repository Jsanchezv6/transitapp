import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Environment variable for JWT secret, with fallback
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = '24h';

// Zod schema for login validation
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(userId: number, username: string, role: string): string {
  return jwt.sign(
    { userId, username, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Authentication middleware
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  // Attach user info to request object
  (req as any).user = decoded;
  next();
}

// Role-based authorization middleware
export function authorize(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
}

// Login handler
export async function login(req: Request, res: Response) {
  try {
    // Validate request body
    const data = loginSchema.parse(req.body);

    // Find user by username
    const user = await storage.getUserByUsername(data.username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Check if user is active
    if (!user.active) {
      return res.status(401).json({ message: 'Your account is not active' });
    }

    // Verify password
    const passwordValid = await verifyPassword(data.password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate and send token
    const token = generateToken(user.id, user.username, user.role);
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
    
    // Log activity
    await storage.createActivity({
      userId: user.id,
      action: 'Login',
      details: `User ${user.username} logged in`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login' });
  }
}
