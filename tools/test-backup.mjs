// 备份/恢复模块的纯逻辑测试（在 Node 里用 localStorage 垫片跑，不涉及 UI）
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const { registerUser, saveUserProgress, getUserProgress } = await import('../src/data/auth.js');
const { serializeBackup, parseBackup, applyBackup } = await import('../src/data/backup.js');

const results = [];
const check = (name, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ' :: ' + extra : ''}`);

// 准备用户与进度
registerUser('tester', 'pw1234');
saveUserProgress('tester', {
  answered: { q1: { selected: 'A', correct: true }, q2: { selected: 'B', correct: false } },
  bookmarks: ['q1'],
  wrongs: ['q2'],
  stats: { totalAnswered: 2, totalCorrect: 1 },
});

// 1. 导出内容正确
const text = serializeBackup('tester');
const parsed = parseBackup(text);
check('导出的 JSON 可解析', parsed.ok === true);
check('用户名写入备份', parsed.ok && parsed.data.username === 'tester', parsed.ok ? parsed.data.username : parsed.error);
check('作答记录 2 题', parsed.ok && Object.keys(parsed.data.progress.answered).length === 2);
check('收藏 1 题', parsed.ok && parsed.data.progress.bookmarks.length === 1);

// 2. 合并恢复：已有数据不会被覆盖
registerUser('tester2', 'pw1234');
saveUserProgress('tester2', {
  answered: { q9: { selected: 'C', correct: true } },
  bookmarks: ['q9'],
  wrongs: [],
});
const merged = applyBackup('tester2', parsed.data);
check('合并后作答 3 题', merged.answered === 3, JSON.stringify(merged));
check('合并后收藏 2 题', merged.bookmarks === 2, JSON.stringify(merged));
check('合并后错题 1 题', merged.wrongs === 1, JSON.stringify(merged));
const after = getUserProgress('tester2');
check('原用户自有记录仍在', Object.keys(after.answered).includes('q9'), Object.keys(after.answered).join(','));

// 3. 容错
check('非 JSON 报错', parseBackup('not json at all').ok === false, parseBackup('not json at all').error);
check('陌生文件报错', parseBackup(JSON.stringify({ app: 'other' })).ok === false);
check('未来版本报错', parseBackup(JSON.stringify({ app: 'beisen-practice', version: 99, progress: {} })).ok === false);
check('缺作答记录报错', parseBackup(JSON.stringify({ app: 'beisen-practice', version: 1, progress: {} })).ok === false);

console.log(results.join('\n'));
const failed = results.filter((r) => r.startsWith('FAIL')).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
