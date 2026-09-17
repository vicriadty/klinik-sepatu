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

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("expo-network", () => ({
  useNetworkState: jest.fn(() => ({
    isConnected: true,
    isInternetReachable: true,
    type: "WIFI",
  })),
}));

jest.mock("expo-file-system", () => {
  class MockFile {
    uri: string;
    exists = false;

    constructor(...parts: unknown[]) {
      this.uri = parts
        .map((part) =>
          typeof part === "string" ? part : (part as { uri: string }).uri
        )
        .join("/");
    }

    async copy(target: MockFile): Promise<void> {
      target.exists = true;
    }

    delete(): void {
      this.exists = false;
    }
  }

  class MockDirectory {
    uri: string;
    exists = false;

    constructor(...parts: unknown[]) {
      this.uri = parts
        .map((part) =>
          typeof part === "string" ? part : (part as { uri: string }).uri
        )
        .join("/");
    }

    create(): void {
      this.exists = true;
    }
  }

  return {
    File: MockFile,
    Directory: MockDirectory,
    Paths: {
      document: new MockDirectory("file:///document"),
      cache: new MockDirectory("file:///cache"),
    },
  };
});
