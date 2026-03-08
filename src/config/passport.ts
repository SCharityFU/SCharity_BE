import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { authService } from '../services/auth.service';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const tokens = await authService.googleLogin({
          id: profile.id,
          emails: profile.emails?.map((e) => ({ value: e.value })) ?? [],
          displayName: profile.displayName,
          photos: profile.photos?.map((p) => ({ value: p.value })) ?? [],
        });

        return done(null, tokens as unknown as Express.User);
      } catch (err) {
        return done(err as Error, undefined);
      }
    },
  ),
);

export default passport;
