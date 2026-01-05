type Key = string;
type Value = unknown;
type StoredValue = { value: Value; expiresAt?: number };
type Milliseconds = number;

const cache = new Map<Key, StoredValue>();
const expirationTimerMap = new Map<Key, NodeJS.Timeout>();

/**
 * get a Value given a Key
 * @param key key to get
 * @returns the value stored for key
 */
export function get(key: Key): Value {
  return cache.get(key)?.value || null;
}

/**
 * Sets a K,V pair, if given a TTL it will cleanup after that time is elapsed
 * @param key key to set
 * @param value value to set
 * @param ttl ttl in milliseconds to cleanup key
 */
export function set(key: Key, value: Value, ttl?: Milliseconds): void {
  if (value == null) {
    throw new Error(`Cannot set null or undefined as value for key ${key}`);
  }

  const storedValue: StoredValue = { value };

  if (ttl) storedValue.expiresAt = getExpiration(ttl);

  cache.set(key, storedValue);

  scheduleExpiration(key, ttl);
}

/**
 * Removes the specified keys. A key is ignored if it does not exist.
 * @param key key or keys to delete
 * @returns number of deleted keys
 */
export function del(key: Key | Key[]): number {
  key = arrayfy(key);

  let counter = 0;

  key.forEach((k) => cache.delete(k) && ++counter);

  return counter;
}

/**
 * Returns if key exists.
 * @param key key or keys to check existence
 * @returns number of existing keys
 */
export function exists(key: Key | Key[]): number {
  key = arrayfy(key);

  let counter = 0;

  key.forEach((k) => cache.has(k) && ++counter);

  return counter;
}

/**
 * Set a timeout on key. After the timeout has expired, the key will automatically be deleted
 * @param key key to expire
 * @param ttl time to expire in milliseconds
 */
export function expire(key: Key, ttl?: Milliseconds): void {
  const value = get(key);

  set(key, value, ttl);
}

/**
 * The command returns -2 if the key does not exist.
 * The command returns -1 if the key exists but has no associated expire.
 * @param key key to check TTL
 * @returns -1 if key exist but has no associated expire. -2 if key does not exist
 */
export function ttl(key: Key): number {
  const stored = cache.get(key);

  if (!stored) return -2;

  if (!stored.expiresAt) return -1;

  return stored.expiresAt - Date.now();
}

/**
 * Removes expiration for a particular key
 * @param key key to remove TTL
 * @returns False if key does not exist or does not have an associated timeout. True if timeout has been removed;
 */

export function persist(key: Key): boolean {
  const stored = cache.get(key);

  if (!stored?.expiresAt) return false;

  cache.set(key, { value: stored.value });

  clearTimeout(expirationTimerMap.get(key));

  expirationTimerMap.delete(key);

  return true;
}

/**
 * Returns all keys
 * @returns an array of keys
 */
export function keys(): Key[] {
  // pending using a glob pattern to match existing implementation
  // example when called with h*llo it will match keys: hallo, hello, hollo, etc
  return Array.from(cache.keys());
}

/**
 * @returns cache size number
 */
export function size(): number {
  return cache.size;
}

/**
 * clears the cache
 */
export function clear(): void {
  cache.clear();
}

/**
 * Internal use, makes arrays
 * @param value value to convert to array if not array
 * @returns Array
 */
export function arrayfy(value: unknown) {
  return Array.isArray(value) ? value : [value];
}

/**
 * Internal use given ttl sums the current time to that ttl to give future expiration in ms
 * @param ttl time left
 * @returns timestamp in the future to expire
 */
export function getExpiration(ttl: Milliseconds): Milliseconds {
  return Date.now() + ttl;
}

/**
 * Internal use, schedule expiration for entry
 * @param key key to expire in the future
 * @param ttl how long until expiration
 */
export function scheduleExpiration(key: Key, ttl: Milliseconds): void {
  if (ttl) {
    const timeout = setTimeout(() => {
      cache.delete(key);
      expirationTimerMap.delete(key); //mini-opt so we only schedule one task
    }, ttl);

    expirationTimerMap.set(key, timeout);
  }
}
