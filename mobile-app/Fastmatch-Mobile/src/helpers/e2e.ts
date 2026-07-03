import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import AsyncStorage from '@react-native-async-storage/async-storage';

const E2E_PRIVATE_KEY = 'e2e_private_key';
const E2E_PUBLIC_KEY = 'e2e_public_key';

export const generateE2EKeyPair = async () => {
  try {
    const keyPair = nacl.box.keyPair();
    const publicKeyBase64 = naclUtil.encodeBase64(keyPair.publicKey);
    const privateKeyBase64 = naclUtil.encodeBase64(keyPair.secretKey);
    
    await AsyncStorage.setItem(E2E_PRIVATE_KEY, privateKeyBase64);
    await AsyncStorage.setItem(E2E_PUBLIC_KEY, publicKeyBase64);

    return { publicKey: publicKeyBase64, privateKey: privateKeyBase64 };
  } catch (error) {
    console.error('Error generating E2E key pair:', error);
    return null;
  }
};

export const getE2EKeys = async () => {
  try {
    const publicKey = await AsyncStorage.getItem(E2E_PUBLIC_KEY);
    const privateKey = await AsyncStorage.getItem(E2E_PRIVATE_KEY);
    return { publicKey, privateKey };
  } catch (error) {
    console.error('Error getting E2E keys:', error);
    return { publicKey: null, privateKey: null };
  }
};

export const encryptMessage = (message: string, recipientPublicKeyBase64: string, senderPrivateKeyBase64: string) => {
  try {
    if (!recipientPublicKeyBase64 || !senderPrivateKeyBase64) return message;
    
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const messageUint8 = naclUtil.decodeUTF8(message);
    const recipientPublicKeyUint8 = naclUtil.decodeBase64(recipientPublicKeyBase64);
    const senderPrivateKeyUint8 = naclUtil.decodeBase64(senderPrivateKeyBase64);

    const encrypted = nacl.box(messageUint8, nonce, recipientPublicKeyUint8, senderPrivateKeyUint8);

    const fullMessage = new Uint8Array(nonce.length + encrypted.length);
    fullMessage.set(nonce);
    fullMessage.set(encrypted, nonce.length);

    return `[E2EE] ` + naclUtil.encodeBase64(fullMessage);
  } catch (error) {
    console.error('Encryption error:', error);
    return message;
  }
};

export const decryptMessage = (encryptedMessageWithPrefix: string, senderPublicKeyBase64: string, recipientPrivateKeyBase64: string) => {
  try {
    if (!encryptedMessageWithPrefix.startsWith('[E2EE] ')) return encryptedMessageWithPrefix;
    if (!senderPublicKeyBase64 || !recipientPrivateKeyBase64) return encryptedMessageWithPrefix;

    const encryptedBase64 = encryptedMessageWithPrefix.replace('[E2EE] ', '');
    const messageWithNonceAsUint8Array = naclUtil.decodeBase64(encryptedBase64);
    
    const nonce = messageWithNonceAsUint8Array.slice(0, nacl.box.nonceLength);
    const message = messageWithNonceAsUint8Array.slice(nacl.box.nonceLength, messageWithNonceAsUint8Array.length);

    const senderPublicKeyUint8 = naclUtil.decodeBase64(senderPublicKeyBase64);
    const recipientPrivateKeyUint8 = naclUtil.decodeBase64(recipientPrivateKeyBase64);

    const decrypted = nacl.box.open(message, nonce, senderPublicKeyUint8, recipientPrivateKeyUint8);

    if (!decrypted) {
      throw new Error("Could not decrypt message");
    }

    return naclUtil.encodeUTF8(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedMessageWithPrefix; // fallback
  }
};
