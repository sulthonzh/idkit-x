/**
 * idkit-x — Zero-dependency ID generation library
 *
 * Generators: nanoid, UUID v4/v7, ULID, Snowflake, ObjectId
 */

// ─── Random Bytes ────────────────────────────────────────────

function random(size: number): Uint8Array {
  const buf = new Uint8Array(size);
  crypto.getRandomValues(buf);
  return buf;
}

// ─── NanoID ──────────────────────────────────────────────────

const URL_ALPHABET =
  'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';

export function nanoid(size = 21, alphabet = URL_ALPHABET): string {
  const bytes = random(size);
  let id = '';
  for (let i = 0; i < size; i++) {
    id += alphabet[bytes[i] % alphabet.length];
  }
  return id;
}

export function customAlphabet(alphabet: string, size = 21): () => string {
  return () => nanoid(size, alphabet);
}

// ─── UUID ─────────────────────────────────────────────────────

export function uuidv4(): string {
  const b = random(16);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  return hex(b);
}

export function uuidv7(timestamp: number = Date.now()): string {
  const b = random(16);
  b[0] = Math.floor(timestamp / 0x10000000000) & 0xff;
  b[1] = Math.floor(timestamp / 0x100000000) & 0xff;
  b[2] = (timestamp >>> 24) & 0xff;
  b[3] = (timestamp >>> 16) & 0xff;
  b[4] = (timestamp >>> 8) & 0xff;
  b[5] = timestamp & 0xff;
  b[6] = (b[6] & 0x0f) | 0x70;
  b[8] = (b[8] & 0x3f) | 0x80;
  return hex(b);
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function uuidVersion(value: string): number {
  if (!isUuid(value)) throw new TypeError('Invalid UUID');
  return Number.parseInt(value[14], 16);
}

function hex(b: Uint8Array): string {
  const h: string[] = [];
  for (let i = 0; i < 16; i++) h.push(b[i].toString(16).padStart(2, '0'));
  return `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`;
}

// ─── ULID ─────────────────────────────────────────────────────

const C32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function ulid(timestamp: number = Date.now()): string {
  return enc32Time(timestamp) + enc32Rand();
}

export function ulidTime(id: string): number {
  let t = 0;
  for (let i = 0; i < 10; i++) t = t * 32 + C32.indexOf(id[i]);
  return t;
}

export function isUlid(value: string): boolean {
  return /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/i.test(value);
}

let _monoTime = 0;
let _monoRand = '';

export function monotonicUlid(timestamp: number = Date.now()): string {
  if (timestamp <= _monoTime) {
    _monoRand = inc32(_monoRand);
  } else {
    _monoTime = timestamp;
    _monoRand = enc32Rand();
  }
  return enc32Time(timestamp) + _monoRand;
}

function enc32Time(ts: number): string {
  let n = BigInt(ts), s = '';
  for (let i = 0; i < 10; i++) {
    s = C32[Number(n & 31n)] + s;
    n >>= 5n;
  }
  return s;
}

function enc32Rand(): string {
  const bytes = random(10);
  let n = 0n;
  for (let i = 0; i < 10; i++) n = (n << 8n) | BigInt(bytes[i]);
  let s = '';
  for (let i = 0; i < 16; i++) {
    s = C32[Number(n & 31n)] + s;
    n >>= 5n;
  }
  return s;
}

function inc32(s: string): string {
  const c = s.split('');
  for (let i = 15; i >= 0; i--) {
    const idx = C32.indexOf(c[i]);
    if (idx < 31) { c[i] = C32[idx + 1]; return c.join(''); }
    c[i] = C32[0];
  }
  return c.join('');
}

// ─── Snowflake ────────────────────────────────────────────────

export class Snowflake {
  private readonly epoch: bigint;
  private readonly wid: bigint;
  private readonly did: bigint;
  private readonly maxWid: bigint;
  private readonly maxDid: bigint;
  private readonly widShift: bigint;
  private readonly didShift: bigint;
  private readonly tsShift: bigint;
  private readonly seqMask: bigint;
  private seq = 0n;
  private lastTs = -1n;

  constructor(
    epoch: number | bigint = 1288834974657,
    workerId: number | bigint = 1,
    datacenterId: number | bigint = 1,
  ) {
    this.epoch = BigInt(epoch);
    this.wid = BigInt(workerId);
    this.did = BigInt(datacenterId);

    const WID_BITS = 5n, DID_BITS = 5n, SEQ_BITS = 12n;
    this.maxWid = (1n << WID_BITS) - 1n;
    this.maxDid = (1n << DID_BITS) - 1n;
    this.widShift = SEQ_BITS;
    this.didShift = SEQ_BITS + WID_BITS;
    this.tsShift = SEQ_BITS + WID_BITS + DID_BITS;
    this.seqMask = (1n << SEQ_BITS) - 1n;

    if (this.wid < 0n || this.wid > this.maxWid)
      throw new RangeError(`workerId must be 0-${this.maxWid}`);
    if (this.did < 0n || this.did > this.maxDid)
      throw new RangeError(`datacenterId must be 0-${this.maxDid}`);
  }

  generate(): bigint {
    let ts = BigInt(Date.now()) - this.epoch;
    if (ts < this.lastTs) {
      throw new Error(`Clock moved backwards by ${this.lastTs - ts}ms`);
    }
    if (ts === this.lastTs) {
      this.seq = (this.seq + 1n) & this.seqMask;
      if (this.seq === 0n) {
        while (ts <= this.lastTs) ts = BigInt(Date.now()) - this.epoch;
      }
    } else {
      this.seq = 0n;
    }
    this.lastTs = ts;
    return (ts << this.tsShift)
      | (this.did << this.didShift)
      | (this.wid << this.widShift)
      | this.seq;
  }

  parse(id: bigint): {
    timestamp: bigint;
    datacenterId: bigint;
    workerId: bigint;
    sequence: bigint;
    date: Date;
  } {
    return {
      timestamp: (id >> this.tsShift) + this.epoch,
      datacenterId: (id >> this.didShift) & this.maxDid,
      workerId: (id >> this.widShift) & this.maxWid,
      sequence: id & this.seqMask,
      date: new Date(Number((id >> this.tsShift) + this.epoch)),
    };
  }
}

// ─── ObjectId ─────────────────────────────────────────────────

let oidCounter = Math.floor(Math.random() * 0xffffff);
const oidMachine = random(3);
const oidPid = random(2);

export function objectId(timestamp: number = Math.floor(Date.now() / 1000)): string {
  const c = oidCounter++ & 0xffffff;
  return [
    ((timestamp >>> 24) & 0xff),
    ((timestamp >>> 16) & 0xff),
    ((timestamp >>> 8) & 0xff),
    (timestamp & 0xff),
    oidMachine[0], oidMachine[1], oidMachine[2],
    oidPid[0], oidPid[1],
    ((c >> 16) & 0xff),
    ((c >> 8) & 0xff),
    (c & 0xff),
  ].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function objectIdTime(id: string): Date {
  return new Date(Number.parseInt(id.slice(0, 8), 16) * 1000);
}

export function isObjectId(value: string): boolean {
  return /^[0-9a-f]{24}$/i.test(value);
}
