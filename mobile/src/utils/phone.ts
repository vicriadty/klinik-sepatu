/**
 * Indonesian customer phone normalization (ADR-0008), mirroring the
 * backend `App\Support\PhoneNumber`. Canonical: digits only, `62`
 * prefix, e.g. 0812-3456-7890 -> 6281234567890.
 */
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();

  if (trimmed === "") {
    return null;
  }

  if (trimmed.startsWith("+") && !trimmed.startsWith("+62")) {
    return null;
  }

  let digits = trimmed.replace(/\D/g, "");

  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  } else if (digits.startsWith("8")) {
    digits = "62" + digits;
  }

  return /^628\d{7,12}$/.test(digits) ? digits : null;
}

export function displayPhone(canonical: string): string {
  return `+${canonical}`;
}
