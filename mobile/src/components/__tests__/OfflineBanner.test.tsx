import { render, screen } from "@testing-library/react-native";
import * as Network from "expo-network";
import OfflineBanner from "../OfflineBanner";

jest.mock("react-native-safe-area-context", () =>
  jest.requireActual("react-native-safe-area-context/jest/mock").default
);

const useNetworkStateMock = Network.useNetworkState as jest.MockedFunction<
  typeof Network.useNetworkState
>;

describe("OfflineBanner", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("warns when the device is offline", async () => {
    useNetworkStateMock.mockReturnValue({
      isConnected: false,
      isInternetReachable: false,
      type: "NONE",
    } as never);

    await render(<OfflineBanner />);

    expect(
      screen.getByText("Tidak ada koneksi — data mungkin lama")
    ).toBeTruthy();
  });

  it("renders nothing while online", async () => {
    useNetworkStateMock.mockReturnValue({
      isConnected: true,
      isInternetReachable: true,
      type: "WIFI",
    } as never);

    await render(<OfflineBanner />);

    expect(
      screen.queryByText("Tidak ada koneksi — data mungkin lama")
    ).toBeNull();
  });
});
