jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "test-uuid"),
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: null },
}));
