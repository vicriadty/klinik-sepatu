jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "test-uuid"),
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: null },
}));

jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchCameraAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
}));
