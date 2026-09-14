jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "test-uuid"),
}));
