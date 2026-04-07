import db from '../db/schema.js';
import { execSync } from 'child_process';

const AI_PROVIDERS = {
  gemini: {
    name: 'Google Gemini',
    generate: async (apiKey, prompt, model = 'gemini-3.1-flash-lite-preview') => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      console.log('GEMINI REQUEST URL:', url);
      console.log('GEMINI REQUEST BODY:', JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }));

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      });

      console.log('Gemini response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Gemini API error:', error);
        throw new Error(error.error?.message || 'Gemini API hatası');
      }

      const data = await response.json();
      console.log('Gemini full response:', JSON.stringify(data).substring(0, 500));

      // Try different response structures
      let text = '';

      // Newer API format
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = data.candidates[0].content.parts[0].text;
      }
      // Alternative format
      else if (data.candidates?.[0]?.content?.parts) {
        text = data.candidates[0].content.parts.map(p => p.text || '').join('');
      }
      // Prompt feedback format (blocked)
      else if (data.promptFeedback?.blockReason) {
        throw new Error('İçerik engellendi: ' + data.promptFeedback.blockReason);
      }
      // No candidates
      else {
        console.error('Unexpected Gemini response structure:', data);
        throw new Error('Gemini API yanıtı beklenmeyen formatta');
      }

      console.log('Gemini extracted text length:', text.length);

      if (!text || text.trim().length === 0) {
        throw new Error('AI boş yanıt döndü. Lütfen API anahtarınızı kontrol edin.');
      }

      return text;
    }
  },
  gemini_cli: {
    name: 'Gemini CLI',
    generate: async (apiKey, prompt, model = 'gemini-3.1-flash-lite-preview') => {
      console.log('GEMINI CLI REQUEST, model:', model);
      try {
        // echo prompt | gemini -m model
        const safePrompt = JSON.stringify(prompt);
        const cmd = `echo ${safePrompt} | gemini -m ${model}`;
        const result = execSync(cmd, {
          encoding: 'utf-8',
          timeout: 120000,
          maxBuffer: 10 * 1024 * 1024,
          shell: true
        });
        console.log('Gemini CLI result length:', result.length);
        // Remove "Loaded cached credentials." line if present
        const cleaned = result.replace(/Loaded cached credentials\.\s*/gi, '').trim();
        if (!cleaned) {
          throw new Error('Gemini CLI boş yanıt döndü.');
        }
        return cleaned;
      } catch (err) {
        console.error('Gemini CLI error:', err.message);
        throw new Error('Gemini CLI hatası: ' + err.message);
      }
    }
  },
  minimax: {
    name: 'MiniMax',
    generate: async (apiKey, prompt, model = 'MiniMax-M2.7') => {
      console.log('MiniMax API called, model:', model);

      const response = await fetch('https://api.minimax.io/v1/text/chatcompletion_v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      console.log('MiniMax response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('MiniMax API error:', error);
        throw new Error(error.error?.message || 'MiniMax API hatası');
      }

      const data = await response.json();
      console.log('MiniMax full response:', JSON.stringify(data).substring(0, 500));

      const text = data.choices?.[0]?.message?.content || '';

      if (!text || text.trim().length === 0) {
        throw new Error('AI boş yanıt döndü. Lütfen API anahtarınızı kontrol edin.');
      }

      return text;
    }
  }
};

export async function generateReport(entries, forcedProvider = null, model = null, language = 'en') {
  console.log('Generating report for', entries.length, 'entries', forcedProvider ? 'with provider: ' + forcedProvider : '', 'model:', model, 'language:', language);

  const settings = db.prepare('SELECT provider, gemini_api_key, minimax_api_key FROM settings WHERE id = 1').get();

  // Use forced provider if specified, otherwise use settings provider
  const activeProvider = forcedProvider || settings?.provider;

  // Get API key for the active provider
  let apiKey;
  if (activeProvider === 'minimax') {
    apiKey = settings?.minimax_api_key;
  } else if (activeProvider === 'gemini') {
    apiKey = settings?.gemini_api_key;
  }
  // gemini_cli doesn't need an API key

  if (activeProvider !== 'gemini_cli' && !apiKey) {
    throw new Error(activeProvider + ' API anahtarı tanımlanmamış. Lütfen ayarlardan API anahtarınızı girin.');
  }

  const provider = AI_PROVIDERS[activeProvider];
  if (!provider) {
    throw new Error('Geçersiz AI sağlayıcı: ' + activeProvider);
  }

  console.log('Provider:', provider.name);
  console.log('API Key being used:', apiKey ? '***' + apiKey.slice(-4) : 'EMPTY');

  // Language mapping
  const languageMap = {
    'en': {
      name: 'English',
      prompt: 'You are a sprint report assistant. Generate a professional sprint report in ENGLISH from the given progress information. Write ENTIRELY in English. Write each section in complete sentences, do not use bullet points.',
      headers: {
        done: '## What We Have Done So Far',
        working: '## What We Are Working On Now',
        planning: '## What We Are Planning to Complete Next',
        deadlines: '## Deadlines & Delivery Plan',
        risks: '## Risks & Blockers'
      }
    },
    'tr': {
      name: 'Türkçe',
      prompt: 'Sen bir sprint raporu asistanısın. Verilen ilerleme bilgilerinden profesyonel sprint raporu oluştur. Her bölümü cümlelerle yaz, maddeleme yapma.',
      headers: {
        done: '## Şu Ana Kadar Yaptıklarımız',
        working: '## Şu An Üzerinde Çalıştığımız',
        planning: '## Bir Sonraki Tamamlamayı Planladıklarımız',
        deadlines: '## Teslimat Planı ve Deadline',
        risks: '## Riskler ve Engeller'
      }
    },
    'de': {
      name: 'Deutsch',
      prompt: 'Du bist ein Sprint-Bericht-Assistent. Erstellen Sie einen professionellen Sprint-Bericht auf DEUTSCH aus den gegebenen Fortschrittsinformationen. Schreiben Sie jeden Abschnitt in Sätzen, keine Aufzählungspunkte.',
      headers: {
        done: '## Was Wir Bisher Gemacht Haben',
        working: '## Worauf Wir Jetzt Arbeiten',
        planning: '## Was Wir Als Nächstes Zu Erledigen Planen',
        deadlines: '## Termine Und Lieferplan',
        risks: '## Risiken Und Blocker'
      }
    },
    'fr': {
      name: 'Français',
      prompt: 'Vous êtes un assistant de rapport de sprint. Générez un rapport de sprint professionnel en FRANÇAIS à partir des informations de progression données. Écrivez chaque section en phrases complètes, pas de listes à puces.',
      headers: {
        done: '## Ce Que Nous Avons Fait Jusqu\'à Présent',
        working: '## Ce Sur Quoi Nous Travaillons Maintenant',
        planning: '## Ce Que Nous Planifions De Compléter Ensuite',
        deadlines: '## Calendrier Et Plan De Livraison',
        risks: '## Risques Et Blocages'
      }
    },
    'es': {
      name: 'Español',
      prompt: 'Eres un asistente de informe de sprint. Genera un informe de sprint profesional en ESPAÑOL a partir de la información de progreso proporcionada. Escriba cada sección en oraciones completas, no use viñetas.',
      headers: {
        done: '## Lo Que Hemos Hecho Hasta Ahora',
        working: '## En Lo Que Estamos Trabajando Ahora',
        planning: '## Lo Que Planeamos Completar A Continuación',
        deadlines: '## Fechas Límite Y Plan De Entrega',
        risks: '## Riesgos Y Bloqueos'
      }
    }
  };

  const lang = languageMap[language] || languageMap['en'];

  // Filter entries by report-eligible categories only
  const reportCategories = ['deadlines', 'working', 'completed', 'planning', 'risks_blockers'];
  const reportEntries = entries.filter(e => reportCategories.includes(e.category));

  // Group entries by category
  const entriesByCategory = {
    'deadlines': reportEntries.filter(e => e.category === 'deadlines'),
    'working': reportEntries.filter(e => e.category === 'working'),
    'completed': reportEntries.filter(e => e.category === 'completed'),
    'planning': reportEntries.filter(e => e.category === 'planning'),
    'risks_blockers': reportEntries.filter(e => e.category === 'risks_blockers')
  };

  // Build prompt with grouped entries
  const prompt = `${lang.prompt}

Giriş formatı:
## Deadlines
${entriesByCategory.deadlines.map(e => `- ${e.date}: ${e.description}`).join('\n') || 'Bulunamadı'}

## Working
${entriesByCategory.working.map(e => `- ${e.date}: ${e.description}`).join('\n') || 'Bulunamadı'}

## Completed
${entriesByCategory.completed.map(e => `- ${e.date}: ${e.description}`).join('\n') || 'Bulunamadı'}

## Planning
${entriesByCategory.planning.map(e => `- ${e.date}: ${e.description}`).join('\n') || 'Bulunamadı'}

## Risks & Blockers
${entriesByCategory.risks_blockers.map(e => `- ${e.date}: ${e.description}`).join('\n') || 'Bulunamadı'}

Çıktı formatı (5 bölüm, sadece cümlelerle yaz, başlıkları koru):
${lang.headers.done}
[buraya cümle yaz]

${lang.headers.working}
[buraya cümle yaz]

${lang.headers.planning}
[buraya cümle yaz]

${lang.headers.deadlines}
[buraya cümle yaz]

${lang.headers.risks}
[buraya cümle yaz]`;

  console.log('Calling AI provider:', provider.name, 'with model:', model);

  try {
    const content = await provider.generate(apiKey, prompt, model);
    console.log('Report generated successfully, length:', content.length);
    return content;
  } catch (err) {
    console.error('AI generate error:', err.message);
    throw err;
  }
}

export async function editWithAI(text, command, provider = 'gemini', model = null, language = 'en') {
  console.log('AI edit request:', command, 'provider:', provider, 'model:', model, 'language:', language);

  const settings = db.prepare('SELECT gemini_api_key, minimax_api_key FROM settings WHERE id = 1').get();
  const activeProvider = provider || 'gemini';

  let key;
  if (activeProvider === 'minimax') {
    key = settings?.minimax_api_key;
  } else if (activeProvider === 'gemini') {
    key = settings?.gemini_api_key;
  }
  // gemini_cli doesn't need an API key

  if (activeProvider !== 'gemini_cli' && !key) {
    throw new Error(activeProvider + ' API anahtarı tanımlanmamış. Lütfen ayarlardan API anahtarınızı girin.');
  }

  const aiProvider = AI_PROVIDERS[activeProvider];
  if (!aiProvider) {
    throw new Error('Geçersiz AI sağlayıcı: ' + activeProvider);
  }

  // Language instruction for the prompt
  const langInstructions = {
    'en': 'Write the result in English.',
    'tr': 'Sonucu Türkçe olarak yaz.',
    'de': 'Schreiben Sie das Ergebnis auf Deutsch.',
    'fr': 'Écrivez le résultat en français.',
    'es': 'Escriba el resultado en español.'
  };

  const langInstruction = langInstructions[language] || langInstructions['en'];

  const prompt = `Aşağıdaki metinde değişiklik yap. Sadece değiştirilmiş halini ver, açıklama ekleme. ${langInstruction}

Komut: ${command}

Metin:
${text}`;

  // Use default model if not specified
  const activeModel = model || (activeProvider === 'minimax' ? 'MiniMax-M2.7' : 'gemini-3.1-flash-lite-preview');

  try {
    const result = await aiProvider.generate(key, prompt, activeModel);
    return result;
  } catch (err) {
    console.error('AI edit error:', err.message);
    throw err;
  }
}

export { AI_PROVIDERS };
