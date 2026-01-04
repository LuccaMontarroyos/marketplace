import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const SECRET_KEY = process.env.JWT_SECRET || "seu segredo super secreto";

interface AuthenticatedSocket extends Socket {
  userId?: number;
}

export class WebSocketService {
  private io: SocketServer;
  private prisma: PrismaClient;
  private userSockets: Map<number, Set<string>> = new Map();

  constructor(httpServer: HttpServer) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.prisma = new PrismaClient();
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Token não fornecido'));
        }

        const decoded = jwt.verify(token, SECRET_KEY) as { id: number; email: string; isAdmin: boolean };
        socket.userId = decoded.id;
        next();
      } catch (error) {
        next(new Error('Token inválido'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId;

      if (!userId) {
        socket.disconnect();
        return;
      }

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      socket.emit('connected', { userId, message: 'Conectado ao servidor de mensagens' });

      socket.on('join_conversation', async (data: { otherUserId: number }) => {
        const roomId = this.getRoomId(userId, data.otherUserId);
        socket.join(roomId);
      });

      socket.on('leave_conversation', (data: { otherUserId: number }) => {
        const roomId = this.getRoomId(userId, data.otherUserId);
        socket.leave(roomId);
      });

      socket.on('disconnect', () => {
        if (userId && this.userSockets.has(userId)) {
          this.userSockets.get(userId)!.delete(socket.id);
          if (this.userSockets.get(userId)!.size === 0) {
            this.userSockets.delete(userId);
          }
        }
      });
    });
  }

  public emitNewMessage(message: any): void {
    const { idUsuarioEmissor, idUsuarioReceptor } = message;
    
    const roomId = this.getRoomId(idUsuarioEmissor, idUsuarioReceptor);
    
    this.io.to(roomId).emit('new_message', message);
    
    const emitterSockets = this.userSockets.get(idUsuarioEmissor);
    const receiverSockets = this.userSockets.get(idUsuarioReceptor);

    if (emitterSockets) {
      emitterSockets.forEach(socketId => {
        this.io.to(socketId).emit('message_sent', message);
      });
    }

    if (receiverSockets && receiverSockets.size > 0) {
      receiverSockets.forEach(socketId => {
        this.io.to(socketId).emit('message_received', message);
      });
    }
  }

  public emitMessageDeleted(messageId: number, userIds: number[]): void {
    userIds.forEach(userId => {
      const userSockets = this.userSockets.get(userId);
      if (userSockets) {
        userSockets.forEach(socketId => {
          this.io.to(socketId).emit('message_deleted', { messageId });
        });
      }
    });
  }

  private getRoomId(userId1: number, userId2: number): string {
    return [userId1, userId2].sort().join('_');
  }

  public getIO(): SocketServer {
    return this.io;
  }
}

