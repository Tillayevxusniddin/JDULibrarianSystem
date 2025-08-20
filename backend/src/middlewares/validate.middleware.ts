import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

interface ValidatedRequestData {
  body?: any;
  query?: any;
  params?: any;
}

const validate =
  (schema: ZodSchema<ValidatedRequestData>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      req.validatedData = validatedData;

      next();
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          messages: error.issues.map((issue) => issue.message),
        });
      }
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };

export default validate;
