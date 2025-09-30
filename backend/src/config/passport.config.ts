import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import * as authService from '../api/auth/auth.service.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: (error: any, user?: any) => void,
    ) => {
      try {
        // Servisdagi funksiya Googledan kelgan profil asosida foydalanuvchini topadi yoki yaratadi
        const user = await authService.authenticateGoogleUser(profile);
        done(null, user);
      } catch (err) {
        done(err, false);
      }
    },
  ),
);

// JWT ishlatganimiz uchun serialize/deserialize kerak emas, lekin passport talab qiladi.
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

export default passport;
