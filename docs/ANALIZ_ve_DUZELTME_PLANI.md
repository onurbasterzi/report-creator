# Sprint Reporter - Analiz ve Düzeltme Planı

## MEVCUT SORUNLAR

### 1. Rapor Çıktı Sayfası
- Çıktı düz metin olarak gösteriliyor (pre/code)
- Markdown formatı render edilmiyor
- Kullanıcı çıktıyı düzenleyemiyor
- Çıktı silinemiyor

### 2. Silme İşlemleri
- Entry silme çalışıyor mu? (net)
- Rapor silme işlevi YOK
- Proje silme işlevi eklendi ama test edilmedi

### 3. Rapor Oluşturma Akışı
- Entry seçimi yapılıyor ama detay yok
- Rapor adı/donem sorulmuyor
- Başlık/özet seçeneği yok
- Tarih aralığı seçilmiyor

### 4. Dil Sorunu
- Backend'de prompt Türkçe'ye zorlanıyor
- Kullanıcı rapor dilini seçemiyor

### 5. Genel UI Sorunları
- Entry formu modal içinde çok küçük
- Sayfa geçişleri smooth değil
- Loading states yeterli değil

---

## DÜZELTME ÖNERİLERİ

### 1. Rapor Çıktı Sayfası
**Yapılacaklar:**
- Markdown renderör eklenecek (vue-markdown veya showdown)
- Çıktı düzenlenebilir textarea yapılacak
- "Kaydet" butonu eklenecek (değişiklikleri kaydeder)
- Raporu sil butonu eklenecek
- Raporu farklı kaydet (markdown dosyası olarak) eklenecek

**Beklenen Sonuç:**
- Çıktı güzel görünür (başlıklar, listeler, bold vs.)
- Kullanıcı çıktıyı düzenleyebilir
- Silebilir
- İndirebilir

### 2. Silme İşlemleri
**Yapılacaklar:**
- Rapor silme API endpoint i eklenecek (backend)
- Rapor silme butonu ve onay dialogu eklenecek (frontend)
- Entry silme tekrar test edilecek
- Proje silme tekrar test edilecek

**Beklenen Sonuç:**
- Tüm silme işlemleri çalışır
- Silmeden önce onay alınır

### 3. Rapor Oluşturma Akışı
**Yapılacaklar:**
- Entry seçimi geliştirilecek:
  - Tarih aralığı seçimi eklenecek
  - Kategoriye göre filtreleme eklenecek
- Rapor ayarları dialogu eklenecek:
  - Rapor adı (opsiyonel)
  - Dönem (örn: "Sprint 5", "Ocak 2026")
  - Dil seçeneği (Türkçe/İngilizce)
- Önizleme seçeneği eklenecek

**Beklenen Sonuç:**
- Kullanıcı hangi entry'lerden rapor oluşturacağını seçebilir
- Tarih ve kategoriye göre filtreleyebilir
- Rapor ayarlarını belirleyebilir

### 4. Dil Sorunu
**Yapılacaklar:**
- Backend prompt'dan Türkçe zorlama kaldırılacak
- Frontend'de dil seçeneği eklenecek
- AI'a dili prompt'ta belirteceğiz ama zorlamayacağız

**Beklenen Sonuç:**
- Kullanıcı rapor dilini seçebilir
- AI isterse Türkçe, isterse İngilizce yazabilir

### 5. Genel UI İyileştirmeleri
**Yapılacaklar:**
- Entry formu full-page olarak değiştirilebilir
- Animasyonlar eklenebilir
- Toast notification'lar iyileştirilebilir

**Beklenen Sonuç:**
- Daha iyi kullanıcı deneyimi

---

## ÖNCELİK SIRASI

1. **Kritik:** Rapor çıktı sayfası düzeltmesi (en çok mağdur olunan)
2. **Kritik:** Rapor silme işlevi eklenmesi
3. **Yüksek:** Rapor oluşturma akışı iyileştirmesi
4. **Orta:** Dil seçeneği eklenmesi
5. **Düşük:** Genel UI iyileştirmeleri

---

## SORULAR

1. Rapor çıktısında Markdown render edilsin mi? (Başlıklar, listeler, bold vs. görünsün mü?)
2. Rapor oluştururken hangi ayarları seçmek istersiniz?
   - Tarih aralığı?
   - Kategori filtresi?
   - Rapor adı/dönem?
   - Dil seçeneği?
3. Raporu hangi formatta indirmek istersiniz? (Markdown, PDF, sadece metin)

---

## KABUL BEKLENİYOR

Yukarıdaki analiz ve önerileri onaylarsanız uygulamaya başlayacağım.
Onay vermeden HIÇBIR değişiklik yapmayacağım.
