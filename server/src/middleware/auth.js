import jwt from 'jsonwebtoken';
import { UserStore } from '../store/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ayush_vastu_garden_secret_key_2026';

export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = UserStore.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found or session expired.' });
    }

    // Attach user safe payload (exclude password)
    const { password, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }
}

export function generateToken(user) {
  return jwt.sign(
    { userId: user._id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
