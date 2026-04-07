import express from 'express';
import db from '../db/schema.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Helper: check project ownership
function checkProjectOwnership(projectId, userId) {
  return db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(projectId, userId);
}

// List entries for a project
router.get('/projects/:id/entries', (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    if (!checkProjectOwnership(id, req.user.id)) {
      return res.status(404).json({ error: 'Proje bulunamadı' });
    }

    const entries = db.prepare(`
      SELECT id, date, description, category, sort_order, created_at
      FROM entries
      WHERE project_id = ?
      ORDER BY category, sort_order ASC, created_at DESC
    `).all(id);

    res.json(entries);
  } catch (err) {
    console.error('Get entries error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Create entry
router.post('/projects/:id/entries', (req, res) => {
  try {
    const { id } = req.params;
    const { date, description, category } = req.body;

    // Check ownership
    if (!checkProjectOwnership(id, req.user.id)) {
      return res.status(404).json({ error: 'Proje bulunamadı' });
    }

    // Validation
    if (!date || !description || !category) {
      return res.status(400).json({ error: 'Tarih, açıklama ve kategori gerekli' });
    }

    const validCategories = ['todo', 'in_progress', 'done', 'deadlines', 'working', 'completed', 'planning', 'risks_blockers'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Geçersiz kategori' });
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Tarih formatı YYYY-MM-DD olmalı' });
    }

    const result = db.prepare(`
      INSERT INTO entries (project_id, date, description, category)
      VALUES (?, ?, ?, ?)
    `).run(id, date, description.trim(), category);

    res.status(201).json({
      id: result.lastInsertRowid,
      date,
      description: description.trim(),
      category,
      sort_order: 0,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Create entry error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Reorder entries (bulk update sort_order)
router.put('/entries/reorder', (req, res) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries)) {
      return res.status(400).json({ error: 'Entries dizisi gerekli' });
    }

    // Verify ownership of all entries
    const ids = entries.map(e => e.id);
    if (ids.length === 0) {
      return res.status(400).json({ error: 'En az bir entry gerekli' });
    }

    const placeholders = ids.map(() => '?').join(',');
    const existingEntries = db.prepare(`
      SELECT e.id FROM entries e
      JOIN projects p ON e.project_id = p.id
      WHERE e.id IN (${placeholders}) AND p.user_id = ?
    `).all(...ids, req.user.id);

    if (existingEntries.length !== ids.length) {
      return res.status(404).json({ error: 'Tüm entry\'ler bulunamadı veya yetkiniz yok' });
    }

    // Update sort_order for each entry
    const updateStmt = db.prepare('UPDATE entries SET sort_order = ?, category = ? WHERE id = ?');
    const updateMany = db.transaction((items) => {
      for (const item of items) {
        updateStmt.run(item.sort_order, item.category, item.id);
      }
    });

    updateMany(entries);

    res.json({ success: true });
  } catch (err) {
    console.error('Reorder entries error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Update entry
router.put('/entries/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { date, description, category } = req.body;

    // Find entry and check ownership via project
    const entry = db.prepare(`
      SELECT e.* FROM entries e
      JOIN projects p ON e.project_id = p.id
      WHERE e.id = ? AND p.user_id = ?
    `).get(id, req.user.id);

    if (!entry) {
      return res.status(404).json({ error: 'Entry bulunamadı' });
    }

    // Validation
    const validCategories = ['todo', 'in_progress', 'done', 'deadlines', 'working', 'completed', 'planning', 'risks_blockers'];
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({ error: 'Geçersiz kategori' });
    }

    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Tarih formatı YYYY-MM-DD olmalı' });
    }

    const updatedEntry = {
      date: date || entry.date,
      description: description !== undefined ? description.trim() : entry.description,
      category: category || entry.category
    };

    db.prepare(`
      UPDATE entries
      SET date = ?, description = ?, category = ?
      WHERE id = ?
    `).run(updatedEntry.date, updatedEntry.description, updatedEntry.category, id);

    res.json({
      id: Number(id),
      ...updatedEntry,
      created_at: entry.created_at
    });
  } catch (err) {
    console.error('Update entry error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Delete entry
router.delete('/entries/:id', (req, res) => {
  try {
    const { id } = req.params;

    // Find entry and check ownership via project
    const entry = db.prepare(`
      SELECT e.id FROM entries e
      JOIN projects p ON e.project_id = p.id
      WHERE e.id = ? AND p.user_id = ?
    `).get(id, req.user.id);

    if (!entry) {
      return res.status(404).json({ error: 'Entry bulunamadı' });
    }

    db.prepare('DELETE FROM entries WHERE id = ?').run(id);

    res.json({ success: true });
  } catch (err) {
    console.error('Delete entry error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

export default router;
