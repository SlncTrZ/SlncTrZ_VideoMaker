#!/usr/bin/env node
/**
 * Verify export/import workflow round-trip không mất data.
 * Trích logic từ WorkflowList._convertNodesToExport, _saveImportedWorkflow,
 * _convertImportedNodes, _validateImportData để chạy độc lập.
 *
 * Chạy: node scripts/verify-export-import.mjs
 */

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

// ============================================================================
// Trích logic export từ WorkflowList.js (sau fix)
// ============================================================================

function convertNodesToExport(nodes) {
  return nodes.map(node => {
    const exportNode = {
      node_id: node.node_id,
      node_type: node.node_type,
      node_name: node.node_name,
      pos_x: node.pos_x,
      pos_y: node.pos_y,
      enabled: node.enabled !== false
    };

    const t = node.node_type;
    const isGenLike = t === 'generate';
    const hasRatio = isGenLike || t === 'chatgpt' || t === 'grok';
    const hasQuantity = isGenLike || t === 'grok';
    const hasAutoDownload = isGenLike || t === 'chatgpt' || t === 'grok' || t === 'download';
    const isAIProvider = t === 'chatgpt' || t === 'grok' || t === 'prompt';

    if (node.prompt) exportNode.prompt = node.prompt;
    if (node.prompts) exportNode.prompts = node.prompts;
    if (isGenLike && node.gen_type) exportNode.gen_type = node.gen_type;
    if (isGenLike && node.media_type) exportNode.media_type = node.media_type;
    if (isGenLike && node.video_input_type) exportNode.video_input_type = node.video_input_type;
    if (isGenLike && node.model) exportNode.model = node.model;
    if (hasQuantity && node.quantity) exportNode.quantity = node.quantity;
    if (hasRatio && node.ratio) exportNode.ratio = node.ratio;
    if (isGenLike && node.style_prompt) exportNode.style_prompt = node.style_prompt;
    if (isGenLike && node.ref_mode) exportNode.ref_mode = node.ref_mode;
    if (hasAutoDownload && node.auto_download) exportNode.auto_download = node.auto_download;
    if (hasAutoDownload && node.download_resolution) exportNode.download_resolution = node.download_resolution;
    if (hasAutoDownload && node.video_download_resolution) exportNode.video_download_resolution = node.video_download_resolution;
    if (t === 'delay' && node.delay_seconds) exportNode.delay_seconds = node.delay_seconds;

    if (t === 'telegram') {
      if (node.telegram_chat_id) exportNode.telegram_chat_id = node.telegram_chat_id;
      if (node.telegram_send_mode) exportNode.telegram_send_mode = node.telegram_send_mode;
      if (node.telegram_message) exportNode.telegram_message = node.telegram_message;
    }

    if (node.frame_1_file_name) exportNode.frame_1_file_name = node.frame_1_file_name;
    if (node.frame_2_file_name) exportNode.frame_2_file_name = node.frame_2_file_name;
    if (node.frame_1_thumbnail) exportNode.frame_1_thumbnail = node.frame_1_thumbnail;
    if (node.frame_2_thumbnail) exportNode.frame_2_thumbnail = node.frame_2_thumbnail;

    if (node.note_text) exportNode.note_text = node.note_text;

    // Dual URL — provider URL gốc cho download chất lượng 100%
    if (node.result_provider_urls && Object.keys(node.result_provider_urls).length > 0) {
      exportNode.result_provider_urls = node.result_provider_urls;
    }

    if (isAIProvider && node.provider) exportNode.provider = node.provider;
    if ((t === 'generate' || t === 'chatgpt' || t === 'grok') && node.prompt_source) {
      exportNode.prompt_source = node.prompt_source;
    }
    if (isGenLike && node.multi_prompt) exportNode.multi_prompt = node.multi_prompt;
    if (t === 'prompt' && node.enhance !== undefined) exportNode.enhance = node.enhance;
    if (t === 'prompt' && node.timeout_sec) exportNode.timeout_sec = node.timeout_sec;
    if (t === 'chatgpt' && node.use_fallback_prefix) exportNode.use_fallback_prefix = node.use_fallback_prefix;
    if ((t === 'chatgpt' || t === 'grok') && node.timeout_ms) exportNode.timeout_ms = node.timeout_ms;
    if ((t === 'chatgpt' || t === 'grok') && node.max_ref_images) exportNode.max_ref_images = node.max_ref_images;
    if (t === 'grok' && node.grok_mode) exportNode.grok_mode = node.grok_mode;
    if (t === 'grok' && node.grok_duration) exportNode.grok_duration = node.grok_duration;
    if (t === 'grok' && node.grok_resolution) exportNode.grok_resolution = node.grok_resolution;
    if (t === 'grok' && node.grok_image_quality) exportNode.grok_image_quality = node.grok_image_quality;

    const refThumbnails = node.ref_thumbnails || {};
    const refFileNames = node.ref_file_names || {};
    const idsFromString = (node.ref_file_ids || '').split(',').map(s => s.trim()).filter(Boolean);
    const idsFromMaps = [...new Set([
      ...Object.keys(refThumbnails),
      ...Object.keys(refFileNames),
    ])];
    const refIds = idsFromString.length > 0 ? idsFromString : idsFromMaps;

    if (refIds.length > 0) {
      exportNode.ref_images = refIds.map(id => {
        const thumb = refThumbnails[id];
        const fileName = refFileNames[id];
        const result = {};
        if (thumb) result.thumbnail = typeof thumb === 'object' ? thumb.thumbnail : thumb;
        if (fileName) result.file_name = fileName;
        return result;
      }).filter(img => img.thumbnail || img.file_name);
    }

    return exportNode;
  });
}

function buildExportData(workflow, nodes, edges) {
  const exportNodes = convertNodesToExport(nodes);
  const settings = {
    parallel: workflow.parallel_execution ?? true,
    quantity: workflow.quantity || 1,
    delay_between_nodes: workflow.delay_between_nodes || 3,
    timeout_per_node: workflow.timeout_per_node || 120,
    retry_on_error: workflow.retry_on_error || 0,
    stop_on_error: workflow.stop_on_error !== false
  };
  return {
    version: '1.0',
    type: 'workflow',
    exported_at: new Date().toISOString(),
    workflow: {
      name: workflow.wf_name || 'Untitled',
      description: workflow.description || '',
      settings,
      nodes: exportNodes,
      edges: edges.map(e => ({
        edge_id: e.edge_id,
        source_node_id: e.source_node_id,
        source_handle: e.source_handle,
        source_port: e.source_port || null,
        target_node_id: e.target_node_id,
        target_handle: e.target_handle,
        target_port: e.target_port || null,
        data_type: e.data_type || 'image'
      }))
    }
  };
}

// ============================================================================
// Trích logic import từ WorkflowList.js (sau fix)
// ============================================================================

function validateImportData(data) {
  const errors = [];
  if (data.version !== '1.0') errors.push('version');
  if (data.type !== 'workflow') errors.push('type');
  if (!data.workflow) { errors.push('workflow missing'); return { valid: false, errors }; }
  if (!data.workflow.name) errors.push('name');
  if (!Array.isArray(data.workflow.nodes)) errors.push('nodes');
  else {
    const validTypes = [
      'start', 'generate', 'download', 'delay', 'telegram',
      'note', 'image', 'chatgpt', 'grok', 'prompt',
      'transform', 'condition', 'merge', 'output',
    ];
    data.workflow.nodes.forEach((n, i) => {
      if (!n.node_id || !n.node_type) errors.push(`node ${i + 1} missing id/type`);
      if (n.node_type && !validTypes.includes(n.node_type)) errors.push(`node ${i + 1} invalid type ${n.node_type}`);
    });
  }
  if (!Array.isArray(data.workflow.edges)) {
    errors.push('edges');
  } else if (Array.isArray(data.workflow.nodes)) {
    const nodeIds = new Set(data.workflow.nodes.map(n => n.node_id).filter(Boolean));
    data.workflow.edges.forEach((e, i) => {
      const srcId = e.source_node_id || e.source_node;
      const tgtId = e.target_node_id || e.target_node;
      if (srcId && !nodeIds.has(srcId)) errors.push(`edge ${i + 1} orphan source ${srcId}`);
      if (tgtId && !nodeIds.has(tgtId)) errors.push(`edge ${i + 1} orphan target ${tgtId}`);
    });
  }
  return { valid: errors.length === 0, errors };
}

function convertImportedNodes(nodes) {
  const nodeIdMap = {};
  return nodes.map(node => {
    const converted = { ...node };
    const newNodeId = 'node_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    nodeIdMap[node.node_id] = newNodeId;
    converted.node_id = newNodeId;
    if (node.ref_images && node.ref_images.length > 0) {
      const importKeys = [];
      converted.ref_thumbnails = {};
      converted.ref_file_names = {};
      node.ref_images.forEach((img, idx) => {
        const key = `upload_import_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`;
        importKeys.push(key);
        converted.ref_thumbnails[key] = img.thumbnail || img.url;
        if (img.file_name) converted.ref_file_names[key] = img.file_name;
      });
      converted.ref_file_ids = importKeys.join(', ');
    }
    if (node.frame_1 && node.frame_1.thumbnail) {
      converted.frame_1_file_id = '';
      converted.frame_1_thumbnail = node.frame_1.thumbnail;
      converted.frame_1_file_name = node.frame_1.file_name || null;
    }
    if (node.frame_2 && node.frame_2.thumbnail) {
      converted.frame_2_file_id = '';
      converted.frame_2_thumbnail = node.frame_2.thumbnail;
      converted.frame_2_file_name = node.frame_2.file_name || null;
    }
    return { converted, nodeIdMap: { [node.node_id]: newNodeId } };
  }).reduce((acc, { converted, nodeIdMap: map }) => {
    acc.nodes.push(converted);
    Object.assign(acc.nodeIdMap, map);
    return acc;
  }, { nodes: [], nodeIdMap: {} });
}

function saveImportedWorkflow(importData) {
  const { nodes: convertedNodes, nodeIdMap } = convertImportedNodes(importData.workflow.nodes);
  const convertedEdges = (importData.workflow.edges || []).map(e => {
    const oldSourceId = e.source_node_id || e.source_node;
    const oldTargetId = e.target_node_id || e.target_node;
    return {
      edge_id: 'edge_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      source_node_id: nodeIdMap[oldSourceId] || oldSourceId,
      source_handle: e.source_handle || e.source_output || 'output_1',
      source_port: e.source_port || null,
      target_node_id: nodeIdMap[oldTargetId] || oldTargetId,
      target_handle: e.target_handle || e.target_input || 'input_1',
      target_port: e.target_port || null,
      data_type: e.data_type || 'image'
    };
  });

  const importedSettings = importData.workflow.settings || {};
  const mappedSettings = {};
  if ('parallel' in importedSettings) mappedSettings.parallel_execution = importedSettings.parallel;
  if ('parallel_execution' in importedSettings) mappedSettings.parallel_execution = importedSettings.parallel_execution;
  if ('quantity' in importedSettings) mappedSettings.quantity = importedSettings.quantity;
  if ('delay_between_nodes' in importedSettings) mappedSettings.delay_between_nodes = importedSettings.delay_between_nodes;
  if ('timeout_per_node' in importedSettings) mappedSettings.timeout_per_node = importedSettings.timeout_per_node;
  if ('retry_on_error' in importedSettings) mappedSettings.retry_on_error = importedSettings.retry_on_error;
  if ('stop_on_error' in importedSettings) mappedSettings.stop_on_error = importedSettings.stop_on_error;

  const workflow = {
    wf_id: 'wf_' + Date.now(),
    wf_name: importData.workflow.name,
    wf_description: importData.workflow.description || '',
    ...mappedSettings,
  };
  return { workflow, nodes: convertedNodes, edges: convertedEdges };
}

// ============================================================================
// Tests
// ============================================================================

let passed = 0; let failed = 0;
const test = (name, fn) => {
  try { fn(); console.log(`  PASS  ${name}`); passed++; }
  catch (e) { console.error(`  FAIL  ${name}\n        ${e.message}`); failed++; }
};

console.log('\n=== Test 1: Round-trip với workflow đa node ===');

const sampleNodes = [
  // Generate node với full data + Smart Clone (ref_file_ids='')
  {
    node_id: 'gen_1', node_type: 'generate', node_name: 'Tạo ảnh',
    pos_x: 100, pos_y: 200, enabled: true,
    prompt: 'A cat', media_type: 'Image', model: 'Nano Banana Pro',
    ratio: '9:16', quantity: 2, auto_download: true, download_resolution: '2k',
    ref_file_ids: '',
    ref_thumbnails: { 'tile_old_1': 'https://cdn.example/img1.png', 'tile_old_2': 'https://cdn.example/img2.png' },
    ref_file_names: { 'tile_old_1': 'uuid-1111', 'tile_old_2': 'uuid-2222' },
    provider: 'flow',
  },
  // ChatGPT image node
  {
    node_id: 'cg_1', node_type: 'chatgpt', node_name: 'ChatGPT',
    pos_x: 500, pos_y: 200, enabled: true,
    prompt: 'A dog', ratio: 'square', provider: 'chatgpt',
    use_fallback_prefix: 'auto', timeout_ms: 120000, max_ref_images: 4,
    ref_file_ids: 'tile_x_1, tile_x_2',
    ref_thumbnails: { 'tile_x_1': 'https://cdn.example/dog1.png' },
    ref_file_names: { 'tile_x_1': 'uuid-dog' },
  },
  // Grok video node — có result_provider_urls (bridge xong)
  {
    node_id: 'grok_1', node_type: 'grok', node_name: 'Grok Video',
    pos_x: 900, pos_y: 200, enabled: true,
    prompt: 'A car', ratio: 'widescreen', provider: 'grok',
    grok_mode: 'video', grok_duration: '6s', grok_resolution: '720p',
    timeout_ms: 180000,
    result_file_ids: 'flow_tile_aaa',
    result_thumbnails: { 'flow_tile_aaa': { thumbnail: 'https://labs.google/.../result.mp4', type: 'video', file_name: 'uuid-grok-result' } },
    result_provider_urls: {
      'flow_tile_aaa': {
        url: 'https://assets.grok.com/users/abc/generations/xyz.mp4',
        provider: 'grok',
        media_type: 'video',
        tab_id: 99,
        captured_at: 1714430000000,
      },
    },
  },
  // Prompt node enhance
  {
    node_id: 'p_1', node_type: 'prompt', node_name: 'Enhance',
    pos_x: 100, pos_y: 500, enabled: true,
    prompt: 'Cute cat playing', enhance: true, provider: 'chatgpt', timeout_sec: 60,
  },
  // Telegram node
  {
    node_id: 'tg_1', node_type: 'telegram', node_name: 'Send',
    pos_x: 500, pos_y: 500, enabled: false,
    telegram_chat_id: '123456', telegram_send_mode: 'group', telegram_message: 'Hi',
  },
  // Note node
  {
    node_id: 'note_1', node_type: 'note', node_name: 'Note',
    pos_x: 900, pos_y: 500, enabled: true,
    note_text: 'Đây là ghi chú quan trọng',
  },
  // Image source node
  {
    node_id: 'img_1', node_type: 'image', node_name: 'Source',
    pos_x: 500, pos_y: 800, enabled: true,
    ref_file_ids: 'tile_src_1',
    ref_thumbnails: { 'tile_src_1': 'https://cdn/src.png' },
    ref_file_names: { 'tile_src_1': 'uuid-src' },
  },
];

const sampleEdges = [
  { edge_id: 'e1', source_node_id: 'gen_1', source_handle: 'output_1', source_port: 'media',
    target_node_id: 'cg_1', target_handle: 'input_1', target_port: 'image_ref', data_type: 'image' },
  { edge_id: 'e2', source_node_id: 'p_1', source_handle: 'output_1', source_port: 'text',
    target_node_id: 'gen_1', target_handle: 'input_2', target_port: 'text', data_type: 'text' },
  { edge_id: 'e3', source_node_id: 'img_1', source_handle: 'output_1', source_port: 'media',
    target_node_id: 'gen_1', target_handle: 'input_1', target_port: 'image_ref', data_type: 'image' },
];

const sampleWorkflow = {
  wf_name: 'Test Workflow', description: 'demo',
  parallel_execution: false, quantity: 3, delay_between_nodes: 5,
  timeout_per_node: 90, retry_on_error: 2, stop_on_error: false,
};

const exported = buildExportData(sampleWorkflow, sampleNodes, sampleEdges);
const validation = validateImportData(exported);
const imported = saveImportedWorkflow(exported);

test('export có version=1.0 + type=workflow', () => {
  assert.equal(exported.version, '1.0');
  assert.equal(exported.type, 'workflow');
});

test('export 7 nodes', () => assert.equal(exported.workflow.nodes.length, 7));

test('export edges có source_port + target_port', () => {
  exported.workflow.edges.forEach(e => {
    assert.ok('source_port' in e, 'source_port missing');
    assert.ok('target_port' in e, 'target_port missing');
  });
  assert.equal(exported.workflow.edges[0].source_port, 'media');
  assert.equal(exported.workflow.edges[0].target_port, 'image_ref');
});

test('Smart Clone (ref_file_ids="") giữ ref_images với 2 entries', () => {
  const gen = exported.workflow.nodes.find(n => n.node_id === 'gen_1');
  assert.ok(gen.ref_images, 'ref_images missing for Smart Clone');
  assert.equal(gen.ref_images.length, 2);
  assert.equal(gen.ref_images[0].thumbnail, 'https://cdn.example/img1.png');
  assert.equal(gen.ref_images[0].file_name, 'uuid-1111');
});

test('note_text export đúng field name (không phải "note")', () => {
  const note = exported.workflow.nodes.find(n => n.node_id === 'note_1');
  assert.equal(note.note_text, 'Đây là ghi chú quan trọng');
  assert.ok(!('note' in note), 'wrong field "note" leaked');
});

test('provider field export cho Grok/ChatGPT/Prompt nodes', () => {
  const grok = exported.workflow.nodes.find(n => n.node_id === 'grok_1');
  const cg = exported.workflow.nodes.find(n => n.node_id === 'cg_1');
  const pn = exported.workflow.nodes.find(n => n.node_id === 'p_1');
  assert.equal(grok.provider, 'grok');
  assert.equal(cg.provider, 'chatgpt');
  assert.equal(pn.provider, 'chatgpt');
});

test('Grok-specific fields export đầy đủ', () => {
  const grok = exported.workflow.nodes.find(n => n.node_id === 'grok_1');
  assert.equal(grok.grok_mode, 'video');
  assert.equal(grok.grok_duration, '6s');
  assert.equal(grok.grok_resolution, '720p');
});

test('ChatGPT use_fallback_prefix + timeout_ms + max_ref_images export', () => {
  const cg = exported.workflow.nodes.find(n => n.node_id === 'cg_1');
  assert.equal(cg.use_fallback_prefix, 'auto');
  assert.equal(cg.timeout_ms, 120000);
  assert.equal(cg.max_ref_images, 4);
});

test('Prompt enhance + timeout_sec export', () => {
  const pn = exported.workflow.nodes.find(n => n.node_id === 'p_1');
  assert.equal(pn.enhance, true);
  assert.equal(pn.timeout_sec, 60);
});

test('Telegram fields chỉ export trên telegram node', () => {
  const tg = exported.workflow.nodes.find(n => n.node_id === 'tg_1');
  assert.equal(tg.telegram_chat_id, '123456');
  assert.equal(tg.telegram_send_mode, 'group');
  // Generate/image/note nodes KHÔNG có telegram fields
  const gen = exported.workflow.nodes.find(n => n.node_id === 'gen_1');
  const img = exported.workflow.nodes.find(n => n.node_id === 'img_1');
  const note = exported.workflow.nodes.find(n => n.node_id === 'note_1');
  assert.ok(!('telegram_chat_id' in gen), 'telegram leaked into gen');
  assert.ok(!('telegram_send_mode' in img), 'telegram_send_mode leaked into image');
  assert.ok(!('telegram_send_mode' in note), 'telegram_send_mode leaked into note');
});

test('enabled=false preserved cho telegram node', () => {
  const tg = exported.workflow.nodes.find(n => n.node_id === 'tg_1');
  assert.equal(tg.enabled, false);
});

test('validation pass cho exported data', () => {
  assert.ok(validation.valid, 'errors: ' + validation.errors.join(', '));
});

test('Settings parallel → parallel_execution mapped đúng khi import', () => {
  assert.equal(imported.workflow.parallel_execution, false);
  assert.equal(imported.workflow.quantity, 3);
  assert.equal(imported.workflow.delay_between_nodes, 5);
  assert.equal(imported.workflow.timeout_per_node, 90);
  assert.equal(imported.workflow.retry_on_error, 2);
  assert.equal(imported.workflow.stop_on_error, false);
});

test('Imported edges giữ source_port + target_port', () => {
  imported.edges.forEach(e => {
    assert.ok('source_port' in e);
    assert.ok('target_port' in e);
  });
  assert.equal(imported.edges[0].source_port, 'media');
  assert.equal(imported.edges[0].target_port, 'image_ref');
});

test('Imported Smart Clone node có ref_file_ids + ref_thumbnails + ref_file_names', () => {
  // Tìm node được map từ gen_1 (đã đổi node_id)
  const gen = imported.nodes.find(n => n.node_type === 'generate');
  assert.ok(gen.ref_file_ids, 'ref_file_ids empty');
  const refIds = gen.ref_file_ids.split(',').map(s => s.trim()).filter(Boolean);
  assert.equal(refIds.length, 2);
  refIds.forEach(id => {
    assert.ok(id.startsWith('upload_import_'), `expected upload_import_ prefix, got ${id}`);
    assert.ok(gen.ref_thumbnails[id], `thumbnail missing for ${id}`);
    assert.ok(gen.ref_file_names[id], `file_name missing for ${id}`);
  });
});

test('Imported note node có note_text restored', () => {
  const note = imported.nodes.find(n => n.node_type === 'note');
  assert.equal(note.note_text, 'Đây là ghi chú quan trọng');
});

test('Grok node export giữ result_provider_urls (URL gốc + provider + tab_id)', () => {
  const grok = exported.workflow.nodes.find(n => n.node_id === 'grok_1');
  assert.ok(grok.result_provider_urls, 'result_provider_urls missing in export');
  const entry = grok.result_provider_urls['flow_tile_aaa'];
  assert.ok(entry, 'tile entry missing');
  assert.equal(entry.url, 'https://assets.grok.com/users/abc/generations/xyz.mp4');
  assert.equal(entry.provider, 'grok');
  assert.equal(entry.media_type, 'video');
  assert.equal(entry.tab_id, 99);
});

test('Imported Grok node giữ result_provider_urls (round-trip persist)', () => {
  const grok = imported.nodes.find(n => n.node_type === 'grok');
  assert.ok(grok.result_provider_urls, 'result_provider_urls missing after import');
  const entry = grok.result_provider_urls['flow_tile_aaa'];
  assert.ok(entry?.url?.includes('assets.grok.com'));
  assert.equal(entry?.provider, 'grok');
});

test('Non-grok/non-chatgpt nodes KHÔNG có result_provider_urls leak', () => {
  // Chỉ Grok node trong sample có result_provider_urls. Các node khác không có.
  const nonProviderNodes = exported.workflow.nodes.filter(n =>
    n.node_id !== 'grok_1' && n.node_id !== 'cg_1'
  );
  nonProviderNodes.forEach(n => {
    assert.ok(!('result_provider_urls' in n), `${n.node_type}/${n.node_id}: result_provider_urls leaked`);
  });
});

console.log('\n=== Test 2: Edge orphan validation ===');

test('Orphan source edge bị reject', () => {
  const bad = {
    version: '1.0', type: 'workflow',
    workflow: {
      name: 'Bad', nodes: [{ node_id: 'a', node_type: 'generate' }],
      edges: [{ source_node_id: 'GHOST', target_node_id: 'a', source_handle: 'output_1', target_handle: 'input_1' }],
    }
  };
  const v = validateImportData(bad);
  assert.ok(!v.valid);
  assert.ok(v.errors.some(e => e.includes('orphan source')), 'expected orphan source error');
});

test('Orphan target edge bị reject', () => {
  const bad = {
    version: '1.0', type: 'workflow',
    workflow: {
      name: 'Bad', nodes: [{ node_id: 'a', node_type: 'generate' }],
      edges: [{ source_node_id: 'a', target_node_id: 'GHOST', source_handle: 'output_1', target_handle: 'input_1' }],
    }
  };
  const v = validateImportData(bad);
  assert.ok(!v.valid);
  assert.ok(v.errors.some(e => e.includes('orphan target')), 'expected orphan target error');
});

console.log('\n=== Test 3: Backward-compat — file legacy không có port info ===');

const legacyExport = {
  version: '1.0', type: 'workflow',
  workflow: {
    name: 'Legacy', settings: { parallel: true },
    nodes: [
      { node_id: 'a', node_type: 'generate', node_name: 'A', pos_x: 0, pos_y: 0 },
      { node_id: 'b', node_type: 'generate', node_name: 'B', pos_x: 200, pos_y: 0 },
    ],
    edges: [
      { edge_id: 'le', source_node_id: 'a', source_handle: 'output_1', target_node_id: 'b', target_handle: 'input_1', data_type: 'image' },
    ],
  },
};

test('Legacy file (no port info) validate pass + import OK', () => {
  const v = validateImportData(legacyExport);
  assert.ok(v.valid, 'errors: ' + v.errors.join(', '));
  const r = saveImportedWorkflow(legacyExport);
  assert.equal(r.edges.length, 1);
  assert.equal(r.edges[0].source_port, null); // null fallback
  assert.equal(r.edges[0].target_port, null);
});

console.log('\n=== Test 4: Real-world files ===');

const userFiles = [
  { name: 'Mỹ Phẩm QC', path: '../docs/data/screenshot/wl/workflow_Mỹ_Phẩm_QC_copy_20260429_192359.json' },
  { name: 'WL - Grok to Flow (pre-fix)', path: '../docs/data/screenshot/wl/workflow_WL_-_Grok_to_Flow_20260429_211329.json' },
  { name: 'WL - Grok to Flow (post-fix)', path: '../docs/data/screenshot/wl/workflow_WL_-_Grok_to_Flow_20260429_211927.json', verifyClean: true },
];

for (const uf of userFiles) {
  let parsed = null;
  try { parsed = JSON.parse(readFileSync(resolve(PROJECT_ROOT, uf.path), 'utf8')); } catch (e) {}
  if (!parsed) { console.log(`  SKIP  ${uf.name} (file not found)`); continue; }

  test(`[${uf.name}] parse + validate pass`, () => {
    const v = validateImportData(parsed);
    assert.ok(v.valid, 'errors: ' + v.errors.join(', '));
  });
  test(`[${uf.name}] import → nodes + edges count match`, () => {
    const r = saveImportedWorkflow(parsed);
    assert.equal(r.nodes.length, parsed.workflow.nodes.length);
    assert.equal(r.edges.length, parsed.workflow.edges.length);
  });
  test(`[${uf.name}] settings.parallel mapped → parallel_execution`, () => {
    const r = saveImportedWorkflow(parsed);
    assert.equal(r.workflow.parallel_execution, parsed.workflow.settings.parallel);
  });

  // verifyClean: file post-fix phải KHÔNG có field leak trên non-generate nodes
  if (uf.verifyClean) {
    test(`[${uf.name}] non-generate nodes KHÔNG có media_type/model/multi_prompt rò rỉ`, () => {
      parsed.workflow.nodes.forEach(n => {
        if (n.node_type === 'generate') return;
        assert.ok(!('media_type' in n), `${n.node_type}/${n.node_id}: media_type leaked`);
        assert.ok(!('model' in n), `${n.node_type}/${n.node_id}: model leaked`);
        assert.ok(!('multi_prompt' in n), `${n.node_type}/${n.node_id}: multi_prompt leaked`);
      });
    });
    test(`[${uf.name}] image/note KHÔNG có ratio/quantity, prompt KHÔNG có ratio`, () => {
      parsed.workflow.nodes.forEach(n => {
        if (n.node_type === 'image' || n.node_type === 'note' || n.node_type === 'prompt') {
          assert.ok(!('ratio' in n), `${n.node_type}/${n.node_id}: ratio leaked`);
        }
        if (n.node_type === 'image' || n.node_type === 'note' || n.node_type === 'prompt') {
          assert.ok(!('quantity' in n), `${n.node_type}/${n.node_id}: quantity leaked`);
        }
      });
    });
    test(`[${uf.name}] enhance chỉ trên prompt nodes`, () => {
      parsed.workflow.nodes.forEach(n => {
        if (n.node_type !== 'prompt') {
          assert.ok(!('enhance' in n), `${n.node_type}/${n.node_id}: enhance leaked`);
        }
      });
    });
    test(`[${uf.name}] tất cả edges có source_port + target_port`, () => {
      parsed.workflow.edges.forEach(e => {
        assert.ok(e.source_port, `edge ${e.edge_id}: source_port missing`);
        assert.ok(e.target_port, `edge ${e.edge_id}: target_port missing`);
      });
    });
    test(`[${uf.name}] Generate node giữ đầy đủ media_type/model/ratio/quantity`, () => {
      const gen = parsed.workflow.nodes.find(n => n.node_type === 'generate');
      assert.ok(gen, 'no generate node');
      assert.equal(gen.media_type, 'Image');
      assert.equal(gen.model, 'Nano Banana Pro');
      assert.ok(gen.ratio, 'ratio missing');
      assert.ok(gen.quantity, 'quantity missing');
    });
    test(`[${uf.name}] Grok node giữ ratio + ref_images, KHÔNG leak media_type/model`, () => {
      const grok = parsed.workflow.nodes.find(n => n.node_type === 'grok');
      assert.ok(grok, 'no grok node');
      assert.equal(grok.ratio, 'story');
      assert.ok(grok.ref_images?.length >= 1, 'ref_images missing');
      assert.ok(!('media_type' in grok), 'media_type leaked');
      assert.ok(!('model' in grok), 'model leaked');
    });
  }
}

// Round-trip với Grok file: import → export lại → field leak phải sạch
const grokFile = (() => {
  try { return JSON.parse(readFileSync(resolve(PROJECT_ROOT, userFiles[1].path), 'utf8')); }
  catch { return null; }
})();

if (grokFile) {
  test('[Grok file] re-export sau import — node image KHÔNG leak media_type/model/quantity', () => {
    const r = saveImportedWorkflow(grokFile);
    const reExported = convertNodesToExport(r.nodes);
    const img = reExported.find(n => n.node_type === 'image');
    assert.ok(!('media_type' in img), 'media_type leaked');
    assert.ok(!('model' in img), 'model leaked');
    assert.ok(!('ratio' in img), 'ratio leaked');
    assert.ok(!('quantity' in img), 'quantity leaked');
  });
  test('[Grok file] re-export — prompt nodes KHÔNG có media_type/model/ratio/quantity/multi_prompt', () => {
    const r = saveImportedWorkflow(grokFile);
    const reExported = convertNodesToExport(r.nodes);
    const prompts = reExported.filter(n => n.node_type === 'prompt');
    assert.ok(prompts.length >= 1);
    prompts.forEach(p => {
      assert.ok(!('media_type' in p), 'media_type leaked into prompt');
      assert.ok(!('model' in p), 'model leaked into prompt');
      assert.ok(!('ratio' in p), 'ratio leaked into prompt');
      assert.ok(!('quantity' in p), 'quantity leaked into prompt');
      assert.ok(!('multi_prompt' in p), 'multi_prompt leaked into prompt');
    });
  });
  test('[Grok file] re-export — Grok node giữ ratio + ref_images', () => {
    const r = saveImportedWorkflow(grokFile);
    const reExported = convertNodesToExport(r.nodes);
    const grok = reExported.find(n => n.node_type === 'grok');
    assert.equal(grok.ratio, 'story');
    assert.ok(grok.ref_images?.length >= 1, 'ref_images missing');
    assert.ok(!('media_type' in grok), 'media_type leaked into grok');
    assert.ok(!('model' in grok), 'model leaked into grok');
  });
  test('[Grok file] re-export — Generate node giữ đầy đủ media_type/model/ratio/quantity', () => {
    const r = saveImportedWorkflow(grokFile);
    const reExported = convertNodesToExport(r.nodes);
    const gen = reExported.find(n => n.node_type === 'generate');
    assert.equal(gen.media_type, 'Image');
    assert.equal(gen.model, 'Nano Banana Pro');
    assert.equal(gen.ratio, '9:16');
    assert.equal(gen.quantity, 1);
    assert.equal(gen.auto_download, true);
    assert.equal(gen.download_resolution, '1k');
  });
  test('[Grok file] re-export — edges giữ source_port + target_port', () => {
    const r = saveImportedWorkflow(grokFile);
    r.edges.forEach(e => {
      assert.ok(e.source_port, 'source_port missing');
      assert.ok(e.target_port, 'target_port missing');
    });
  });
}

console.log('\n=== Test 5: Default-value leak (DiagramCanvas force defaults) ===');

// Simulate DiagramCanvas force defaults: TẤT CẢ node có media_type='Image', model='Nano Banana Pro',
// ratio='Ngang', quantity=1 dù node là image/grok/prompt/note. Verify _convertNodesToExport filter.
const leakSampleNodes = [
  // Grok node với defaults từ DiagramCanvas + grok-specific value
  {
    node_id: 'grok_l', node_type: 'grok', node_name: 'Grok',
    pos_x: 0, pos_y: 0, enabled: true,
    media_type: 'Image', model: 'Nano Banana Pro', ratio: 'story', quantity: 1,
    multi_prompt: false, enhance: false,
    grok_mode: 'image', provider: 'grok',
  },
  // Image source node với defaults rò rỉ (không nên có media_type/model/ratio/quantity)
  {
    node_id: 'img_l', node_type: 'image', node_name: 'Source',
    pos_x: 0, pos_y: 0, enabled: true,
    media_type: 'Image', model: 'Nano Banana Pro', ratio: 'Ngang', quantity: 1,
    multi_prompt: false, enhance: false,
    ref_file_ids: 'tile_x', ref_thumbnails: { 'tile_x': 'https://cdn/x.png' },
  },
  // Prompt node với defaults rò rỉ (chỉ giữ enhance + timeout_sec)
  {
    node_id: 'pmt_l', node_type: 'prompt', node_name: 'Prompt',
    pos_x: 0, pos_y: 0, enabled: true,
    media_type: 'Image', model: 'Nano Banana Pro', ratio: 'Ngang', quantity: 1,
    multi_prompt: false, enhance: false,
    prompt: 'Hello',
  },
  // Note node với defaults rò rỉ (chỉ giữ note_text)
  {
    node_id: 'note_l', node_type: 'note', node_name: 'Note',
    pos_x: 0, pos_y: 0, enabled: true,
    media_type: 'Image', model: 'Nano Banana Pro', ratio: 'Ngang', quantity: 1,
    multi_prompt: false, enhance: false,
    note_text: 'A note',
  },
  // Generate node — phải GIỮ media_type/model/ratio/quantity
  {
    node_id: 'gen_l', node_type: 'generate', node_name: 'Gen',
    pos_x: 0, pos_y: 0, enabled: true,
    media_type: 'Image', model: 'Nano Banana Pro', ratio: '9:16', quantity: 2,
    multi_prompt: false, enhance: false,
    prompt: 'A cat',
  },
];

const leakExported = convertNodesToExport(leakSampleNodes);

test('Grok node KHÔNG leak media_type/model/quantity, chỉ giữ ratio + grok_mode', () => {
  const grok = leakExported.find(n => n.node_id === 'grok_l');
  assert.ok(!('media_type' in grok), 'media_type leaked');
  assert.ok(!('model' in grok), 'model leaked');
  assert.ok('ratio' in grok, 'ratio missing');
  assert.equal(grok.ratio, 'story');
  assert.ok('quantity' in grok, 'quantity should export for grok');
  assert.equal(grok.grok_mode, 'image');
});

test('Image source node KHÔNG có media_type/model/ratio/quantity', () => {
  const img = leakExported.find(n => n.node_id === 'img_l');
  assert.ok(!('media_type' in img), 'media_type leaked into image');
  assert.ok(!('model' in img), 'model leaked into image');
  assert.ok(!('ratio' in img), 'ratio leaked into image');
  assert.ok(!('quantity' in img), 'quantity leaked into image');
  assert.ok(img.ref_images, 'ref_images preserved');
});

test('Prompt node KHÔNG có media_type/model/ratio/quantity', () => {
  const pmt = leakExported.find(n => n.node_id === 'pmt_l');
  assert.ok(!('media_type' in pmt), 'media_type leaked into prompt');
  assert.ok(!('model' in pmt), 'model leaked into prompt');
  assert.ok(!('ratio' in pmt), 'ratio leaked into prompt');
  assert.ok(!('quantity' in pmt), 'quantity leaked into prompt');
  assert.equal(pmt.prompt, 'Hello');
});

test('Note node chỉ có note_text, không leak default values', () => {
  const note = leakExported.find(n => n.node_id === 'note_l');
  assert.ok(!('media_type' in note), 'media_type leaked into note');
  assert.ok(!('model' in note), 'model leaked into note');
  assert.ok(!('ratio' in note), 'ratio leaked into note');
  assert.ok(!('quantity' in note), 'quantity leaked into note');
  assert.equal(note.note_text, 'A note');
});

test('enhance=false KHÔNG leak vào generate/grok/image/note (chỉ prompt giữ)', () => {
  const grok = leakExported.find(n => n.node_id === 'grok_l');
  const img = leakExported.find(n => n.node_id === 'img_l');
  const note = leakExported.find(n => n.node_id === 'note_l');
  const gen = leakExported.find(n => n.node_id === 'gen_l');
  assert.ok(!('enhance' in grok), 'enhance leaked into grok');
  assert.ok(!('enhance' in img), 'enhance leaked into image');
  assert.ok(!('enhance' in note), 'enhance leaked into note');
  assert.ok(!('enhance' in gen), 'enhance leaked into generate');
});

test('multi_prompt=false KHÔNG leak — chỉ export khi truthy ở generate/list', () => {
  leakExported.forEach(n => {
    assert.ok(!('multi_prompt' in n), `multi_prompt leaked into ${n.node_id}`);
  });
});

test('Generate node giữ đầy đủ media_type/model/ratio/quantity', () => {
  const gen = leakExported.find(n => n.node_id === 'gen_l');
  assert.equal(gen.media_type, 'Image');
  assert.equal(gen.model, 'Nano Banana Pro');
  assert.equal(gen.ratio, '9:16');
  assert.equal(gen.quantity, 2);
});

test('provider chỉ export trên AI nodes (chatgpt/grok/prompt), không leak generate', () => {
  const grok = leakExported.find(n => n.node_id === 'grok_l');
  const gen = leakExported.find(n => n.node_id === 'gen_l');
  assert.equal(grok.provider, 'grok');
  assert.ok(!('provider' in gen), 'provider leaked into generate');
});

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
