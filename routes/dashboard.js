const express = require('express');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard  (protected)
// Returns the logged-in user's stats and recent activity for their dashboard screen.
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      'name village adviceCount schemesViewCount loanChecksCount activityLog'
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      name: user.name,
      village: user.village,
      adviceCount: user.adviceCount,
      schemesViewCount: user.schemesViewCount,
      loanChecksCount: user.loanChecksCount,
      activityLog: user.activityLog
    });
  } catch (err) {
    console.error('Dashboard route error:', err);
    res.status(500).json({ error: 'Something went wrong loading your dashboard.' });
  }
});

module.exports = router;
