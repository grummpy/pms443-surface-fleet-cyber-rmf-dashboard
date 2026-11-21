const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

function dashboardHarness() {
  const elements = { scenarioAsOf: { value: '' } };
  const context = vm.createContext({
    ArrayBuffer,
    TextEncoder,
    Uint8Array,
    crypto: globalThis.crypto,
    console,
    document: {
      addEventListener() {},
      getElementById(id) {
        if (!elements[id]) elements[id] = { value: '', innerHTML: '', classList: { add() {}, remove() {} } };
        return elements[id];
      },
    },
    window: {},
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'offline-import.js'), 'utf8'), context, { filename: 'offline-import.js' });
  vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), context, { filename: 'data.js' });
  vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), context, { filename: 'app.js' });
  vm.runInContext(`
    refreshAll = () => {};
    populateFilters = () => {};
    toast = () => {};
    globalThis.__dashboardHarness = {
      state,
      snapshot: buildOfflineSnapshot,
      importSnapshot: handleDataUpload,
      sha256: DashboardOfflineImport.sha256Hex,
      canonical: DashboardOfflineImport.canonicalJson,
    };
  `, context, { filename: 'snapshot-test-hooks.js' });
  return { harness: context.__dashboardHarness, elements };
}

test('saved synthetic snapshot reimports with its matching hash and scenario state', async () => {
  const { harness, elements } = dashboardHarness();
  harness.state.shipClass = 'ddg';
  harness.state.hull = 'ddg51';
  harness.state.selectedCompartment = 'cic';
  harness.state.scenarioAsOf = '2026-12-31';

  const unsigned = harness.snapshot();
  const saved = { ...unsigned, snapshotSha256: await harness.sha256(unsigned) };

  harness.state.shipClass = 'all';
  harness.state.hull = 'all';
  harness.state.selectedCompartment = null;
  harness.state.scenarioAsOf = '2026-01-01';
  await harness.importSnapshot([{
    name: 'SYN-PMS443-snapshot.json',
    text: async () => JSON.stringify(saved),
  }]);

  assert.equal(harness.state.shipClass, 'ddg');
  assert.equal(harness.state.hull, 'ddg51');
  assert.equal(harness.state.selectedCompartment, 'cic');
  assert.equal(harness.state.scenarioAsOf, '2026-12-31');
  assert.equal(elements.scenarioAsOf.value, '2026-12-31');
  assert.deepEqual(harness.snapshot().artifacts, unsigned.artifacts);
  assert.match(harness.snapshot().artifacts[0].type, /metadata/i);
  assert.match(harness.snapshot().artifacts[0].uploaded, /^2026-\d{2}-\d{2}$/);
  assert.equal(harness.canonical(harness.snapshot()), harness.canonical(unsigned));
  assert.equal(await harness.sha256(harness.snapshot()), saved.snapshotSha256);
});
