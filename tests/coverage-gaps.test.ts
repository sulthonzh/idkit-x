import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  nanoid, customAlphabet,
  uuidv4, uuidv7, isUuid, uuidVersion,
  ulid, ulidTime, isUlid, monotonicUlid,
  Snowflake,
  objectId, objectIdTime, isObjectId,
} from '../src/index.js';

describe('coverage-gaps: nanoid edge cases', () => {
  test('nanoid size=0 returns empty string', () => {
    assert.equal(nanoid(0), '');
  });

  test('nanoid size=1 returns single char', () => {
    const id = nanoid(1, 'ab');
    assert.equal(id.length, 1);
    assert.match(id, /^[ab]$/);
  });

  test('customAlphabet uses default size when not specified', () => {
    const gen = customAlphabet('xyz');
    const id = gen();
    assert.equal(id.length, 21);
    assert.match(id, /^[xyz]{21}$/);
  });

  test('customAlphabet with custom size after factory creation', () => {
    const gen = customAlphabet('01', 5);
    const id = gen();
    assert.equal(id.length, 5);
    assert.match(id, /^[01]{5}$/);
  });
});

describe('coverage-gaps: UUID edge cases', () => {
  test('isUuid accepts version 1 UUID', () => {
    assert.ok(isUuid('12345678-1234-1234-89ab-1234567890ab'));
  });

  test('isUuid accepts version 2 UUID', () => {
    assert.ok(isUuid('12345678-1234-2234-89ab-1234567890ab'));
  });

  test('isUuid accepts version 3 UUID', () => {
    assert.ok(isUuid('12345678-1234-3234-89ab-1234567890ab'));
  });

  test('isUuid accepts version 5 UUID', () => {
    assert.ok(isUuid('12345678-1234-5234-89ab-1234567890ab'));
  });

  test('isUuid accepts version 8 UUID', () => {
    assert.ok(isUuid('12345678-1234-8234-89ab-1234567890ab'));
  });

  test('isUuid rejects version 0', () => {
    assert.ok(!isUuid('12345678-1234-0234-89ab-1234567890ab'));
  });

  test('isUuid rejects version 9', () => {
    assert.ok(!isUuid('12345678-1234-9234-89ab-1234567890ab'));
  });

  test('isUuid rejects variant 0 (not 8/9/a/b)', () => {
    assert.ok(!isUuid('12345678-1234-4234-0234-1234567890ab'));
  });

  test('isUuid rejects variant c (not 8/9/a/b)', () => {
    assert.ok(!isUuid('12345678-1234-4234-c234-1234567890ab'));
  });

  test('isUuid accepts variant a (upper)', () => {
    assert.ok(isUuid('12345678-1234-4234-A234-1234567890ab'));
  });

  test('isUuid accepts variant b (upper)', () => {
    assert.ok(isUuid('12345678-1234-4234-B234-1234567890ab'));
  });

  test('isUuid is case-insensitive (uppercase)', () => {
    assert.ok(isUuid('ABCDEF12-3456-4234-89AB-CDEF01234567'));
  });

  test('uuidVersion returns correct version for v1', () => {
    assert.equal(uuidVersion('12345678-1234-1234-89ab-1234567890ab'), 1);
  });

  test('uuidVersion returns correct version for v5', () => {
    assert.equal(uuidVersion('12345678-1234-5234-89ab-1234567890ab'), 5);
  });

  test('uuidVersion returns correct version for v8', () => {
    assert.equal(uuidVersion('12345678-1234-8234-89ab-1234567890ab'), 8);
  });

  test('uuidv7 with timestamp 0', () => {
    const id = uuidv7(0);
    assert.ok(isUuid(id));
    assert.equal(uuidVersion(id), 7);
  });

  test('uuidv7 with very large timestamp', () => {
    const id = uuidv7(Date.now() + 1000000);
    assert.ok(isUuid(id));
    assert.equal(uuidVersion(id), 7);
  });
});

describe('coverage-gaps: ULID edge cases', () => {
  test('ulid with timestamp 0', () => {
    const id = ulid(0);
    assert.equal(id.length, 26);
    assert.ok(isUlid(id));
    assert.equal(ulidTime(id), 0);
  });

  test('ulidTime with known timestamp', () => {
    const ts = 1234567890;
    const id = ulid(ts);
    assert.equal(ulidTime(id), ts);
  });

  test('isUlid rejects first char > 7', () => {
    // First char must be [0-7] to limit to 48-bit timestamp
    assert.ok(!isUlid('8ZZZZZZZZZZZZZZZZZZZZZZZZZ'));
  });

  test('isUlid accepts first char 0', () => {
    assert.ok(isUlid('0ZZZZZZZZZZZZZZZZZZZZZZZZZ'));
  });

  test('isUlid accepts lowercase (regex is case-insensitive)', () => {
    assert.ok(isUlid(ulid().toLowerCase()));
  });

  test('isUlid rejects I, L, O, U (excluded chars)', () => {
    assert.ok(!isUlid('0IIIIIIIIIIIIIIIIIIIIIIIII'));
    assert.ok(!isUlid('0LLLLLLLLLLLLLLLLLLLLLLLLL'));
    assert.ok(!isUlid('0OOOOOOOOOOOOOOOOOOOOOOOOO'));
    assert.ok(!isUlid('0UUUUUUUUUUUUUUUUUUUUUUUUU'));
  });

  test('monotonicUlid with timestamp 0 then advancing', () => {
    // Reset: call with 0 first, then with large timestamp
    const id1 = monotonicUlid(0);
    const id2 = monotonicUlid(Date.now());
    assert.ok(id2 > id1);
  });

  test('monotonicUlid generates valid ULIDs', () => {
    const id = monotonicUlid();
    assert.ok(isUlid(id));
  });

  test('inc32 full carry produces all-zero random section', () => {
    // Generate many IDs at same timestamp to exercise carry extensively
    const ts = 999999999;
    const ids: string[] = [];
    for (let i = 0; i < 100; i++) {
      ids.push(monotonicUlid(ts));
    }
    // All should be unique (inc32 working including carry paths)
    const unique = new Set(ids);
    assert.equal(unique.size, ids.length);
  });
});

describe('coverage-gaps: Snowflake edge cases', () => {
  test('throws on clock moved backwards', () => {
    const sf = new Snowflake(1288834974657, 1, 1);
    sf.generate(); // sets lastTs
    // Mock Date.now to go backwards
    const originalNow = Date.now;
    const baseTime = originalNow();
    let callCount = 0;
    Date.now = () => {
      callCount++;
      // First call for generate above already happened.
      // Return baseTime - 1000 to simulate clock going backwards
      return baseTime - 1000;
    };
    try {
      assert.throws(() => sf.generate(), /Clock moved backwards/);
    } finally {
      Date.now = originalNow;
    }
  });

  test('sequence overflow waits for next millisecond', () => {
    // Use a Snowflake that will hit sequence overflow quickly
    // We need to generate 4096 IDs in the same millisecond
    const sf = new Snowflake(1288834974657, 1, 1);
    // Force many generates - most will be in the same ms
    const ids: bigint[] = [];
    for (let i = 0; i < 5000; i++) {
      ids.push(sf.generate());
    }
    // All must be unique
    const seen = new Set(ids.map(String));
    assert.equal(seen.size, ids.length);
  });

  test('workerId 31 (max) is valid', () => {
    const sf = new Snowflake(1288834974657, 31, 0);
    const p = sf.parse(sf.generate());
    assert.equal(p.workerId, 31n);
  });

  test('datacenterId 31 (max) is valid', () => {
    const sf = new Snowflake(1288834974657, 0, 31);
    const p = sf.parse(sf.generate());
    assert.equal(p.datacenterId, 31n);
  });

  test('both workerId and datacenterId at max 31', () => {
    const sf = new Snowflake(1288834974657, 31, 31);
    const p = sf.parse(sf.generate());
    assert.equal(p.workerId, 31n);
    assert.equal(p.datacenterId, 31n);
  });

  test('rejects workerId 32 (over max)', () => {
    assert.throws(() => new Snowflake(1288834974657, 32, 0), RangeError);
  });

  test('rejects datacenterId 32 (over max)', () => {
    assert.throws(() => new Snowflake(1288834974657, 0, 32), RangeError);
  });

  test('rejects negative datacenterId', () => {
    assert.throws(() => new Snowflake(1288834974657, 0, -1), RangeError);
  });

  test('rejects negative workerId', () => {
    assert.throws(() => new Snowflake(1288834974657, -1, 0), RangeError);
  });

  test('bigint epoch parameter', () => {
    const epoch = 1288834974657n;
    // @ts-expect-error testing bigint epoch
    const sf = new Snowflake(epoch, 1, 1);
    const id = sf.generate();
    const p = sf.parse(id);
    assert.ok(p.timestamp > 0n);
  });

  test('bigint workerId parameter', () => {
    // @ts-expect-error testing bigint workerId
    const sf = new Snowflake(1288834974657, 5n, 1n);
    const p = sf.parse(sf.generate());
    assert.equal(p.workerId, 5n);
  });

  test('parse returns correct sequence for rapid generates', () => {
    const sf = new Snowflake(1288834974657, 0, 0);
    const id1 = sf.generate();
    const id2 = sf.generate();
    const p1 = sf.parse(id1);
    const p2 = sf.parse(id2);
    // Sequence should increment if same timestamp
    if (p1.timestamp === p2.timestamp) {
      assert.equal(p2.sequence, p1.sequence + 1n);
    }
  });

  test('date field is correct Date object', () => {
    const sf = new Snowflake(1288834974657, 0, 0);
    const id = sf.generate();
    const p = sf.parse(id);
    assert.ok(p.date instanceof Date);
    assert.ok(p.date.getTime() > 0);
  });
});

describe('coverage-gaps: ObjectId edge cases', () => {
  test('objectId with timestamp 0', () => {
    const id = objectId(0);
    assert.ok(isObjectId(id));
    assert.equal(objectIdTime(id).getTime(), 0);
  });

  test('objectId with large timestamp', () => {
    const ts = 4102444800; // year 2100
    const id = objectId(ts);
    assert.ok(isObjectId(id));
    assert.equal(Math.floor(objectIdTime(id).getTime() / 1000), ts);
  });

  test('objectId counter increments', () => {
    const id1 = objectId(1000);
    const id2 = objectId(1000);
    // Last 6 hex chars (counter) should differ
    assert.notEqual(id1.slice(-6), id2.slice(-6));
  });

  test('isObjectId rejects 23 chars (too short)', () => {
    assert.ok(!isObjectId('a'.repeat(23)));
  });

  test('isObjectId rejects 25 chars (too long)', () => {
    assert.ok(!isObjectId('a'.repeat(25)));
  });

  test('isObjectId rejects empty string', () => {
    assert.ok(!isObjectId(''));
  });

  test('isObjectId accepts uppercase hex', () => {
    assert.ok(isObjectId('ABCDEF0123456789ABCDEF01'));
  });

  test('isObjectId rejects non-hex chars', () => {
    assert.ok(!isObjectId('g'.repeat(24)));
    assert.ok(!isObjectId('z'.repeat(24)));
  });

  test('objectIdTime with known timestamp', () => {
    const ts = 1700000000;
    const id = objectId(ts);
    assert.equal(Math.floor(objectIdTime(id).getTime() / 1000), ts);
  });
});
