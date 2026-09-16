import * as Crypto from "expo-crypto";
import { useOrderWizardStore } from "../orderWizardStore";

const customer = {
  id: 3,
  name: "Emma",
  phone: "6281234567890",
  phone_display: "+6281234567890",
  email: null,
  address: null,
  notes: null,
  wa_opt_out: false,
  created_at: null,
  updated_at: null,
};

const itemInput = {
  brand: "Nike",
  model: "Air Max",
  color: "Putih",
  shoeType: "Sneakers",
  customerNote: "",
};

describe("useOrderWizardStore", () => {
  beforeEach(() => {
    useOrderWizardStore.setState({
      customer: null,
      items: [],
      discountId: null,
      idempotencyKey: null,
    });
    jest.clearAllMocks();
  });

  it("stores the selected customer", () => {
    useOrderWizardStore.getState().setCustomer(customer);
    expect(useOrderWizardStore.getState().customer).toEqual(customer);
  });

  it("adds, updates and removes items", () => {
    const id = useOrderWizardStore.getState().addItem(itemInput);

    expect(useOrderWizardStore.getState().items).toHaveLength(1);
    expect(useOrderWizardStore.getState().items[0]).toMatchObject({
      id,
      brand: "Nike",
      serviceIds: [],
    });

    useOrderWizardStore
      .getState()
      .updateItem(id, { ...itemInput, brand: "Adidas" });
    expect(useOrderWizardStore.getState().items[0]?.brand).toBe("Adidas");

    useOrderWizardStore.getState().removeItem(id);
    expect(useOrderWizardStore.getState().items).toHaveLength(0);
  });

  it("stores services per item", () => {
    const id = useOrderWizardStore.getState().addItem(itemInput);

    useOrderWizardStore.getState().setItemServices(id, [1, 2]);

    expect(useOrderWizardStore.getState().items[0]?.serviceIds).toEqual([
      1, 2,
    ]);
  });

  it("keeps one idempotency key across retries", () => {
    const key = useOrderWizardStore.getState().ensureIdempotencyKey();

    expect(key).toBe("test-uuid");
    expect(Crypto.randomUUID).toHaveBeenCalledTimes(1);

    expect(useOrderWizardStore.getState().ensureIdempotencyKey()).toBe(key);
    expect(Crypto.randomUUID).toHaveBeenCalledTimes(1);
  });

  it("resets the wizard after a successful order", () => {
    const id = useOrderWizardStore.getState().addItem(itemInput);
    useOrderWizardStore.getState().setItemServices(id, [1]);
    useOrderWizardStore.getState().setCustomer(customer);
    useOrderWizardStore.getState().setDiscountId(5);
    useOrderWizardStore.getState().ensureIdempotencyKey();

    useOrderWizardStore.getState().reset();

    expect(useOrderWizardStore.getState()).toMatchObject({
      customer: null,
      items: [],
      discountId: null,
      idempotencyKey: null,
    });
  });
});
