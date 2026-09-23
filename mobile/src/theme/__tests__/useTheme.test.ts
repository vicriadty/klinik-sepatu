import { buildNavigationTheme, darkTheme, lightTheme } from "../useTheme";

describe("theme", () => {
  it("keeps the light canvas neutral with an ink primary CTA", () => {
    expect(lightTheme.isDark).toBe(false);
    expect(lightTheme.colors.canvas).toBe("#fafafa");
    expect(lightTheme.colors.surface).toBe("#ffffff");
    expect(lightTheme.colors.brand).toBe("#0072f5");
    expect(lightTheme.colors.primary).toBe("#171717");
    expect(lightTheme.colors.onPrimary).toBe("#ffffff");
  });

  it("inverts the primary CTA on the dark canvas", () => {
    expect(darkTheme.isDark).toBe(true);
    expect(darkTheme.colors.canvas).toBe("#0a0a0a");
    expect(darkTheme.colors.primary).toBe("#ededed");
    expect(darkTheme.colors.onPrimary).toBe("#0a0a0a");
    expect(darkTheme.colors.hairline).toBe("rgba(255,255,255,0.1)");
  });

  it("maps navigation colors from the palette", () => {
    expect(buildNavigationTheme(lightTheme).colors.background).toBe("#fafafa");
    expect(buildNavigationTheme(darkTheme).colors.background).toBe("#0a0a0a");
    expect(buildNavigationTheme(darkTheme).colors.text).toBe("#ededed");
  });
});
