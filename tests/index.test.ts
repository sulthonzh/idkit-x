import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  nanoid, customAlphabet,
  uuidv4, uuidv7, isUuid, uuidVersion,
  ulid, ulidTime, isUlid, monotonicUlid,
  Snowflake,
  objectId, objectIdTime, isObjectId,
  VERSION,
} from '../src/index.js';

import pkg from '../package.json' with { type: 'json' };

describe('VERSION', () => {
  test('VERSION is valid semver', () => {
    assert.match(VERSION, /^\d+\.\d+\.\d+$/);
  });
  test('VERSION matches package.json', () => {
    assert.equal(VERSION, pkg.version);
  });
});

describe('nanoid', () => {
  test('default size is 21', () => {
    assert.equal(nanoid().length, 21);
  });
  test('custom size', () => {
    assert.equal(nanoid(8).length, 8);
    assert.equal(nanoid(36).length, 36);
  });
  test('custom alphabet', () => {
    const id = nanoid(100, '01');
    assert.match(id, /^[01]{100}$/);
  });
  test('10k unique IDs', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 10000; i++) seen.add(nanoid());
    assert.equal(seen.size, 10000);
  });
  test('customAlphabet factory', () => {
    const gen = customAlphabet('abcdef', 10);
    const id = gen();
    assert.equal(id.length, 10);
    assert.match(id, /^[abcdef]{10}$/);
  });
});

describe('uuid', () => {
  test('v4 format', () => {
    assert.match(uuidv4(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
  test('v4 uniqueness', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 10000; i++) seen.add(uuidv4());
    assert.equal(seen.size, 10000);
  });
  test('v7 format', () => {
    assert.match(uuidv7(), /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
  test('v7 is time-ordered', () => {
    assert.ok(uuidv7(1000000) < uuidv7(2000000));
  });
  test('isUuid', () => {
    assert.ok(isUuid(uuidv4()));
    assert.ok(isUuid(uuidv7()));
    assert.ok(!isUuid('nope'));
    assert.ok(!isUuid('12345678-1234-1234-1234-1234567890ab'));
  });
  test('uuidVersion', () => {
    assert.equal(uuidVersion(uuidv4()), 4);
    assert.equal(uuidVersion(uuidv7()), 7);
  });
  test('uuidVersion throws on invalid', () => {
    assert.throws(() => uuidVersion('bad'), TypeError);
  });
});

describe('ulid', () => {
  test('26 characters', () => {
    assert.equal(ulid().length, 26);
  });
  test('valid Crockford Base32', () => {
    assert.match(ulid(), /^[0-9A-HJKMNP-TV-Z]{26}$/);
  });
  test('sortable', () => {
    assert.ok(ulid(1000000) < ulid(2000000));
  });
  test('ulidTime recovers timestamp', () => {
    const ts = Date.now();
    assert.equal(ulidTime(ulid(ts)), ts);
  });
  test('isUlid', () => {
    assert.ok(isUlid(ulid()));
    assert.ok(!isUlid('bad'));
    assert.ok(!isUlid('UUUUUUUUUUUUUUUUUUUUUUUUUU'));
  });
  test('monotonicUlid is non-decreasing', () => {
    const now = Date.now();
    const ids: string[] = [];
    for (let i = 0; i < 100; i++) ids.push(monotonicUlid(now));
    for (let i = 1; i < ids.length; i++) {
      assert.ok(ids[i] >= ids[i - 1], `${ids[i]} < ${ids[i - 1]}`);
    }
  });
  test('monotonicUlid strictly increases within same ms', () => {
    const now = Date.now();
    assert.ok(monotonicUlid(now) < monotonicUlid(now));
  });
  test('monotonicUlid handles many IDs in same ms', () => {
    const now = Date.now();
    const ids: string[] = [];
    for (let i = 0; i < 5000; i++) ids.push(monotonicUlid(now));
    const unique = new Set(ids);
    assert.equal(unique.size, ids.length, 'all IDs should be unique');
    for (let i = 1; i < ids.length; i++) {
      assert.ok(ids[i] > ids[i - 1], `ID ${i} should be strictly greater: ${ids[i]} vs ${ids[i-1]}`);
    }
  });
  test('monotonicUlid accepts new timestamp after old ones', () => {
    const t1 = 1000000;
    const t2 = 2000000;
    monotonicUlid(t1);
    const id2 = monotonicUlid(t2);
    assert.ok(ulidTime(id2) === t2);
  });
});

describe('Snowflake', () => {
  test('1000 unique IDs', () => {
    const sf = new Snowflake();
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) seen.add(sf.generate().toString());
    assert.equal(seen.size, 1000);
  });
  test('parse recovers components', () => {
    const sf = new Snowflake(1288834974657, 7, 4);
    const p = sf.parse(sf.generate());
    assert.equal(p.workerId, 7n);
    assert.equal(p.datacenterId, 4n);
    assert.ok(p.timestamp > 0n);
    assert.ok(p.date instanceof Date);
  });
  test('IDs increase monotonically', () => {
    const sf = new Snowflake();
    assert.ok(sf.generate() < sf.generate());
  });
  test('rejects invalid worker/datacenter IDs', () => {
    assert.throws(() => new Snowflake(undefined, -1), RangeError);
    assert.throws(() => new Snowflake(undefined, 32), RangeError);
    assert.throws(() => new Snowflake(undefined, 0, 32), RangeError);
  });
  test('parse recovers sequence', () => {
    const sf = new Snowflake();
    const id1 = sf.generate();
    const p = sf.parse(id1);
    assert.ok(p.sequence >= 0n);
    assert.equal(typeof p.timestamp, 'bigint');
  });
  test('custom epoch produces correct timestamp', () => {
    const epoch = Date.now() - 10000;
    const sf = new Snowflake(epoch, 0, 0);
    const id = sf.generate();
    const p = sf.parse(id);
    assert.ok(p.timestamp >= 0n);
    assert.ok(p.date.getTime() >= epoch);
  });
  test('workerId and datacenterId 0 are valid', () => {
    const sf = new Snowflake(1288834974657, 0, 0);
    const p = sf.parse(sf.generate());
    assert.equal(p.workerId, 0n);
    assert.equal(p.datacenterId, 0n);
  });
});

describe('objectId', () => {
  test('24 hex characters', () => {
    assert.match(objectId(), /^[0-9a-f]{24}$/);
  });
  test('objectIdTime', () => {
    const ts = Math.floor(Date.now() / 1000);
    assert.equal(objectIdTime(objectId(ts)).getTime() / 1000, ts);
  });
  test('10k unique IDs', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 10000; i++) seen.add(objectId());
    assert.equal(seen.size, 10000);
  });
  test('isObjectId', () => {
    assert.ok(isObjectId(objectId()));
    assert.ok(!isObjectId('short'));
    assert.ok(!isObjectId('z'.repeat(24)));
  });
});
