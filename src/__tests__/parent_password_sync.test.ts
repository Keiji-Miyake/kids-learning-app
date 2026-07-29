import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
// @ts-ignore
import app from '../../server.js';

const DB_FILE = path.join(process.cwd(), 'db.json');

describe('Parent Password Server Persistence & Verification API', () => {
  let dbBackup: string | null = null;

  beforeEach(() => {
    if (fs.existsSync(DB_FILE)) {
      dbBackup = fs.readFileSync(DB_FILE, 'utf-8');
    }
    // テスト用にパスワードをデフォルトハッシュに初期化
    const defaultHash = crypto.createHash('sha256').update('parent').digest('hex');
    let currentData = {};
    if (fs.existsSync(DB_FILE)) {
      try { currentData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')); } catch {}
    }
    fs.writeFileSync(DB_FILE, JSON.stringify({ ...currentData, parentPasswordHash: defaultHash }, null, 2), 'utf-8');
  });

  afterEach(() => {
    if (dbBackup !== null) {
      fs.writeFileSync(DB_FILE, dbBackup, 'utf-8');
    }
  });

  it('should verify default password "parent" correctly via API', async () => {
    const res = await request(app)
      .post('/api/parent-password/verify')
      .send({ password: 'parent' });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  it('should reject invalid password via API', async () => {
    const res = await request(app)
      .post('/api/parent-password/verify')
      .send({ password: 'wrong_password_123' });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(false);
  });

  it('should update password and save hashed value in db.json', async () => {
    const newPassword = 'myNewSuperSecretPassword2026';
    const updateRes = await request(app)
      .put('/api/parent-password')
      .send({ newPassword, currentPassword: 'parent' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);

    // 新パスワードの検証
    const verifyNewRes = await request(app)
      .post('/api/parent-password/verify')
      .send({ password: newPassword });

    expect(verifyNewRes.status).toBe(200);
    expect(verifyNewRes.body.valid).toBe(true);

    // 旧パスワードの却下
    const verifyOldRes = await request(app)
      .post('/api/parent-password/verify')
      .send({ password: 'parent' });

    expect(verifyOldRes.status).toBe(200);
    expect(verifyOldRes.body.valid).toBe(false);

    // db.json に平文ではなく SHA-256 ハッシュ文字列として保存されているか検証
    const dbContent = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    const expectedHash = crypto.createHash('sha256').update(newPassword).digest('hex');
    expect(dbContent.parentPasswordHash).toBe(expectedHash);
    expect(dbContent.parentPasswordHash).not.toBe(newPassword);
  });
});
