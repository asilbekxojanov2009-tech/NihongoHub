const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const db = require("./database");
require("./seed");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const SESSION_SECRET = process.env.SESSION_SECRET || "local-development-secret-change-before-deploy";

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  name: "nihongohub.sid",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 8
  }
}));
app.use(express.static("."));

function requireUser(req, res, next) {
  if (!req.session.user) return res.status(401).json({ message: "Avval akkauntingizga kiring." });
  next();
}
function requireAdmin(req, res, next) {
  if (!req.session.admin) return res.status(401).json({ message: "Admin sifatida qayta kiring." });
  next();
}
function cleanText(value, max = 5000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

// Authentication
app.post("/api/register", async (req, res) => {
  const name = cleanText(req.body.name, 80);
  const email = cleanText(req.body.email, 160).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
    return res.status(400).json({ message: "Ism (kamida 2 belgi), to‘g‘ri email va kamida 8 belgili parol kiriting." });
  }
  try {
    const hash = await bcrypt.hash(password, 12);
    const result = db.prepare("INSERT INTO users (name,email,password) VALUES (?,?,?)").run(name, email, hash);
    req.session.user = { id: Number(result.lastInsertRowid), name, email };
    res.status(201).json({ message: "Ro‘yxatdan o‘tish muvaffaqiyatli!", user: req.session.user });
  } catch (err) {
    if (String(err.code).includes("SQLITE_CONSTRAINT")) return res.status(409).json({ message: "Bu email allaqachon ro‘yxatdan o‘tgan." });
    console.error(err);
    res.status(500).json({ message: "Server xatosi." });
  }
});

app.post("/api/login", async (req, res) => {
  const email = cleanText(req.body.email, 160).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const user = db.prepare("SELECT id,name,email,password FROM users WHERE email = ?").get(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Email yoki parol noto‘g‘ri." });
  }
  req.session.regenerate(err => {
    if (err) return res.status(500).json({ message: "Sessiyani boshlashda xatolik." });
    req.session.user = { id: user.id, name: user.name, email: user.email };
    res.json({ message: "Kirish muvaffaqiyatli!", user: req.session.user });
  });
});

app.post("/api/admin/login", async (req, res) => {
  const username = cleanText(req.body.username, 40);
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const admin = db.prepare("SELECT id,username,password FROM admins WHERE username = ?").get(username);
  if (!admin || !(await bcrypt.compare(password, admin.password))) {
    return res.status(401).json({ message: "Login yoki parol noto‘g‘ri." });
  }
  req.session.regenerate(err => {
    if (err) return res.status(500).json({ message: "Sessiyani boshlashda xatolik." });
    req.session.admin = { id: admin.id, username: admin.username };
    res.json({ message: "Admin sifatida kirish muvaffaqiyatli!", admin: req.session.admin });
  });
});

app.get("/api/me", (req, res) => {
  if (req.session.admin) return res.json({ role: "admin", admin: req.session.admin });
  if (req.session.user) return res.json({ role: "user", user: req.session.user });
  res.status(401).json({ message: "Kirish talab qilinadi." });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: "Chiqishda xatolik." });
    res.clearCookie("nihongohub.sid");
    res.json({ message: "Tizimdan chiqildi." });
  });
});

// User lessons and progress
app.get("/api/lessons", requireUser, (req, res) => {
  const level = req.query.level;
  if (level && !["N5", "N4"].includes(level)) return res.status(400).json({ message: "Daraja noto‘g‘ri." });
  const lessons = level
    ? db.prepare("SELECT id,title,description,level,created_at FROM lessons WHERE level=? ORDER BY id").all(level)
    : db.prepare("SELECT id,title,description,level,created_at FROM lessons ORDER BY CASE level WHEN 'N5' THEN 1 ELSE 2 END, id").all();
  const progress = db.prepare("SELECT lesson_id FROM lesson_progress WHERE user_id=?").all(req.session.user.id).map(x => x.lesson_id);
  res.json(lessons.map(l => ({ ...l, completed: progress.includes(l.id) })));
});

app.get("/api/lessons/:id", requireUser, (req, res) => {
  const lesson = db.prepare("SELECT id,title,description,level,content,created_at FROM lessons WHERE id=?").get(Number(req.params.id));
  if (!lesson) return res.status(404).json({ message: "Dars topilmadi." });
  const completed = !!db.prepare("SELECT 1 FROM lesson_progress WHERE user_id=? AND lesson_id=?").get(req.session.user.id, lesson.id);
  res.json({ ...lesson, completed });
});

app.post("/api/lessons/:id/complete", requireUser, (req, res) => {
  const id = Number(req.params.id);
  const lesson = db.prepare("SELECT id FROM lessons WHERE id=?").get(id);
  if (!lesson) return res.status(404).json({ message: "Dars topilmadi." });
  db.prepare("INSERT OR IGNORE INTO lesson_progress (user_id,lesson_id) VALUES (?,?)").run(req.session.user.id, id);
  res.json({ message: "Dars tugatilgan deb belgilandi!" });
});

app.get("/api/progress", requireUser, (req, res) => {
  const total = db.prepare("SELECT COUNT(*) AS n FROM lessons").get().n;
  const completed = db.prepare("SELECT COUNT(*) AS n FROM lesson_progress WHERE user_id=?").get(req.session.user.id).n;
  const quizzes = db.prepare("SELECT level,score,total,created_at FROM quiz_results WHERE user_id=? ORDER BY id DESC LIMIT 10").all(req.session.user.id);
  res.json({ totalLessons: total, completedLessons: completed, percent: total ? Math.round(completed * 100 / total) : 0, quizzes });
});

// Small starter quizzes (answer keys stay on the server)
const quizzes = {
  N5: [
    { q: "「こんにちは」 nimani anglatadi?", options: ["Xayrli tong", "Salom / xayrli kun", "Rahmat", "Kechirasiz"], answer: 1 },
    { q: "「水」 kanjisining ma'nosi nima?", options: ["Olov", "Tog‘", "Suv", "Odam"], answer: 2 },
    { q: "「ありがとう」 nimani anglatadi?", options: ["Rahmat", "Salom", "Xayr", "Ha"], answer: 0 },
    { q: "「学生」 nimani anglatadi?", options: ["O‘qituvchi", "O‘quvchi/talaba", "Shifokor", "Do‘st"], answer: 1 },
    { q: "「日」 ko‘pincha nimani bildiradi?", options: ["Suv", "Oy", "Kun/quyosh", "Kitob"], answer: 2 }
  ],
  N4: [
    { q: "「と思います」 ma'nosi qaysi?", options: ["Deb o‘ylayman", "Bormoqchiman", "Qila olmayman", "Bilganman"], answer: 0 },
    { q: "「たり〜たりします」 qanday vazifada ishlatiladi?", options: ["Faqat o‘tgan zamon", "Bir nechta ishni misol tariqasida sanash", "Savol berish", "Inkor qilish"], answer: 1 },
    { q: "「日本語はおもしろいと思います」 tarjimasi?", options: ["Yapon tili qiyin", "Yapon tilini qiziqarli deb o‘ylayman", "Men yaponman", "Yapon tilini unutdim"], answer: 1 },
    { q: "「学生」 so‘zi nimani anglatadi?", options: ["Talaba/o‘quvchi", "Do‘kon", "Suv", "Bugun"], answer: 0 },
    { q: "「すみません」 odatda nimani anglatadi?", options: ["Xayr", "Kechirasiz", "Mazali", "Yaxshi tun"], answer: 1 }
  ]
};

app.get("/api/quiz/:level", requireUser, (req, res) => {
  const level = req.params.level;
  if (!quizzes[level]) return res.status(404).json({ message: "Test topilmadi." });
  res.json(quizzes[level].map(({ q, options }, index) => ({ id: index, q, options })));
});

app.post("/api/quiz/:level/submit", requireUser, (req, res) => {
  const level = req.params.level;
  if (!quizzes[level]) return res.status(404).json({ message: "Test topilmadi." });
  const answers = req.body.answers;
  if (!Array.isArray(answers) || answers.length !== quizzes[level].length) return res.status(400).json({ message: "Barcha savollarga javob bering." });
  const score = quizzes[level].reduce((n, q, i) => n + (Number(answers[i]) === q.answer ? 1 : 0), 0);
  db.prepare("INSERT INTO quiz_results (user_id,level,score,total) VALUES (?,?,?,?)").run(req.session.user.id, level, score, quizzes[level].length);
  res.json({ score, total: quizzes[level].length, percent: Math.round(score * 100 / quizzes[level].length), message: score === quizzes[level].length ? "Ajoyib! Barcha javoblar to‘g‘ri." : "Yaxshi urinish! Darslarni takrorlab, yana urinib ko‘ring." });
});

// Kanji
app.get("/api/kanji", requireUser, (req, res) => {
  res.json(db.prepare("SELECT id,character,reading,meaning,example FROM kanji ORDER BY id").all());
});

// Admin APIs: all protected on the server
app.get("/api/admin/users", requireAdmin, (req, res) => {
  res.json(db.prepare("SELECT id,name,email,role,created_at FROM users ORDER BY id DESC").all());
});
app.delete("/api/admin/users/:id", requireAdmin, (req, res) => {
  const result = db.prepare("DELETE FROM users WHERE id=?").run(Number(req.params.id));
  if (!result.changes) return res.status(404).json({ message: "Foydalanuvchi topilmadi." });
  res.json({ message: "Foydalanuvchi o‘chirildi." });
});
app.get("/api/admin/lessons", requireAdmin, (req, res) => {
  res.json(db.prepare("SELECT id,title,description,level,content,created_at FROM lessons ORDER BY id DESC").all());
});
app.post("/api/admin/lessons", requireAdmin, (req, res) => {
  const title = cleanText(req.body.title, 160);
  const description = cleanText(req.body.description, 500);
  const level = req.body.level;
  const content = cleanText(req.body.content, 20000);
  if (!title || !description || !["N5", "N4"].includes(level)) return res.status(400).json({ message: "Dars nomi, tavsifi va N5/N4 darajasini kiriting." });
  const result = db.prepare("INSERT INTO lessons (title,description,level,content) VALUES (?,?,?,?)").run(title, description, level, content);
  res.status(201).json({ message: "Dars qo‘shildi!", id: Number(result.lastInsertRowid) });
});
app.put("/api/admin/lessons/:id", requireAdmin, (req, res) => {
  const title = cleanText(req.body.title, 160);
  const description = cleanText(req.body.description, 500);
  const level = req.body.level;
  const content = cleanText(req.body.content, 20000);
  if (!title || !description || !["N5", "N4"].includes(level)) return res.status(400).json({ message: "Maydonlarni to‘g‘ri to‘ldiring." });
  const result = db.prepare("UPDATE lessons SET title=?,description=?,level=?,content=? WHERE id=?").run(title, description, level, content, Number(req.params.id));
  if (!result.changes) return res.status(404).json({ message: "Dars topilmadi." });
  res.json({ message: "Dars yangilandi." });
});
app.delete("/api/admin/lessons/:id", requireAdmin, (req, res) => {
  const result = db.prepare("DELETE FROM lessons WHERE id=?").run(Number(req.params.id));
  if (!result.changes) return res.status(404).json({ message: "Dars topilmadi." });
  res.json({ message: "Dars o‘chirildi." });
});
app.get("/api/admin/stats", requireAdmin, (req, res) => {
  res.json({
    users: db.prepare("SELECT COUNT(*) AS n FROM users").get().n,
    lessons: db.prepare("SELECT COUNT(*) AS n FROM lessons").get().n,
    quizzes: db.prepare("SELECT COUNT(*) AS n FROM quiz_results").get().n
  });
});

app.get("/api/health", (req, res) => res.json({ ok: true, app: "NihongoHub" }));

app.listen(PORT, () => console.log(`NihongoHub ishlayapti: http://localhost:${PORT}`));
