require('dotenv').config(); // Loads keys from your .env file
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');

const app = express();

// 1. Tell Express to serve your HTML files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));
app.enable('trust proxy'); 

// 2. Passport configuration
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL,
    proxy: true 
  },
  (accessToken, refreshToken, profile, done) => {
    return done(null, {
      id: profile.id,
      displayName: profile.displayName,
      email: profile.emails[0].value
    });
  }
));

// 3. Session Middleware
app.use(session({ 
  secret: process.env.SESSION_SECRET || 'fallback_local_secret', 
  resave: false, 
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

app.use(passport.initialize());
app.use(passport.session());


// ========================================================
// HERE IS THE EXACT ROUTE YOU WERE CONFUSED ABOUT:
// ========================================================
app.get('/api/user-status', (req, res) => {
  if (req.isAuthenticated()) {
    // If logged in, send the user's name back to index.html
    res.json({ isAuthenticated: true, user: req.user });
  } else {
    // If not logged in, tell index.html to keep showing "Sign In"
    res.json({ isAuthenticated: false });
  }
});


// 4. Authentication Routes
app.get('/login', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/'); // Redirect back to homepage after logging in
  }
);

app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/'); // Send back to homepage after logging out
  });
});

// 5. Start the engine
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));