import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient } from "@tanstack/react-query";
import {
  persistQueryClientRestore,
  persistQueryClientSave,
} from "@tanstack/react-query-persist-client";
import { persistOptions, queryPersister } from "../queryClient";

describe("query cache persistence", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("restores successful queries for offline reads", async () => {
    const client = new QueryClient();
    client.setQueryData(["services", "active"], [
      { id: 1, name: "Fast Clean", price: 25000 },
    ]);

    await persistQueryClientSave({
      queryClient: client,
      ...persistOptions,
    });

    const restored = new QueryClient();
    await persistQueryClientRestore({
      queryClient: restored,
      persister: queryPersister,
      maxAge: persistOptions.maxAge,
    });

    expect(restored.getQueryData(["services", "active"])).toEqual([
      { id: 1, name: "Fast Clean", price: 25000 },
    ]);
  });

  it("does not cache failed queries", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    await client
      .fetchQuery({
        queryKey: ["broken"],
        queryFn: async () => {
          throw new Error("network down");
        },
      })
      .catch(() => undefined);

    await persistQueryClientSave({
      queryClient: client,
      ...persistOptions,
    });

    const restored = new QueryClient();
    await persistQueryClientRestore({
      queryClient: restored,
      persister: queryPersister,
      maxAge: persistOptions.maxAge,
    });

    expect(restored.getQueryData(["broken"])).toBeUndefined();
  });
});
