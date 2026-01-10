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
import asyncify from '../utils/asyncify';

export const get = asyncify(getSync);
export const set = asyncify(setSync);
export const del = asyncify(delSync);
export const exists = asyncify(existsSync);
export const expire = asyncify(expireSync);
export const ttl = asyncify(ttlSync);
export const persist = asyncify(persistSync);
export const keys = asyncify(keysSync);
export const size = asyncify(sizeSync);
export const clear = asyncify(clearSync);
export const getOrSet = getOrSetSync; //already a promise
