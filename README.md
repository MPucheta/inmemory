# In memory services

## Summary

A library that mimics services and tools for distributed systems, but in memory, for single deployment units.

As of now mimics Redis caching, as pre-step to migrate to the actual service or if only caching in memory with expiration is needed.

## Installing and using

`npm i in-memory-services`

```ts
import { cache } from 'in-memory-services';
```

## Caching

A subset of operations intended to be like Redis. Mostly getting/setting and expiring

```ts
get('key'); // => returns stored key

get('unknown_key'); // => returns null

set('key', 'value'); // => sets <K,V> pair that won't expire

set('key', { obj1: { obj2: 'value' } }); // allows more types than string

set('key', 'value', 10); // set a <K,V> that will expire in 10 seconds

set('key', null); // throws an error

set('key', 'value', -10); // throws an error (TTL negative)

getOrSet('key', function, 10); // tries to get key, if it fails, uses function to set that value and returns it

await getOrSet('key', promise, 10); // tries to get key, if it fails, uses promise to set that value and returns it

del('key'); // deletes stored key

del(['key', 'keys']); // deletes stored keys

exists('key'); // => 1 if key exists, 0 otherwise

exists(['key', 'key2', 'unknown_key']); //2 => returns amount of keys that exist

expire('key', 10); // adds TTL to key, will expire in 10s

ttl('key'); // returns how much time until key expires in seconds

persist('key'); // removes TTL of key, it won't be deleted automatically

keys(); // returns all cache keys

size(); // returns number of cache keys

clear(); // clears cache
```

### Example

```ts
>> cache.set('key', 'test', 10);
>> (void)
>> cache.get('key');
>> 'test'
>> cache.get('another-key');
>> null
>> cache.ttl('key');
>> 10 (or a bit less depending on time elapsed)
>> cache.persist('key')
>> (void)
>> cache.ttl('key')
>> -1
>> cache.del('key')
>> 1
>> cache.del('key')
>> 0
>> cache.get('key')
>> null
```

### Use case

```ts
import { cache } from 'in-memory-services';

let value = cache.get('KEY');

if (!value){
  value = await fetchValue(...);

  if (value) cache.set('KEY', value, 3600); // cache for an hour
}
```

### Use case using getOrSet

```ts
import { cache } from 'in-memory-services';

// tries to get a key, if it fails it uses the provided function to get the value and sets timers
// this can throw if provided function throws or rejects (if promise)
const fetchValue = () => 0;
let value = cache.getOrSet('KEY', fetchValue, 3600);

const fetchValuePromise = async () => {
  /* example: fetch call promise */
};
let value2 = cache.getOrSet('KEY2', fetchValuePromise, 3600);
```

### Async

All cache functions have a corresponding async version through `cacheAsync`.

`import { cacheAsync as cache } from 'in-memory-services`

Async is easier to migrate to other interfaces if needed (caches in distributed services work as Promises), but the functionality is the same since they are just wrappers.

```ts
await get('key');
await get('unknown_key');
await set('key', 'value', 10);
await getOrSet('key', function, 10);
await del('key');
.
.
.
```

## Roadmap (?)

- Caching ✓
- Message Broker X
- Queue X
