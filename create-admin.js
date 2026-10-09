const readline = require("node:readline/promises");
const { stdin: input, stdout: output } = require("node:process");
const bcrypt = require("bcryptjs");
const db = require("./database");

(async () => {
  const rl = readline.createInterface({ input, output });
  try {
    const username = (await rl.question("Admin loginini kiriting: ")).trim();
    const password = await rl.question("Yangi admin parolini kiriting (kamida 10 belgi): ");
    if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(username)) {
      throw new Error("Login 3-40 belgi bo‘lsin; harf, raqam, _, ., - ishlating.");
    }
    if (password.length < 10) {
      throw new Error("Parol kamida 10 belgidan iborat bo‘lishi kerak.");
    }
    const hash = await bcrypt.hash(password, 12);
    db.prepare(`
      INSERT INTO admins (username, password) VALUES (?, ?)
      ON CONFLICT(username) DO UPDATE SET password = excluded.password
    `).run(username, hash);
    console.log(`Admin "${username}" yaratildi/yangilandi.`);
  } catch (err) {
    console.error("Xatolik:", err.message);
    process.exitCode = 1;
  } finally {
    rl.close();
    db.close();
  }
})();
