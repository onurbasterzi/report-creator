import express from 'express';
import db from '../db/schema.js';
import { authenticateToken } from '../middleware/auth.js';
import { AI_PROVIDERS } from '../services/ai.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get settings (without API key)
router.get('/', (req, res) => {
  try {
    const settings = db.prepare('SELECT provider, gemini_api_key, minimax_api_key FROM settings WHERE id = 1').get();

    const availableProviders = Object.keys(AI_PROVIDERS).map(key => ({
      id: key,
      name: AI_PROVIDERS[key].name
    }));

    res.json({
      provider: settings?.provider || 'gemini',
      geminiApiKey: !!settings?.gemini_api_key,
      geminiMaskedKey: settings?.gemini_api_key ? '****' + settings.gemini_api_key.slice(-4) : null,
      minimaxApiKey: !!settings?.minimax_api_key,
      minimaxMaskedKey: settings?.minimax_api_key ? '****' + settings.minimax_api_key.slice(-4) : null,
      availableProviders
    });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Update settings
router.put('/', (req, res) => {
  try {
    const { provider, geminiApiKey, minimaxApiKey } = req.body;

    console.log('Update settings request:', { provider, hasGeminiKey: !!geminiApiKey, hasMinimaxKey: !!minimaxApiKey });

    // Validate provider
    if (provider && !AI_PROVIDERS[provider]) {
      return res.status(400).json({ error: 'Geçersiz AI sağlayıcı' });
    }

    // Get current settings
    const current = db.prepare('SELECT provider, gemini_api_key, minimax_api_key FROM settings WHERE id = 1').get();

    // If no settings row exists, create one
    if (!current) {
      db.prepare(`INSERT INTO settings (id, provider, gemini_api_key, minimax_api_key, updated_at) VALUES (1, ?, ?, ?, datetime('now'))`).run(
        provider || 'gemini',
        geminiApiKey || null,
        minimaxApiKey || null
      );
    } else {
      // Build dynamic UPDATE based on what was provided
      const updates = [];
      const values = [];

      if (provider !== undefined) {
        updates.push('provider = ?');
        values.push(provider);
      }
      if (geminiApiKey !== undefined) {
        updates.push('gemini_api_key = ?');
        values.push(geminiApiKey || null);
      }
      if (minimaxApiKey !== undefined) {
        updates.push('minimax_api_key = ?');
        values.push(minimaxApiKey || null);
      }

      updates.push("updated_at = datetime('now')");
      values.push(1);

      if (updates.length > 1) {
        db.prepare(`UPDATE settings SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      }
    }

    // Fetch updated settings
    const updated = db.prepare('SELECT provider, gemini_api_key, minimax_api_key FROM settings WHERE id = 1').get();

    res.json({
      provider: updated?.provider || 'gemini',
      geminiApiKey: !!updated?.gemini_api_key,
      geminiMaskedKey: updated?.gemini_api_key ? '****' + updated.gemini_api_key.slice(-4) : null,
      minimaxApiKey: !!updated?.minimax_api_key,
      minimaxMaskedKey: updated?.minimax_api_key ? '****' + updated.minimax_api_key.slice(-4) : null
    });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Test API connection
router.post('/test', async (req, res) => {
  try {
    const { provider, apiKey } = req.body;

    const aiProvider = AI_PROVIDERS[provider];
    if (!aiProvider) {
      return res.json({ success: false, message: 'Geçersiz AI sağlayıcı' });
    }

    // Gemini CLI doesn't need an API key
    if (provider === 'gemini_cli') {
      const testPrompt = 'Merhaba, kısaca "Çalışıyor" diye cevap ver.';
      try {
        const result = await aiProvider.generate(null, testPrompt);
        res.json({ success: true, message: 'Bağlantı başarılı', result: result.substring(0, 100) });
      } catch (cliErr) {
        res.json({ success: false, message: cliErr.message });
      }
      return;
    }

    if (!apiKey) {
      return res.json({ success: false, message: 'API anahtarı gerekli' });
    }

    // Test with a simple prompt
    const testPrompt = 'Merhaba, bağlantı testi. Kısaca "Çalışıyor" diye cevap ver.';

    try {
      const result = await aiProvider.generate(apiKey, testPrompt);
      console.log('API test result:', result.substring(0, 100));
      res.json({ success: true, message: 'Bağlantı başarılı', result: result.substring(0, 100) });
    } catch (apiErr) {
      console.error('API test error:', apiErr.message);
      res.json({ success: false, message: apiErr.message });
    }
  } catch (err) {
    console.error('Test endpoint error:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

export default router;