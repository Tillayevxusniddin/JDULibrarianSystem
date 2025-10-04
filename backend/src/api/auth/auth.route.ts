import { Router } from 'express';
import {
  registerUserHandler,
  loginUserHandler,
  getMeHandler,
  updateProfileHandler,
  changePasswordHandler,
  updateProfilePictureHandler,
  googleCallbackHandler,
} from './auth.controller.js';
import {
  createUserSchema,
  loginUserSchema,
  changePasswordSchema,
} from './auth.validation.js';
import { updateProfileSchema } from './auth.validation.js';
import validate from '../../middlewares/validate.middleware.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { uploadToS3 } from '../../utils/s3.service.js';
import passport from '../../config/passport.config.js';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Autentifikatsiya, ro'yxatdan o'tish va foydalanuvchi ma'lumotlari
 */

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     summary: Yangi foydalanuvchi yaratish (Faqat kutubxonachi)
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserInput'
 *     responses:
 *       '201':
 *         description: Muvaffaqiyatli yaratildi
 *       '403':
 *         description: Ruxsat yo'q
 *       '409':
 *         description: Foydalanuvchi allaqachon mavjud
 */
router.post(
  '/register',
  authenticate,
  authorize(['LIBRARIAN']),
  validate(createUserSchema),
  registerUserHandler,
);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Tizimga kirish va JWT token olish
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       '401':
 *         description: Email yoki parol noto'g'ri
 */
router.post('/login', validate(loginUserSchema), loginUserHandler);

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     summary: Joriy foydalanuvchi ma'lumotlarini olish
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli
 *       '401':
 *         description: Avtorizatsiya xatoligi
 */
router.get('/me', authenticate, getMeHandler);

/**
 * @openapi
 * /api/v1/auth/me:
 *   put:
 *     summary: Joriy foydalanuvchi profilini yangilash
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Muvaffaqiyatli yangilandi
 */

router.put(
  '/me',
  authenticate,
  validate(updateProfileSchema),
  updateProfileHandler,
);

/**
 * @openapi
 * /api/v1/auth/change-password:
 *   post:
 *     summary: Joriy foydalanuvchining parolini o'zgartirish
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordInput'
 *     responses:
 *       '200':
 *         description: Parol muvaffaqiyatli o'zgartirildi
 *       '400':
 *         description: Joriy parol noto'g'ri yoki yangi parollar mos kelmadi
 */
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  changePasswordHandler,
);

/**
 * @openapi
 * /api/v1/auth/me/picture:
 *   put:
 *     summary: Joriy foydalanuvchi profil rasmini yangilash
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Rasm muvaffaqiyatli yangilandi
 */

router.put(
  '/me/picture',
  authenticate,
  uploadToS3.single('profilePicture'),
  updateProfilePictureHandler,
);

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  }),
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=true`,
  }),
  googleCallbackHandler,
);

export default router;
