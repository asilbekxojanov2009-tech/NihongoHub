const db=require("./database");
if(!db.prepare("SELECT COUNT(*) n FROM lessons").get().n){const a=db.prepare("INSERT INTO lessons(title,description,level,content) VALUES(?,?,?,?)");[
["Hiragana あいうえお","Birinchi besh hiragana belgisi","N5","あ — a\nい — i\nう — u\nえ — e\nお — o\nMashq: har birini 5 marta yozing."],
["Salomlashish","Kundalik iboralar","N5","こんにちは — Salom\nおはようございます — Xayrli tong\nありがとうございます — Katta rahmat\nすみません — Kechirasiz"],
["です bilan gaplar","O‘zingiz haqingizda gap tuzish","N5","わたしは学生です。 — Men o‘quvchiman.\nQolip: [ot] は [ot] です。"],
["と思います","Fikr bildirish","N4","と思います — deb o‘ylayman.\n日本語はおもしろいと思います。 — Yapon tilini qiziqarli deb o‘ylayman."],
["たり〜たりします","Faoliyatlarni sanash","N4","本を読んだり、音楽を聞いたりします。 — Kitob o‘qiyman, musiqa tinglayman va hokazo."]
].forEach(x=>a.run(...x));}
if(!db.prepare("SELECT COUNT(*) n FROM kanji").get().n){const a=db.prepare("INSERT INTO kanji(character,reading,meaning,example) VALUES(?,?,?,?)");[["日","にち / ひ","kun, quyosh","日本 — Yaponiya"],["月","げつ / つき","oy","月曜日 — dushanba"],["人","じん / ひと","odam","日本人 — yapon"],["水","すい / みず","suv","水曜日 — chorshanba"],["山","さん / やま","tog‘","富士山 — Fuji tog‘i"],["学","がく","o‘qish, ta’lim","学生 — talaba"]].forEach(x=>a.run(...x));}
console.log("Demo darslar va kanjilar tayyor.");
// Muhim: server ishlayotgan paytda database ulanishini yopmang.