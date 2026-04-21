import { Request, Response, NextFunction, RequestHandler } from 'express';

function authorizeRole(...allowedRoles: string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      res.status(403).json({ error: 'Role not found in token' });
      return;
    }
    if (!allowedRoles.includes(req.userRole)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}

export default authorizeRole;
