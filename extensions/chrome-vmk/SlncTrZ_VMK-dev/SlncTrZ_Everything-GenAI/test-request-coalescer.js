/**
 * Test script for RequestCoalescer
 * Run in browser console to test the implementation
 *
 * Test scenarios:
 * 1. Basic initialization
 * 2. Leader/follower detection
 * 3. Dedup cache
 * 4. Request delegation (requires multiple windows)
 */
(function() {
  'use strict';

  const tests = [];
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    tests.push({ name, fn });
  }

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  async function runTests() {
    console.log('=== RequestCoalescer Tests ===\n');

    for (const t of tests) {
      try {
        await t.fn();
        console.log('✓ ' + t.name);
        passed++;
      } catch (err) {
        console.error('✗ ' + t.name + ': ' + err.message);
        failed++;
      }
    }

    console.log('\n=== Results: ' + passed + ' passed, ' + failed + ' failed ===');
    return { passed, failed };
  }

  // Test 1: Basic initialization
  test('RequestCoalescer is defined', function() {
    assert(window.RequestCoalescer, 'RequestCoalescer should be defined');
  });

  // Test 2: Init method
  test('Init method exists', function() {
    assert(typeof window.RequestCoalescer.init === 'function', 'init should be a function');
  });

  // Test 3: Request method
  test('Request method exists', function() {
    assert(typeof window.RequestCoalescer.request === 'function', 'request should be a function');
  });

  // Test 4: Check initialization state
  test('Can check if initialized', function() {
    assert(typeof window.RequestCoalescer.isReady === 'function', 'isReady should be a function');
  });

  // Test 5: Leader detection
  test('Leader detection works', function() {
    const isLeader = window.RequestCoalescer.isLeader();
    const path = window.location.pathname;
    const expectedFollower = path.endsWith('workflow-editor.html') ||
                            path.endsWith('angles-editor.html') ||
                            path.endsWith('effects-editor.html') ||
                            path.endsWith('settings.html');
    assert(isLeader === !expectedFollower, 'Leader detection should match window type');
  });

  // Test 6: Dedup cache key generation
  test('Cache key generation', function() {
    const key = window.RequestCoalescer._getCacheKey('GET', 'tasks', null);
    assert(key === 'GET:tasks:', 'Cache key should be method:endpoint:data');

    const key2 = window.RequestCoalescer._getCacheKey('GET', 'tasks', { page: 1 });
    assert(key2.includes('"page":1'), 'Cache key should include data');
  });

  // Test 7: Skip coalescing for mutations
  test('Skip coalescing for POST/PUT/DELETE', async function() {
    // This test just checks that the code path doesn't error
    // Actual network call is mocked
    const originalApiCall = window.authManager?._apiCall;
    if (!originalApiCall) {
      console.log('  (skipped - authManager not available)');
      return;
    }

    let callCount = 0;
    window.authManager._apiCall = async function(method) {
      callCount++;
      return { test: true };
    };

    try {
      await window.RequestCoalescer.request('POST', 'test', { foo: 'bar' });
      assert(callCount === 1, 'POST should call API directly');
    } finally {
      window.authManager._apiCall = originalApiCall;
    }
  });

  // Test 8: Dedup within window
  test('Dedup same request within window', async function() {
    const originalApiCall = window.authManager?._apiCall;
    if (!originalApiCall) {
      console.log('  (skipped - authManager not available)');
      return;
    }

    let callCount = 0;
    window.authManager._apiCall = async function() {
      callCount++;
      await new Promise(r => setTimeout(r, 100));
      return { test: true };
    };

    try {
      // Make same request twice quickly
      const [r1, r2] = await Promise.all([
        window.RequestCoalescer.request('GET', 'test-dedup'),
        window.RequestCoalescer.request('GET', 'test-dedup')
      ]);
      assert(callCount === 1, 'Same request within window should only call API once');
      assert(r1 === r2, 'Both requests should return same result');
    } finally {
      window.authManager._apiCall = originalApiCall;
    }
  });

  // Export for console use
  window._testRequestCoalescer = runTests;

  console.log('RequestCoalescer test loaded. Run: _testRequestCoalescer()');
})();
