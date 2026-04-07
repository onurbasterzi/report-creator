# Sprint Reporter - Detaylı Proje Planı

## 1. Konsept & Hedef

**Proje Amacı:** Bir sprint raporu oluşturma aracı geliştirmek. Kullanıcılar günlük ilerleme bilgilerini (entry) sisteme girer ve bu veriler AI (Gemini/MiniMax) kullanılarak profesyonel bir sprint raporuna dönüştürülür.

**Temel Değer:**
- Hızlı ve kolay günlük ilerleme kaydı
- AI destekli profesyonel rapor üretimi
- Takım ilerlemesinin görsel takibi

---

## 2. Teknoloji Stack

| Katman | Teknoloji | Açıklama |
|--------|-----------|----------|
| Frontend | Vue 3 + Vite | Modern reactive UI framework |
| Styling | Tailwind CSS | Utility-first CSS framework |
| State Management | Pinia | Vue 3 için resmi state management |
| Backend | Node.js + Express | Lightweight API server |
| Database | SQLite (better-sqlite3) | Dosya tabanlı, kurulum gerektirmeyen DB |
| Authentication | JWT | Token-based authentication |
| AI | Gemini / MiniMax | Rapor üretimi için AI servisleri |

**Neden bu stack?**
- SQLite: Kurulum gerektirmez, tek dosyada tüm veriyi saklar
- JWT: Stateless auth, session gerektirmez
- Vue 3 + Pinia: Modern, lightweight ve vue ecosystem'e uygun

---

## 3. Rapor Çıktı Formatı

Üretilen raporun yapısı:

```markdown
# Sprint Raporu

## What We Have Done So Far
[AI bu bölüme tamamlanmış işleri cümlelerle yazar]

## What We Are Working On Now
[AI bu bölüme devam eden işleri cümlelerle yazar]

## What We Are Planning to Complete Next
[AI bu bölüme planlanan işleri cümlelerle yazar]

## Deadlines & Delivery Plan
[AI bu bölüme deadline'ları ve teslimat planını cümlelerle yazar]

## Risks & Blockers
[AI bu bölüme riskleri ve engelleri cümlelerle yazar]
```

**Önemli Not:** AI çıktıyı maddelemez, sadece cümlelerle yazar. Bu profesyonel bir rapor formatı sağlar.

---

## 4. Veritabanı Şeması (4 Tablo)

### Tablo: users
Kullanıcı hesapları için.
```sql
users
├── id (INTEGER PRIMARY KEY)           -- Benzersiz kullanıcı ID
├── username (TEXT UNIQUE)             -- Benzersiz kullanıcı adı
├── password_hash (TEXT)               -- BCrypt ile hash'lenmiş şifre
└── created_at (TEXT)                  -- ISO format tarih (YYYY-MM-DDTHH:mm:ss)
```

### Tablo: projects
Her kullanıcının birden fazla projesi olabilir.
```sql
projects
├── id (INTEGER PRIMARY KEY)           -- Benzersiz proje ID
├── user_id (INTEGER FK → users)       -- Sahip kullanıcı
├── name (TEXT)                        -- Proje adı
└── created_at (TEXT)                  -- Oluşturma tarihi
```

### Tablo: entries
Günlük ilerleme kayıtları. Her entry bir proje altında.
```sql
entries
├── id (INTEGER PRIMARY KEY)           -- Benzersiz entry ID
├── project_id (INTEGER FK → projects) -- Bağlı proje
├── date (TEXT - YYYY-MM-DD)          -- İşin yapıldığı tarih
├── description (TEXT)                 -- Yapılan işin açıklaması
├── category (TEXT)                   -- Kategori: done/in-progress/planning/blocked
└── created_at (TEXT)                  -- Kayıt oluşturulma tarihi
```

**Kategoriler:**
- `done`: Tamamlanan işler
- `in-progress`: Devam eden işler
- `planning`: Planlanan işler
- `blocked`: Engellenen işler

### Tablo: reports
Üretilen raporların saklandığı tablo.
```sql
reports
├── id (INTEGER PRIMARY KEY)           -- Benzersiz rapor ID
├── project_id (INTEGER FK → projects) -- Bağlı proje
├── content (TEXT - JSON)             -- Rapor içeriği (JSON formatında)
└── generated_at (TEXT)               -- Üretim tarihi
```

---

## 5. Özellikler Listesi

| # | Özellik | Açıklama |
|---|---------|----------|
| 1 | Kayıt ol | Yeni kullanıcı hesabı oluşturma |
| 2 | Giriş yap | Mevcut hesapla giriş yapma |
| 3 | Proje oluştur | Yeni sprint projesi başlatma |
| 4 | Proje seç | Mevcut projeler arasından seçim yapma |
| 5 | Entry ekle | Tarih + açıklama + kategori ile ilerleme kaydı |
| 6 | Entry listesi görüntüle | Tarihe göre gruplandırılmış entry listesi |
| 7 | Entry düzenle | Mevcut entry'yi güncelleme |
| 8 | Entry sil | Entry'yi silme |
| 9 | Rapor üret | Seçili entry'lerden AI'a gönderip rapor oluşturma |
| 10 | Geçmiş raporları listele | Önceki üretilen raporları görüntüleme |
| 11 | Rapor görüntüle | Seçili raporu detaylı görüntüleme |
| 12 | Raporu panoya kopyala | Raporu tek tıkla panoya kopyalama |
| 13 | Timeline view | İlerlemenin görsel timeline formatında gösterimi |
| 14 | Ayarlar | AI provider ve API key tanımlama |

---

## 6. API Yapısı

### Auth Endpoints

| Method | Endpoint | Request Body | Response | Açıklama |
|--------|----------|--------------|----------|----------|
| POST | `/api/auth/register` | `{ username, password }` | `{ id, username }` | Yeni kullanıcı kaydı |
| POST | `/api/auth/login` | `{ username, password }` | `{ token }` | Giriş, JWT token döner |

### Projects Endpoints

| Method | Endpoint | Request Body | Response | Açıklama |
|--------|----------|--------------|----------|----------|
| GET | `/api/projects` | - | `[{ id, name, created_at }]` | Kullanıcının tüm projeleri |
| POST | `/api/projects` | `{ name }` | `{ id, name }` | Yeni proje oluştur |
| DELETE | `/api/projects/:id` | - | `{ success: true }` | Projeyi sil |

### Entries Endpoints

| Method | Endpoint | Request Body | Response | Açıklama |
|--------|----------|--------------|----------|----------|
| GET | `/api/projects/:id/entries` | - | `[{ id, date, description, category }]` | Projenin tüm entry'leri |
| POST | `/api/projects/:id/entries` | `{ date, description, category }` | `{ id, date, description, category }` | Yeni entry ekle |
| PUT | `/api/entries/:id` | `{ date?, description?, category? }` | `{ id, ...entry }` | Entry güncelle |
| DELETE | `/api/entries/:id` | - | `{ success: true }` | Entry sil |

### Reports Endpoints

| Method | Endpoint | Request Body | Response | Açıklama |
|--------|----------|--------------|----------|----------|
| POST | `/api/projects/:id/reports` | `{ entryIds }` | `{ id, content }` | AI'dan rapor üret |
| GET | `/api/projects/:id/reports` | - | `[{ id, generated_at }]` | Projenin raporları listele |
| GET | `/api/reports/:id` | - | `{ id, content, generated_at }` | Rapor detayını getir |

### Settings Endpoints

| Method | Endpoint | Request Body | Response | Açıklama |
|--------|----------|--------------|----------|----------|
| GET | `/api/settings` | - | `{ provider }` | Sadece provider bilgisi (apiKey gelmez) |
| PUT | `/api/settings` | `{ provider, apiKey }` | `{ provider }` | Ayarları güncelle |

---

## 7. Tasarım Sistemi (Koyu Tema)

### Renk Paleti

```
Background:     #0a0a0a    -- Ana arka plan (çok koyu)
Surface:        #141414    -- Kart ve yüzey arka planı
Border:         #262626    -- Kenarlık ve çizgiler
Primary:        #6366f1    -- Ana aksiyon rengi (indigo)
Accent:         #22d3ee    -- Vurgu rengi (cyan)
Text:           #fafafa    -- Ana metin rengi (beyaz)
Muted:          #737373    -- Soluk metin rengi

Kategori Renkleri:
Done:           #22c55e    -- Yeşil (tamamlanan)
In-Progress:    #f59e0b    -- Turuncu (devam eden)
Planning:       #818cf8    -- Açık mor (planlanan)
Blocked:        #ef4444    -- Kırmızı (engellenen)
```

### Layout Yapısı

```
┌─────────────────────────────────────────────────────────┐
│  Sol Sidebar (240px)  │     Sağ Ana İçerik Alanı        │
│  ┌─────────────────┐  │  ┌────────────────────────────┐  │
│  │ Logo            │  │  │ Header / Başlık            │  │
│  ├─────────────────┤  │  ├────────────────────────────┤  │
│  │ Projeler       │  │  │                            │  │
│  │  > Proje 1     │  │  │  İçerik Alanı             │  │
│  │  > Proje 2     │  │  │  (Entry listesi,          │  │
│  │  + Yeni Proje  │  │  │   Rapor görüntüleme,      │  │
│  ├─────────────────┤  │  │   Timeline vs.)          │  │
│  │ Ayarlar        │  │  │                            │  │
│  │ Çıkış          │  │  │                            │  │
│  └─────────────────┘  │  └────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### UI Komponent Stilleri

**Kartlar:**
- `border border-[#262626] rounded-xl`
- Hover: `hover:brightness-110 transition-all duration-150`

**Input Alanları:**
- `bg-[#141414] border border-[#262626] rounded-lg`
- Focus: `focus:border-[#6366f1] focus:outline-none`

**Primary Buton:**
- `bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-lg`
- Transition: `transition-all duration-150`

**Entry Kartları:**
- Sol kenarda kategori rengi border (4px)
- Kategori rengi yukarıdaki palete göre belirlenir

**Timeline View:**
- Dikey çizgi (border-l-2 border-[#262626])
- Tarihler sol tarafta
- Entry'ler sağ tarafta kartlar olarak

---

## 8. AI Prompt Tasarımı

```
Sen bir sprint raporu asistanısın. Verilen ilerleme bilgilerinden profesyonel Türkçe sprint raporu oluştur. Her bölümü cümlelerle yaz, maddeleme yapma.

Giriş formatı (sistemden gelen veri):
- Tarih: YYYY-MM-DD
- İlerleme: [Açıklama]
- Kategori: done/in-progress/planning/blocked

Çıktı formatı (5 bölüm, sadece cümlelerle):
## What We Have Done So Far
[Geçen sprint'te/dönemde tamamlanan işler cümle cümle yazılır]

## What We Are Working On Now
[Şu anda devam eden işler cümle cümle yazılır]

## What We Are Planning to Complete Next
[Önümüzdeki dönem için planlanan işler cümle cümle yazılır]

## Deadlines & Delivery Plan
[Deadline'lar ve teslimat planı cümle cümle yazılır]

## Risks & Blockers
[Karşılaşılan riskler ve engeller cümle cümle yazılır]
```

**Prompt Tasarım Kararları:**
- Cümle bazlı yazım: Profesyonel ve akıcı rapor
- Türkçe çıktı: Kullanıcı profiline uygun
- Kategori bazlı gruplama: AI'ın işini kolaylaştırır

---

## 9. API Key Güvenliği

**Kurallar:**
1. API key sadece backend'de saklanır, frontend'e asla gönderilmez
2. Backend'de environment variable olarak saklanır
3. `GET /api/settings` sadece provider bilgisi döner, apiKey DÖNMEZ
4. Frontend "API key tanımlı mı?" bilgisini backend'den alır

**Güvenlik Zinciri:**
```
Frontend → (API key yok) → Backend → (API key env'de) → AI Provider
```

---

## 10. Proje Dosya Yapısı

```
rapor-olusturucu/
├── backend/
│   ├── server.js              -- Express sunucu ana dosyası
│   ├── routes/
│   │   ├── auth.js            -- Auth endpoint'leri
│   │   ├── projects.js        -- Projects endpoint'leri
│   │   ├── entries.js         -- Entries endpoint'leri
│   │   ├── reports.js         -- Reports endpoint'leri
│   │   └── settings.js        -- Settings endpoint'leri
│   ├── db/
│   │   ├── schema.js          -- SQLite schema tanımları
│   │   └── database.sqlite    -- SQLite veritabanı dosyası
│   ├── services/
│   │   └── ai.js              -- AI servis entegrasyonu (Gemini/MiniMax)
│   └── middleware/
│       └── auth.js            -- JWT doğrulama middleware
├── frontend/
│   ├── src/
│   │   ├── components/        -- Yeniden kullanılabilir UI komponentleri
│   │   ├── views/             -- Sayfa komponentleri (Login, Dashboard, etc.)
│   │   ├── stores/            -- Pinia store'ları (auth, projects, entries)
│   │   ├── router/            -- Vue Router yapılandırması
│   │   ├── App.vue            -- Ana Vue komponenti
│   │   └── main.js            -- Vue uygulama giriş noktası
│   ├── index.html
│   └── package.json
├── docs/
│   ├── PLAN.md                -- Özet proje planı
│   └── PLAN_DETAILED.md       -- Bu detaylı plan dosyası
└── package.json               -- Root package.json (monorepo için)
```

---

## 11. Geliştirme Sırası (18 Adım)

### Backend Geliştirme (Adım 1-7)

| Adım | Görev | Açıklama |
|------|-------|----------|
| 1 | Proje kurulumu | Klasör yapısı + package.json dosyaları |
| 2 | Backend: SQLite schema | Tabloları oluştur, bağlantıyı test et |
| 3 | Backend: Auth | Register, login, JWT token üretimi |
| 4 | Backend: Projects CRUD | Proje oluştur, listele, sil |
| 5 | Backend: Entries CRUD | Entry ekle, güncelle, sil, listele |
| 6 | Backend: Reports + AI | AI entegrasyonu, rapor üretimi |
| 7 | Backend: Settings | API key ve provider ayarları |

### Frontend Geliştirme (Adım 8-17)

| Adım | Görev | Açıklama |
|------|-------|----------|
| 8 | Frontend kurulum | Vite + Vue 3 + Tailwind + Pinia |
| 9 | Login + Register | Auth ekranları |
| 10 | Layout | Sidebar + ana container |
| 11 | Projects dropdown | Proje seçimi |
| 12 | Entry ekle form | Tarih, açıklama, kategori girişi |
| 13 | Entry listesi | Tarihe göre gruplandırılmış |
| 14 | Entry düzenle/sil | Inline düzenleme veya modal |
| 15 | Timeline view | Dikey timeline gösterimi |
| 16 | Rapor üret + görüntüle | AI çağrısı ve sonuç gösterimi |
| 17 | Geçmiş raporlar | Rapor tarihçesi |
| 18 | Settings | API key tanımlama |

### Final (Adım 19)

| Adım | Görev | Açıklama |
|------|-------|----------|
| 19 | Responsive + Polish | Mobil uyumluluk, animasyonlar, hata yönetimi |

---

## 12. KRİTİK FRONTEND KURALLARI

> ⚠️ BU KURALLAR ESAS ALINMALIDIR - UYGULANMAMASI KABUL EDİLMEZ

### Kural 1: REUSABLE COMPONENT MİMARİSİ

**Temel Prensip:** Tekrar eden veya edebilecek HERŞEY component olmalıdır.

**Örnekler:**

| YANLIŞ ❌ | DOĞRU ✅ |
|-----------|----------|
| Her yere ayrı buton kopyalamak | `BaseButton` component'i |
| Her form alanını ayrı yazmak | `BaseInput`, `BaseSelect`, `BaseTextarea` |
| Her kartı tek tek kodlamak | `EntryCard`, `ProjectCard`, `ReportCard` |
| Alert/modal'ı her yerde ayrı yazmak | `ConfirmModal`, `ToastNotification` |

**Component Hiyerarşisi:**

```
components/
├── ui/                        -- TEMEL ATOMİK COMPONENTLER
│   ├── BaseButton.vue        -- Buton (variant: primary, secondary, danger, ghost)
│   ├── BaseInput.vue         -- Text input
│   ├── BaseSelect.vue        -- Select dropdown
│   ├── BaseTextarea.vue      -- Textarea
│   ├── BaseModal.vue         -- Modal container
│   └── BaseBadge.vue         -- Badge/label
├── layout/                    -- LAYOUT COMPONENTLERİ
│   ├── AppSidebar.vue        -- Sidebar
│   └── AppHeader.vue         -- Header
├── common/                   -- ORTAK/REUSABLE COMPONENTLER
│   ├── ConfirmModal.vue      -- Onay dialogu (silme vs.)
│   ├── ToastNotification.vue -- Bildirim/toast
│   ├── LoadingSpinner.vue    -- Loading state
│   ├── EmptyState.vue        -- Boş durum gösterimi
│   ├── CategoryBadge.vue     -- Kategori badge (done/in-progress/planning/blocked)
│   └── EntryCard.vue         -- Entry kartı
└── features/                 -- FEATURE-SPECIFIC COMPONENTLER
    ├── EntryForm.vue          -- Entry ekle/düzenle formu
    ├── EntryList.vue          -- Entry listesi
    ├── ProjectSelector.vue    -- Proje seçici
    └── ReportViewer.vue       -- Rapor görüntüleyici
```

### Kural 2: HTML DEFAULT DIALOG YASAK

**Kesinlikle YASAK:**
- `window.alert()`
- `window.confirm()`
- `window.prompt()`
- `<dialog>` elementi
- Native browser dialog'ları

**Neden Yasak?**
- Kullanıcı deneyimini bozar
- Styling kontrolü yok
- Branding'e uymaz
- Farklı tarayıcılarda farklı görünür

**Alternatif: Custom Component'ler**

```vue
<!-- ConfirmModal.vue - Silme, çıkış gibi kritik aksiyonlar için -->
<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="onCancel">
      <div class="modal-content">
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
        <div class="modal-actions">
          <BaseButton variant="ghost" @click="onCancel">İptal</BaseButton>
          <BaseButton :variant="confirmVariant" @click="onConfirm">{{ confirmText }}</BaseButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
```

---

## 13. Kritik Kararlar ve Notlar

### Güvenlik
- Şifreler BCrypt ile hash'lenmeli
- JWT token'lar 24 saat geçerli olmalı
- API key asla frontend'e gönderilmemeli

### Performans
- Entry listesi sayfalanabilir olmalı (100+ entry olabilir)
- AI API çağrıları timeout ile korunmalı

### Kullanıcı Deneyimi
- Tüm aksiyonlarda toast notification (custom component)
- Loading state'leri gösterilmeli
- Hata mesajları açık ve faydalı olmalı
- Tüm kullanıcı aksiyonlarında feedback verilmeli

---

## 14. Alternatif Düşünceler (Future)

- [ ] Çoklu dil desteği (Türkçe + İngilizce)
- [ ] Markdown export
- [ ] PDF rapor çıktısı
- [ ] Takım paylaşımı (birden fazla kullanıcı同一 proje)
- [ ] Slack/Teams entegrasyonu
- [ ] Entry'leri AI ile özetleme
