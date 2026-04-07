# SPRINT REPORTER - DETAYLI ANALIZ RAPORU

## MEVCUT ÇALIŞAN ÖZELLİKLER

| Özellik | Durum | Not |
|---------|-------|-----|
| Kayıt ol | ✅ Çalışıyor | |
| Giriş yap | ✅ Çalışıyor | |
| Proje oluşturma | ✅ Çalışıyor | |
| Proje seçme | ✅ Çalışıyor | |
| Entry oluşturma | ✅ Çalışıyor | |
| Entry listesi | ✅ Çalışıyor | Tarihe göre gruplandırılmış |
| Rapor oluşturma | ⚠️ Kısmen | 1 tane oluşuyor, ikincisi oluşmuyor |
| API key kaydetme | ⚠️ Bilinmiyor | Konsol yok, doğru kaydediliyor mu? |

---

## 1. RAPPOR YÖNETİMİ SORUNLARI

### 1.1 Birden Fazla Rapor Oluşturulamıyor
- **Şu an:** Her proje için sadece 1 rapor oluşturulabiliyor
- **Sorun:** İkinci rapor oluşturulmaya çalışıldığında ne oluyor? Hata mı veriyor? Eski raporu mu güncelliyor?
- **Neden:** Backend'de kontrol mü var? Frontend'de mi?

### 1.2 Rapor Düzenlenemiyor
- **Şu an:** ReportDetailView sadece görüntülüyor, düzenleme yok
- **Olması gereken:** Textarea ile içerik düzenlenebilmeli

### 1.3 Rapor Silinemiyor
- **Şu an:** Backend'de `DELETE /reports/:id` endpointi YOK
- **Frontend:** Rapor silme butonu YOK
- **Olması gereken:** Rapor yanında silme butonu, onay dialogu

### 1.4 AI'a Ek Prompt Verilemiyor
- **Şu an:** Raporu düzeltmek için mekanizma YOK
- **Olması gereken:** "Şunu düzelt", "buna ekle" gibi talimatlar verilebilmeli
- **AI'a gönderilecek:** Mevcut içerik + kullanıcı talimatı

### 1.5 AI Modeli Seçilemiyor
- **Şu an:** Sadece ayarlardaki tek model kullanılıyor
- **Olması gereken:** Rapor oluştururken veya düzenlerken model seçilebilmeli
- **Seçenekler:** Gemini / MiniMax (hangileri API key'e sahipse)

---

## 2. RAPPOR ÇIKTISI SORUNLARI

### 2.1 Markdown Render Edilmiyor
- **Şu an:** `pre` tag ile düz metin gösteriliyor
- **Sorun:** Başlıklar (# ##), listeler (- *), bold (**) düz görünüyor
- **Olması gereken:** Gerçek markdown görünümü (başlıklar büyük, listeler noktalı, bold kalın)

### 2.2 Rapor İçeriği Sadece Okunur
- **Şu an:** `<pre>{{ report.content }}</pre>`
- **Olması gereken:** Düzenlenebilir textarea veya contenteditable

---

## 3. RAPPOR OLUŞTURMA SORUNLARI

### 3.1 Detay Sorulmuyor
- **Şu an:** Entry seçimi var, onayla oluştur
- **Olması gereken:**
  - AI modeli seçimi (Gemini / MiniMax)
  - Tarih aralığı (bu hafta / bu ay / özel)
  - Kategori filtresi (done / in-progress / planning / blocked)
  - Özel talimat kutusu ("raporu şöyle yap")
  - Dil seçeneği (Türkçe / İngilizce / Her ikisi)

### 3.2 Oluşturma Sonrası Yönlendirme
- **Şu an:** Rapor oluşturulduktan sonra nereye gidiyor?
- **Olması gereken:** Rapor düzenleme sayfasına gitsin

---

## 4. ENTRY YÖNETİMİ SORUNLARI

### 4.1 Düzenleme Modall Boş Geliyor
- **Şu an:** EntryCard'da edit butonuna basınca modal açılıyor
- **Sorun:** Form'daki alanlar boş geliyor (entry.date, entry.description, entry.category)
- **Neden:** `watch` fonksiyonu entry prop'u değiştiğinde mi tetikleniyor?
- **Düzeltme:** Props'u doğru izlemek gerekiyor

### 4.2 Silme Çalışıyor Mu?
- **Şu an:** ConfirmModal var, silme fonksiyonu var
- **Sorun:** Test edilmedi, çalışıyor mu bilinmiyor

---

## 5. PROJE YÖNETİMİ SORUNLARI

### 5.1 Düzenleme Backend'e Gitmiyor
- **Şu an:** Sidebar'da edit butonu var, modal açılıyor
- **Sorun:** `handleUpdateProject` fonksiyonu boş, hiçbir şey yapmıyor
- **Backend:** `PUT /projects/:id` endpointi YOK

### 5.2 Silme Çalışıyor Mu?
- **Şu an:** ConfirmModal var, silme fonksiyonu var
- **Sorun:** Test edilmedi

---

## 6. AYARLAR SORUNLARI

### 6.1 API Key Doğru Kaydediliyor Mu?
- **Şu an:** Backend konsolu olmadığı için bilinmiyor
- **Sorun:** `INSERT OR REPLACE` çalışıyor mu?

### 6.2 MiniMax Model Adı
- **Şu an:** "MiniMax-M2.7" olarak yazıldı
- **Doğru mu:** Bilinmiyor, kullanıcı doğrulaması gerekiyor

---

## 7. DİL SORUNU

### 7.1 Türkçe Zorlanıyor
- **Şu an:** Prompt'ta "Türkçe sprint raporu oluştur" yazıyor
- **Sorun:** Kullanıcı İngilizce rapor isterse ne olacak?
- **Olması gereken:** Prompt'tan "Türkçe" zorlaması kaldırılmalı, AI serbest bırakılmalı

---

## 8. TEKNİK SORUNLAR

### 8.1 Backend Konsol Yok
- **Sorun:** Hata ayıklanamıyor
- **Çözüm:** `console.log` eklendi mi?

### 8.2 Validation Yetersiz
- **Sorun:** Girilen veriler yeterince kontrol edilmiyor

### 8.3 Error Handling Yetersiz
- **Sorun:** Hatalar kullanıcıya düzgün gösterilmiyor

---

## 9. EKLENMESİ GEREKEN DOSYALAR

| Dosya | Açıklama |
|-------|----------|
| `backend/routes/reports.js` | `DELETE /reports/:id` ekle |
| `backend/routes/projects.js` | `PUT /projects/:id` ekle |
| `frontend/src/views/ReportEditView.vue` | Rapor düzenleme sayfası |
| Frontend'de markdown render | `marked` veya `showdown` kütüphanesi |

---

## 10. DEĞİŞTİRİLMESİ GEREKEN DOSYALAR

| Dosya | Ne değişecek |
|-------|--------------|
| `backend/services/ai.js` | Türkçe zorlaması kaldır, model adları düzelt |
| `frontend/src/views/ReportDetailView.vue` | Düzenleme modu ekle, markdown render ekle |
| `frontend/src/views/ReportsView.vue` | AI model seçimi ekle |
| `frontend/src/components/features/EntryForm.vue` | watch düzelt |

---

## 11. TEST EDİLMESİ GEREKENLER

| Özellik | Test |
|---------|------|
| Entry düzenleme | Modal açılır, veriler gelir, kaydeder |
| Entry silme | Onay dialogu açılır, siler, listeden gider |
| Rapor oluşturma | 1. oluşur, 2. oluşur mu? |
| Rapor düzenleme | İçerik değiştirilebilir, kaydedilir |
| Rapor silme | Silinebilir, listeden gider |
| AI ek prompt | "şunu düzelt" diyince düzelir mi? |
| Proje düzenleme | İsim değişir, backend'e gider |
| Proje silme | Tüm entry/raporlarla birlikte silinir |

---

## 12. YAPILACAK İŞLER LİSTESİ

### Kritik (Önce Yapılacak)
1. Rapor backend'e silme endpointi ekle (`DELETE /reports/:id`)
2. Rapor frontend'de silme butonu ekle
3. Rapor düzenleme sayfası oluştur
4. Entry düzenleme modalı düzelt
5. Türkçe zorlaması kaldır

### Yüksek
6. Markdown render ekle
7. AI model seçimi ekle
8. AI'a ek prompt özelliği ekle
9. Rapor oluşturma detayları ekle

### Orta
10. Proje düzenleme backend'e bağla
11. Konsol çıktılarını düzelt
12. Validation/Error handling iyileştir
