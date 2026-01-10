# Changelog

## v0.0.8

### Added

- Async caching utilities. These are just wrappers but wanted to maintain separate sync and async.
  - Sync makes sense to cache normal object/internal schemas or so
  - Async is easier to migrate to other interface because the `Promise` make it similar to systems like Redis.
  - Functionality is the same, just that having Promises is different than functions;

### Fixed

- really man, bugs this early?
- memory leaks and edge cases regarding falsy values, ttl (0, negative), multiple calls for same key, expiration overriding

## v0.0.7

### Added

- Caching utilities: get, set, del, exists, expire, ttl, persist, keys, size, clear, getOrSet
