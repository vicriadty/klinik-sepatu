import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import {
  clearPaymentIdempotencyKey,
  getPaymentIdempotencyKey,
} from "../paymentIdempotency";

describe("payment idempotency storage", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it("reuses a key for the same request and clears it after success", async () => {
    const first = await getPaymentIdempotencyKey(9, "payment", "cash:54000");
    const sameRequest = await getPaymentIdempotencyKey(
      9,
      "payment",
      "cash:54000"
    );

    expect(sameRequest).toBe(first);
    expect(Crypto.randomUUID).toHaveBeenCalledTimes(1);

    await clearPaymentIdempotencyKey(9, "payment");
    await getPaymentIdempotencyKey(9, "payment", "cash:54000");

    expect(Crypto.randomUUID).toHaveBeenCalledTimes(2);
  });

  it("uses separate keys for payment and refund operations", async () => {
    await getPaymentIdempotencyKey(9, "payment", "cash:54000");
    await getPaymentIdempotencyKey(9, "refund", "cash:10000");

    expect(Crypto.randomUUID).toHaveBeenCalledTimes(2);
  });
});
