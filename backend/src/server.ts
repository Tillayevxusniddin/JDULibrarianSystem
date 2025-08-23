import http from 'http';
import { Server } from 'socket.io';
import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpecs } from './config/swagger.config.js';
import { initializeSocket } from './utils/socket.js';

import { startDueDateChecker } from './jobs/dueDateChecker.js';
import { startReservationChecker } from './jobs/reservationChecker.js';
import errorMiddleware from './middlewares/error.middleware.js';

import authRouter from './api/auth/auth.route.js';
import categoryRouter from './api/category/category.route.js';
import bookRouter from './api/book/book.route.js';
import loanRouter from './api/loan/loan.route.js';
import suggestionRouter from './api/suggestion/suggestion.route.js';
import notificationRouter from './api/notification/notification.route.js';
import fineRouter from './api/fine/fine.route.js';
import userRouter from './api/user/user.route.js';
import reservationRouter from './api/reservation/reservation.route.js';
import dashboardRouter from './api/dashboard/dashboard.route.js';
import channelRouter from './api/channel/channel.route.js';
import postRouter from './api/post/post.route.js';
import commentRouter from './api/comment/comment.route.js';
import reactionRouter from './api/reaction/reaction.route.js';
import feedRouter from './api/feed/feed.route.js'; // <-- YANGI IMPORT

dotenv.config();

const app: Application = express();

app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(process.cwd(), 'public')));

// --- Barcha routerlar ---
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/books', bookRouter);
app.use('/api/v1/loans', loanRouter);
app.use('/api/v1/suggestions', suggestionRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/fines', fineRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reservations', reservationRouter);
app.use('/api/v1/channels', channelRouter);
app.use('/api/v1/posts', postRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/api/v1/reactions', reactionRouter);
app.use('/api/v1/feed', feedRouter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.get('/', (req: Request, res: Response) => {
  res
    .status(200)
    .json({ message: 'The library API is running successfully.!' });
});

app.use(errorMiddleware);

// --- SOCKET.IO INTEGRATSIYASI ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

initializeSocket(io);

io.on('connection', (socket) => {
  console.log('✅ A user connected:', socket.id);

  // Shaxsiy bildirishnomalar uchun xona
  socket.on('joinRoom', (userId: string) => {
    socket.join(userId);
    console.log(`User ${socket.id} joined personal room: ${userId}`);
  });

  // Post izohlari uchun xona
  socket.on('joinPostComments', (postId: string) => {
    const roomName = `post_comments_${postId}`;
    socket.join(roomName);
    console.log(`User ${socket.id} joined post comments room: ${postId}`);
  });

  socket.on('leavePostComments', (postId: string) => {
    const roomName = `post_comments_${postId}`;
    socket.leave(roomName);
    console.log(`User ${socket.id} left post comments room: ${postId}`);
  });

  socket.on('joinPostReactions', (postId: string) => {
    socket.join(`post_reactions_${postId}`);
  });

  socket.on('leavePostReactions', (postId: string) => {
    socket.leave(`post_reactions_${postId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 A user disconnected:', socket.id);
  });
});
// --- INTEGRATSIYA TUGADI ---

const PORT: number = parseInt(process.env.PORT || '5000', 10);

if (process.env.NODE_ENV !== 'test') {
  startDueDateChecker();
  startReservationChecker();
  server.listen(PORT, () => {
    console.log(`🚀 Server started at http://localhost:${PORT}...`);
  });
}

export default app;
