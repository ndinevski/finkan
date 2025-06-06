import passport from 'passport';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';


dotenv.config();


const configureMicrosoftStrategy = (pool) => {
  passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: process.env.MICROSOFT_REDIRECT_URI,
    scope: ['user.read'],
    tenant: process.env.MICROSOFT_TENANT_ID || 'common',
  }, async (accessToken, refreshToken, profile, done) => {
    try {

      const client = await pool.connect();
      
      try {

        await client.query('BEGIN');
        

        const userResult = await client.query(
          'SELECT * FROM profiles WHERE microsoft_id = $1',
          [profile.id]
        );
        
        let user = userResult.rows[0];
        
        if (!user) {

          const emailResult = await client.query(
            'SELECT * FROM profiles WHERE email = $1',
            [profile.emails?.[0]?.value]
          );
          
          if (emailResult.rows[0]) {

            user = emailResult.rows[0];
            await client.query(
              'UPDATE profiles SET microsoft_id = $1, auth_provider = $2, updated_at = NOW() WHERE id = $3',
              [profile.id, 'microsoft', user.id]
            );
          } else {

            const newUserResult = await client.query(
              'INSERT INTO profiles (email, full_name, avatar_url, microsoft_id, auth_provider) VALUES ($1, $2, $3, $4, $5) RETURNING *',
              [
                profile.emails?.[0]?.value,
                profile.displayName,
                profile.photos?.[0]?.value,
                profile.id,
                'microsoft'
              ]
            );
            user = newUserResult.rows[0];
          }
        }
        

        if (refreshToken) {

          await client.query('DELETE FROM auth_sessions WHERE user_id = $1', [user.id]);
          

          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 1);
          

          await client.query(
            'INSERT INTO auth_sessions (user_id, access_token, refresh_token, expires_at) VALUES ($1, $2, $3, $4)',
            [user.id, accessToken, refreshToken, expiresAt]
          );
        }
        
        await client.query('COMMIT');
        return done(null, user);
      } catch (error) {
        await client.query('ROLLBACK');
        return done(error);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error in Microsoft authentication strategy:', error);
      return done(error);
    }
  }));


  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const result = await pool.query('SELECT * FROM profiles WHERE id = $1', [id]);
      done(null, result.rows[0] || false);
    } catch (error) {
      done(error, false);
    }
  });
};


const createToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};


const verifyToken = (req, res, next) => {
  try {
    console.log('verifyToken middleware called', { 
      cookies: req.cookies,
      hasAuthHeader: !!req.headers.authorization,
      url: req.originalUrl
    });
    
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      console.log('No token found in request');
      return res.status(401).json({ message: 'No token provided' });
    }

    console.log('Token found, verifying with JWT');
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('JWT verification error:', err);
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      console.log('Token successfully verified for user:', decoded.id);
      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};


const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated() || req.user) {
    return next();
  }
  
  res.status(401).json({ message: 'Unauthorized' });
};

export {
  configureMicrosoftStrategy,
  createToken,
  verifyToken,
  isAuthenticated
};
