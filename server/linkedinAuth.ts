import type { Express } from "express";
import passport from "passport";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import session from "express-session";
import { storage } from "./storage";
import MemoryStore from "memorystore";

const MemoryStoreSession = MemoryStore(session);

export function setupLinkedInAuth(app: Express) {
  // Configure session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "linkedin-pdf-enhancer-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure LinkedIn strategy
  passport.use(
    new LinkedInStrategy(
      {
        clientID: process.env.LINKEDIN_CLIENT_ID || "linkedin-client-id",
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "linkedin-client-secret",
        callbackURL: "/api/auth/linkedin/callback",
        scope: ["r_emailaddress", "r_liteprofile"],
        state: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists
          let user = await storage.getUserByLinkedinId(profile.id);

          if (!user) {
            // Create new user
            user = await storage.createUser({
              username: profile.emails[0].value || `linkedin_${profile.id}`,
              linkedinId: profile.id,
              linkedinToken: accessToken,
              email: profile.emails[0].value,
              fullName: profile.displayName,
              profilePicture: profile.photos?.[0]?.value,
            });
          } else {
            // Update user's LinkedIn token
            await storage.updateUserLinkedinToken(user.id, accessToken);
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  // Serialize user to the session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // LinkedIn authentication routes
  app.get("/api/auth/linkedin", passport.authenticate("linkedin"));

  app.get(
    "/api/auth/linkedin/callback",
    passport.authenticate("linkedin", {
      successRedirect: "/",
      failureRedirect: "/login-failed",
    })
  );

  // Auth status endpoint
  app.get("/api/auth/status", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });
}
