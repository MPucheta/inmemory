import * as cache from './caching';

const MOCK_KEY = '1';
const MOCK_KEY_2 = '2';
let fetchValue = jest.fn(async () => Promise.resolve('async'));

describe('The caching utility', () => {
  beforeEach(() => {
    cache.clear(); // this is inmemory so making sure it does not break
    jest.useFakeTimers();
    fetchValue = jest.fn(async () => Promise.resolve('async'));
  });

  describe('for get and set', () => {
    it('string value', () => {
      cache.set(MOCK_KEY, 'test');
      expect(cache.get(MOCK_KEY)).toBe('test');
    });

    it('number values', () => {
      cache.set(MOCK_KEY, 1);
      expect(cache.get(MOCK_KEY)).toBe(1);
    });

    it('boolean values', () => {
      cache.set(MOCK_KEY, true);
      expect(cache.get(MOCK_KEY)).toBe(true);
    });

    it('object values', () => {
      cache.set(MOCK_KEY, { property: '1' });
      expect(cache.get(MOCK_KEY)).toEqual({ property: '1' });
    });

    it('nest object values', () => {
      const object = { firstlevel: { secondlevel: 'test ' } };
      cache.set(MOCK_KEY, object);
      expect(cache.get(MOCK_KEY)).toEqual(object);
    });

    it('classes values (and should be able to maintain prototype)', () => {
      class Test {
        method() {
          return 'test';
        }
      }
      cache.set(MOCK_KEY, new Test());
      const instance = cache.get(MOCK_KEY);

      expect(instance).toBeInstanceOf(Test);
      expect((instance as Test).method()).toBe('test');
    });

    it('should throw for null values', () => {
      expect(() => cache.set(MOCK_KEY, null)).toThrow(
        `Cannot set null or undefined as value for key ${MOCK_KEY}`
      );
    });

    it('should throw for undefined values', () => {
      expect(() => cache.set(MOCK_KEY, undefined)).toThrow(
        `Cannot set null or undefined as value for key ${MOCK_KEY}`
      );
    });

    it('should return null for non-existing key', () => {
      expect(cache.get(MOCK_KEY)).toBe(null);
    });

    it('should return previous value when getOrSet', async () => {
      cache.set(MOCK_KEY, 'test');

      expect(await cache.getOrSet(MOCK_KEY, fetchValue)).toBe('test');
      expect(fetchValue).not.toHaveBeenCalled();
    });

    it('should return new value when getOrSet', async () => {
      expect(await cache.getOrSet(MOCK_KEY, fetchValue)).toBe('async');
      expect(fetchValue).toHaveBeenCalled();
    });

    it('should return new value when getOrSet and never expire', async () => {
      await cache.getOrSet(MOCK_KEY, fetchValue);

      jest.runAllTimers();

      expect(cache.get(MOCK_KEY)).toBe('async');
      expect(fetchValue).toHaveBeenCalled();
    });

    it('should be able to be used as condition', async () => {
      expect(!!(await cache.getOrSet(MOCK_KEY, fetchValue))).toBeTruthy();
      expect(fetchValue).toHaveBeenCalled();
    });

    it('should return null when getOrSet expires', async () => {
      await cache.getOrSet(MOCK_KEY, fetchValue, 5);

      jest.advanceTimersByTime(6000);

      expect(cache.get(MOCK_KEY)).toBeNull();
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
    it('should be able to delete key', () => {
      cache.set(MOCK_KEY, 'test');

      expect(cache.get(MOCK_KEY)).toBe('test');

      cache.del(MOCK_KEY);

      expect(cache.get(MOCK_KEY)).toBe(null);
    });

    it('should be able to delete multiple keys', () => {
      cache.set('mock1', 'test');
      cache.set('mock2', 'test');
      cache.set('not to be deleted', 'test');

      expect(cache.get('mock1')).toBe('test');
      expect(cache.get('mock2')).toBe('test');

      const deletedAmount = cache.del(['mock1', 'mock2']);

      expect(cache.get('mock1')).toBe(null);
      expect(cache.get('mock2')).toBe(null);
      expect(deletedAmount).toBe(2);
    });
  });

  describe('for exists ', () => {
    it('should be able to check that a key exists', () => {
      cache.set(MOCK_KEY, 'test');

      expect(cache.exists(MOCK_KEY)).toBe(1);
    });

    it('should be able to check that multiple keys exists', () => {
      cache.set('mock1', 'test');
      cache.set('mock2', 'test');

      expect(cache.exists(['mock1', 'mock2'])).toBe(2);
    });
  });

  describe('for keys', () => {
    it('should return all keys if no pattern', () => {
      cache.set(MOCK_KEY, 'test');
      cache.set(MOCK_KEY_2, 'test');

      expect(cache.keys()).toEqual([MOCK_KEY, MOCK_KEY_2]);
    });

    // MISSING GLOB TESTS FOR PATTERNS
  });

  describe('for size', () => {
    it('should return correct sizes', () => {
      expect(cache.size()).toBe(0);

      cache.set(MOCK_KEY, 'test');

      expect(cache.size()).toBe(1);

      cache.del(MOCK_KEY);

      expect(cache.size()).toBe(0);

      cache.set(MOCK_KEY, 'test');
      cache.set(MOCK_KEY_2, 'test');

      expect(cache.size()).toBe(2);
    });
  });

  describe('for clear', () => {
    it('should empty cache', () => {
      cache.set(MOCK_KEY, 'test');

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.get(MOCK_KEY)).toBeNull();
    });
  });

  describe('for expiration management', () => {
    it('should delete entry after elapsed time', () => {
      cache.set(MOCK_KEY, 'test', 10000);

      expect(cache.get(MOCK_KEY)).toBe('test');

      jest.runAllTimers();

      expect(cache.get(MOCK_KEY)).toBeNull();
    });

    it('should still have entry after some time below TTL has passed', () => {
      cache.set(MOCK_KEY, 'test', 10);

      expect(cache.get(MOCK_KEY)).toBe('test');

      jest.advanceTimersByTime(2000);

      expect(cache.get(MOCK_KEY)).not.toBeNull();
    });

    it('should return false when persisting a non-ttl key', () => {
      cache.set(MOCK_KEY, 'test');

      expect(cache.persist(MOCK_KEY)).toBe(false);

      jest.runAllTimers();

      expect(cache.get(MOCK_KEY)).toBe('test');
    });

    it('should be able to setup a TTL, but then persist it', () => {
      cache.set(MOCK_KEY, 'test', 4);

      cache.persist(MOCK_KEY);

      jest.runAllTimers();

      expect(cache.get(MOCK_KEY)).toBe('test');
    });

    it('should be able to setup a key, and then expire', () => {
      cache.set(MOCK_KEY, 'test');

      cache.expire(MOCK_KEY, 5);

      jest.runAllTimers();

      expect(cache.get(MOCK_KEY)).toBeNull();
    });

    it('should be able to setup a ket with float ttl', () => {
      cache.set(MOCK_KEY, 'test', 5.5);

      jest.runAllTimers();

      expect(cache.get(MOCK_KEY)).toBeNull();
    });

    it('should return -2 for TTL if key does not exist', () => {
      expect(cache.ttl(MOCK_KEY)).toBe(-2);
    });

    it('should return -1 for TTL if key does not have expiration', () => {
      cache.set(MOCK_KEY, 'test');
      expect(cache.ttl(MOCK_KEY)).toBe(-1);
    });

    it('should return TTL if key has expiration', () => {
      cache.set(MOCK_KEY, 'test', 10);
      expect(cache.ttl(MOCK_KEY)).toBe(10);
    });

    it('should return correct TTL after some time has passed', () => {
      cache.set(MOCK_KEY, 'test', 10);

      jest.advanceTimersByTime(1000);

      expect(cache.ttl(MOCK_KEY)).toBe(9);
    });
  });

  describe('on internal utilities', () => {
    it('should properly arrayfy', () => {
      expect(cache.arrayfy(1)).toEqual([1]);
      expect(cache.arrayfy([1])).toEqual([1]);
    });

    it('should return a future expiration timestamp ', () => {
      expect(cache.getExpiration(4)).toBe(Date.now() + 4000);
    });

    it('should clear expiration and clear cache appropiately', () => {
      cache.set(MOCK_KEY, 'test'); // without TTL, so we force expiration with utility

      cache.scheduleExpiration(MOCK_KEY, 10);

      jest.runAllTimers();

      expect(cache.get(MOCK_KEY)).toBeNull();
    });
  });
});
