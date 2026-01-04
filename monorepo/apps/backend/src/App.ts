import express, { Express } from 'express';
import { createServer, Server as HttpServer } from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger.json';
import cron from 'node-cron';
import dotenv from 'dotenv';

import userRoutes from './routes/userRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import paymentRoutes from './routes/paymentRoutes';
import cartRoutes, { CartController } from './routes/cartRoutes';
import addressRoutes from './routes/addressRoutes';
import rateRoutes from './routes/rateRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import messageRoutes from './routes/messageRoutes';
import adminRoutes from './routes/adminRoutes';
import stripeRoutes from './routes/stripeRoutes';
import { uploadDir } from './controllers/ProductController';
import { WebSocketService } from './services/WebSocketService';

dotenv.config();

export class App {
  private app: Express;
  private httpServer: HttpServer;
  private port: number;
  private webSocketService: WebSocketService | null = null;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.port = 5000;
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupCronJobs();
    this.setupSwagger();
    this.setupWebSocket();
  }

  private setupMiddlewares(): void {
    this.app.use(cors({
      origin: 'http://localhost:3000',
      credentials: true
    }));

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use('/uploads', express.static(uploadDir));
    this.app.use(cookieParser());
  }

  private setupRoutes(): void {
    this.app.use(userRoutes);
    this.app.use(productRoutes);
    this.app.use(orderRoutes);
    this.app.use(paymentRoutes);
    this.app.use(cartRoutes);
    this.app.use(addressRoutes);
    this.app.use(rateRoutes);
    this.app.use(favoriteRoutes);
    this.app.use(messageRoutes);
    this.app.use(adminRoutes);
    this.app.use(stripeRoutes);
  }

  private setupCronJobs(): void {
    cron.schedule("0 * * * *", async () => {
      await CartController.limparCarrinhosExpirados();
    });
  }

  private setupSwagger(): void {
    this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  }

  private setupWebSocket(): void {
    this.webSocketService = new WebSocketService(this.httpServer);
  }

  public start(): void {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET não definida no .env");
    }

    this.httpServer.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
    });
  }

  public getApp(): Express {
    return this.app;
  }

  public getWebSocketService(): WebSocketService | null {
    return this.webSocketService;
  }
}

