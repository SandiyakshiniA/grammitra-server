const express = require('express');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// POST /api/advice  (protected)
// body: { trade, scale, challenge, lang }
router.post('/advice', requireAuth, async (req, res) => {
  try {
    const { trade, scale, challenge, lang } = req.body;

    if (!challenge || !challenge.trim()) {
      return res.status(400).json({ error: 'Please describe your challenge.' });
    }

    const prompt = `You are GramMitra, a warm and practical business advisor for rural Indian micro-entrepreneurs with limited formal business education.

Business type: ${trade}
Current monthly earnings: ${scale}
Main challenge: "${challenge}"
Respond entirely in: ${lang}

Give short, concrete, actionable advice (max 120 words) in plain, simple language a small shopkeeper would understand. Include: one immediate action they can take this week, one cost-saving idea, and one growth idea. No jargon. No headers, just plain conversational text, written entirely in ${lang}.`;

    const apiKey = process.env.GEMINI_API_KEY;
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API error:', errText);
      return res.status(502).json({ error: 'The AI advisor is unavailable right now. Please try again.' });
    }

    const data = await geminiResponse.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
      return res.status(502).json({ error: 'The AI advisor returned an empty response. Please try again.' });
    }

    // Log this action against the logged-in user
    await User.findByIdAndUpdate(req.userId, {
      $inc: { adviceCount: 1 },
      $push: {
        activityLog: {
          $each: [{ label: 'Got business advice', time: new Date() }],
          $position: 0,
          $slice: 6
        }
      }
    });

    res.json({ advice: text });
  } catch (err) {
    console.error('Advice route error:', err);
    res.status(500).json({ error: 'Something went wrong generating advice.' });
  }
});

// POST /api/loan-check  (protected)
// body: { loanAmount, monthlyIncome }
router.post('/loan-check', requireAuth, async (req, res) => {
  try {
    const loanAmount = parseFloat(req.body.loanAmount);
    const monthlyIncome = parseFloat(req.body.monthlyIncome);

    if (!loanAmount || !monthlyIncome || loanAmount <= 0 || monthlyIncome <= 0) {
      return res.status(400).json({ error: 'Please provide valid loan amount and income figures.' });
    }

    const ratio = loanAmount / (monthlyIncome * 12);
    let verdict, detail;

    if (ratio <= 0.5) {
      verdict = 'Likely eligible';
      detail = 'Your loan request is well within typical lending ratios for micro-enterprise loans like MUDRA Shishu/Kishor. A local bank or MFI is a good next step.';
    } else if (ratio <= 1.2) {
      verdict = 'Possibly eligible, with documentation';
      detail = 'This is a moderate ask relative to your income. Approval is likely if you can show consistent earnings and a clear use of funds.';
    } else {
      verdict = 'Consider a smaller amount first';
      detail = 'This loan is large relative to your current income. Consider starting with a smaller MUDRA Shishu loan and scaling up as your business grows.';
    }

    await User.findByIdAndUpdate(req.userId, {
      $inc: { loanChecksCount: 1 },
      $push: {
        activityLog: {
          $each: [{ label: 'Checked loan eligibility', time: new Date() }],
          $position: 0,
          $slice: 6
        }
      }
    });

    res.json({ verdict, detail });
  } catch (err) {
    console.error('Loan check error:', err);
    res.status(500).json({ error: 'Something went wrong checking eligibility.' });
  }
});

// POST /api/schemes-viewed  (protected) - just logs that the user viewed schemes for their dashboard
router.post('/schemes-viewed', requireAuth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      $inc: { schemesViewCount: 1 },
      $push: {
        activityLog: {
          $each: [{ label: 'Viewed government schemes', time: new Date() }],
          $position: 0,
          $slice: 6
        }
      }
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Schemes-viewed error:', err);
    res.status(500).json({ error: 'Something went wrong logging this.' });
  }
});

module.exports = router;
