# ClickUp Refresh Helper Chrome Eklentisi

ClickUp'ın cache problemlerini çözen akıllı Chrome eklentisi.

## Problem
ClickUp, aggressive caching nedeniyle UI güncellemelerini geç yansıtıyor. Etiket değişiklikleri, kart durumu güncellemeleri ve liste değişimleri bazen 30 dakika gecikebiliyor.

## Çözüm
Bu eklenti şu özellikleri sunuyor:

### ✨ Özellikler
- **Akıllı Yenileme**: Kullanıcı aktifken yenileme yapmaz
- **Otomatik Cache Algılama**: Stale data'yı tespit eder
- **Özelleştirilebilir Aralıklar**: 2-30 dakika arası seçenekler
- **Manuel Kontrol**: Anında yenileme butonu
- **Cache Temizleme**: ClickUp domain'i için özel cache temizleme
- **Görsel Geri Bildirim**: Yenileme durumu göstergesi

### 🔧 Kurulum

1. **Chrome'da Developer Mode'u aktifleştir:**
   - `chrome://extensions/` adresine git
   - Sağ üstten "Developer mode" toggle'ını aç

2. **Eklentiyi yükle:**
   - "Load unpacked" butonuna tıkla
   - Bu klasörü seç

3. **İzinleri onayla:**
   - ClickUp domain'lerine erişim izni ver

### 🎯 Kullanım

1. **Otomatik Mod:**
   - Eklenti varsayılan olarak 5 dakikada bir kontrol eder
   - Kullanıcı aktifken yenileme yapmaz
   - Stale data algıladığında otomatik yeniler

2. **Manuel Kontrol:**
   - Eklenti ikonuna tıkla
   - "Şimdi Yenile" butonu ile anında yenileme
   - "Cache Temizle" ile derin temizleme

3. **Ayarlar:**
   - Yenileme aralığını değiştir (2-30 dakika)
   - Akıllı yenilemeyi aç/kapat
   - Eklentiyi tamamen devre dışı bırak

### 🎛️ Ayar Seçenekleri

- **Otomatik Yenileme**: Ana özelliği aç/kapat
- **Yenileme Aralığı**: 2, 5, 10, 15, 30 dakika seçenekleri
- **Akıllı Yenileme**: Kullanıcı aktivitesini dikkate al

### 🔍 Nasıl Çalışır

1. **Aktivite İzleme**: Mouse, klavye ve scroll hareketlerini izler
2. **Sayfa Analizi**: ClickUp'ın DOM değişikliklerini takip eder
3. **Stale Data Tespiti**: Boş listeler, error state'ler ve loading sorunlarını algılar
4. **Akıllı Refresh**: Gerektiğinde soft/hard refresh yapar

### 🛠️ Teknik Detaylar

- **Manifest V3** uyumlu
- **Service Worker** tabanlı background script
- **Content Script** ile sayfa analizi
- **Chrome Storage API** ile ayar yönetimi
- **MutationObserver** ile DOM izleme

### 🐛 Sorun Giderme

**Eklenti çalışmıyor:**
- Developer mode açık olduğundan emin ol
- Eklentiyi yeniden yükle
- Console'da hata mesajlarını kontrol et

**Yenileme çok sık/seyrek:**
- Popup'tan aralığı ayarla
- Akıllı yenileme ayarını kontrol et

**Cache problemi devam ediyor:**
- "Cache Temizle" butonunu kullan
- Browser'ı yeniden başlat
- ClickUp'ı incognito modda test et

### 📝 Notlar

- Sadece ClickUp domain'lerinde çalışır
- Kullanıcı gizliliğini korur
- Minimum sistem kaynağı kullanır
- Offline durumda otomatik devre dışı kalır

### 🔄 Güncellemeler

Bu eklenti sürekli geliştirilmektedir. Yeni özellikler ve iyileştirmeler için GitHub'ı takip edin.
