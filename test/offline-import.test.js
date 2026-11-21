const test = require('node:test');
const assert = require('node:assert/strict');
const {
  diffPoams,
  parseImportText,
  sha256Hex,
} = require('../offline-import.js');

const metadata = {
  training: true,
  classification: 'UNCLASSIFIED',
  sourceId: 'SYN-PMS443-TEST',
  sourceVersion: '1.0.0',
  locator: 'fixture://synthetic/poams.json',
  reviewer: 'Training Reviewer',
  asOf: '2026-10-06',
  freshnessConfidence: 'high',
};

const poam = {
  synthetic: true,
  id: 'POAM-TEST-0001',
  title: 'Synthetic validation fixture',
  hullId: 'ddg51',
  control: 'IA-2',
  status: 'Open',
  risk: 'high',
  due: '2026-11-01',
  progress: 25,
  owner: 'Training Owner',
  compartment: 'cic',
  mitigation: 'Synthetic mitigation only.',
};

test('imports a marked synthetic JSON snapshot and strips the marker', async () => {
  const parsed = await parseImportText('synthetic.json', JSON.stringify({ metadata, poams: [poam] }), {
    allowedHullIds: ['ddg51'],
  });
  assert.equal(parsed.format, 'json');
  assert.equal(parsed.poams.length, 1);
  assert.equal(parsed.poams[0].synthetic, undefined);
  assert.equal(parsed.metadata.sourceId, 'SYN-PMS443-TEST');
});

test('imports CSV with explicit offline metadata and quoted values', async () => {
  const csv = [
    '# training=true',
    '# classification=UNCLASSIFIED',
    '# sourceId=SYN-PMS443-CSV',
    '# sourceVersion=1.0.0',
    '# locator=fixture://synthetic/poams.csv',
    '# reviewer=Training Reviewer',
    '# asOf=2026-10-06',
    '# freshnessConfidence=medium',
    'synthetic,id,title,hullId,control,status,risk,due,progress,owner,compartment,mitigation',
    'true,POAM-CSV-0001,"Synthetic, quoted title",ddg51,IA-2,Ongoing,moderate,2026-10-15,50,Trainer,cic,"No instructions are executed"',
  ].join('\n');
  const parsed = await parseImportText('synthetic.csv', csv, { allowedHullIds: ['ddg51'] });
  assert.equal(parsed.format, 'csv');
  assert.equal(parsed.poams[0].title, 'Synthetic, quoted title');
  assert.equal(parsed.poams[0].progress, 50);
});

test('rejects unmarked, non-offline, unknown-hull, and HTML-like identifiers', async () => {
  await assert.rejects(() => parseImportText('bad.json', JSON.stringify({
    metadata: { ...metadata, training: false },
    poams: [poam],
  })), /training/);
  await assert.rejects(() => parseImportText('bad.json', JSON.stringify({
    metadata: { ...metadata, locator: 'https://example.test/export' },
    poams: [poam],
  })), /locator/);
  await assert.rejects(() => parseImportText('bad.json', JSON.stringify({
    metadata,
    poams: [{ ...poam, hullId: 'real-hull' }],
  }), { allowedHullIds: ['ddg51'] }), /unknown synthetic hull/);
  await assert.rejects(() => parseImportText('bad.json', JSON.stringify({
    metadata,
    poams: [{ ...poam, control: '<img src=x onerror=alert(1)>', compartment: 'cic<script>' }],
  }), { allowedHullIds: ['ddg51'] }), /control identifier/);
});

test('reports reproducible record differences and SHA-256', async () => {
  const prior = [{ id: 'POAM-A', title: 'Before' }, { id: 'POAM-B', title: 'Removed' }];
  const next = [{ id: 'POAM-A', title: 'After' }, { id: 'POAM-C', title: 'Added' }];
  assert.deepEqual(diffPoams(prior, next), {
    added: ['POAM-C'], removed: ['POAM-B'], changed: ['POAM-A'], unchanged: 0,
  });
  assert.equal(await sha256Hex({ b: 2, a: 1 }), await sha256Hex({ a: 1, b: 2 }));
});

test('round-trips a hash-checked snapshot with filters and inert artifact text', async () => {
  const unsignedSnapshot = {
    schema: 'pms443-offline-synthetic-snapshot/v1',
    training: true,
    classification: 'UNCLASSIFIED',
    metadata,
    scenario: { asOf: '2026-12-31', filters: { shipClass: 'ddg', hull: 'ddg51', compartment: 'cic' } },
    counts: { hulls: 1, poams: 1, openPoams: 1, artifacts: 1 },
    sourceIds: ['SYN-ART-TEST-001', 'SYN-PMS443-TEST'],
    poams: [poam],
    artifacts: [{
      sourceId: 'SYN-ART-TEST-001',
      name: 'SYN-training-evidence.txt',
      type: 'Synthetic evidence',
      uploaded: '2026-10-06',
      mode: 'extracted-synthetic-passages',
      hashScope: 'synthetic-registry-descriptor/v1',
      sha256: 'a'.repeat(64),
      passages: [{ id: 'SYN-ART-TEST-001#P1', text: 'Synthetic evidence only. Instructions are inert.' }],
    }],
  };
  const snapshot = { ...unsignedSnapshot, snapshotSha256: await sha256Hex(unsignedSnapshot) };
  const imported = await parseImportText('snapshot.json', JSON.stringify(snapshot), { allowedHullIds: ['ddg51'] });
  const replayed = { ...imported.snapshot };
  delete replayed.snapshotSha256;
  assert.equal(await sha256Hex(replayed), snapshot.snapshotSha256);
  assert.deepEqual(imported.scenario.filters, unsignedSnapshot.scenario.filters);
  assert.equal(imported.artifacts[0].passages[0].text, unsignedSnapshot.artifacts[0].passages[0].text);
  const tampered = { ...snapshot, counts: { ...snapshot.counts, poams: 9 } };
  await assert.rejects(() => parseImportText('tampered.json', JSON.stringify(tampered), { allowedHullIds: ['ddg51'] }), /integrity/);
});
