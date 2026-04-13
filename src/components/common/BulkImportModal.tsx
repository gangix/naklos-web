import { useState, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { truckApi, driverApi, type BulkImportResult } from '../../services/api';

type EntityType = 'truck' | 'driver';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entityType: EntityType;
}

interface FieldSchema {
  field: string;
  label: string;
  required: boolean;
  aliases: string[]; // normalized: lowercased, trimmed
}

const TRUCK_SCHEMA: FieldSchema[] = [
  {
    field: 'plateNumber',
    label: 'Plaka',
    required: true,
    aliases: ['platenumber', 'plaka', 'plate', 'plakano', 'plakanumarası', 'aracplakası', 'aracno', 'aracplaka'],
  },
  {
    field: 'type',
    label: 'Araç Tipi',
    required: true,
    aliases: ['type', 'tip', 'araçtipi', 'aractipi', 'kategori', 'vehicletype', 'tipi', 'sınıf', 'sinif'],
  },
  {
    field: 'capacityKg',
    label: 'Kapasite (kg)',
    required: true,
    aliases: ['capacitykg', 'kapasite', 'capacity', 'ton', 'tonaj', 'kg', 'kapasitekg', 'taşımakapasitesi', 'yük'],
  },
  {
    field: 'cargoVolumeM3',
    label: 'Hacim (m³)',
    required: false,
    aliases: ['cargovolumem3', 'hacim', 'volume', 'm3', 'kübikmetre', 'kubikmetre', 'yükhacmi'],
  },
];

const DRIVER_SCHEMA: FieldSchema[] = [
  {
    field: 'firstName',
    label: 'Ad',
    required: true,
    aliases: ['firstname', 'ad', 'isim', 'name', 'firstname'],
  },
  {
    field: 'lastName',
    label: 'Soyad',
    required: true,
    aliases: ['lastname', 'soyad', 'soyisim', 'surname', 'familyname'],
  },
  {
    field: 'phone',
    label: 'Telefon',
    required: true,
    aliases: ['phone', 'telefon', 'telefonno', 'phonenumber', 'gsm', 'mobile', 'tel'],
  },
  {
    field: 'email',
    label: 'E-posta',
    required: true,
    aliases: ['email', 'eposta', 'e-posta', 'mail', 'emailaddress', 'epostaadresi'],
  },
  {
    field: 'licenseNumber',
    label: 'Ehliyet No',
    required: true,
    aliases: ['licensenumber', 'ehliyetno', 'ehliyet', 'licenseno', 'license', 'ehliyetnumarası', 'tc', 'tcno', 'tckn'],
  },
  {
    field: 'licenseClass',
    label: 'Ehliyet Sınıfı',
    required: true,
    aliases: ['licenseclass', 'ehliyetsınıfı', 'ehliyetsinifi', 'class', 'sınıf', 'sinif', 'ehliyetklası'],
  },
];

// Truck type alias normalization (value-level, not column-level)
const TRUCK_TYPE_ALIASES: Record<string, string> = {
  van: 'VAN',
  kamyonet: 'PICKUP',
  pickup: 'PICKUP',
  küçükkamyon: 'SMALL_TRUCK',
  kucukkamyon: 'SMALL_TRUCK',
  smalltruck: 'SMALL_TRUCK',
  kamyon: 'MEDIUM_TRUCK',
  ortaboykamyon: 'MEDIUM_TRUCK',
  mediumtruck: 'MEDIUM_TRUCK',
  büyükkamyon: 'LARGE_TRUCK',
  buyukkamyon: 'LARGE_TRUCK',
  largetruck: 'LARGE_TRUCK',
  tır: 'TIR',
  tir: 'TIR',
  çekici: 'TIR',
  cekici: 'TIR',
  açıkkasa: 'FLATBED',
  aciklasa: 'FLATBED',
  flatbed: 'FLATBED',
  damperli: 'TIPPER',
  damperlikamyon: 'TIPPER',
  tipper: 'TIPPER',
  soğutuculu: 'REFRIGERATED',
  sogutuculu: 'REFRIGERATED',
  refrigerated: 'REFRIGERATED',
  frigo: 'REFRIGERATED',
  tanker: 'TANKER',
};

const normalizeKey = (s: string): string =>
  s.toLowerCase().trim().replace(/[\s_\-()]/g, '').replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' } as any)[c] || c);

const matchHeaderToField = (header: string, schema: FieldSchema[]): string | null => {
  const normalized = normalizeKey(header);
  for (const field of schema) {
    if (field.field.toLowerCase() === normalized) return field.field;
    const normalizedAliases = field.aliases.map(normalizeKey);
    if (normalizedAliases.includes(normalized)) return field.field;
  }
  return null;
};

const buildInitialMapping = (headers: string[], schema: FieldSchema[]): Record<string, string | null> => {
  const mapping: Record<string, string | null> = {};
  for (const field of schema) mapping[field.field] = null;
  for (const header of headers) {
    const matched = matchHeaderToField(header, schema);
    if (matched && !mapping[matched]) mapping[matched] = header;
  }
  return mapping;
};

const normalizeTruckType = (value: any): string | null => {
  if (!value) return null;
  const raw = String(value).trim();
  const key = normalizeKey(raw);
  return TRUCK_TYPE_ALIASES[key] || raw.toUpperCase();
};

const BulkImportModal = ({ isOpen, onClose, onSuccess, entityType }: BulkImportModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [fileName, setFileName] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  const isTruck = entityType === 'truck';
  const title = isTruck ? 'Araçları Toplu İçe Aktar' : 'Sürücüleri Toplu İçe Aktar';
  const singularLabel = isTruck ? 'araç' : 'sürücü';
  const schema = isTruck ? TRUCK_SCHEMA : DRIVER_SCHEMA;

  const missingRequiredFields = useMemo(
    () => schema.filter((f) => f.required && !mapping[f.field]),
    [mapping, schema]
  );

  const readyToImport = rawRows.length > 0 && missingRequiredFields.length === 0;

  const normalizedRows = useMemo(() => {
    if (rawRows.length === 0 || Object.keys(mapping).length === 0) return [];
    return rawRows.map((row) => {
      const out: any = {};
      for (const field of schema) {
        const sourceCol = mapping[field.field];
        if (sourceCol && row[sourceCol] != null) {
          let val = row[sourceCol];
          if (field.field === 'type' && isTruck) {
            val = normalizeTruckType(val);
          } else if (field.field === 'capacityKg' && isTruck) {
            val = Number(String(val).replace(/[^\d.,]/g, '').replace(',', '.'));
            if (Number.isNaN(val)) val = null;
          } else if (field.field === 'cargoVolumeM3' && isTruck) {
            val = Number(String(val).replace(/[^\d.,]/g, '').replace(',', '.'));
            if (Number.isNaN(val)) val = null;
          } else {
            val = String(val).trim();
          }
          out[field.field] = val;
        } else {
          out[field.field] = null;
        }
      }
      return out;
    });
  }, [rawRows, mapping, schema, isTruck]);

  if (!isOpen) return null;

  const downloadTemplate = () => {
    const templateHeaders = schema.map((f) => f.field);
    const example = isTruck
      ? [
          { plateNumber: '34 ABC 123', type: 'LARGE_TRUCK', capacityKg: 24000, cargoVolumeM3: 60 },
          { plateNumber: '06 XYZ 456', type: 'TIR', capacityKg: 40000, cargoVolumeM3: 90 },
        ]
      : [
          {
            firstName: 'Ahmet',
            lastName: 'Yılmaz',
            phone: '+90 555 111 22 33',
            email: 'ahmet.yilmaz@example.com',
            licenseNumber: '12345678901',
            licenseClass: 'C',
          },
        ];
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(example, { header: templateHeaders });
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Şablon');
    XLSX.writeFile(workbook, `naklos-${entityType}-sablon.xlsx`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const parsed = XLSX.utils.sheet_to_json<any>(firstSheet, { defval: null, raw: false });

        if (parsed.length === 0) {
          setParseError('Dosya boş görünüyor');
          setRawRows([]);
          return;
        }

        const fileHeaders = Object.keys(parsed[0]);
        setHeaders(fileHeaders);
        setRawRows(parsed);
        setMapping(buildInitialMapping(fileHeaders, schema));
      } catch (err) {
        console.error('Parse error:', err);
        setParseError(err instanceof Error ? err.message : 'Dosya okunamadı');
        setRawRows([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (normalizedRows.length === 0) return;
    try {
      setImporting(true);
      const res = isTruck
        ? await truckApi.bulkImport(normalizedRows)
        : await driverApi.bulkImport(normalizedRows);

      if (res.successCount > 0) onSuccess();

      // All rows imported successfully → close the modal.
      // Otherwise show the result screen so the user can review errors.
      if (res.errorCount === 0) {
        handleClose();
      } else {
        setResult(res);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'İçe aktarma başarısız');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setRawRows([]);
    setHeaders([]);
    setMapping({});
    setFileName('');
    setParseError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  const setFieldMapping = (field: string, column: string) => {
    setMapping((prev) => ({ ...prev, [field]: column || null }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            ×
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {!result ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Nasıl kullanılır?</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Kendi Excel dosyanızı yükleyin — sütun adlarını otomatik eşleştireceğiz</li>
                  <li>Veya aşağıdaki şablonu indirip kullanın</li>
                  <li>Eşleştirmeleri kontrol edin, eksikleri elle seçin</li>
                  <li>İçe aktarın</li>
                </ol>
              </div>

              <button
                onClick={downloadTemplate}
                className="w-full mb-4 px-4 py-3 border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                <Download className="w-5 h-5 inline -mt-0.5" /> Şablonu İndir (.xlsx)
              </button>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="bulk-file-input"
                />
                <label
                  htmlFor="bulk-file-input"
                  className="cursor-pointer inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  {fileName ? 'Farklı Dosya Seç' : 'Dosya Seç'}
                </label>
                {fileName && (
                  <p className="mt-3 text-sm text-gray-600">
                    Seçili: <strong>{fileName}</strong>
                  </p>
                )}
              </div>

              {parseError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-700">{parseError}</p>
                </div>
              )}

              {rawRows.length > 0 && (
                <>
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">Sütun Eşleştirme</h3>
                    <p className="text-xs text-gray-500 mb-3">
                      Dosyanızdaki sütunları alanlarımıza eşleştirin. Otomatik bulunan eşleştirmeleri değiştirebilirsiniz.
                    </p>
                    <div className="space-y-2">
                      {schema.map((field) => {
                        const missing = field.required && !mapping[field.field];
                        return (
                          <div
                            key={field.field}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${
                              missing
                                ? 'border-red-300 bg-red-50'
                                : mapping[field.field]
                                ? 'border-green-200 bg-green-50'
                                : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {field.label}
                                {field.required && <span className="text-red-600 ml-1">*</span>}
                              </p>
                            </div>
                            <select
                              value={mapping[field.field] || ''}
                              onChange={(e) => setFieldMapping(field.field, e.target.value)}
                              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-0"
                            >
                              <option value="">— Seçin —</option>
                              {headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {missingRequiredFields.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-orange-900 font-medium">
                        <span className="inline-flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-orange-500 inline flex-shrink-0" /> Eksik zorunlu alanlar: {missingRequiredFields.map((f) => f.label).join(', ')}</span>
                      </p>
                      <p className="text-xs text-orange-700 mt-1">
                        Devam etmek için yukarıdaki listeden sütunları seçin.
                      </p>
                    </div>
                  )}

                  {readyToImport && (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-green-800 font-medium">
                          ✓ {normalizedRows.length} {singularLabel} içe aktarılmaya hazır
                        </p>
                      </div>
                      <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50">
                              <tr>
                                {schema.map((f) => (
                                  <th key={f.field} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                                    {f.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {normalizedRows.slice(0, 5).map((row, idx) => (
                                <tr key={idx} className="border-t border-gray-100">
                                  {schema.map((f) => (
                                    <td key={f.field} className="px-3 py-2 text-gray-900 whitespace-nowrap">
                                      {row[f.field] != null ? String(row[f.field]) : '—'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {normalizedRows.length > 5 && (
                          <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 text-center border-t border-gray-100">
                            ... ve {normalizedRows.length - 5} tane daha
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div
                className={`rounded-lg p-4 ${
                  result.successCount > 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <p className="text-lg font-bold text-gray-900">
                  {result.successCount} başarılı
                  {result.errorCount > 0 && `, ${result.errorCount} hata`}
                </p>
              </div>

              {result.errors.length > 0 && (
                <div className="border border-red-200 rounded-lg overflow-hidden">
                  <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                    <p className="text-sm font-semibold text-red-900">Hatalar</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {result.errors.map((err, idx) => (
                      <div key={idx} className="px-4 py-3 border-b border-red-100 last:border-b-0">
                        <p className="text-sm font-medium text-gray-900">
                          Satır {err.rowNumber}: {err.identifier}
                        </p>
                        <p className="text-xs text-red-700 mt-1">{err.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            {result ? 'Kapat' : 'İptal'}
          </button>
          {!result && readyToImport && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex-[2] py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
            >
              {importing ? 'İçe Aktarılıyor...' : `${normalizedRows.length} ${singularLabel} İçe Aktar`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;
