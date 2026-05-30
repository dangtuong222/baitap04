import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";

export const verifyToken = (req, res, next) => {
  let token = req.cookies.accessToken;
  const authHeader = req.headers.authorization;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    console.log('[Auth] No token found in cookies or Authorization header');
    return res.status(401).json({ message: 'Unauthorized: No token' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      console.error('[Auth] Token verification error:', err.message, 'Secret:', process.env.ACCESS_TOKEN_SECRET?.substring(0, 10) + '...');
      return res.status(403).json({ message: 'Forbidden: Invalid token', error: err.message });
    }
    console.log('[Auth] Token verified successfully for user:', user.id);
    req.user = user;
    next();
  });
};

export const optionalAuth = (req, res, next) => {
  let token = req.cookies.accessToken;
  const authHeader = req.headers.authorization;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (!err) {
      req.user = user;
    }
    next();
  });
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};


export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  next();
};
