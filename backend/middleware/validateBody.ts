import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema } from 'zod';

function validateBody(schema: ZodSchema): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const firstMessage = result.error.issues[0]?.message || 'Invalid request body';
      res.status(400).json({
        error: firstMessage,
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.') || 'body',
          message: issue.message
        }))
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

export default validateBody;
