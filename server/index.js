const express = require('express');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for deployment
app.set('trust proxy', 1);

// CORS configuration
app.use(cors({
  origin: process.env.REACT_APP_FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(passport.initialize());

// JWT utilities
const generateJWT = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.emails?.[0]?.value,
    avatar: user.photos?.[0]?.value,
    accessToken: user.accessToken
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

const verifyJWT = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (error) {
    return null;
  }
};

// JWT Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const user = verifyJWT(token);
  if (!user) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = user;
  next();
}

// Passport GitHub Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: `${process.env.REACT_APP_BACKEND_URL}/auth/github/callback`
}, (accessToken, refreshToken, profile, done) => {
  profile.accessToken = accessToken;
  return done(null, profile);
}));

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the GitHub OAuth Dashboard API');
});

// GitHub OAuth routes
app.get('/auth/github', passport.authenticate('github', {
  scope: ['user', 'repo'],
  session: false
}));

app.get('/auth/github/callback',
  passport.authenticate('github', {
    failureRedirect: `${process.env.REACT_APP_FRONTEND_URL}/login?error=auth_failed`,
    session: false
  }),
  (req, res) => {
    console.log('User authenticated:', req.user.username);

    const token = generateJWT(req.user);

    // Redirect to frontend with token
    res.redirect(`${process.env.REACT_APP_FRONTEND_URL}/dashboard?token=${token}`);
  }
);

// API routes
app.get('/api/user', authenticateToken, (req, res) => {
  const { accessToken, ...userInfo } = req.user;
  res.json(userInfo);
});

app.get('/api/repo', authenticateToken, async (req, res) => {
  const { accessToken } = req.user;
  try {
    const { data } = await axios.get('https://api.github.com/user/repos', {
      headers: { Authorization: `token ${accessToken}` }
    });
    res.json(data);
  } catch (err) {
    console.error('Repo fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

app.get('/api/repo/:id', authenticateToken, async (req, res) => {
  const { accessToken } = req.user;
  const repoId = req.params.id;
  try {
    const { data } = await axios.get(`https://api.github.com/repositories/${repoId}`, {
      headers: { Authorization: `token ${accessToken}` }
    });
    res.json(data);
  } catch (err) {
    console.error('Repo detail fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch repo details' });
  }
});

app.get('/api/repo/:id/issues', authenticateToken, async (req, res) => {
  const { accessToken } = req.user;
  const repoId = req.params.id;
  try {
    const { data } = await axios.get(`https://api.github.com/repositories/${repoId}/issues`, {
      headers: { Authorization: `token ${accessToken}` }
    });
    res.json(data);
  } catch (err) {
    console.error('Issues fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

app.get('/api/repo/:id/pulls', authenticateToken, async (req, res) => {
  const { accessToken } = req.user;
  const repoId = req.params.id;
  try {
    const { data } = await axios.get(`https://api.github.com/repositories/${repoId}/pulls`, {
      headers: { Authorization: `token ${accessToken}` }
    });
    res.json(data);
  } catch (err) {
    console.error('Pull requests fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch pull requests' });
  }
});

app.get('/api/search', authenticateToken, async (req, res) => {
  const { accessToken } = req.user;
  const query = req.query.query;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const { data: userRepos } = await axios.get('https://api.github.com/user/repos', {
      headers: { Authorization: `token ${accessToken}` }
    });

    const matchedRepo = userRepos.find(repo =>
      repo.name.toLowerCase() === query.toLowerCase()
    );

    if (matchedRepo) {
      return res.json({ source: 'user', repo: matchedRepo });
    }

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

app.get('/api/suggest', authenticateToken, async (req, res) => {
  const { accessToken } = req.user;
  const query = req.query.query?.toLowerCase();

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const headers = { Authorization: `token ${accessToken}` };

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

    const globalReposRes = await axios.get(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=5`, { headers });
    const globalRepos = globalReposRes.data.items
      .map(repo => ({
        id: repo.id,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        source: 'global'
      }));

    const combined = [...userRepos, ...globalRepos];
    res.json(combined);
  } catch (error) {
    console.error('Suggestion error:', error.message);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
