import passport from 'passport';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { storage } from './storage';

export function setupLinkedInAuth() {
  // Setup passport LinkedIn strategy
  const callbackURL = process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/api/auth/linkedin/callback` 
    : 'http://localhost:5000/api/auth/linkedin/callback';

  const linkedInClientId = process.env.LINKEDIN_CLIENT_ID || '';
  const linkedInClientSecret = process.env.LINKEDIN_CLIENT_SECRET || '';

  if (!linkedInClientId || !linkedInClientSecret) {
    console.warn("LinkedIn OAuth credentials missing. LinkedIn login will not work.");
  }

  passport.use(new LinkedInStrategy({
    clientID: linkedInClientId,
    clientSecret: linkedInClientSecret,
    callbackURL,
    scope: ['r_emailaddress', 'r_liteprofile'],
    state: true
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user
      let user = await storage.getUserByLinkedinId(profile.id);
      
      if (!user) {
        // Create new user from LinkedIn profile
        user = await storage.createUser({
          username: profile.displayName.replace(/\s+/g, '.').toLowerCase(),
          email: profile.emails[0].value,
          fullName: profile.displayName,
          linkedinId: profile.id,
          avatarUrl: profile.photos?.[0]?.value,
          accessToken,
          refreshToken,
          tokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
          password: null // No password for social login
        });
      } else {
        // Update existing user with new token info
        await storage.updateUser(user.id, {
          accessToken,
          refreshToken,
          tokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
          avatarUrl: profile.photos?.[0]?.value || user.avatarUrl
        });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error as Error);
    }
  }));

  // Serialize and deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  return passport;
}
