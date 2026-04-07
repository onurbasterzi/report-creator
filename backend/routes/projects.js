import express from 'express';
import db from '../db/schema.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// List projects
router.get('/', (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT id, name, created_at
      FROM projects
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    res.json(projects);
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Create project
router.post('/', (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Proje adı gerekli' });
    }

    const result = db.prepare('INSERT INTO projects (user_id, name) VALUES (?, ?)').run(req.user.id, name.trim());

    res.status(201).json({
      id: result.lastInsertRowid,
      name: name.trim(),
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Update project
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Proje adı gerekli' });
    }

    // Check ownership
    const project = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!project) {
      return res.status(404).json({ error: 'Proje bulunamadı' });
    }

    db.prepare('UPDATE projects SET name = ? WHERE id = ?').run(name.trim(), id);

    res.json({ id: parseInt(id), name: name.trim() });
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Delete project
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const project = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(id, req.user.id);
    if (!project) {
      return res.status(404).json({ error: 'Proje bulunamadı' });
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(id);

    res.json({ success: true });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

export default router;
