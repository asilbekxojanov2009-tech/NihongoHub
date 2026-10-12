const session = require('express-session');

// Small SQLite-backed session store. Uses the same database as the app.
class SQLiteSessionStore extends session.Store {
  constructor(db) {
    super();
    this.db = db;
    db.exec(`CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      sess TEXT NOT NULL,
      expire INTEGER NOT NULL
    ); CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions(expire);`);
    this.getStmt = db.prepare('SELECT sess, expire FROM sessions WHERE sid = ?');
    this.setStmt = db.prepare(`INSERT INTO sessions(sid, sess, expire) VALUES(?, ?, ?)
      ON CONFLICT(sid) DO UPDATE SET sess=excluded.sess, expire=excluded.expire`);
    this.destroyStmt = db.prepare('DELETE FROM sessions WHERE sid = ?');
    this.touchStmt = db.prepare('UPDATE sessions SET expire = ? WHERE sid = ?');
    this.cleanupStmt = db.prepare('DELETE FROM sessions WHERE expire <= ?');
    this.lastCleanup = 0;
  }
  get(sid, callback) {
    try {
      const row = this.getStmt.get(sid);
      if (!row) return callback(null, null);
      if (row.expire <= Date.now()) {
        this.destroyStmt.run(sid);
        return callback(null, null);
      }
      callback(null, JSON.parse(row.sess));
    } catch (error) { callback(error); }
  }
  set(sid, sess, callback = () => {}) {
    try {
      const expires = sess.cookie && sess.cookie.expires
        ? new Date(sess.cookie.expires).getTime()
        : Date.now() + Number(sess.cookie && sess.cookie.maxAge || 8 * 60 * 60 * 1000);
      this.setStmt.run(sid, JSON.stringify(sess), expires);
      this.cleanupOccasionally();
      callback(null);
    } catch (error) { callback(error); }
  }
  touch(sid, sess, callback = () => {}) {
    try {
      const expires = sess.cookie && sess.cookie.expires
        ? new Date(sess.cookie.expires).getTime()
        : Date.now() + Number(sess.cookie && sess.cookie.maxAge || 8 * 60 * 60 * 1000);
      this.touchStmt.run(expires, sid);
      callback(null);
    } catch (error) { callback(error); }
  }
  destroy(sid, callback = () => {}) {
    try { this.destroyStmt.run(sid); callback(null); }
    catch (error) { callback(error); }
  }
  cleanupOccasionally() {
    if (Date.now() - this.lastCleanup > 10 * 60 * 1000) {
      this.lastCleanup = Date.now();
      this.cleanupStmt.run(Date.now());
    }
  }
}
module.exports = SQLiteSessionStore;
