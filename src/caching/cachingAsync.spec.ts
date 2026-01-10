import * as cache from './cachingAsync';

const MOCK_KEY = '1';
const MOCK_KEY_2 = '2';
let fetchValue = jest.fn(async () => Promise.resolve('async'));

describe('The caching async utility', () => {
  beforeEach(async () => {
    await cache.clear(); // this is inmemory so making sure it does not break
    jest.useFakeTimers();
    fetchValue = jest.fn(async () => Promise.resolve('async'));
  });

  describe('for get and set', () => {
    it('string value', async () => {
      await cache.set(MOCK_KEY, 'test');
      await expect(cache.get(MOCK_KEY)).resolves.toBe('test');
    });

    it('number values', async () => {
      await cache.set(MOCK_KEY, 1);
      await expect(cache.get(MOCK_KEY)).resolves.toBe(1);
    });

    it('boolean values', async () => {
      await cache.set(MOCK_KEY, true);
      await expect(cache.get(MOCK_KEY)).resolves.toBe(true);
    });

    it('falsy values', async () => {
      await cache.set(MOCK_KEY, false);
      await expect(cache.get(MOCK_KEY)).resolves.toBe(false);

      await cache.set(MOCK_KEY, 0);
      await expect(cache.get(MOCK_KEY)).resolves.toBe(0);
    });

    it('object values', async () => {
      await cache.set(MOCK_KEY, { property: '1' });
      await expect(cache.get(MOCK_KEY)).resolves.toEqual({ property: '1' });
    });

    it('nest object values', async () => {
      const object = { firstlevel: { secondlevel: 'test ' } };
      await cache.set(MOCK_KEY, object);
      await expect(cache.get(MOCK_KEY)).resolves.toEqual(object);
    });

    it('classes values (and should be able to maintain prototype)', async () => {
      class Test {
        method() {
          return 'test';
        }
      }
      await cache.set(MOCK_KEY, new Test());

      const instance = await cache.get(MOCK_KEY);

      expect(instance).toBeInstanceOf(Test);
      expect((instance as Test).method()).toBe('test');
    });

    it('should throw for null values', async () => {
      await expect(cache.set(MOCK_KEY, null)).rejects.toThrow(
        `Cannot set null or undefined as value for key ${MOCK_KEY}`
      );
    });

    it('should throw for undefined values', async () => {
      await expect(cache.set(MOCK_KEY, undefined)).rejects.toThrow(
        `Cannot set null or undefined as value for key ${MOCK_KEY}`
      );
    });

    it('should return null for non-existing key', async () => {
      await expect(cache.get(MOCK_KEY)).resolves.toBe(null);
    });

    it('should return previous value when getOrSet', async () => {
      await cache.set(MOCK_KEY, 'test');

      await expect(cache.getOrSet(MOCK_KEY, fetchValue)).resolves.toBe('test');
      expect(fetchValue).not.toHaveBeenCalled();
    });

    it('should return new value when getOrSet', async () => {
      await expect(cache.getOrSet(MOCK_KEY, fetchValue)).resolves.toBe('async');
      expect(fetchValue).toHaveBeenCalled();
    });

    it('should return new value when getOrSet and never expire', async () => {
      await cache.getOrSet(MOCK_KEY, fetchValue);

      jest.runAllTimers();

      await expect(cache.get(MOCK_KEY)).resolves.toBe('async');
      expect(fetchValue).toHaveBeenCalled();
    });

    it('should be able to be used as condition', async () => {
      await expect(cache.getOrSet(MOCK_KEY, fetchValue)).resolves.toBeTruthy();
      expect(fetchValue).toHaveBeenCalled();
    });

    it('should return null when getOrSet expires', async () => {
      await cache.getOrSet(MOCK_KEY, fetchValue, 5);

      jest.advanceTimersByTime(6000);

      await expect(cache.get(MOCK_KEY)).resolves.toBeNull();
      expect(fetchValue).toHaveBeenCalled();
    });

    it('should throw error if fetch function throws', async () => {
      await expect(
        cache.getOrSet(
          MOCK_KEY,
          async () => {
            throw new Error('test error');
          },
          5
        )
      ).rejects.toThrow(
        `Failed to obtain value in getOrSet, original error: test error`
      );
    });

    it('should throw error if fetch function rejects', async () => {
      await expect(
        cache.getOrSet(
          MOCK_KEY,
          async () => {
            return Promise.reject('reject');
          },
          5
        )
      ).rejects.toThrow(
        `Failed to obtain value in getOrSet, original error: reject`
      );
    });

    it('should throw error if fetch function returns falsy', async () => {
      await expect(
        cache.getOrSet(
          MOCK_KEY,
          async () => {
            return null;
          },
          5
        )
      ).rejects.toThrow(`Cannot set null or undefined as value for key 1`);
    });
  });

  describe('for del', () => {
    it('should be able to delete key', async () => {
      await cache.set(MOCK_KEY, 'test');

      await expect(cache.get(MOCK_KEY)).resolves.toBe('test');

      await cache.del(MOCK_KEY);

      await expect(cache.get(MOCK_KEY)).resolves.toBe(null);
    });

    it('should be able to delete multiple keys', async () => {
      await cache.set('mock1', 'test');
      await cache.set('mock2', 'test');
      await cache.set('not to be deleted', 'test');

      await expect(cache.get('mock1')).resolves.toBe('test');
      await expect(cache.get('mock2')).resolves.toBe('test');

      const deletedAmount = await cache.del(['mock1', 'mock2']);

      await expect(cache.get('mock1')).resolves.toBe(null);
      await expect(cache.get('mock2')).resolves.toBe(null);

      expect(deletedAmount).toBe(2);
    });
  });

  describe('for exists ', () => {
    it('should be able to check that a key exists', async () => {
      await cache.set(MOCK_KEY, 'test');

      await expect(cache.exists(MOCK_KEY)).resolves.toBe(1);
    });

    it('should be able to check that multiple keys exists', async () => {
      await cache.set('mock1', 'test');
      await cache.set('mock2', 'test');

      await expect(cache.exists(['mock1', 'mock2'])).resolves.toBe(2);
    });
  });

  describe('for keys', () => {
    it('should return all keys if no pattern', async () => {
      await cache.set(MOCK_KEY, 'test');
      await cache.set(MOCK_KEY_2, 'test');

      await expect(cache.keys()).resolves.toEqual([MOCK_KEY, MOCK_KEY_2]);
    });

    // MISSING GLOB TESTS FOR PATTERNS
  });

  describe('for size', () => {
    it('should return correct sizes', async () => {
      await expect(cache.size()).resolves.toBe(0);

      await cache.set(MOCK_KEY, 'test');

      await expect(cache.size()).resolves.toBe(1);

      await cache.del(MOCK_KEY);

      await expect(cache.size()).resolves.toBe(0);

      await cache.set(MOCK_KEY, 'test');
      await cache.set(MOCK_KEY_2, 'test');

      await expect(cache.size()).resolves.toBe(2);
    });
  });

  describe('for clear', () => {
    it('should empty await cache', async () => {
      await cache.set(MOCK_KEY, 'test');

      await cache.clear();

      await expect(cache.size()).resolves.toBe(0);
      await expect(cache.get(MOCK_KEY)).resolves.toBeNull();
    });
  });

  describe('for expiration management', () => {
    it('should delete entry after elapsed time', async () => {
      await cache.set(MOCK_KEY, 'test', 10000);

      await expect(cache.get(MOCK_KEY)).resolves.toBe('test');

      jest.runAllTimers();

      await expect(cache.get(MOCK_KEY)).resolves.toBeNull();
    });

    it('should still have entry after some time below TTL has passed', async () => {
      await cache.set(MOCK_KEY, 'test', 10);

      await expect(cache.get(MOCK_KEY)).resolves.toBe('test');

      jest.advanceTimersByTime(2000);

      await expect(cache.get(MOCK_KEY)).resolves.not.toBeNull();
    });

    it('should return false when persisting a non-ttl key', async () => {
      await cache.set(MOCK_KEY, 'test');

      await expect(cache.persist(MOCK_KEY)).resolves.toBe(false);

      jest.runAllTimers();

      await expect(cache.get(MOCK_KEY)).resolves.toBe('test');
    });

    it('should be able to setup a TTL, but then persist it', async () => {
      await cache.set(MOCK_KEY, 'test', 4);

      await cache.persist(MOCK_KEY);

      jest.runAllTimers();

      await expect(cache.get(MOCK_KEY)).resolves.toBe('test');
    });

    it('should be able to setup a key, and then expire', async () => {
      await cache.set(MOCK_KEY, 'test');

      await cache.expire(MOCK_KEY, 5);

      jest.runAllTimers();

      await expect(cache.get(MOCK_KEY)).resolves.toBeNull();
    });

    it('should not fail when calling expire on non existing key', async () => {
      await expect(() => cache.expire('NON_KEY', 10)).resolves.not.toThrow();
    });

    it('should throw when calling expire with negative or zero ttl', async () => {
      await expect(() => cache.expire(MOCK_KEY, -1)).rejects.toThrow(
        `TTL must be positive got -1`
      );
      await expect(() => cache.expire(MOCK_KEY, 0)).rejects.toThrow(
        `TTL must be positive got 0`
      );
    });

    it('should be able to setup a ket with float ttl', async () => {
      await cache.set(MOCK_KEY, 'test', 5.5);

      jest.runAllTimers();

      await expect(cache.get(MOCK_KEY)).resolves.toBeNull();
    });

    it('should return -2 for TTL if key does not exist', async () => {
      await expect(cache.ttl(MOCK_KEY)).resolves.toBe(-2);
    });

    it('should return -1 for TTL if key does not have expiration', async () => {
      await cache.set(MOCK_KEY, 'test');
      await expect(cache.ttl(MOCK_KEY)).resolves.toBe(-1);
    });

    it('should return TTL if key has expiration', async () => {
      await cache.set(MOCK_KEY, 'test', 10);
      await expect(cache.ttl(MOCK_KEY)).resolves.toBe(10);
    });

    it('should return correct TTL after some time has passed', async () => {
      await cache.set(MOCK_KEY, 'test', 10);

      jest.advanceTimersByTime(1000);

      await expect(cache.ttl(MOCK_KEY)).resolves.toBe(9);
    });
  });
});
