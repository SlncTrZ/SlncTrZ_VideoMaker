const D = new (require('better-sqlite3'))('data/db2.sqlite');
const tables = D.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(r => r.name);
tables.forEach(t => {
  const cols = D.prepare('PRAGMA table_info(' + JSON.stringify(t) + ')').all().filter(c => c.type && c.type.toUpperCase().includes('TEXT'));
  if (cols.length) {
    cols.forEach(c => {
      try {
        // Use simple LIKE with unicode ranges won't work in SQLite, so use GLOB or manual approach
        // Instead, let's just sample data
        const sample = D.prepare('SELECT ' + JSON.stringify(c.name) + ' FROM ' + JSON.stringify(t) + ' WHERE ' + JSON.stringify(c.name) + ' IS NOT NULL AND length(' + JSON.stringify(c.name) + ') > 0 LIMIT 50').all();
        const chinese = sample.filter(r => r[c.name] && /[\u4e00-\u9fff]/.test(r[c.name]));
        if (chinese.length > 0) {
          console.log('TABLE: ' + t + ' | COL: ' + c.name + ' | ' + chinese.length + '/' + sample.length + ' rows with Chinese');
          console.log('  Sample: ' + (chinese[0][c.name] || '').substring(0, 100));
        }
      } catch(e) {}
    });
  }
});
D.close();
