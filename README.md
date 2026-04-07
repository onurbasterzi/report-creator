# Rapor Oluşturucu

AI destekli sprint raporu oluşturma aracı. Günlük ilerleme bilgilerinizi girin, profesyonel sprint raporlarınızı AI (Gemini/MiniMax) ile oluşturun.

---

## Proje Raporu

### Konsept & Hedef

Bu proje, yazılım geliştirme ekiplerinin sprint ilerlemelerini kolayca takip etmeleri ve profesyonel raporlar üretmeleri için tasarlanmıştır. Kullanıcılar günlük olarak yaptıkları işleri "entry" olarak kaydeder ve bu entry'ler AI'a gönderilerek profesyonel bir sprint raporuna dönüştürülür.

**Temel Özellikler:**
- Hızlı ve kolay günlük ilerleme kaydı
- 4 kategori desteği: Tamamlandı, Devam Ediyor, Planlanıyor, Engelli
- AI destekli rapor üretimi (Gemini / MiniMax)
- Timeline görselleştirme
- Koyu tema modern arayüz

---

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Vue 3 + Vite + Tailwind CSS + Pinia |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Auth | JWT |
| AI | Gemini / MiniMax |

---

## Özellikler

| # | Özellik | Açıklama |
|---|---------|----------|
| 1 | Kayıt ol | Yeni kullanıcı hesabı oluşturma |
| 2 | Giriş yap | Mevcut hesapla giriş yapma |
| 3 | Proje oluştur | Yeni sprint projesi başlatma |
| 4 | Entry ekle | Tarih + açıklama + kategori ile ilerleme kaydı |
| 5 | Entry listesi görüntüle | Tarihe göre gruplandırılmış entry listesi |
| 6 | Entry düzenle | Mevcut entry'yi güncelleme |
| 7 | Entry sil | Entry'yi silme |
| 8 | Rapor üret | Seçili entry'lerden AI'a gönderip rapor oluşturma |
| 9 | Geçmiş raporları listele | Önceki üretilen raporları görüntüleme |
| 10 | Raporu panoya kopyala | Raporu tek tıkla panoya kopyalama |
| 11 | Timeline view | İlerlemenin görsel timeline formatında gösterimi |
| 12 | Ayarlar | AI provider ve API key tanımlama |

---

## Kurulum

### Gereksinimler

- Node.js 18+
- npm

### Adımlar

**1. Backend Kurulumu**

```bash
cd backend
npm install
```

**2. Frontend Kurulumu**

```bash
cd frontend
npm install
```

---

## Kullanım

### Backend'i Başlatma

```bash
cd backend
npm start
```

Sunucu `http://localhost:3001` adresinde çalışır.

### Frontend'i Başlatma

```bash
cd frontend
npm run dev
```

Uygulama `http://localhost:5173` adresinde çalışır.

### Geliştirme Modu

Backend'de değişiklikleri otomatik algılamak için:

```bash
cd backend
npm run dev
```

---

## API Referansı

### Auth Endpoints

#### Kayıt Ol
```
POST /api/auth/register
Body: { "username": "kullanici", "password": "sifre" }
Response: { "id": 1, "username": "kullanici", "token": "..." }
```

#### Giriş Yap
```
POST /api/auth/login
Body: { "username": "kullanici", "password": "sifre" }
Response: { "token": "..." }
```

### Projects Endpoints

#### Projeleri Listele
```
GET /api/projects
Headers: Authorization: Bearer <token>
Response: [{ "id": 1, "name": "Sprint 1", "created_at": "..." }]
```

#### Proje Oluştur
```
POST /api/projects
Headers: Authorization: Bearer <token>
Body: { "name": "Sprint 1" }
Response: { "id": 1, "name": "Sprint 1", "created_at": "..." }
```

#### Proje Sil
```
DELETE /api/projects/:id
Headers: Authorization: Bearer <token>
Response: { "success": true }
```

### Entries Endpoints

#### Entry'leri Listele
```
GET /api/projects/:projectId/entries
Headers: Authorization: Bearer <token>
Response: [{ "id": 1, "date": "2024-01-15", "description": "...", "category": "done" }]
```

#### Entry Oluştur
```
POST /api/projects/:projectId/entries
Headers: Authorization: Bearer <token>
Body: { "date": "2024-01-15", "description": "...", "category": "done" }
Response: { "id": 1, "date": "2024-01-15", "description": "...", "category": "done" }
```

**Kategori Değerleri:** `done`, `in-progress`, `planning`, `blocked`

#### Entry Güncelle
```
PUT /api/entries/:id
Headers: Authorization: Bearer <token>
Body: { "description": "Yeni açıklama", "category": "in-progress" }
Response: { "id": 1, "date": "...", "description": "Yeni açıklama", "category": "in-progress" }
```

#### Entry Sil
```
DELETE /api/entries/:id
Headers: Authorization: Bearer <token>
Response: { "success": true }
```

### Reports Endpoints

#### Rapor Oluştur
```
POST /api/projects/:projectId/reports
Headers: Authorization: Bearer <token>
Body: {} (tüm entry'lerden) veya { "entryIds": [1, 2, 3] } (seçili entry'lerden)
Response: { "id": 1, "content": "# Sprint Raporu\n...", "generated_at": "..." }
```

#### Raporları Listele
```
GET /api/projects/:projectId/reports
Headers: Authorization: Bearer <token>
Response: [{ "id": 1, "generated_at": "..." }]
```

#### Rapor Detayı
```
GET /api/reports/:id
Headers: Authorization: Bearer <token>
Response: { "id": 1, "content": "# Sprint Raporu\n...", "generated_at": "..." }
```

### Settings Endpoints

#### Ayarları Getir
```
GET /api/settings
Headers: Authorization: Bearer <token>
Response: { "provider": "gemini", "hasApiKey": true }
```

#### Ayarları Güncelle
```
PUT /api/settings
Headers: Authorization: Bearer <token>
Body: { "provider": "gemini", "apiKey": "your-api-key" }
Response: { "provider": "gemini", "hasApiKey": true }
```

---

## AI Yapılandırması

### Gemini (Önerilen)

1. [Google AI Studio](https://makersuite.google.com/app/apikey) adresine gidin
2. API key oluşturun
3. Ayarlar sayfasına gidin ve API key'i yapıştırın

### MiniMax

1. [MiniMax Platform](https://platform.minimax.chat/) adresine gidin
2. API key oluşturun
3. Ayarlar sayfasında provider'ı "MiniMax" olarak değiştirin ve API key'i yapıştırın

---

## Rapor Formatı

Oluşturulan raporlar şu formatta çıkar:

```markdown
# Sprint Raporu

## What We Have Done So Far
[AI tamamlanan işleri cümlelerle yazar]

## What We Are Working On Now
[AI devam eden işleri cümlelerle yazar]

## What We Are Planning to Complete Next
[AI planlanan işleri cümlelerle yazar]

## Deadlines & Delivery Plan
[AI deadline'ları ve teslimat planını yazar]

## Risks & Blockers
[AI riskleri ve engelleri yazar]
```

---

## Proje Yapısı

```
rapor-olusturucu/
├── backend/
│   ├── server.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── entries.js
│   │   ├── reports.js
│   │   └── settings.js
│   ├── db/
│   │   └── schema.js
│   ├── services/
│   │   └── ai.js
│   └── middleware/
│       └── auth.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # BaseButton, BaseInput, BaseSelect, BaseTextarea, BaseModal, BaseBadge
│   │   │   ├── layout/       # AppSidebar, AppHeader
│   │   │   ├── common/       # ToastNotification, ConfirmModal, LoadingSpinner, EmptyState, CategoryBadge, EntryCard
│   │   │   └── features/     # EntryForm
│   │   ├── views/            # Login, Register, Dashboard, Home, Timeline, Reports, ReportDetail, Settings
│   │   ├── stores/           # Pinia stores
│   │   └── router/
│   └── package.json
├── docs/
│   ├── PLAN.md
│   └── PLAN_DETAILED.md
└── package.json
```

---

## Kategoriler

| Kategori | Renk | Açıklama |
|----------|------|----------|
| done | Yeşil | Tamamlanan işler |
| in-progress | Turuncu | Devam eden işler |
| planning | Mor | Planlanan işler |
| blocked | Kırmızı | Engellenen işler |

---

## Güvenlik Notları

- Şifreler BCrypt ile hash'lenir
- JWT token'lar 24 saat geçerlidir
- API key sadece backend'de saklanır, frontend'e gönderilmez

---

## Geliştirme Kuralları

### Reusable Component Mimarisi

Her yerde kullanılabilecek elementler `components/ui/` altında component olarak oluşturulmalıdır:

- **BaseButton** - Tüm butonlar için
- **BaseInput** - Tüm input alanları için
- **BaseSelect** - Tüm dropdown'lar için
- **BaseTextarea** - Tüm textarea alanları için
- **BaseModal** - Tüm modal pencereleri için
- **BaseBadge** - Tüm badge/label'lar için

### HTML Default Dialog Yasak

Kesinlikle kullanılmaması gerekenler:
- `window.alert()`
- `window.confirm()`
- `window.prompt()`

Alternatif: `ConfirmModal.vue`, `ToastNotification.vue` component'leri

---

## Lisans

Bu proje özel kullanım içindir.
