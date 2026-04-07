import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/schema.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Kullanıcı adı en az 3 karakter olmalı' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı' });
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const result = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, passwordHash);

    const user = { id: result.lastInsertRowid, username };
    const token = generateToken(user);

    res.status(201).json({ id: user.id, username: user.username, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }

    const token = generateToken(user);

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

export default router;
