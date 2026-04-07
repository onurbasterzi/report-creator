# Sprint Reporter - Proje Spesifikasyonu

## 1. Kanban Görünümü

### 1.1 Kolonlar (8 adet)

| ID | Kolon Adı | Rapor'a Gider | Rapor Bölümü |
|----|-----------|---------------|--------------|
| todo | To Do | Hayır | - |
| in_progress | In Progress | Hayır | - |
| done | Done | Hayır | - |
| deadlines | Deadlines | Evet | Deadlines & Delivery Plan |
| working | Working | Evet | What We Are Working On Now |
| completed | Completed | Evet | What We Have Done So Far |
| planning | Planning | Evet | What We Are Planning to Complete Next |
| risks_blockers | Risks & Blockers | Evet | Risks & Blockers |

**ÖNEMLİ:** Rapor'a gidenler ve gitmeyenler SABİT, değiştirilemez.

### 1.2 Filtre Sistemi

Kanban'da gösterilecek kolonları filtrele (dropdown):

- **Tümü** - Hepsini göster (8 kolon)
- **Rapor'a Dahil Olanlar** - Sadece rapora giden 5 kolonu göster
- **Rapor'a Dahil Olmayanlar** - Sadece rapora gitmeyen 3 kolonu göster

### 1.3 Varsayılan Durum

Tüm kolonlar görünür.

## 2. Veritabanı Değişiklikleri

### 2.1 Kategoriler Tablosu

Mevcut:
```sql
category TEXT NOT NULL CHECK (category IN ('done', 'in-progress', 'planning', 'blocked'))
```

Yeni:
```sql
category TEXT NOT NULL CHECK (category IN ('todo', 'in_progress', 'done', 'deadlines', 'working', 'completed', 'planning', 'risks_blockers'))
```

### 2.2 Yeni Kategoriler

| ID | Değer | Label |
|----|-------|-------|
| todo | todo | To Do |
| in_progress | in_progress | In Progress |
| done | done | Done |
| deadlines | deadlines | Deadlines |
| working | working | Working |
| completed | completed | Completed |
| planning | planning | Planning |
| risks_blockers | risks_blockers | Risks & Blockers |

### 2.3 Migration

```sql
-- Yeni kolon ekle (geçici)
ALTER TABLE entries ADD COLUMN new_category TEXT;

-- Değerleri çevir
UPDATE entries SET new_category = 'planning' WHERE category = 'planning';
UPDATE entries SET new_category = 'in_progress' WHERE category = 'in-progress';
UPDATE entries SET new_category = 'risks_blockers' WHERE category = 'blocked';
UPDATE entries SET new_category = 'done' WHERE category = 'done';

-- Yeni kategoriler ekle
UPDATE entries SET new_category = 'todo' WHERE new_category IS NULL;
UPDATE entries SET new_category = 'working' WHERE new_category IS NULL;
UPDATE entries SET new_category = 'completed' WHERE new_category IS NULL;
UPDATE entries SET new_category = 'deadlines' WHERE new_category IS NULL;

-- Eski kolonu sil ve yeniden adlandır
ALTER TABLE entries DROP COLUMN category;
ALTER TABLE entries ADD COLUMN category TEXT CHECK (category IN ('todo', 'in_progress', 'done', 'deadlines', 'working', 'completed', 'planning', 'risks_blockers'));
```

## 3. Backend Değişiklikleri

### 3.1 AI Prompt Yapısı

Sadece rapora dahil olan kategoriler rapora girer:

```
## Deadlines & Delivery Plan
[deadlines kategorisindeki tasklar]

## What We Are Working On Now
[working kategorisindeki tasklar]

## What We Have Done So Far
[completed kategorisindeki tasklar]

## What We Are Planning to Complete Next
[planning kategorisindeki tasklar]

## Risks & Blockers
[risks_blockers kategorisindeki tasklar]
```

## 4. Frontend Değişiklikleri

### 4.1 Kanban View

- 8 kolonlu kanban görünümü
- Header'da filtre dropdown (Tümü / Rapor'a Dahil Olanlar / Rapor'a Dahil Olmayanlar)

### 4.2 Filtre Seçenekleri

```
[ Tümü ▼ ]
├── Tümü (8)
├── Rapor'a Dahil Olanlar (5)
└── Rapor'a Dahil Olmayanlar (3)
```

### 4.3 Kolon Renkleri

| Kolon | Renk |
|-------|------|
| To Do | Sarı |
| In Progress | Mavi |
| Done | Yeşil |
| Deadlines | Mor |
| Working | Turkuaz |
| Completed | Koyu Yeşil |
| Planning | Turuncu |
| Risks & Blockers | Kırmızı |

## 5. User Flow

1. Kullanıcı projeye girer
2. 8 kolonlu kanban görür
3. Header'daki filtreyle istediği kolonları gösterir/gizler
4. Taskları sürükler, düzenler
5. Rapor oluşturduğunda sadece "rapora giden" kategoriler dahil edilir

## 6. Teknik Notlar

- Kategori ID'leri `snake_case`
- Eski `blocked` → `risks_blockers`
- Eski `in-progress` → `in_progress`
- Migration'da mevcut veriler korunmalı
