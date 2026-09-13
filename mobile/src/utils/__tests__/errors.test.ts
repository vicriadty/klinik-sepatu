import { ApiError } from "../../api/client";
import { loginErrorMessage } from "../errors";

describe("loginErrorMessage", () => {
  it("maps 401 to invalid credentials copy", () => {
    expect(
      loginErrorMessage(new ApiError("Invalid credentials.", 401))
    ).toBe("Username atau password salah.");
  });

  it("maps 403 to deactivated account copy", () => {
    expect(
      loginErrorMessage(new ApiError("Account deactivated.", 403))
    ).toBe("Akun dinonaktifkan. Hubungi Owner atau Admin.");
  });

  it("maps 422 to a generic validation copy", () => {
    expect(loginErrorMessage(new ApiError("Unprocessable.", 422))).toBe(
      "Periksa kembali data yang diisi."
    );
  });

  it("maps 5xx to a server error copy", () => {
    expect(loginErrorMessage(new ApiError("Server error.", 500))).toBe(
      "Terjadi kesalahan pada server. Coba lagi."
    );
  });

  it("keeps the network message for errors without a status", () => {
    expect(
      loginErrorMessage(new ApiError("Tidak dapat terhubung ke server."))
    ).toBe("Tidak dapat terhubung ke server.");
  });

  it("falls back for unknown errors", () => {
    expect(loginErrorMessage(new Error("boom"))).toBe(
      "Terjadi kesalahan. Coba lagi."
    );
  });
});
