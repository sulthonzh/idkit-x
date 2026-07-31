import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Snowflake } from '../src/index.js';

describe('coverage-gaps-2: Snowflake sequence overflow spin-wait', () => {
  test('sequence overflow spin-wait exits when time advances', () => {
    // Strategy: freeze Date.now for 4096+1 calls (initial reads in generate()),
    // then advance on subsequent calls (the spin-wait loop reads).
    // This covers lines 180-181: the while loop body that advances ts.
    const sf = new Snowflake(1288834974657, 1, 1);
    const fixedTime = 1700000000000;
    let dateCallCount = 0;
    const freezeFor = 4097; // freeze first 4097 calls (4096 generates + 1 initial read of 4097th)

    const originalNow = Date.now;
    Date.now = () => {
      dateCallCount++;
      if (dateCallCount > freezeFor) {
        return fixedTime + 10; // advance to break spin-wait
      }
      return fixedTime;
    };

    try {
      // Generate 4096 IDs at fixedTime (each calls Date.now() once at top of generate())
      for (let i = 0; i < 4096; i++) {
        sf.generate();
      }

      // 4097th call: Date.now() at top returns fixedTime (call #4097, still frozen).
      // ts === lastTs, seq wraps to 0, enters spin-wait.
      // Spin-wait calls Date.now() again (call #4098 > 4097 → returns fixedTime + 10).
      // ts advances, loop exits.
      const overflowId = sf.generate();
      const p = sf.parse(overflowId);
      assert.ok(p.sequence >= 0n);
      assert.ok(p.timestamp > 0n);
    } finally {
      Date.now = originalNow;
    }
  });
});
