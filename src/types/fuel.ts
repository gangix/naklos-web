export type FuelProvider = 'OPET' | 'SHELL' | 'BP' | 'PETROL_OFISI' | 'GENERIC';

export type FuelImportStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type DedupClassification = 'NEW' | 'DUPLICATE';

export type MappingSource = 'HEURISTIC' | 'CLAUDE' | 'EMPTY';

export interface FuelImportFormatDto {
  id: string;
  fleetId: string | null;
  provider: FuelProvider;
  name: string;
  version: number;
  columnMapping: Record<string, string>;
  sampleHeaders: string[] | null;
  active: boolean;
  global: boolean;
  createdAt: string;
}

export interface SuggestedMappingDto {
  mapping: Record<string, string>;
  overallConfidence: number;
  source: MappingSource;
  sampleHeaders: string[];
}

export interface PreviewRow {
  rowIndex: number;
  plate: string | null;
  occurredAt: string | null;
  fuelType: string | null;
  liters: number | null;
  totalPrice: number | null;
  classification: DedupClassification;
  matchedTruckId: string | null;
  matchedExistingEntryId: string | null;
  /** i18n key suffix under fuelImport.error.* — null on success. */
  errorCode: string | null;
  /** Interpolation values for the localized error message. */
  errorParams: Record<string, string | number> | null;
  /** English fallback for unknown error codes / missing translations. */
  errorMessage: string | null;
}

export interface PreviewSummary {
  total: number;
  newCount: number;
  duplicateCount: number;
  possibleDuplicateCount: number;
  unmatchedCount: number;
  errorCount: number;
}

export interface DraftPreview {
  draftId: string;
  formatId: string;
  fileName: string;
  fileSizeBytes: number;
  summary: PreviewSummary;
  rows: PreviewRow[];
}

export interface CommitOverride {
  rowIndex: number;
  action: 'SKIP' | 'IMPORT';
}

export interface FuelImportBatchDto {
  id: string;
  fleetId: string;
  formatId: string | null;
  provider: FuelProvider;
  fileName: string;
  fileSizeBytes: number;
  rowCountTotal: number;
  rowCountImported: number;
  rowCountSkippedDuplicate: number;
  rowCountSkippedPossibleDup: number;
  rowCountUnmatched: number;
  rowCountError: number;
  status: FuelImportStatus;
  uploadedBy: string;
  uploadedAt: string;
  completedAt: string | null;
}

export const SEMANTIC_FIELDS = [
  'plate', 'date', 'time', 'fuelType', 'liters', 'pricePerLiter', 'totalPrice',
  'stationName', 'stationCity', 'cardNumber', 'transactionId', 'odometerKm',
] as const;

export const REQUIRED_SEMANTIC_FIELDS = ['plate', 'date', 'liters', 'totalPrice'] as const;

export interface UnmatchedPlateGroup {
  normalizedPlate: string;
  displayPlate: string;
  entryCount: number;
  totalLiters: string;     // BigDecimal arrives as string in Jackson defaults
  totalPriceTl: string;
  firstOccurredAt: string; // ISO-8601
  lastOccurredAt: string;
  batches: UnmatchedBatchBreakdown[];
}

export interface UnmatchedBatchBreakdown {
  batchId: string;
  batchFileName: string;
  entryCount: number;
}

export interface PossibleDuplicatePair {
  flaggedEntry: FuelEntryDto;
  suspectedOriginal: FuelEntryDto | null;
  batchId: string | null;
  batchFileName: string | null;
}

export interface FuelEntryDto {
  id: string;
  plateTextRaw: string;
  occurredAt: string;
  liters: string;
  totalPrice: string;
  stationName: string | null;
  transactionId: string | null;
  fingerprint: string;
  matchStatus: 'MATCHED' | 'UNMATCHED' | 'AMBIGUOUS' | 'SUBCONTRACTOR' | 'DISMISSED';
  reviewStatus: 'NONE' | 'POSSIBLE_DUPLICATE_PENDING' | 'POSSIBLE_DUPLICATE_CONFIRMED' | 'POSSIBLE_DUPLICATE_DISMISSED';
}

export interface ReviewCounts {
  unmatchedPlateGroups: number;
  pendingDuplicates: number;
}

export interface PlateResolutionDto {
  normalizedPlate: string;
  kind: 'ALIAS' | 'SUBCONTRACTOR';
  canonicalPlate: string | null;
  createdAt: string;
}

export interface ResolutionEntryView {
  id: string;
  plateTextRaw: string;
  occurredAt: string;
  liters: string;
  totalPrice: string;
  stationName: string | null;
  transactionId: string | null;
  matchStatus: 'MATCHED' | 'UNMATCHED' | 'AMBIGUOUS' | 'SUBCONTRACTOR' | 'DISMISSED';
  importBatchId: string | null;
}
