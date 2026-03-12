# Piklab - Kurumsal Medya ve Prodüksiyon

Piklab için geliştirilmiş tam teşekküllü Müşteri, Tasarımcı ve Yönetici panellerini içeren abonelik tabanlı web uygulaması.

## Özellikler

- **Yönetici Paneli**: Portfolyo, Hizmetler, Paketler ve Referanslar CRUD işlemleri
- **Müşteri Paneli**: Görev takibi, brief oluşturma, marka DNA'sı oluşturma, tasarımlara yorum yapma ve onaya gönderme
- **Tasarımcı Paneli**: Tüm müşteri görevlerini takip etme, içerik yükleme ve müşteriye onay için gönderme
- **Canlı Tasarım Tahtası**: Tasarımlar üzerinde pin bırakarak yorum yapabilme
- **AI Araçları**: Prompt üzerinden ürün resmi varyasyonu oluşturabilme ve brief metinlerini seslendirilebilme
- **Firebase Authentication**: Güvenli Google hesabı ile giriş

## Teknolojiler

- **Frontend**: React 19, Vite, TailwindCSS (V4), Lucide React
- **Backend**: Express.js, TypeScript
- **Veritabanı**: Firebase Firestore
- **State Management**: React Context, Hooks
- **Styling**: Brutalism estetiği (Vanilla CSS + Tailwind)

## Kurulum ve Çalıştırma (Lokal)

Platformu lokal bilgisayarınızda kurmak ve geliştirmek için aşağıdaki adımları takip edin:

1. **Bağımlılıkları Yükleyin:**
   ```bash
   npm install
   ```
2. **Uygulamayı Çalıştırın (Hem Backend Hem Frontend):**
   ```bash
   npm run dev
   ```
   Bu komut hem Vite dev sunucusunu başlatır (Frontend) hem de API istekleri için `server.ts` üzerinden aracı görev görür.
