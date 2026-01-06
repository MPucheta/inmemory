# In memory services

A library of common services and implementations for distributed systems, but in memory, for single deployment units.
Allows caching, pub/sub and message brokers to be implemented in memory, as pre-step to migrate to actual distributed services or as a way to decouple.

## Caching

A subset of operations intended to be like Redis. Mostly getting/setting and expiring

```ts
get('key'); // => returns stored key

get('unknown_key'); // => returns null

set('key', 'value'); // => sets <K,V> pair that won't expire

set('key', { obj1: { obj2: 'value' } }); // allows more types than string

set('key', 'value', 10); // set a <K,V> that will expire in 10 seconds

del('key'); // deletes stored key

del(['key', 'keys']); // deletes stored keys

exists('key'); // => 1 if key exists, 0 otherwise

exists(['key', 'key2', 'unknown_key']); //2,  => returns amount of keys that exist

expire('key', 10); // adds TTL to key, will expire in 10s

ttl('key'); // returns how much time until key expires in milliseconds

persist('key'); // removes TTL of key, it won't be deleted automatically

keys(); // returns all cache keys

size(); // returns number of cache keys

clear(); // clears cache
```
