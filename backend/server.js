const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Configure uploads directory and multer
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '';
    cb(null, `${unique}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit
app.use('/uploads', express.static(uploadDir));

const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET;
const dbFile = path.join(__dirname, 'data.db');

let db = null;

// Initialize SQL.js and load/create DB
async function initDB() {
  const SQL = await initSqlJs();

  let data;
  if (fs.existsSync(dbFile)) {
    data = fs.readFileSync(dbFile);
  }

  db = new SQL.Database(data);

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      date TEXT,
      image TEXT,
      category TEXT,
      excerpt TEXT,
      content TEXT,
      author TEXT
    );
  `);

  // Ensure existing DBs get the new column (no-op if already exists)
  try {
    db.run(`ALTER TABLE posts ADD COLUMN image TEXT`);
  } catch (err) {
    // column probably already exists, ignore
  }

  // Seed admin if not exists
  try {
    const result = db.exec(`SELECT * FROM users WHERE username = 'admin'`);
    if (!result || result.length === 0 || result[0].values.length === 0) {
      const password = process.env.ADMIN_PASSWORD;
      const hashed = bcrypt.hashSync(password, 8);
      db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, ['admin', hashed]);
      saveDB();
      console.log('Seeded admin user with username=admin and password from ADMIN_PASSWORD env');
    } else {
      console.log('Admin user already exists in database');
    }
  } catch (err) {
    console.log('Admin user check error:', err.message);
  }
}

// Save DB to file
function saveDB() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbFile, buffer);
}

// Auth route
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Missing credentials' });

  try {
    // Use stmt to properly handle parameter binding
    const stmt = db.prepare(`SELECT * FROM users WHERE username = ?`);
    stmt.bind([username]);

    let user = null;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      user = { id: row.id, username: row.username, password: row.password };
    }
    stmt.free();

    if (!user) return res.status(401).json({ message: 'Invalid username or password' });

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Invalid username or password' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '8h',
    });
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'DB error' });
  }
});

// Middleware to protect routes
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Missing Authorization' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Missing token' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.user = decoded;
    next();
  });
}

// Posts endpoints
app.get('/api/posts', (req, res) => {
  try {
    const result = db.exec(`SELECT * FROM posts ORDER BY id DESC`);
    let posts = [];
    if (result && result.length > 0) {
      posts = result[0].values.map((row) => ({
        id: row[0],
        title: row[1],
        date: row[2],
        image: row[3],
        category: row[4],
        excerpt: row[5],
        content: row[6],
        author: row[7],
      }));
    }
    res.json(posts);
  } catch (err) {
    console.error('Get posts error:', err);
    res.status(500).json({ message: 'DB error' });
  }
});

app.post('/api/posts', authenticate, upload.single('image'), (req, res) => {
  const { title, date, category, excerpt, content, author, existingImage } = req.body;
  if (!title || !excerpt || !content) return res.status(400).json({ message: 'Missing fields' });

  try {
    const imagePath = req.file ? `/uploads/${req.file.filename}` : existingImage || null;
    db.run(
      `INSERT INTO posts (title, date, image, category, excerpt, content, author) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, date, imagePath, category, excerpt, content, author]
    );
    saveDB();

    // Get the inserted row
    const result = db.exec(`SELECT * FROM posts ORDER BY id DESC LIMIT 1`);
    let post = null;
    if (result && result.length > 0 && result[0].values.length > 0) {
      const row = result[0].values[0];
      post = {
        id: row[0],
        title: row[1],
        date: row[2],
        image: row[3],
        category: row[4],
        excerpt: row[5],
        content: row[6],
        author: row[7],
      };
    }
    res.status(201).json(post);
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ message: 'DB error' });
  }
});

app.put('/api/posts/:id', authenticate, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, date, category, excerpt, content, author, existingImage } = req.body;
  try {
    const imagePath = req.file ? `/uploads/${req.file.filename}` : existingImage || null;
    db.run(
      `UPDATE posts SET title=?, date=?, image=?, category=?, excerpt=?, content=?, author=? WHERE id=?`,
      [title, date, imagePath, category, excerpt, content, author, id]
    );
    saveDB();

    // Use a prepared statement to query by id (sql.js doesn't support param binding with exec)
    const stmt = db.prepare(`SELECT * FROM posts WHERE id = ?`);
    stmt.bind([id]);
    let post = null;
    if (stmt.step()) {
      const rowObj = stmt.getAsObject();
      post = {
        id: rowObj.id,
        title: rowObj.title,
        date: rowObj.date,
        image: rowObj.image,
        category: rowObj.category,
        excerpt: rowObj.excerpt,
        content: rowObj.content,
        author: rowObj.author,
      };
    }
    stmt.free();
    res.json(post);
  } catch (err) {
    console.error('Update post error:', err);
    res.status(500).json({ message: 'DB error' });
  }
});

app.delete('/api/posts/:id', authenticate, (req, res) => {
  const { id } = req.params;
  try {
    db.run(`DELETE FROM posts WHERE id = ?`, [id]);
    saveDB();
    res.json({ success: true });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ message: 'DB error' });
  }
});

// CORS and JSON middleware
app.use(cors());
app.use(express.json());

// Base API route
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Blog working fine',
  });
});

// Start server after DB is initialized
initDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Another server may be running.`);
        process.exit(1);
      }
      console.error('Server error:', err);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize DB:', err);
    process.exit(1);
  });
