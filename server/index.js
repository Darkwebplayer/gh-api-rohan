const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'https://github-oath-frontend.onrender.com', credentials: true }));
app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "https://github-oath-backend.onrender.com/auth/github/callback"
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


app.get('/auth/github', passport.authenticate('github', { scope: ['user', 'repo'] }));
// app.get('auth/github', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
//   res.redirect('http://localhost:3000/dashboard');
// }
// );
app.get('/auth/github/callback', passport.authenticate('github', {
  failureRedirect: '/login',
  session: true
}), (req, res) => {
  console.log('User authenticated:', req.user);
  res.redirect('https://github-oath-frontend.onrender.com');
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
      res.redirect('http://localhost:3000'); // Frontend login page
    });
  });
});


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
