import express from 'express';
import db from '../db/schema.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateReport, generateFreeReport, generateFreeTextReport, editWithAI } from '../services/ai.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Helper: check project ownership
function checkProjectOwnership(projectId, userId) {
  return db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(projectId, userId);
}

// Generate report
router.post('/projects/:id/reports', async (req, res) => {
  try {
    const { id } = req.params;
    const { entryIds, provider, model, language, mode, freeText } = req.body;

    // Check ownership
    if (!checkProjectOwnership(id, req.user.id)) {
      return res.status(404).json({ error: 'Proje bulunamadı' });
    }

    let content = '';
    const reportMode = mode || 'structured';

    // Free Text Mode - no entries needed
    if (reportMode === 'freeText') {
      if (!freeText || freeText.trim().length === 0) {
        return res.status(400).json({ error: 'Rapor metni boş olamaz' });
      }
      content = await generateFreeTextReport(freeText, provider, model, language);
    } else {
      // Get entries for structured or free mode
      let entries;
      if (entryIds && Array.isArray(entryIds) && entryIds.length > 0) {
        // Get specific entries (convert string IDs to integers)
        entries = db.prepare(`
          SELECT e.* FROM entries e
          JOIN projects p ON e.project_id = p.id
          WHERE e.id IN (${entryIds.map(() => '?').join(',')}) AND e.project_id = ? AND p.user_id = ?
        `).all(...entryIds.map(id => parseInt(id)), parseInt(id), req.user.id);
      } else {
        // Get all entries for the project
        entries = db.prepare(`
          SELECT e.* FROM entries e
          JOIN projects p ON e.project_id = p.id
          WHERE e.project_id = ? AND p.user_id = ?
          ORDER BY e.date DESC
        `).all(id, req.user.id);
      }

      if (entries.length === 0) {
        return res.status(400).json({ error: 'Rapor üretmek için en az bir entry olmalı' });
      }

      if (reportMode === 'free') {
        content = await generateFreeReport(entries, provider, model, language);
      } else {
        content = await generateReport(entries, provider, model, language);
      }
    }

    // Save report
    const result = db.prepare(`
      INSERT INTO reports (project_id, content)
      VALUES (?, ?)
    `).run(id, content);

    res.status(201).json({
      id: result.lastInsertRowid,
      content,
      generated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Generate report error:', err);
    res.status(500).json({ error: err.message || 'Sunucu hatası' });
  }
});

// AI edit report content
router.post('/reports/:id/edit', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, command, provider, model, language } = req.body;

    if (!text || !command) {
      return res.status(400).json({ error: 'Metin ve komut gerekli' });
    }

    // Check report ownership
    const report = db.prepare(`
      SELECT r.id, r.content FROM reports r
      JOIN projects p ON r.project_id = p.id
      WHERE r.id = ? AND p.user_id = ?
    `).get(id, req.user.id);

    if (!report) {
      return res.status(404).json({ error: 'Rapor bulunamadı' });
    }

    const result = await editWithAI(text, command, provider, model, language);
    res.json({ result });
  } catch (err) {
    console.error('AI edit error:', err);
    res.status(500).json({ error: err.message || 'Sunucu hatası' });
  }
});

// List reports for a project
router.get('/projects/:id/reports', (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    if (!checkProjectOwnership(id, req.user.id)) {
      return res.status(404).json({ error: 'Proje bulunamadı' });
    }

    const reports = db.prepare(`
      SELECT id, content, generated_at
      FROM reports
      WHERE project_id = ?
      ORDER BY generated_at DESC
    `).all(id);

    res.json(reports);
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Update report (manual edit)
router.put('/reports/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { content, title } = req.body;

    const report = db.prepare(`
      SELECT r.id, r.content FROM reports r
      JOIN projects p ON r.project_id = p.id
      WHERE r.id = ? AND p.user_id = ?
    `).get(id, req.user.id);

    if (!report) {
      return res.status(404).json({ error: 'Rapor bulunamadı' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'İçerik boş olamaz' });
    }

    db.prepare('UPDATE reports SET content = ? WHERE id = ?').run(content.trim(), id);

    res.json({ success: true });
  } catch (err) {
    console.error('Update report error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Delete report
router.delete('/reports/:id', (req, res) => {
  try {
    const { id } = req.params;

    const report = db.prepare(`
      SELECT r.id FROM reports r
      JOIN projects p ON r.project_id = p.id
      WHERE r.id = ? AND p.user_id = ?
    `).get(id, req.user.id);

    if (!report) {
      return res.status(404).json({ error: 'Rapor bulunamadı' });
    }

    db.prepare('DELETE FROM reports WHERE id = ?').run(id);

    res.json({ success: true });
  } catch (err) {
    console.error('Delete report error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Get single report
router.get('/reports/:id', (req, res) => {
  try {
    const { id } = req.params;

    const report = db.prepare(`
      SELECT r.id, r.content, r.generated_at
      FROM reports r
      JOIN projects p ON r.project_id = p.id
      WHERE r.id = ? AND p.user_id = ?
    `).get(id, req.user.id);

    if (!report) {
      return res.status(404).json({ error: 'Rapor bulunamadı' });
    }

    res.json(report);
  } catch (err) {
    console.error('Get report error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

export default router;
