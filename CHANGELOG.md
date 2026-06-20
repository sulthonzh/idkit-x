# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-06-21

### Added
- `VERSION` export constant for programmatic version access
- Real-world examples: Multi-tenant SaaS, URL-friendly keys, distributed job queue
- Comparison table vs nanoid, uuid, ulid, flake-idgen
- `engines` field (Node >=18)
- `files` field for npm package
- `prepublishOnly` script to ensure build on publish
- `test:core` script for core test suite
- `CHANGELOG.md` with full version history

### Changed
- Enhanced README with compelling hook showing test count
- Improved API documentation with detailed examples
- Added unique value proposition: 6 generators in zero-dependency package

### Verified
- 27/27 tests passing (100% pass rate)
- Zero TypeScript errors
- Zero TODO/FIXME comments

## [1.0.0] - 2026-06-16

### Added
- Initial release
- `nanoid()` - URL-safe compact ID generator
- `customAlphabet()` - Custom alphabet factory
- `uuidv4()` - RFC 4122 UUID v4
- `uuidv7()` - RFC 9562 UUID v7 (sortable)
- `isUuid()` / `uuidVersion()` - UUID validation
- `ulid()` - Crockford Base32 ULID
- `ulidTime()` / `isUlid()` - ULID utilities
- `monotonicUlid()` - Strictly increasing ULIDs
- `Snowflake` - Twitter-style distributed ID generator
- `objectId()` - MongoDB-style ObjectId
- `objectIdTime()` / `isObjectId()` - ObjectId utilities
- Zero dependencies
- TypeScript support
- Full test suite (27 tests)