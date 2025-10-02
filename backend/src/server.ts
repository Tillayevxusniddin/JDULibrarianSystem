import http from 'http';
import { Server } from 'socket.io';
import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import jwt from 'jsonwebtoken'; // JWT uchun
import swaggerUi from 'swagger-ui-express';
import { swaggerSpecs } from './config/swagger.config.js';
import { initializeSocket } from './utils/socket.js';
import passport from './config/passport.config.js';

// === Jobs ===
import { startDueDateChecker } from './jobs/dueDateChecker.js';
import { startReservationChecker } from './jobs/reservationChecker.js';

// === Middlewares ===
import errorMiddleware from './middlewares/error.middleware.js';

// === Routers ===
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
import feedRouter from './api/feed/feed.route.js';
import kintoneRouter from './api/kintone/kintone.route.js';

// === Environment ===
dotenv.config();

const app: Application = express();

// ✅ O'zgartirilgan joy: allowedOrigins massivni qoldirib, soddalashtirdik
const allowedOrigins = [
  'http://localhost:5173',
  'https://d1i0w0wleowwc9.cloudfront.net', // CloudFront domeningiz
  'https://library.manabi.uz', // Rasmiy domeningiz
];

// ✅ O'zgartirilgan joy: CORS opsiyalarini soddalashtirdik
app.use(cors({ origin: allowedOrigins }));

app.use(passport.initialize());
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(process.cwd(), 'public')));

// === Routers ===
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
app.use('/api/v1/kintone', kintoneRouter);

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.get('/', (req: Request, res: Response) => {
  res
    .status(200)
    .json({ message: 'The library API is running successfully.!' });
});

// Error Middleware
app.use(errorMiddleware);

// --- SOCKET.IO INTEGRATSIYASI ---
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

// ✅ O'zgartirilgan joy: Socket.IO autentifikatsiyasini soddalashtirdik
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    console.error('❌ Socket rejected: No token');
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      role: string;
    };
    socket.data.user = decoded; // foydalanuvchi ma'lumotlarini socketga yozib qo'yamiz
    next();
  } catch (err) {
    console.error('❌ Socket rejected: Invalid token');
    return next(new Error('Authentication error'));
  }
});

// === Socket initialize ===
initializeSocket(io);

io.on('connection', (socket) => {
  const userId = socket.data.user?.id;
  console.log('✅ User connected:', socket.id, '| UserID:', userId);

  // ✅ O'zgartirilgan joy: Avtomatik user xonasiga qo'shiladi
  if (userId) {
    socket.join(userId);
    console.log(`➡️  User ${socket.id} auto-joined room: ${userId}`);
  }

  // joinRoom (faqat o'zining xonasiga)
  socket.on('joinRoom', (roomUserId: string) => {
    if (roomUserId === userId) {
      console.log(`➡️ User ${socket.id} re-joined room: ${roomUserId}`);
    }
  });

  // Post comments room
  socket.on('joinPostComments', (postId: string) => {
    socket.join(`post_comments_${postId}`);
  });
  socket.on('leavePostComments', (postId: string) => {
    socket.leave(`post_comments_${postId}`);
  });

  // Post reactions room
  socket.on('joinPostReactions', (postId: string) => {
    socket.join(`post_reactions_${postId}`);
  });
  socket.on('leavePostReactions', (postId: string) => {
    socket.leave(`post_reactions_${postId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 User disconnected:', socket.id, '| UserID:', userId);
  });
});

// --- SERVER START ---
const PORT: number = parseInt(process.env.PORT || '5000', 10);

if (process.env.NODE_ENV !== 'test') {
  startDueDateChecker();
  startReservationChecker();
  server.listen(PORT, () => {
    console.log(`🚀 Server started at http://localhost:${PORT}...`);
  });
}

export default app;
