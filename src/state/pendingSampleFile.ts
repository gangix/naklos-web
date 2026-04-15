/**
 * Tiny in-memory cache for handing a sample File from FuelImportPage's
 * "all rows failed" recovery banner to FuelFormatCreatePage. Module-level
 * state is intentional — survives in-app navigation, gets wiped on refresh
 * (which is fine; the create-format page falls back to a normal file picker).
 */
let pending: File | null = null;

export function setPendingSample(file: File | null): void {
  pending = file;
}

export function consumePendingSample(): File | null {
  const file = pending;
  pending = null;
  return file;
}
