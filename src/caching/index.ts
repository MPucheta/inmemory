import {
  get as getSync,
  set as setSync,
  del as delSync,
  exists as existsSync,
  expire as expireSync,
  ttl as ttlSync,
  persist as persistSync,
  keys as keysSync,
  size as sizeSync,
  clear as clearSync,
  getOrSet as getOrSetSync,
} from './caching';

import {
  get as getAsync,
  set as setAsync,
  del as delAsync,
  exists as existsAsync,
  expire as expireAsync,
  ttl as ttlAsync,
  persist as persistAsync,
  keys as keysAsync,
  size as sizeAsync,
  clear as clearAsync,
  getOrSet as getOrSetAsync,
} from './cachingAsync';

export const cache = {
  get: getSync,
  set: setSync,
  del: delSync,
  exists: existsSync,
  expire: expireSync,
  ttl: ttlSync,
  persist: persistSync,
  keys: keysSync,
  size: sizeSync,
  clear: clearSync,
  getOrSet: getOrSetSync,
};

export const cacheAsync = {
  get: getAsync,
  set: setAsync,
  del: delAsync,
  exists: existsAsync,
  expire: expireAsync,
  ttl: ttlAsync,
  persist: persistAsync,
  keys: keysAsync,
  size: sizeAsync,
  clear: clearAsync,
  getOrSet: getOrSetAsync,
};
