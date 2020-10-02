// @flow

import { NativeModules } from 'react-native';
import B64 from 'base64-js';
import { Buffer } from 'buffer';
import CryptoJS from 'crypto-js';
import { compose } from 'ramda';

export function uInt8ArrayToB64(array: Uint8Array) {
  const b = Buffer.from(array);
  return b.toString('base64');
}

export function b64ToUint8Array(str: string) {
  // B64.toByteArray might return a Uint8Array, an Array or an Object depending on the platform.
  // Wrap it in Object.values and new Uint8Array to make sure it's a Uint8Array.
  let arr = B64.toByteArray(str);
  if (arr.join) {
    return arr;
  }
  const plainArray = Object.values(arr);
  arr = new Uint8Array(arr);
  if (arr.join) {
    return arr;
  }
  return plainArray;
}

export function strToUint8Array(str: string) {
  return new Uint8Array(Buffer.from(str, 'ascii'));
}

export const objValues = (obj: Uint8Obj): Array<number> =>
  Object.values(obj).map(parseFloat);

export const objToUint8 = (obj: Uint8Obj) => new Uint8Array(objValues(obj));

export function b64ToUrlSafeB64(s: string) {
  const alts = {
    '/': '_',
    '+': '-',
    '=': '',
  };
  return s.replace(/[/+=]/g, (c) => alts[c]);
}

export function urlSafeB64ToB64(s) {
  const alts = {
    _: '/',
    '-': '+',
  };
  s = s.replace(/[-_]/g, (c) => alts[c]);
  while (s.length % 4) {
    s += '=';
  }
  return s;
}

export const objToB64 = compose(uInt8ArrayToB64, objToUint8);

export const hash = (data: string) => {
  const h = CryptoJS.SHA256(data);
  const b = h.toString(CryptoJS.enc.Base64);
  return b64ToUrlSafeB64(b);
};

export const safeHash = compose(b64ToUrlSafeB64, hash);

const { RNRandomBytes } = NativeModules;
export const randomKey = (size: number) =>
  new Promise((resolve, reject) => {
    RNRandomBytes.randomBytes(size, (err, bytes) => {
      err ? reject(err) : resolve(bytes);
    });
  });
