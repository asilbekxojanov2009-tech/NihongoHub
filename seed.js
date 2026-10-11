const db = require("./database");

const count = db.prepare("SELECT COUNT(*) AS n FROM lessons").get().n;
if (count === 0) {
  const add = db.prepare(`
    INSERT INTO lessons (title, description, level, content)
    VALUES (?, ?, ?, ?)
  `);
  const lessons = [
    ["Hiragana: あいうえお", "Hiragana yozuvining dastlabki besh belgisi.", "N5",
     "あ — a\nい — i\nう — u\nえ — e\nお — o\n\nMashq: har bir belgini 5 martadan yozing va ovoz chiqarib o‘qing.\n\nMisol: あお (ao) — ko‘k rang."],
    ["Salomlashish", "Yapon tilida kundalik salomlashish iboralari.", "N5",
     "こんにちは (Konnichiwa) — Salom / xayrli kun.\nおはようございます (Ohayou gozaimasu) — Xayrli tong.\nこんばんは (Konbanwa) — Xayrli kech.\nありがとうございます (Arigatou gozaimasu) — Katta rahmat.\nすみません (Sumimasen) — Kechirasiz."],
    ["です bilan sodda gaplar", "O‘zingiz haqingizda sodda gap tuzish.", "N5",
     "わたしはアリです。 — Men Ali(man).\nわたしは学生です。 — Men o‘quvchiman.\n\nQolip: [ot] は [ot/sifat] です。\nは bu yerda mavzu ko‘rsatkichi bo‘lib, wa deb o‘qiladi."],
    ["N4: と思います", "Fikr va taxminni ifodalash.", "N4",
     "と思います (to omoimasu) — deb o‘ylayman.\n\n例: 日本語はおもしろいと思います。\nTarjima: Yapon tilini qiziqarli deb o‘ylayman.\n\nMashq: O‘zingiz yoqtirgan narsa haqida bitta gap yozing."],
    ["N4: たり〜たりします", "Bir nechta faoliyatni misol tariqasida sanash.", "N4",
     "たり〜たりします — u-bu ishlarni qilmoq.\n\n例: 日曜日は本を読んだり、音楽を聞いたりします。\nTarjima: Yakshanba kuni kitob o‘qiyman, musiqa tinglayman va shunga o‘xshash ishlar qilaman.\n\nFe’lning た shakli + り, oxirida します." ]
  ];
  const tx = db.transaction(() => lessons.forEach(x => add.run(...x)));
  tx();
}

const kanjiCount = db.prepare("SELECT COUNT(*) AS n FROM kanji").get().n;
if (kanjiCount === 0) {
  const addKanji = db.prepare("INSERT INTO kanji (character, reading, meaning, example) VALUES (?, ?, ?, ?)");
  const items = [
    ["日", "にち / ひ (nichi / hi)", "kun, quyosh", "日本 (にほん) — Yaponiya"],
    ["月", "げつ / つき (getsu / tsuki)", "oy", "月曜日 (げつようび) — dushanba"],
    ["人", "じん / ひと (jin / hito)", "odam", "日本人 (にほんじん) — yapon"],
    ["水", "すい / みず (sui / mizu)", "suv", "水曜日 (すいようび) — chorshanba"],
    ["山", "さん / やま (san / yama)", "tog‘", "富士山 (ふじさん) — Fuji tog‘i"],
    ["学", "がく (gaku)", "o‘qish, ta’lim", "学生 (がくせい) — o‘quvchi/talaba"]
  ];
  const tx = db.transaction(() => items.forEach(x => addKanji.run(...x)));
  tx();
}
console.log("Demo darslar va kanjilar tayyor.");

