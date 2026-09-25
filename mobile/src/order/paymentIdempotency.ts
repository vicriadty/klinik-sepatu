import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

type PaymentOperation = "payment" | "refund";

interface StoredRequest {
  key: string;
  fingerprint: string;
}

function storageKey(orderId: number, operation: PaymentOperation): string {
  return `ks-${operation}-idempotency-${orderId}`;
}

export async function getPaymentIdempotencyKey(
  orderId: number,
  operation: PaymentOperation,
  fingerprint: string
): Promise<string> {
  const key = storageKey(orderId, operation);
  const storedValue = await AsyncStorage.getItem(key);

  if (storedValue) {
    try {
      const stored = JSON.parse(storedValue) as StoredRequest;
      if (stored.fingerprint === fingerprint && stored.key) {
        return stored.key;
      }
    } catch {
      // Replace malformed persisted state with a fresh request key.
    }
  }

  const requestKey = Crypto.randomUUID();
  await AsyncStorage.setItem(
    key,
    JSON.stringify({ key: requestKey, fingerprint } satisfies StoredRequest)
  );
  return requestKey;
}

export function clearPaymentIdempotencyKey(
  orderId: number,
  operation: PaymentOperation
): Promise<void> {
  return AsyncStorage.removeItem(storageKey(orderId, operation));
}
