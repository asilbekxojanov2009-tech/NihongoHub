# NihongoHub — tuzatilgan to‘liq loyiha

## Mahalliy kompyuterda ishga tushirish
1. Node.js 20 yoki undan yangisini o‘rnating.
2. Terminalda loyiha papkasiga kiring.
3. `npm install` buyrug‘ini bajaring.
4. `npm start` buyrug‘ini bajaring.
5. Brauzerda `http://localhost:3000` ni oching.

## Render’ga joylash
- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variables qo‘shing:
  - `NODE_ENV` = `production`
  - `SESSION_SECRET` = kamida 32 belgili, taxmin qilib bo‘lmaydigan maxfiy qiymat
  - `ADMIN_USERNAME` = admin uchun tanlagan login
  - `ADMIN_PASSWORD` = kamida 12 belgili maxfiy parol
  - `DB_PATH` = `/var/data/nihongohub.db` (faqat `/var/data` manziliga Persistent Disk ulangan bo‘lsa)

### Render Persistent Disk
Render servis sozlamalarida Disk qo‘shib, Mount Path qiymatini `/var/data` qiling. Keyin `DB_PATH=/var/data/nihongohub.db` ni Environment Variables’ga kiriting va deploy qiling. Persistent disk bo‘lmasa, bepul servis qayta ishga tushganda SQLite ma’lumotlari yo‘qolishi mumkin.

### Admin
`ADMIN_USERNAME` va `ADMIN_PASSWORD` to‘g‘ri kiritilgan bo‘lsa, server birinchi marta ishga tushganda admin akkauntini yaratadi. Admin sahifasi: `/admin/login.html`. Agar shu username bazada avvaldan mavjud bo‘lsa, avtomatik qayta yaratmaydi.

## Asosiy sahifalar
- `/` — bosh sahifa
- `/register.html` — ro‘yxatdan o‘tish
- `/login.html` — kirish
- `/dashboard.html` — shaxsiy kabinet
- `/lessons.html`, `/lesson.html?id=1` — darslar
- `/kanji.html` — kanji
- `/quiz.html` — test
- `/progress.html` — natijalar
- `/admin/login.html` — admin kirishi
- `/admin/dashboard.html` — admin panel
- `/admin/users.html` — foydalanuvchilar
- `/admin/lessons.html` — darslarni boshqarish

## Tuzatishlar
- `seed.js` server ishlayotgan paytda SQLite bazasini yopmaydi.
- Sessiyalar SQLite’da saqlanadi; login muvaffaqiyatidan keyin sessiya javobdan oldin saqlanadi.
- Render HTTPS/proxy uchun cookie va `trust proxy` sozlangan.
- Faqat `public/` papkasi ommaga xizmat qiladi; server kodi va maxfiy fayllar ochilmaydi.
