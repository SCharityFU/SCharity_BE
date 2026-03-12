import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate =
  (schema: ZodSchema) =>
    (req: Request, _res: Response, next: NextFunction): void => {
      try {
        req.body = schema.parse(req.body);
        next();
      } catch (error) {
        next(error);
      }
    };

export const validateQuery =
  (schema: ZodSchema) =>
    (req: Request, _res: Response, next: NextFunction): void => {
      try {
        req.query = schema.parse(req.query) as typeof req.query;
        next();
      } catch (error) {
        next(error);
      }
    };

export const validateParams =
  (schema: ZodSchema) =>
    (req: Request, _res: Response, next: NextFunction): void => {
      try {
        req.params = schema.parse(req.params);
        next();
      } catch (error) {
        next(error);
      }
    };

/**
 * Middleware to preprocess multipart/form-data body fields before zod validation.
 * Multer sends ALL text fields as strings, but zod schemas may expect numbers or objects.
 * This middleware:
 *  1. Parses string fields that look like JSON objects/arrays
 *  2. Coerces numeric strings to numbers
 */
export const parseMultipartBody = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.body || typeof req.body !== 'object') {
    next();
    return;
  }

  for (const key of Object.keys(req.body)) {
    const value = req.body[key];
    if (typeof value !== 'string') continue;

    // Try to parse JSON objects/arrays (e.g. bankInfo sent as JSON string)
    if (
      (value.startsWith('{') && value.endsWith('}')) ||
      (value.startsWith('[') && value.endsWith(']'))
    ) {
      try {
        req.body[key] = JSON.parse(value);
        continue;
      } catch {
        // Not valid JSON, keep as string
      }
    }

    // Coerce numeric strings to numbers (e.g. goalAmount: "50000000" → 50000000)
    if (/^\d+(\.\d+)?$/.test(value)) {
      req.body[key] = Number(value);
    }
  }

  next();
};
