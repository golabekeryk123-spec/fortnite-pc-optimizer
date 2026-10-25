'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { diagnoseNetwork, summarizeReplies } = require('../electron/network.cjs');

test('RTT aggregation preserves missing replies and calculates jitter from successful samples', () => {
  assert.deepEqual(summarizeReplies('1.1.1.1', [10, null, 14, null, 12, 20]), {
    host: '1.1.1.1',
    sent: 6,
    received: 4,
    averageMs: 14,
    minMs: 10,
    maxMs: 20,
    jitterMs: 4.67,
  });
});

test('filtered ICMP never becomes successful zero-ms latency', () => {
  assert.deepEqual(summarizeReplies('192.168.1.1', [null, null, null, null, null, null]), {
    host: '192.168.1.1', sent: 6, received: 0,
    averageMs: null, minMs: null, maxMs: null, jitterMs: null,
  });
  assert.equal(summarizeReplies('192.168.1.1', [0, null, null, null, null, null]).averageMs, 0);
  assert.equal(summarizeReplies('192.168.1.1', [0, null, null, null, null, null]).jitterMs, null);
});

test('invalid, truncated or nonnumeric sample data fails rather than fabricating a result', () => {
  for (const replies of [[], [1, 2], 'invalid', [1, 2, 3, 4, 5, -1], [1, 2, 3, 4, 5, NaN], [1, 2, 3, 4, 5, '6']]) {
    assert.throws(() => summarizeReplies('1.1.1.1', replies), { code: 'NETWORK_RESPONSE_INVALID' });
  }
  assert.throws(() => summarizeReplies('example.com', [1, 2, 3, 4, 5, 6]), { code: 'NETWORK_RESPONSE_INVALID' });
});

test('Windows diagnostic aggregates separate gateway and Internet measurements', async () => {
  let calls = 0;
  const result = await diagnoseNetwork({
    platform: 'win32',
    runner: async (...args) => {
      calls++;
      assert.deepEqual(args, [], 'no renderer-controlled destination is passed to the runner');
      return {
        gateway: { host: '192.168.1.1', replies: [1, 2, 1, 2, 1, 2] },
        internet: { host: '1.1.1.1', replies: [12, 14, 16, 18, 20, 22] },
        measuredAt: '2026-10-25T12:00:00.000Z',
      };
    },
  });
  assert.equal(calls, 1);
  assert.equal(result.gateway.averageMs, 1.5);
  assert.equal(result.internet.averageMs, 17);
  assert.equal(result.internet.jitterMs, 2);
  assert.equal(result.measuredAt, '2026-10-25T12:00:00.000Z');
});

test('missing default gateway remains explicitly unavailable while Internet probes still count', async () => {
  const result = await diagnoseNetwork({
    platform: 'win32',
    runner: async () => ({
      gateway: null,
      internet: { host: '1.1.1.1', replies: [null, null, null, null, null, null] },
      measuredAt: '2026-10-25T12:00:00.000Z',
    }),
  });
  assert.equal(result.gateway, null);
  assert.equal(result.internet.sent, 6);
  assert.equal(result.internet.received, 0);
  assert.equal(result.internet.averageMs, null);
});

test('non-Windows calls never run system diagnostics', async () => {
  let called = false;
  await assert.rejects(diagnoseNetwork({ platform: 'linux', runner: async () => { called = true; } }), { code: 'WINDOWS_REQUIRED' });
  assert.equal(called, false);
});

test('unexpected destinations and malformed responses fail closed', async () => {
  const valid = {
    gateway: null,
    internet: { host: '1.1.1.1', replies: [1, 2, 3, 4, 5, 6] },
    measuredAt: '2026-10-25T12:00:00.000Z',
  };
  for (const raw of [null, {}, { ...valid, internet: { host: '8.8.8.8', replies: [1, 2, 3, 4, 5, 6] } }, { ...valid, measuredAt: 'invalid' }, { ...valid, gateway: { host: '0.0.0.0', replies: [1, 2, 3, 4, 5, 6] } }]) {
    await assert.rejects(diagnoseNetwork({ platform: 'win32', runner: async () => raw }), { code: 'NETWORK_RESPONSE_INVALID' });
  }
  await assert.rejects(diagnoseNetwork({ platform: 'win32', runner: async () => { throw new Error('probe unavailable'); } }), /probe unavailable/);
});
