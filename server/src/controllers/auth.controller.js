const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const BlacklistedToken = require('../models/BlacklistedToken');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  const refreshToken = jwt.sign({ userId, role }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
  return { accessToken, refreshToken };
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, phone, department, managerId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'employee',
      phone,
      department,
      managerId,
    });

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +twoFactorSecret');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check 2FA
    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign(
        { userId: user._id, purpose: '2fa' },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.json({
        requires2FA: true,
        tempToken,
        message: 'Please enter your 2FA code',
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    res.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/auth/refresh
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user._id, user.role);
    res.json(tokens);
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  try {
    if (req.token) {
      const decoded = jwt.decode(req.token);
      await BlacklistedToken.create({
        token: req.token,
        expiresAt: new Date(decoded.exp * 1000),
      });
    }
    res.json({ message: 'Logged out successfully' });
  } catch {
    res.json({ message: 'Logged out successfully' });
  }
};

// POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both passwords required' });
    }
    const pwdRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!pwdRegex.test(newPassword)) {
      return res.status(400).json({ message: 'Password must be 8+ chars with 1 uppercase, 1 number, 1 special character' });
    }

    const user = await User.findById(req.user.userId).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/auth/2fa/setup — Generate TOTP secret + QR code
exports.setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('+twoFactorSecret');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.twoFactorEnabled) return res.status(400).json({ message: '2FA already enabled' });

    const secret = authenticator.generateSecret();
    user.twoFactorSecret = secret;
    await user.save();

    const otpauth = authenticator.keyuri(user.email, 'CorporateAI', secret);
    const qrCode = await QRCode.toDataURL(otpauth);

    res.json({ secret, qrCode });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/auth/2fa/verify — Verify and enable 2FA
exports.verify2FA = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Code required' });

    const user = await User.findById(req.user.userId).select('+twoFactorSecret');
    if (!user || !user.twoFactorSecret) return res.status(400).json({ message: '2FA not set up' });

    const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isValid) return res.status(400).json({ message: 'Invalid code' });

    user.twoFactorEnabled = true;
    await user.save();

    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/auth/2fa/validate — Validate 2FA code during login
exports.validate2FA = async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) return res.status(400).json({ message: 'Token and code required' });

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Expired or invalid token' });
    }

    if (decoded.purpose !== '2fa') return res.status(400).json({ message: 'Invalid token' });

    const user = await User.findById(decoded.userId).select('+twoFactorSecret');
    if (!user || !user.twoFactorEnabled) return res.status(400).json({ message: '2FA not enabled' });

    const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isValid) return res.status(401).json({ message: 'Invalid 2FA code' });

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    res.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/auth/2fa/disable — Disable 2FA
exports.disable2FA = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Code required' });

    const user = await User.findById(req.user.userId).select('+twoFactorSecret');
    if (!user || !user.twoFactorEnabled) return res.status(400).json({ message: '2FA not enabled' });

    const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isValid) return res.status(400).json({ message: 'Invalid code' });

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('managerId', 'name email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'No account found with that email' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOTP = otp;
    user.resetOTPExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await user.save();

    // Try sending email
    try {
      const { sendNotificationEmail } = require('../services/email.service');
      await sendNotificationEmail(user.email, 'Password Reset OTP', `Your OTP is: ${otp}. Valid for 15 minutes.`);
    } catch {}

    // In dev mode, return OTP in response for testing
    const response = { message: 'OTP sent to your email' };
    if (process.env.NODE_ENV === 'development') response.otp = otp;

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+resetOTP +resetOTPExpires');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.resetOTP || user.resetOTP !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (user.resetOTPExpires < new Date()) return res.status(400).json({ message: 'OTP has expired. Request a new one.' });

    user.password = newPassword;
    user.resetOTP = undefined;
    user.resetOTPExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
