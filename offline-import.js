/*
 * Offline synthetic-data import helpers.
 *
 * This file deliberately has no network or document-parser dependency.  It accepts
 * only the small POA&M snapshot schema used by this training dashboard and rejects
 * sources that are not explicitly marked as synthetic training material.
 */
(function attachOfflineImport(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.DashboardOfflineImport = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createOfflineImport() {
  'use strict';

  const REQUIRED_FIELDS = [
    'id', 'title', 'hullId', 'control', 'status', 'risk', 'due', 'progress', 'owner', 'compartment', 'mitigation',
  ];
  const CSV_FIELDS = ['synthetic', ...REQUIRED_FIELDS];
  const VALID_STATUS = new Set(['Open', 'Ongoing', 'Closed']);
  const VALID_RISK = new Set(['critical', 'high', 'moderate', 'low']);
  const VALID_FRESHNESS = new Set(['high', 'medium', 'low', 'unknown']);
  const SNAPSHOT_SCHEMA = 'pms443-offline-synthetic-snapshot/v1';
  const VALID_ARTIFACT_MODES = new Set(['metadata-only', 'extracted-synthetic-passages']);
  const VALID_HASH_SCOPES = new Set(['file-bytes', 'synthetic-registry-descriptor/v1']);
  const MAX_RECORDS = 1000;
  const MAX_TEXT = 500;

  function importError(message) {
    const error = new Error(message);
    error.name = 'SyntheticImportError';
    return error;
  }

  function asString(value) {
    return typeof value === 'string' ? value.trim() : String(value == null ? '' : value).trim();
  }

  function isIsoDate(value) {
    const text = asString(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
    const [year, month, day] = text.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }

  function bool(value) {
    return value === true || asString(value).toLowerCase() === 'true';
  }

  function validateMetadata(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw importError('A metadata object is required.');
    const metadata = {
      training: bool(raw.training),
      classification: asString(raw.classification).toUpperCase(),
      sourceId: asString(raw.sourceId),
      sourceVersion: asString(raw.sourceVersion),
      locator: asString(raw.locator),
      reviewer: asString(raw.reviewer),
      asOf: asString(raw.asOf),
      freshnessConfidence: asString(raw.freshnessConfidence).toLowerCase(),
    };
    if (!metadata.training) throw importError('Import rejected: metadata.training must be true.');
    if (metadata.classification !== 'UNCLASSIFIED') throw importError('Import rejected: classification must be UNCLASSIFIED.');
    if (!/^SYN-[A-Z0-9][A-Z0-9._-]{2,119}$/i.test(metadata.sourceId)) {
      throw importError('Import rejected: sourceId must use the SYN- synthetic-source prefix.');
    }
    if (!metadata.sourceVersion || metadata.sourceVersion.length > 120) throw importError('Import rejected: sourceVersion is required.');
    if (!/^(offline|fixture):\/\//.test(metadata.locator)) {
      throw importError('Import rejected: locator must be an offline:// or fixture:// reference.');
    }
    if (!metadata.reviewer || metadata.reviewer.length > 120) throw importError('Import rejected: reviewer is required.');
    if (!isIsoDate(metadata.asOf)) throw importError('Import rejected: asOf must be an ISO date (YYYY-MM-DD).');
    if (!VALID_FRESHNESS.has(metadata.freshnessConfidence)) {
      throw importError('Import rejected: freshnessConfidence must be high, medium, low, or unknown.');
    }
    return metadata;
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      if (char === '"') {
        if (quoted && text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === ',' && !quoted) {
        row.push(cell);
        cell = '';
      } else if ((char === '\n' || char === '\r') && !quoted) {
        if (char === '\r' && text[i + 1] === '\n') i += 1;
        row.push(cell);
        if (row.some((value) => value.length > 0)) rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }
    if (quoted) throw importError('CSV has an unterminated quoted value.');
    row.push(cell);
    if (row.some((value) => value.length > 0)) rows.push(row);
    return rows;
  }

  function parseCsvImport(text) {
    const metadata = {};
    const dataLines = [];
    for (const line of String(text || '').split(/\r?\n/)) {
      if (/^\s*#/.test(line)) {
        const match = line.replace(/^\s*#\s?/, '').match(/^([A-Za-z][A-Za-z0-9]*)\s*=\s*(.*)$/);
        if (!match) throw importError('CSV metadata comments must be in key=value form.');
        metadata[match[1]] = match[2].trim();
      } else if (line.trim()) {
        dataLines.push(line);
      }
    }
    if (!dataLines.length) throw importError('CSV has no records.');
    const rows = parseCsv(dataLines.join('\n'));
    const headers = rows.shift().map((header) => asString(header));
    if (headers.length !== CSV_FIELDS.length || CSV_FIELDS.some((field, index) => headers[index] !== field)) {
      throw importError(`CSV header must exactly be: ${CSV_FIELDS.join(', ')}.`);
    }
    const records = rows.map((row, index) => {
      if (row.length !== headers.length) throw importError(`CSV row ${index + 2} has the wrong number of columns.`);
      return Object.fromEntries(headers.map((header, cellIndex) => [header, row[cellIndex]]));
    });
    return { metadata, poams: records };
  }

  function validateRecords(records, allowedHullIds) {
    if (!Array.isArray(records) || !records.length) throw importError('Import must include at least one POA&M record.');
    if (records.length > MAX_RECORDS) throw importError(`Import exceeds the ${MAX_RECORDS}-record training limit.`);
    const hulls = new Set(allowedHullIds || []);
    const ids = new Set();
    return records.map((raw, index) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw importError(`Record ${index + 1} is not an object.`);
      if (!bool(raw.synthetic)) throw importError(`Record ${index + 1} is not marked synthetic=true.`);
      for (const field of REQUIRED_FIELDS) {
        if (!(field in raw)) throw importError(`Record ${index + 1} is missing ${field}.`);
      }
      const record = {};
      for (const field of REQUIRED_FIELDS) {
        record[field] = field === 'progress' ? Number(raw[field]) : asString(raw[field]);
        if (field !== 'progress' && (!record[field] || record[field].length > MAX_TEXT)) {
          throw importError(`Record ${index + 1} has an invalid ${field}.`);
        }
      }
      if (!/^POAM-[A-Z0-9-]{4,80}$/i.test(record.id)) throw importError(`Record ${index + 1} has an invalid POA&M id.`);
      if (ids.has(record.id)) throw importError(`Record ${index + 1} repeats ${record.id}.`);
      ids.add(record.id);
      if (hulls.size && !hulls.has(record.hullId)) throw importError(`Record ${index + 1} references an unknown synthetic hull.`);
      if (!VALID_STATUS.has(record.status)) throw importError(`Record ${index + 1} has an invalid status.`);
      if (!VALID_RISK.has(record.risk)) throw importError(`Record ${index + 1} has an invalid risk.`);
      if (!/^[A-Z]{2,4}-\d{1,3}(?:\(\d+\))?$/i.test(record.control)) {
        throw importError(`Record ${index + 1} has an invalid control identifier.`);
      }
      if (!/^[a-z][a-z0-9_-]{0,63}$/i.test(record.compartment)) {
        throw importError(`Record ${index + 1} has an invalid compartment identifier.`);
      }
      if (!isIsoDate(record.due)) throw importError(`Record ${index + 1} has an invalid due date.`);
      if (!Number.isInteger(record.progress) || record.progress < 0 || record.progress > 100) {
        throw importError(`Record ${index + 1} has progress outside 0–100.`);
      }
      return record;
    });
  }

  function validateSnapshotScenario(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw importError('Snapshot scenario is required.');
    if (!isIsoDate(raw.asOf)) throw importError('Snapshot scenario as-of must be an ISO date.');
    const filters = raw.filters;
    if (!filters || typeof filters !== 'object' || Array.isArray(filters)) throw importError('Snapshot filters are required.');
    const shipClass = asString(filters.shipClass);
    const hull = asString(filters.hull);
    const compartment = filters.compartment == null ? null : asString(filters.compartment);
    if (!/^(all|[a-z][a-z0-9_-]{0,63})$/i.test(shipClass)
      || !/^(all|[a-z][a-z0-9_-]{0,63})$/i.test(hull)
      || (compartment !== null && !/^[a-z][a-z0-9_-]{0,63}$/i.test(compartment))) {
      throw importError('Snapshot filters contain an invalid identifier.');
    }
    return { asOf: asString(raw.asOf), filters: { shipClass, hull, compartment } };
  }

  function validateArtifacts(raw) {
    if (!Array.isArray(raw) || raw.length > MAX_RECORDS) throw importError('Snapshot artifacts must be a bounded array.');
    const sourceIds = new Set();
    return raw.map((artifact, index) => {
      if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) throw importError(`Artifact ${index + 1} is not an object.`);
      const sourceId = asString(artifact.sourceId);
      const name = asString(artifact.name);
      const type = asString(artifact.type);
      const uploaded = asString(artifact.uploaded);
      const mode = asString(artifact.mode);
      const hashScope = asString(artifact.hashScope);
      const sha256 = asString(artifact.sha256).toLowerCase();
      const passages = Array.isArray(artifact.passages) ? artifact.passages : [];
      if (!/^SYN-[A-Z0-9][A-Z0-9._-]{2,119}$/i.test(sourceId) || sourceIds.has(sourceId)) {
        throw importError(`Artifact ${index + 1} has an invalid or duplicate synthetic sourceId.`);
      }
      sourceIds.add(sourceId);
      if (!name || name.length > MAX_TEXT || !type || type.length > MAX_TEXT || !isIsoDate(uploaded)
        || !VALID_ARTIFACT_MODES.has(mode) || !VALID_HASH_SCOPES.has(hashScope) || !/^[a-f0-9]{64}$/.test(sha256)) {
        throw importError(`Artifact ${index + 1} has invalid metadata.`);
      }
      if (mode === 'metadata-only' && passages.length) throw importError(`Artifact ${index + 1} metadata-only records cannot include text passages.`);
      if (passages.length > 50) throw importError(`Artifact ${index + 1} has too many passages.`);
      const passageIds = new Set();
      const safePassages = passages.map((passage, passageIndex) => {
        if (!passage || typeof passage !== 'object' || Array.isArray(passage)) throw importError(`Artifact ${index + 1} passage ${passageIndex + 1} is invalid.`);
        const id = asString(passage.id);
        const passageText = asString(passage.text);
        if (!/^[A-Z0-9][A-Z0-9._#-]{2,159}$/i.test(id) || passageIds.has(id) || !passageText || passageText.length > 2000) {
          throw importError(`Artifact ${index + 1} passage ${passageIndex + 1} is invalid.`);
        }
        passageIds.add(id);
        return { id, text: passageText };
      });
      return { sourceId, name, type, uploaded, mode, hashScope, sha256, passages: safePassages };
    });
  }

  function validateSnapshotCounts(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw importError('Snapshot counts are required.');
    const counts = {};
    for (const key of ['hulls', 'poams', 'openPoams', 'artifacts']) {
      if (!Number.isInteger(raw[key]) || raw[key] < 0 || raw[key] > MAX_RECORDS) throw importError(`Snapshot count ${key} is invalid.`);
      counts[key] = raw[key];
    }
    return counts;
  }

  async function validateSnapshot(raw, options) {
    if (raw.schema !== SNAPSHOT_SCHEMA || raw.training !== true || asString(raw.classification).toUpperCase() !== 'UNCLASSIFIED') {
      throw importError('Snapshot must use the unclassified synthetic snapshot schema.');
    }
    if (!/^[a-f0-9]{64}$/i.test(asString(raw.snapshotSha256))) throw importError('Snapshot is missing its SHA-256 integrity value.');
    const metadata = validateMetadata(raw.metadata);
    const poams = validateRecords(raw.poams, options.allowedHullIds);
    const scenario = validateSnapshotScenario(raw.scenario);
    const artifacts = validateArtifacts(raw.artifacts);
    const counts = validateSnapshotCounts(raw.counts);
    if (!Array.isArray(raw.sourceIds) || raw.sourceIds.some((id) => !/^SYN-[A-Z0-9][A-Z0-9._-]{2,119}$/i.test(asString(id)))) {
      throw importError('Snapshot source IDs are invalid.');
    }
    const sourceIds = raw.sourceIds.map(asString).sort();
    const expectedSourceIds = [metadata.sourceId, ...artifacts.map((artifact) => artifact.sourceId)].sort();
    if (canonicalJson(sourceIds) !== canonicalJson(expectedSourceIds)) throw importError('Snapshot source IDs do not match its metadata registry.');
    const unsigned = { ...raw };
    delete unsigned.snapshotSha256;
    const computedHash = await sha256Hex(unsigned);
    if (computedHash !== asString(raw.snapshotSha256).toLowerCase()) throw importError('Snapshot SHA-256 integrity check failed.');
    return {
      schema: SNAPSHOT_SCHEMA,
      training: true,
      classification: 'UNCLASSIFIED',
      metadata,
      scenario,
      counts,
      sourceIds,
      poams: poams.map((poam) => ({ synthetic: true, ...poam })),
      artifacts,
      snapshotSha256: computedHash,
    };
  }

  async function parseImportText(filename, text, options = {}) {
    const name = asString(filename).toLowerCase();
    let payload;
    if (name.endsWith('.json')) {
      try {
        payload = JSON.parse(text);
      } catch {
        throw importError('JSON could not be parsed.');
      }
    } else if (name.endsWith('.csv')) {
      payload = parseCsvImport(text);
    } else {
      throw importError('Only offline synthetic .json and .csv snapshots are supported.');
    }
    if (!payload || typeof payload !== 'object') throw importError('Import payload must be an object.');
    if (payload.schema || payload.snapshotSha256) {
      const snapshot = await validateSnapshot(payload, options);
      return {
        metadata: snapshot.metadata,
        poams: snapshot.poams.map(({ synthetic, ...poam }) => poam),
        artifacts: snapshot.artifacts,
        scenario: snapshot.scenario,
        counts: snapshot.counts,
        sourceIds: snapshot.sourceIds,
        snapshotSha256: snapshot.snapshotSha256,
        snapshot,
        format: 'json',
      };
    }
    const metadata = validateMetadata(payload.metadata);
    const poams = validateRecords(payload.poams, options.allowedHullIds);
    return { metadata, poams, format: name.endsWith('.json') ? 'json' : 'csv' };
  }

  function canonicalize(value) {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (value && typeof value === 'object') {
      return Object.keys(value).sort().reduce((out, key) => {
        out[key] = canonicalize(value[key]);
        return out;
      }, {});
    }
    return value;
  }

  function canonicalJson(value) {
    return JSON.stringify(canonicalize(value));
  }

  function diffPoams(before, after) {
    const beforeById = new Map((before || []).map((record) => [record.id, record]));
    const afterById = new Map((after || []).map((record) => [record.id, record]));
    const added = [...afterById.keys()].filter((id) => !beforeById.has(id));
    const removed = [...beforeById.keys()].filter((id) => !afterById.has(id));
    const changed = [...afterById.keys()].filter((id) => beforeById.has(id)
      && canonicalJson(beforeById.get(id)) !== canonicalJson(afterById.get(id)));
    return { added, removed, changed, unchanged: afterById.size - added.length - changed.length };
  }

  async function sha256Hex(value) {
    const text = typeof value === 'string' ? value : null;
    const bytes = value instanceof ArrayBuffer
      ? new Uint8Array(value)
      : ArrayBuffer.isView(value)
        ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
        : new TextEncoder().encode(text == null ? canonicalJson(value) : text);
    const runtime = typeof globalThis !== 'undefined' ? globalThis : {};
    if (runtime.crypto && runtime.crypto.subtle) {
      const digest = await runtime.crypto.subtle.digest('SHA-256', bytes);
      return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    }
    if (typeof require === 'function') {
      return require('crypto').createHash('sha256').update(Buffer.from(bytes)).digest('hex');
    }
    throw importError('SHA-256 is unavailable in this browser.');
  }

  return {
    REQUIRED_FIELDS,
    CSV_FIELDS,
    SNAPSHOT_SCHEMA,
    canonicalJson,
    diffPoams,
    importError,
    parseImportText,
    sha256Hex,
    validateMetadata,
    validateRecords,
    validateSnapshot,
  };
});
