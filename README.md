# idkit-x

Zero-dependency ID generation for Node.js. Six generators, one tiny package.

## Why

Every project needs IDs. Most pull in 3-5 separate libraries. idkit-x ships nanoid, UUID v4/v7, ULID, Snowflake, and ObjectId in one zero-dependency package.

## Generators

| Function | Length | Sortable | Use case |
|----------|--------|----------|----------|
| `nanoid()` | 21 | No | URL-safe compact IDs |
| `uuidv4()` | 36 | No | Standard unique IDs |
| `uuidv7()` | 36 | Yes | Time-ordered UUIDs |
| `ulid()` | 26 | Yes | Lexicographically sortable |
| `Snowflake.generate()` | up to 19 | Yes | Distributed systems |
| `objectId()` | 24 | Partially | MongoDB-style IDs |

## Install

```
npm install idkit-x
```

## Usage

```ts
import { nanoid, uuidv4, uuidv7, ulid, Snowflake, objectId } from 'idkit-x';

nanoid();   // 'V1StGXR8_Z5jdHi6B-myT'
uuidv4();   // 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
uuidv7();   // '017f22e2-79b0-7cc3-98c4-dc0c0c07398f'
ulid();     // '01ARZ3NDEKTSV4RRFFQ69G5FAV'
objectId(); // '507f1f77bcf86cd799439011'

const snowflake = new Snowflake();
snowflake.generate();   // 1234567890123456n

// Custom nanoid alphabet
import { customAlphabet } from 'idkit-x';
const gen = customAlphabet('0123456789ABCDEF', 10);
gen();  // 'A3F5B2C9D1'
```

## API

### nanoid(size?, alphabet?)
Compact URL-safe ID. Default size 21.

### customAlphabet(alphabet, size?)
Factory for IDs with custom alphabet and size.

### uuidv4()
RFC 4122 version 4 UUID.

### uuidv7(timestamp?)
RFC 9562 version 7 UUID with embedded 48-bit timestamp. Sortable.

### isUuid(value) / uuidVersion(value)
Validate UUIDs and extract version number.

### ulid(timestamp?)
26-character Crockford Base32 ULID. Lexicographically sortable.

### ulidTime(id)
Extract timestamp from ULID.

### isUlid(value)
Validate ULID format.

### monotonicUlid(timestamp?)
Guarantees strictly increasing IDs within the same millisecond.

### Snowflake
Twitter-style 64-bit distributed IDs.

```ts
const sf = new Snowflake(epoch?, workerId?, datacenterId?);
const id = sf.generate();        // bigint
const parts = sf.parse(id);      // { timestamp, workerId, datacenterId, sequence, date }
```

### objectId(timestamp?)
24-character hex MongoDB-style ObjectId.

### objectIdTime(id) / isObjectId(value)
Extract timestamp and validate ObjectIds.

## License

MIT
