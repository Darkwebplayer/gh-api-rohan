const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3001;

// CRITICAL: Trust proxy for cross-domain cookies behind Render.com
app.set('trust proxy', 1);

// Add explicit CORS headers for all requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.REACT_APP_FRONTEND_URL);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Standard CORS middleware
app.use(cors({
  origin: process.env.REACT_APP_FRONTEND_URL,
  credentials: true
}));

// Session configuration optimized for cross-domain (Vercel + Render)
app.use(session({
  name: 'github_session', // Custom name instead of connect.sid
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'none', // MUST be 'none' for cross-domain
    secure: true,     // MUST be true with sameSite=none
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/'
  },
  proxy: true // Trust the reverse proxy
}));


app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: `${process.env.REACT_APP_BACKEND_URL}/auth/github/callback`
}, (accessToken, refreshToken, profile, done) => {
  profile.accessToken = accessToken;
  return done(null, profile);
}));

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

app.get('/', (req, res) => {
  res.send('Welcome to the GitHub OAuth Dashboard API');
}
);

// Get authenticated user info
app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});




app.get('/auth/github', passport.authenticate('github', { scope: ['user', 'repo'] }));
// app.get('auth/github', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
//   res.redirect('http://localhost:3000/dashboard');
// }
// );



app.get('/auth/github/callback', passport.authenticate('github', {
  failureRedirect: `${process.env.REACT_APP_FRONTEND_URL}/login`,
  session: true
}), (req, res) => {
  console.log('User authenticated:', req.user);
  console.log('Session ID:', req.sessionID);

  // Force save the session before redirecting
  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
    }

    // Set explicit cookie options for the redirect
    const cookieOptions = {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/'
    };

    // Explicitly set the cookie (belt and suspenders approach)
    res.cookie('github_session', req.sessionID, cookieOptions);

    // Redirect to frontend
    res.redirect(`${process.env.REACT_APP_FRONTEND_URL}/dashboard`);
  });
});



app.get('/api/repo', ensureAuthenticated, async (req, res) => {
  const { accessToken } = req.user;
  try {
    const { data } = await axios.get('https://api.github.com/user/repos', {
      headers: { Authorization: `token ${accessToken}` }
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

app.get('/api/repo/:id', ensureAuthenticated, async (req, res) => {
  const { accessToken } = req.user;
  const repoId = req.params.id;
  try {
    const { data } = await axios.get(`https://api.github.com/repositories/${repoId}`, {
      headers: { Authorization: `token ${accessToken}` }
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch repo details' });
  }
});

app.get('/api/repo/:id/issues', ensureAuthenticated, async (req, res) => {
  const { accessToken } = req.user;
  const repoId = req.params.id;
  try {
    const { data } = await axios.get(`https://api.github.com/repositories/${repoId}/issues`, {
      headers: { Authorization: `token ${accessToken}` }
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

app.get('/api/repo/:id/pull', ensureAuthenticated, async (req, res) => {
  const { accessToken } = req.user;
  const repoId = req.params.id;
  try {
    const { data } = await axios.get(`https://api.github.com/repositories/${repoId}/pulls`, {
      headers: { Authorization: `token ${accessToken}` }
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pull requests' });
  }
});



app.get('/api/search', ensureAuthenticated, async (req, res) => {
  const { accessToken, username } = req.user;
  const query = req.query.query;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    // 1. Search user-owned repositories
    const { data: userRepos } = await axios.get('https://api.github.com/user/repos', {
      headers: { Authorization: `token ${accessToken}` }
    });

    const matchedRepo = userRepos.find(repo =>
      repo.name.toLowerCase() === query.toLowerCase()
    );

    if (matchedRepo) {
      return res.json({ source: 'user', repo: matchedRepo });
    }

    // 2. If not found, search GitHub globally
    const { data: globalSearch } = await axios.get(`https://api.github.com/search/repositories?q=${query}`, {
      headers: { Authorization: `token ${accessToken}` }
    });

    if (globalSearch.total_count > 0) {
      return res.json({ source: 'global', repos: globalSearch.items });
    } else {
      return res.status(404).json({ error: 'No repositories found' });
    }

  } catch (err) {
    console.error('Search error:', err.message);
    return res.status(500).json({ error: 'Search failed' });
  }
});


app.get('/api/suggest', ensureAuthenticated, async (req, res) => {
  const { accessToken, username } = req.user;
  const query = req.query.query?.toLowerCase();

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const headers = { Authorization: `token ${accessToken}` };

    // Fetch user's own repos
    const userReposRes = await axios.get('https://api.github.com/user/repos?per_page=100', { headers });
    const userRepos = userReposRes.data
      .filter(repo => repo.name.toLowerCase().includes(query))
      .map(repo => ({
        id: repo.id,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        source: 'user'
      }));

    // Fetch global repos
    const globalReposRes = await axios.get(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=5`, { headers });
    const globalRepos = globalReposRes.data.items
      .map(repo => ({
        id: repo.id,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        source: 'global'
      }));

    // Combine both
    const combined = [...userRepos, ...globalRepos];

    res.json(combined);
  } catch (error) {
    console.error('Suggestion error:', error.message);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

app.get('/logout', (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.session.destroy(() => {
      res.clearCookie('connect.sid'); // Clear session cookie
      res.redirect(process.env.REACT_APP_FRONTEND_URL || 'https://github-oath-frontend.onrender.com');
    });
  });
});


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
