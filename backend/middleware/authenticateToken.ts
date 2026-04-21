import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken } from '../utils/jwt';

async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  if (!token) {
    res.status(401).json({ error: 'Invalid token format' });
    return;
  }

  try {
    const payload = verifyAuthToken(token, 'access');
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export default authenticateToken;
