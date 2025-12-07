const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return next();
  }
  
  // If it's an API call, return JSON error
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
  
  // Otherwise redirect to login
  res.redirect('/login');
};

module.exports = { isAuthenticated };
