import * as cache from './caching';

const MOCK_KEY = '1';
const MOCK_KEY_2 = '2';

describe('The caching utility', () => {
  beforeEach(() => {
    cache.clear(); // this is inmemory so making sure it does not break
    jest.useFakeTimers();
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

    it('returns null for non-existing key', () => {
      expect(cache.get(MOCK_KEY)).toBe(null);
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
