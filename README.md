# idkit-x

Zero-dependency ID generation for Node.js. 27 tests, 100% pass rate, nanoid, UUID v4/v7, ULID, Snowflake, and ObjectId — all in one zero-dependency package.

Every project needs IDs. Most pull in 3-5 separate libraries. idkit-x ships six production-ready ID generators in a single zero-dependency package.

## Installation

```bash
npm install idkit-x
```

## Quick Start

```ts
import { nanoid, uuidv4, uuidv7, ulid, Snowflake, objectId } from 'idkit-x';

// URL-safe compact IDs
nanoid();   // 'V1StGXR8_Z5jdHi6B-myT'

// Standard UUID v4
uuidv4();   // 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

// Time-ordered UUID v7 (sortable)
uuidv7();   // '017f22e2-79b0-7cc3-98c4-dc0c0c07398f'

// Lexicographically sortable ULID
ulid();     // '01ARZ3NDEKTSV4RRFFQ69G5FAV'

// Distributed Snowflake IDs
const snowflake = new Snowflake();
snowflake.generate();   // 1234567890123456n

// MongoDB-style ObjectId
objectId(); // '507f1f77bcf86cd799439011'
```

## Generators

| Function | Length | Sortable | Use case |
|----------|--------|----------|----------|
| `nanoid()` | 21 | No | URL-safe compact IDs |
| `uuidv4()` | 36 | No | Standard unique IDs |
| `uuidv7()` | 36 | Yes | Time-ordered UUIDs |
| `ulid()` | 26 | Yes | Lexicographically sortable |
| `Snowflake.generate()` | up to 19 | Yes | Distributed systems |
| `objectId()` | 24 | Partially | MongoDB-style IDs |

## Comparison

| Feature | idkit-x | nanoid | uuid | ulid | flake-idgen |
|---------|---------|--------|------|------|-------------|
| Zero dependencies | ✅ | ✅ | ❌ | ❌ | ❌ |
| 6 generators | ✅ | 1 | 1 | 1 | 1 |
| TypeScript support | ✅ | ✅ | ✅ | ✅ | ❌ |
| ESM support | ✅ | ✅ | ❌ | ❌ | ❌ |
| Bundle size | <5KB | 3KB | 3KB | 2KB | 2KB |
| Custom alphabet | ✅ | ✅ | ❌ | ❌ | ❌ |

## Real-World Examples

### 1. Multi-tenant SaaS with time-ordered IDs

```ts
import { uuidv7, isUuid } from 'idkit-x';

// Generate time-ordered UUIDs for efficient database indexing
const orderId = uuidv7();
console.log(orderId); // '017f22e2-79b0-7cc3-98c4-dc0c0c07398f'

// Validate UUIDs from external sources
const input = '017f22e2-79b0-7cc3-98c4-dc0c0c07398f';
if (isUuid(input)) {
  console.log(`Order ID is valid (v${uuidVersion(input)})`);
}
```

### 2. URL-friendly database keys

```ts
import { customAlphabet } from 'idkit-x';

// Generate 8-character hex keys for public URLs
const gen = customAlphabet('0123456789abcdef', 8);
const shortKey = gen();
console.log(`https://app.example.com/share/${shortKey}`);
// https://app.example.com/share/a3f5b2c9
```

### 3. Distributed job queue with Snowflake

```ts
import { Snowflake } from 'idkit-x';

// Configure for multi-region deployment
const snowflake = new Snowflake(
  1609459200000,  // custom epoch (2021-01-01)
  42,             // worker ID
  7,              // datacenter ID
);

const jobId = snowflake.generate();
const parsed = snowflake.parse(jobId);

console.log(`Job ID: ${jobId}`);
console.log(`Generated at: ${parsed.date.toISOString()}`);
console.log(`Worker: ${parsed.workerId}, Datacenter: ${parsed.datacenterId}`);
```

## API Reference

### nanoid(size?, alphabet?)

Compact URL-safe ID using the default 62-character alphabet.

```ts
nanoid(); // 'V1StGXR8_Z5jdHi6B-myT' (21 chars)
nanoid(10); // 'V1StGXR8_Z' (10 chars)
```

### customAlphabet(alphabet, size?)

Factory for generating IDs with a custom alphabet.

```ts
const gen = customAlphabet('0123456789ABCDEF', 10);
gen(); // 'A3F5B2C9D1'
```

### uuidv4()

RFC 4122 version 4 UUID with random bits.

```ts
uuidv4(); // 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
```

### uuidv7(timestamp?)

RFC 9562 version 7 UUID with embedded 48-bit timestamp. Sortable and time-ordered.

```ts
uuidv7(); // '017f22e2-79b0-7cc3-98c4-dc0c0c07398f'
uuidv7(Date.now() - 86400000); // '017f1e00-xxxx-7cc3-98c4-dc0c0c07398f' (yesterday)
```

### isUuid(value)

Validate if a string is a valid UUID (any version).

```ts
isUuid('f47ac10b-58cc-4372-a567-0e02b2c3d479'); // true
isUuid('not-a-uuid'); // false
```

### uuidVersion(value)

Extract the version number from a valid UUID.

```ts
uuidVersion('017f22e2-79b0-7cc3-98c4-dc0c0c07398f'); // 7
```

### ulid(timestamp?)

26-character Crockford Base32 ULID. Lexicographically sortable.

```ts
ulid(); // '01ARZ3NDEKTSV4RRFFQ69G5FAV'
```

### ulidTime(id)

Extract the Unix timestamp from a ULID.

```ts
const id = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
console.log(new Date(ulidTime(id))); // 2021-06-21T00:00:00.000Z
```

### isUlid(value)

Validate ULID format.

```ts
isUlid('01ARZ3NDEKTSV4RRFFQ69G5FAV'); // true
```

### monotonicUlid(timestamp?)

Guarantees strictly increasing ULIDs within the same millisecond.

```ts
const id1 = monotonicUlid(1624243200000);
const id2 = monotonicUlid(1624243200000);
console.log(id2 > id1); // true (even with same timestamp)
```

### Snowflake

Twitter-style 64-bit distributed ID generator with worker and datacenter support.

```ts
const sf = new Snowflake(epoch?, workerId?, datacenterId?);
const id = sf.generate();        // 1234567890123456n
const parts = sf.parse(id);      // { timestamp, workerId, datacenterId, sequence, date }
```

### objectId(timestamp?)

24-character hex MongoDB-style ObjectId.

```ts
objectId(); // '507f1f77bcf86cd799439011'
objectId(Date.now() / 1000); // '507f1f77bcf86cd799439011' (custom timestamp)
```

### objectIdTime(id)

Extract the timestamp from an ObjectId.

```ts
const id = '507f1f77bcf86cd799439011';
console.log(new Date(objectIdTime(id))); // 2012-10-17T20:46:47.000Z
```

### isObjectId(value)

Validate ObjectId format.

```ts
isObjectId('507f1f77bcf86cd799439011'); // true
isObjectId('not-an-objectid'); // false
```

## VERSION

Current version exported as constant:

```ts
import { VERSION } from 'idkit-x';
console.log(VERSION); // '1.1.0'
```

## License

MIT