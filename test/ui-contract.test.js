const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('offline training UI exposes distinct import, replay, provenance, and snapshot controls', async () => {
  const [html, app] = await Promise.all([
    fs.readFile(path.join(root, 'index.html'), 'utf8'),
    fs.readFile(path.join(root, 'app.js'), 'utf8'),
  ]);
  assert.match(html, /id="btnUploadData"[^>]*[\s\S]*IMPORT SYNTHETIC/);
  assert.match(html, /id="btnReplayDemo"/);
  assert.match(html, /id="btnExportSnapshot"/);
  assert.match(html, /id="scenarioAsOf" type="date"/);
  assert.match(html, /id="snapshotProvenance"/);
  assert.match(html, /id="fileData" accept="\.csv,\.json,application\/json,text\/csv"/);
  assert.doesNotMatch(html, /Drop eMASS XML \/ Excel/);
  assert.match(app, /handleDataUpload/);
  assert.match(app, /replayDemo/);
  assert.match(app, /exportOfflineSnapshot/);
  assert.match(app, /document instructions remain inert/i);
});
