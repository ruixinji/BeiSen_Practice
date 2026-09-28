// 练习进度的导出 / 导入（本地实现）
// 云端尚未开通时，这是跨浏览器、跨设备迁移进度，以及防止清缓存丢失数据的手段。
// 未来接入云服务后，只需要把 read/apply 的实现换成云端读写，调用方无需改动。
import { getUserProgress, saveUserProgress } from './auth.js';

const BACKUP_VERSION = 1;
const BACKUP_APP = 'beisen-practice';

function unique(arr, extra) {
  return Array.from(new Set([...arr, ...extra]));
}

// 组装备份内容
export function buildBackup(username) {
  const progress = getUserProgress(username) || {};
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    username,
    progress: {
      answered: progress.answered || {},
      bookmarks: progress.bookmarks || [],
      wrongs: progress.wrongs || [],
    },
  };
}

export function serializeBackup(username) {
  return JSON.stringify(buildBackup(username), null, 2);
}

// 触发浏览器下载备份文件
export function downloadBackup(username) {
  const blob = new Blob([serializeBackup(username)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${username}-进度备份-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// 校验并解析备份文本
export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: '文件不是有效的 JSON' };
  }
  if (!data || data.app !== BACKUP_APP) {
    return { ok: false, error: '这不像本应用导出的备份文件' };
  }
  if (!data.version || Number(data.version) > BACKUP_VERSION) {
    return { ok: false, error: '备份文件版本高于当前应用，请先更新应用' };
  }
  const p = data.progress || {};
  if (!p.answered || typeof p.answered !== 'object') {
    return { ok: false, error: '备份内容里没有作答记录' };
  }
  return {
    ok: true,
    data: {
      username: typeof data.username === 'string' ? data.username : null,
      exportedAt: data.exportedAt || null,
      progress: {
        answered: p.answered,
        bookmarks: Array.isArray(p.bookmarks) ? p.bookmarks : [],
        wrongs: Array.isArray(p.wrongs) ? p.wrongs : [],
      },
    },
  };
}

// 读取本地文件内容（不改动当前数据）
export async function readBackupFile(file) {
  if (!file) return { ok: false, error: '没有选择文件' };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: '文件过大（超过 5MB）' };
  try {
    return parseBackup(await file.text());
  } catch {
    return { ok: false, error: '文件读取失败' };
  }
}

// 合并式恢复：已有的作答、收藏、错题不会被删掉
export function applyBackup(username, payload) {
  const current = getUserProgress(username) || {};
  const incoming = payload.progress;
  const answered = { ...(current.answered || {}), ...incoming.answered };
  const bookmarks = unique(current.bookmarks || [], incoming.bookmarks);
  const wrongs = unique(current.wrongs || [], incoming.wrongs);
  saveUserProgress(username, { ...current, answered, bookmarks, wrongs });
  return {
    answered: Object.keys(answered).length,
    bookmarks: bookmarks.length,
    wrongs: wrongs.length,
  };
}
