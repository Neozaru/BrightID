// @flow
import { getGenericPassword } from 'react-native-keychain';
import store from '@/store';
import SInfo from 'react-native-sensitive-info';
import { objToB64, b64ToUint8Array } from './encoding';

const sharedPreferencesName = 'brightid_shared_preferences';
const keychainService = 'org.brightid.demo.SharedKeychain';

const uInt8SecretKey = (key) => {
  let secretKey = b64ToUint8Array(key);
  if (secretKey.length < 10) {
    throw new Error('secret key does not exist');
  }
  return secretKey;
};

export const obtainKeys = async () => {
  try {
    let id = await SInfo.getItem('brightid_id', {
      sharedPreferencesName,
      keychainService,
    });

    let b64SecretKey = await SInfo.getItem('brightid_secretkey', {
      sharedPreferencesName,
      keychainService,
    });

    // if stored in sensitive info, return immediately
    if (!id || !b64SecretKey) {
      id = store.getState().user.id;
      b64SecretKey = store.getState().user;

      if (id && b64SecretKey) {
        await saveSecretKey(id, b64SecretKey);
      } else {
        throw new Error('retrieve key from react-native-keychain');
      }
    }

    let secretKey = uInt8SecretKey(b64SecretKey);

    return { username: id, secretKey };
    // first check if secretKey is located in redux
  } catch (err) {
    let genericPassword = await getGenericPassword();
    if (!genericPassword) {
      throw new Error('secret key does not exist');
    }
    let { username, password } = genericPassword;

    let secretKey = uInt8SecretKey(password);
    await saveSecretKey(username, secretKey);

    return { username, secretKey };
  }
};

export const saveSecretKey = async (id: string, secretKey: UInt8Array) => {
  try {
    await SInfo.setItem('brightid_id', id, {
      sharedPreferencesName,
      keychainService,
    });

    if (typeof secretKey !== 'string') {
      secretKey = objToB64(secretKey);
    }

    await SInfo.setItem('brightid_secretkey', secretKey, {
      sharedPreferencesName,
      keychainService,
    });
  } catch (err) {
    console.error(err.message);
  }
};
