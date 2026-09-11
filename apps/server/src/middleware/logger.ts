import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusPrefix = status >= 400 ? '⚠' : '✓';
    console.log(`[${new Date().toISOString()}] ${statusPrefix} ${method} ${originalUrl} ${status} - ${duration}ms`);
  });

  next();
}
