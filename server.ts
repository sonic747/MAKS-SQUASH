import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

interface ClubData {
  updated_at: string;
  members: any[];
  posts: any[];
}

const DATA_FILE = path.resolve(process.cwd(), 'src/data/club_db.json');
const MEMBERS_FILE = path.resolve(process.cwd(), 'src/data/members_db.json');

// Helper to safely read JSON file
function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

// Helper to safely write JSON file
function writeJsonFile<T>(filePath: string, data: T): boolean {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// 2. Comprehensive Sync endpoint: Members + Posts combined
app.get('/api/sync', (req: Request, res: Response) => {
  const db = readJsonFile<ClubData>(DATA_FILE, {
    updated_at: new Date().toISOString(),
    members: [],
    posts: [],
  });
  res.json(db);
});

app.post('/api/sync', (req: Request, res: Response) => {
  const { members, posts } = req.body;
  const currentDb = readJsonFile<ClubData>(DATA_FILE, {
    updated_at: new Date().toISOString(),
    members: [],
    posts: [],
  });
  
  const updatedDb: ClubData = {
    updated_at: new Date().toISOString(),
    members: Array.isArray(members) ? members : currentDb.members,
    posts: Array.isArray(posts) ? posts : currentDb.posts,
  };

  writeJsonFile(DATA_FILE, updatedDb);
  
  if (Array.isArray(members)) {
    writeJsonFile(MEMBERS_FILE, { updated_at: updatedDb.updated_at, members });
  }

  res.json({
    success: true,
    membersCount: updatedDb.members.length,
    postsCount: updatedDb.posts.length,
    updated_at: updatedDb.updated_at,
  });
});

// 3. Members DB endpoints (read/write)
app.get('/api/members', (req: Request, res: Response) => {
  const clubDb = readJsonFile<Partial<ClubData>>(DATA_FILE, {});
  if (clubDb.members && Array.isArray(clubDb.members)) {
    res.json({ members: clubDb.members, updated_at: clubDb.updated_at });
    return;
  }
  const data = readJsonFile(MEMBERS_FILE, { members: [] });
  res.json(data);
});

app.post('/api/members', (req: Request, res: Response) => {
  const { members } = req.body;
  if (!Array.isArray(members)) {
    res.status(400).json({ error: 'members must be an array' });
    return;
  }
  const payload = {
    updated_at: new Date().toISOString(),
    members,
  };
  writeJsonFile(MEMBERS_FILE, payload);

  const clubDb = readJsonFile<ClubData>(DATA_FILE, {
    updated_at: payload.updated_at,
    members: [],
    posts: [],
  });
  clubDb.members = members;
  clubDb.updated_at = payload.updated_at;
  writeJsonFile(DATA_FILE, clubDb);

  res.json({ success: true, count: members.length });
});

// 4. Push Notification Endpoints
const PUSH_TOKENS_FILE = path.resolve(process.cwd(), 'src/data/push_tokens.json');
const PUSH_LOGS_FILE = path.resolve(process.cwd(), 'src/data/push_logs.json');

app.get('/api/push/tokens', (req: Request, res: Response) => {
  const tokens = readJsonFile<any[]>(PUSH_TOKENS_FILE, []);
  res.json({ count: tokens.length, tokens });
});

app.post('/api/push/register', (req: Request, res: Response) => {
  const { token, memberId, memberName, role, platform } = req.body;
  if (!token) {
    res.status(400).json({ error: 'Token is required' });
    return;
  }
  const tokens = readJsonFile<any[]>(PUSH_TOKENS_FILE, []);
  const existingIdx = tokens.findIndex((t) => t.token === token || (t.memberId && t.memberId === memberId));
  const newRecord = {
    token,
    memberId: memberId || 'anonymous',
    memberName: memberName || '클럽 회원',
    role: role || 'member',
    platform: platform || 'unknown',
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    tokens[existingIdx] = { ...tokens[existingIdx], ...newRecord };
  } else {
    tokens.push(newRecord);
  }

  writeJsonFile(PUSH_TOKENS_FILE, tokens);
  res.json({ success: true, totalSubscribers: tokens.length });
});

app.post('/api/push/broadcast', (req: Request, res: Response) => {
  const { title, body, category, postId, senderName } = req.body;
  const tokens = readJsonFile<any[]>(PUSH_TOKENS_FILE, []);
  const logs = readJsonFile<any[]>(PUSH_LOGS_FILE, []);

  const pushLog = {
    id: `log-${Date.now()}`,
    title: title || '[MAKS SQUASH] 클럽 새로운 공지',
    body: body || '새로운 클럽 소식이 등록되었습니다.',
    category: category || 'all',
    postId: postId || '',
    senderName: senderName || '최고 관리자',
    sentAt: new Date().toISOString(),
    recipientCount: tokens.length,
  };

  logs.unshift(pushLog);
  writeJsonFile(PUSH_LOGS_FILE, logs.slice(0, 100)); // keep last 100 logs

  console.log(`[Push Notification Broadcast] Sent to ${tokens.length} subscriber devices: "${pushLog.title}"`);
  res.json({
    success: true,
    sentTo: tokens.length,
    log: pushLog,
  });
});

// 5. Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`MAKS Squash Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
