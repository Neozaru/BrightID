// @flow

import { Alert } from 'react-native';
import nacl from 'tweetnacl';
import { setUserData, setHashedId } from '@/actions';
import { createImageDirectory, saveImage } from '@/utils/filesystem';
import {
  b64ToUrlSafeB64,
  uInt8ArrayToB64,
  objToB64,
  urlSafeB64ToB64,
  strToUint8Array,
  b64ToUint8Array,
} from '@/utils/encoding';
import { saveSecretKey, obtainKeys } from '@/utils/keychain';

const testKeypairSigning = async () => {
  const message = 'test messsage';
  let { username, secretKey } = await obtainKeys();

  const signingKey = urlSafeB64ToB64(username);

  const sig = uInt8ArrayToB64(
    nacl.sign.detached(strToUint8Array(message), secretKey),
  );

  // copied from BrightID node operations

  if (
    !nacl.sign.detached.verify(
      strToUint8Array(message),
      b64ToUint8Array(sig),
      b64ToUint8Array(signingKey),
    )
  ) {
    throw new Error('invalid signature');
  }
};

export const handleBrightIdCreation = ({
  name,
  photo,
}: {
  name: string,
  photo: { uri: string },
}) => async (dispatch: dispatch) => {
  try {
    // create public / private key pair
    let { publicKey, secretKey } = await nacl.sign.keyPair();
    let b64PubKey = uInt8ArrayToB64(publicKey);
    let id = b64ToUrlSafeB64(b64PubKey);

    // save id / secretKey inside of keychain
    await saveSecretKey(id, secretKey);

    // this will throw if fails
    await testKeypairSigning();

    // creates Image Directory
    await createImageDirectory();
    let filename = await saveImage({ imageName: id, base64Image: photo.uri });

    const userData = {
      publicKey: b64PubKey,
      id,
      name,
      photo: { filename },
      secretKey: objToB64(secretKey),
    };

    // We have no createUser anymore
    // new user is created while making its first connection with a verified user
    // await api.createUser(id, b64PubKey);

    // // update redux store
    await dispatch(setUserData(userData));
    // to fix bug while testing
    dispatch(setHashedId(''));

    console.log('brightid creation success');

    // // navigate to home page
    return true;
  } catch (err) {
    await saveSecretKey('', []);
    console.error(err.message);
    Alert.alert(
      'Please try again',
      `There was an error generating your BrightID crypto keypair`,
    );
    throw err;
  }
};
