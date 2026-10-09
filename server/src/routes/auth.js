import express from 'express';
import bcrypt from 'bcryptjs';
import { UserStore, ActivityStore } from '../store/index.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, acceptTerms } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    const existing = UserStore.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = UserStore.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`,
      termsAccepted: acceptTerms !== undefined ? acceptTerms : true
    });

    const token = generateToken(user);
    const { password: _, ...safeUser } = user;

    ActivityStore.log(user._id, 'ACCOUNT_CREATED', `Joined Virtual Herbal Garden`);

    res.status(201).json({
      message: 'Account registered successfully!',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed due to server error.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = UserStore.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    const { password: _, ...safeUser } = user;

    ActivityStore.log(user._id, 'LOGGED_IN', `Logged into herbal garden portal`);

    res.json({
      message: 'Login successful!',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed due to server error.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = UserStore.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address.' });
    }

    // If newPassword is provided in the reset request, update it
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters.' });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      UserStore.update(user._id, { password: hashedPassword });

      ActivityStore.log(user._id, 'PASSWORD_RESET', 'Password was successfully reset');

      return res.json({
        message: 'Password has been successfully updated. You can now login with your new password.'
      });
    }

    // Otherwise, issue demo reset instructions / token confirmation
    res.json({
      message: 'Password reset link and security verification sent to your email.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error during password reset.' });
  }
});

export default router;
