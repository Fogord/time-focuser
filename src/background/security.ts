import { Rule, EncryptedStore } from '../types';
import {
  SECURITY_DB_NAME as DB_NAME,
  SECURITY_STORE_NAME as STORE_NAME,
  SECURITY_AES_KEY_ID as AES_KEY_ID,
  SECURITY_HMAC_KEY_ID as HMAC_KEY_ID,
  SECURITY_VERSION as CURRENT_VERSION,
} from '../constants';

// Open IndexedDB to store non-extractable CryptoKeys
const openKeyDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Get or create non-extractable CryptoKey
const getOrCreateKeys = async (): Promise<{ encKey: CryptoKey; hmacKey: CryptoKey }> => {
  const db = await openKeyDB();

  const getKey = (id: string): Promise<CryptoKey | undefined> => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  };

  const putKey = (id: string, key: CryptoKey): Promise<void> => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(key, id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  };

  let encKey = await getKey(AES_KEY_ID);
  if (!encKey) {
    // Generate non-extractable AES-GCM key (cannot be exported from JS or disk inspection)
    encKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false, // non-extractable!
      ['encrypt', 'decrypt']
    );
    await putKey(AES_KEY_ID, encKey);
  }

  let hmacKey = await getKey(HMAC_KEY_ID);
  if (!hmacKey) {
    // Generate non-extractable HMAC key
    hmacKey = await crypto.subtle.generateKey(
      { name: 'HMAC', hash: 'SHA-256' },
      false, // non-extractable!
      ['sign', 'verify']
    );
    await putKey(HMAC_KEY_ID, hmacKey);
  }

  db.close();
  return { encKey, hmacKey };
};

// Helpers for buffer/base64 conversions
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const stringToBuffer = (str: string): ArrayBuffer => {
  return new TextEncoder().encode(str).buffer;
};

const bufferToString = (buf: ArrayBuffer): string => {
  return new TextDecoder().decode(buf);
};

/**
 * Encrypt rules and sign with HMAC to detect any disk tampering
 */
export const encryptAndSignRules = async (rules: Rule[]): Promise<EncryptedStore> => {
  const { encKey, hmacKey } = await getOrCreateKeys();

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = JSON.stringify(rules);
  const plaintextBuffer = stringToBuffer(plaintext);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    encKey,
    plaintextBuffer
  );

  const ivBase64 = arrayBufferToBase64(iv.buffer);
  const ciphertextBase64 = arrayBufferToBase64(ciphertextBuffer);
  const timestamp = Date.now();

  // Sign digest: version + iv + ciphertext + timestamp
  const signatureData = `${CURRENT_VERSION}:${ivBase64}:${ciphertextBase64}:${timestamp}`;
  const hmacBuffer = await crypto.subtle.sign('HMAC', hmacKey, stringToBuffer(signatureData));
  const hmacBase64 = arrayBufferToBase64(hmacBuffer);

  return {
    version: CURRENT_VERSION,
    iv: ivBase64,
    ciphertext: ciphertextBase64,
    hmac: hmacBase64,
    timestamp,
  };
};

/**
 * Verify HMAC integrity and decrypt rules.
 * Returns { rules, tamperDetected: false } or { rules: [], tamperDetected: true }
 */
export const verifyAndDecryptRules = async (
  store: EncryptedStore
): Promise<{ rules: Rule[]; tamperDetected: boolean }> => {
  try {
    const { encKey, hmacKey } = await getOrCreateKeys();

    // Verify HMAC first
    const signatureData = `${store.version}:${store.iv}:${store.ciphertext}:${store.timestamp}`;
    const hmacBuffer = base64ToArrayBuffer(store.hmac);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      hmacKey,
      hmacBuffer,
      stringToBuffer(signatureData)
    );

    if (!isValid) {
      console.error('[Security] Tampering detected! HMAC verification failed.');
      return { rules: [], tamperDetected: true };
    }

    // Decrypt ciphertext
    const iv = new Uint8Array(base64ToArrayBuffer(store.iv));
    const ciphertext = base64ToArrayBuffer(store.ciphertext);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      encKey,
      ciphertext
    );

    const decryptedJson = bufferToString(decryptedBuffer);
    const rules: Rule[] = JSON.parse(decryptedJson);

    return { rules, tamperDetected: false };
  } catch (error) {
    console.error('[Security] Decryption or verification failed:', error);
    return { rules: [], tamperDetected: true };
  }
};
