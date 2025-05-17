import express from 'express';
import passport from 'passport';
import { createToken, verifyToken } from '../middleware/auth.js';

const authRouter = express.Router();

// Microsoft OAuth login route
authRouter.get('/microsoft',
  passport.authenticate('microsoft', { 
    prompt: 'select_account',
    scope: ['user.read'] 
  })
);

// Microsoft OAuth callback route
authRouter.get('/microsoft/callback',
  passport.authenticate('microsoft', { 
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth?error=Failed%20to%20authenticate` 
  }),
  (req, res) => {
    try {
      // Create JWT token
      const token = createToken(req.user);
      
      // Set HTTP-only cookie with token
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax'
      });
      
      // Redirect to client app
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/`);
    } catch (error) {
      console.error('Authentication callback error:', error);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth?error=Server%20error`);
    }
  }
);

// Get current user info
authRouter.get('/me', verifyToken, (req, res) => {
  console.log('Auth/me endpoint reached with user:', req.user);
  
  if (!req.user) {
    console.log('No user found in request');
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  // Log debug info
  console.log('User authenticated successfully:', {
    id: req.user.id,
    email: req.user.email,
    role: req.user.role
  });
  
  res.json({ user: req.user });
});

// Exchange Microsoft token for our session token
authRouter.post('/microsoft/token', async (req, res) => {
  try {
    const { idToken, accessToken } = req.body;
    
    if (!idToken || !accessToken) {
      return res.status(400).json({ message: 'Missing token information' });
    }
    
    // Verify the tokens with Microsoft (in a production app)
    // For now, we'll trust the tokens and create a user session
    
    // Get user info from Microsoft Graph API using the access token
    const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!userInfoResponse.ok) {
      console.error('Failed to fetch user info from Microsoft Graph:', await userInfoResponse.text());
      return res.status(401).json({ message: 'Invalid Microsoft token' });
    }
    
    const userInfo = await userInfoResponse.json();
    
    // Now find or create user in our database
    const client = await req.db.connect();
    let user;
    
    try {
      await client.query('BEGIN');
      
      // Check if user exists by Microsoft ID (extracted from tokens)
      // In practice, you would decode the ID token to get the user ID
      // For now, we use the ID from the Graph API response
      const userResult = await client.query(
        'SELECT * FROM profiles WHERE microsoft_id = $1 OR email = $2',
        [userInfo.id, userInfo.userPrincipalName || userInfo.mail]
      );
      
      if (userResult.rowCount > 0) {
        // Update existing user
        user = userResult.rows[0];
        await client.query(
          'UPDATE profiles SET microsoft_id = $1, auth_provider = $2, updated_at = NOW() WHERE id = $3',
          [userInfo.id, 'microsoft', user.id]
        );
      } else {
        // Create new user
        const newUserResult = await client.query(
          'INSERT INTO profiles (email, full_name, avatar_url, microsoft_id, auth_provider) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [
            userInfo.userPrincipalName || userInfo.mail,
            userInfo.displayName,
            null, // No avatar URL from basic Graph API
            userInfo.id,
            'microsoft'
          ]
        );
        user = newUserResult.rows[0];
      }
      
      await client.query('COMMIT');
      
      // Create JWT token
      const token = createToken(user);
      
      // Set HTTP-only cookie with token
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax'
      });
      
      res.status(200).json({ user });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error processing Microsoft token:', error);
      res.status(500).json({ message: 'Error processing authentication' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ message: 'Server error during authentication' });
  }
});

// Logout route
authRouter.get('/logout', (req, res) => {
  // Clear the token cookie
  res.clearCookie('token');
  
  // Logout from Passport session
  if (req.logout) {
    req.logout();
  }
  
  // Redirect to login page
  res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth`);
});

// Also add POST method for frontend logout
authRouter.post('/logout', (req, res) => {
  // Clear the token cookie
  res.clearCookie('token');
  
  // Logout from Passport session
  if (req.logout) {
    req.logout();
  }
  
  res.status(200).json({ message: 'Logged out successfully' });
});

export default authRouter;
