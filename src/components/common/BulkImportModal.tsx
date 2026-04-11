import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { truckApi, driverApi, type BulkImportResult } from '../../services/api';

type EntityType = 'truck' | 'driver';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entityType: EntityType;
}

const TRUCK_TEMPLATE_HEADERS = [
  'plateNumber',
  'type',
  'capacityKg',
  'cargoVolumeM3',
];

const TRUCK_TEMPLATE_EXAMPLE = [
  { plateNumber: '34 ABC 123', type: 'LARGE_TRUCK', capacityKg: 24000, cargoVolumeM3: 60 },
  { plateNumber: '06 XYZ 456', type: 'TIR', capacityKg: 40000, cargoVolumeM3: 90 },
];

const DRIVER_TEMPLATE_HEADERS = [
  'firstName',
  'lastName',
  'phone',
  'email',
  'licenseNumber',
  'licenseClass',
];

const DRIVER_TEMPLATE_EXAMPLE = [
  {
    firstName: 'Ahmet',
    lastName: 'Yılmaz',
    phone: '+90 555 111 22 33',
    email: 'ahmet.yilmaz@example.com',
    licenseNumber: '12345678901',
    licenseClass: 'C',
  },
  {
    firstName: 'Mehmet',
    lastName: 'Demir',
    phone: '+90 555 222 33 44',
    email: 'mehmet.demir@example.com',
    licenseNumber: '98765432100',
    licenseClass: 'CE',
  },
];

const BulkImportModal = ({ isOpen, onClose, onSuccess, entityType }: BulkImportModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  if (!isOpen) return null;

  const isTruck = entityType === 'truck';
  const title = isTruck ? 'Araçları Toplu İçe Aktar' : 'Sürücüleri Toplu İçe Aktar';
  const singularLabel = isTruck ? 'araç' : 'sürücü';

  const downloadTemplate = () => {
    const headers = isTruck ? TRUCK_TEMPLATE_HEADERS : DRIVER_TEMPLATE_HEADERS;
    const example = isTruck ? TRUCK_TEMPLATE_EXAMPLE : DRIVER_TEMPLATE_EXAMPLE;
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(example, { header: headers });
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
        const parsed = XLSX.utils.sheet_to_json<any>(firstSheet, { defval: null });

        if (parsed.length === 0) {
          setParseError('Dosya boş görünüyor');
          setRows([]);
          return;
        }

        const normalized = parsed.map((row) => {
          if (isTruck) {
            return {
              plateNumber: String(row.plateNumber ?? '').trim(),
              type: String(row.type ?? '').trim().toUpperCase(),
              capacityKg: row.capacityKg ? Number(row.capacityKg) : null,
              cargoVolumeM3: row.cargoVolumeM3 != null ? Number(row.cargoVolumeM3) : null,
            };
          }
          return {
            firstName: String(row.firstName ?? '').trim(),
            lastName: String(row.lastName ?? '').trim(),
            phone: String(row.phone ?? '').trim(),
            email: String(row.email ?? '').trim(),
            licenseNumber: String(row.licenseNumber ?? '').trim(),
            licenseClass: String(row.licenseClass ?? '').trim(),
          };
        });

        setRows(normalized);
      } catch (err) {
        console.error('Parse error:', err);
        setParseError(err instanceof Error ? err.message : 'Dosya okunamadı');
        setRows([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    try {
      setImporting(true);
      const res = isTruck
        ? await truckApi.bulkImport(rows)
        : await driverApi.bulkImport(rows);
      setResult(res);
      if (res.successCount > 0) {
        onSuccess();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'İçe aktarma başarısız');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setRows([]);
    setFileName('');
    setParseError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
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
                  <li>Aşağıdaki butondan şablon dosyasını indirin</li>
                  <li>Excel'de açıp bilgilerinizi girin</li>
                  <li>Doldurulmuş dosyayı yükleyin</li>
                  <li>Önizlemeyi kontrol edip içe aktarın</li>
                </ol>
              </div>

              <button
                onClick={downloadTemplate}
                className="w-full mb-4 px-4 py-3 border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                📥 Şablonu İndir (.xlsx)
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
                  <p className="mt-3 text-sm text-gray-600">Seçili: <strong>{fileName}</strong></p>
                )}
              </div>

              {parseError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-700">{parseError}</p>
                </div>
              )}

              {rows.length > 0 && (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-green-800 font-medium">
                      ✓ {rows.length} {singularLabel} içe aktarılmaya hazır
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(rows[0]).map((key) => (
                            <th key={key} className="px-3 py-2 text-left font-medium text-gray-600">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="border-t border-gray-100">
                            {Object.values(row).map((val, i) => (
                              <td key={i} className="px-3 py-2 text-gray-900">{String(val ?? '')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {rows.length > 5 && (
                      <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 text-center">
                        ... ve {rows.length - 5} tane daha
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className={`rounded-lg p-4 ${result.successCount > 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
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
          {!result && rows.length > 0 && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex-[2] py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
            >
              {importing ? 'İçe Aktarılıyor...' : `${rows.length} ${singularLabel} İçe Aktar`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;
