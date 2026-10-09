# NihongoHub.uz

O'zbek tilida yapon tilini JLPT N5 va N4 darajalarida o'rganish uchun boshlang'ich, ishlaydigan web-loyiha.

## Ishga tushirish

1. Kompyuteringizda Node.js LTS o'rnatilgan bo'lsin.
2. ZIP faylni oching va shu papkani VS Code'da oching.
3. Terminalda quyidagilarni bajaring:

```bash
npm install
npm run create-admin
npm start
```

4. Brauzerda `http://localhost:3000` manzilini oching.

## Admin hisobini yaratish

`npm run create-admin` buyrug'i admin login va parolni terminalda so'raydi. O'zingizga xos parol tanlang. Admin sahifasi:
`http://localhost:3000/admin/login.html`

## Asosiy funksiyalar

- Ro'yxatdan o'tish, login va logout
- Server-side session cookie orqali autentifikatsiya
- Admin login alohida va admin API'lari serverda himoyalangan
- Admin: foydalanuvchilarni ko'rish/o'chirish
- Admin: N5/N4 darslarini yaratish, ko'rish, tahrirlash va o'chirish
- O'quvchi: darslar ro'yxati, darsni alohida o'qish va tugatildi deb belgilash
- N5/N4 mini testlari va natijani ko'rsatish
- Kanji lug'ati uchun boshlang'ich bo'lim
- Moslashuvchan, mobil qurilmalarga mos dizayn

## Muhim xavfsizlik eslatmalari

Bu loyiha lokal rivojlantirish uchun mo'ljallangan. Internetga chiqarishdan oldin:
- `SESSION_SECRET` muhit o'zgaruvchisini uzun, tasodifiy qiymatga sozlang.
- HTTPS, xavfsiz cookie va production session store sozlang.
- Zaxira nusxa, rate limiting, CSRF himoyasi, email tasdiqlash va maxfiylik siyosatini qo'shing.
- Haqiqiy foydalanuvchi ma'lumotlari bilan ishlashdan oldin xavfsizlik tekshiruvidan o'tkazing.

`nihongohub.db` birinchi ishga tushganda avtomatik yaratiladi. `seed.js` demo N5/N4 darslari va kanjilarni qo'shadi.
