import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

export abstract class BaseController {
  protected prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  protected getUsuario(req: Request): any {
    return (req as any).usuario;
  }

  protected getSessionId(req: Request): string | undefined {
    return (req as any).sessionId;
  }

  protected sendError(res: Response, statusCode: number, message: string, error?: any): Response {
    return res.status(statusCode).json({ 
      message,
      error: error instanceof Error ? error.message : error 
    });
  }

  protected sendSuccess(res: Response, statusCode: number, data?: any, message?: string): Response {
    const response: any = {};
    if (message) response.message = message;
    if (data) {
      if (Array.isArray(data)) {
        response.data = data;
      } else {
        Object.assign(response, data);
      }
    }
    return res.status(statusCode).json(response);
  }
}

