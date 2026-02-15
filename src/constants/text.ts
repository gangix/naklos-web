/**
 * Turkish UI text constants
 */

export const NAV = {
  dashboard: 'Ana Sayfa',
  trucks: 'Araçlar',
  trips: 'Seferler',
  clients: 'Müşteriler',
  more: 'Daha Fazla',
} as const;

export const DASHBOARD = {
  title: 'Kontrol Paneli',
  revenue: 'Bu Ay Gelir',
  outstanding: 'Bekleyen Ödemeler',
  overdue: 'Vadesi Geçmiş',
  profit: 'Net Kâr',
  activeTrips: 'Aktif Seferler',
  availableTrucks: 'Müsait Araçlar',
  availableDrivers: 'Müsait Şoförler',
} as const;

export const TRUCKS = {
  title: 'Araçlar',
  available: 'Müsait',
  inTransit: 'Yolda',
  maintenance: 'Bakımda',
  all: 'Tümü',
  plateNumber: 'Plaka',
  type: 'Tür',
  status: 'Durum',
  driver: 'Şoför',
  currentTrip: 'Aktif Sefer',
  assignmentInfo: 'Atama Bilgileri',
  recentTrips: 'Son Seferler',
  earnings: 'Kazançlar',
} as const;

export const TRIPS = {
  title: 'Seferler',
  active: 'Aktif',
  completed: 'Tamamlanan',
  all: 'Tümü',
  createNew: 'Yeni Sefer Oluştur',
  route: 'Güzergah',
  client: 'Müşteri',
  truck: 'Araç',
  driver: 'Şoför',
  status: 'Durum',
  revenue: 'Gelir',
  expenses: 'Giderler',
  profit: 'Kâr',
  assigned: 'Atandı',
  inTransit: 'Yolda',
  delivered: 'Teslim Edildi',
} as const;

export const CLIENTS = {
  title: 'Müşteriler',
  createInvoice: 'Fatura Oluştur',
  companyName: 'Firma Adı',
  taxId: 'Vergi No',
  contact: 'İletişim',
  outstanding: 'Bakiye',
  totalInvoiced: 'Toplam Faturalanan',
  totalPaid: 'Toplam Ödenen',
  avgPaymentDays: 'Ort. Ödeme Süresi',
  invoices: 'Faturalar',
  tripHistory: 'Sefer Geçmişi',
  paid: 'Ödendi',
  pending: 'Bekliyor',
  overdue: 'Gecikmiş',
} as const;

export const EXPENSES = {
  fuel: 'Yakıt',
  tolls: 'HGS/OGS',
  driverFee: 'Şoför Ücreti',
  other: 'Diğer',
  total: 'Toplam Gider',
} as const;

export const COMMON = {
  save: 'Kaydet',
  cancel: 'İptal',
  edit: 'Düzenle',
  delete: 'Sil',
  search: 'Ara',
  filter: 'Filtrele',
  loading: 'Yükleniyor...',
  noData: 'Veri bulunamadı',
  error: 'Bir hata oluştu',
  success: 'Başarılı',
  currency: '₺',
  days: 'gün',
} as const;

export const WARNINGS = {
  overdueInvoices: 'fatura vadesi geçmiş',
  licenseExpiring: 'ehliyet süresi doluyor',
  documentExpiring: 'belgesi süresi doluyor',
} as const;
