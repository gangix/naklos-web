import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockFleet, mockTrucks, mockDrivers } from '../data/mock';
import { useData } from '../contexts/DataContext';
import { calculateWarnings } from '../utils/warnings';
import { getTurkishMonthName, getPreviousMonth, getCurrentMonth, getMonthDateRange } from '../utils/dateHelpers';
import { getBadgeSize } from '../utils/badgeHelpers';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { trips, documentSubmissions, truckAssignmentRequests } = useData();
  const warnings = useMemo(() => calculateWarnings(mockTrucks, mockDrivers), []);

  // Calculate statistics
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get current and previous month date ranges
    const currentMonth = getCurrentMonth();
    const prevMonth = getPreviousMonth();
    const currentMonthRange = getMonthDateRange(currentMonth.year, currentMonth.month);
    const prevMonthRange = getMonthDateRange(prevMonth.year, prevMonth.month);

    // Pending approval trips
    const pendingApprovalTrips = trips.filter(
      (trip) =>
        trip.status === 'delivered' &&
        trip.deliveryDocuments.length > 0
    );

    // Completed this month
    const completedThisMonth = trips.filter((trip) => {
      if (!trip.deliveredAt) return false;
      const deliveredDate = new Date(trip.deliveredAt);
      return deliveredDate >= currentMonthRange.start && deliveredDate <= currentMonthRange.end;
    });

    // Completed last month
    const completedLastMonth = trips.filter((trip) => {
      if (!trip.deliveredAt) return false;
      const deliveredDate = new Date(trip.deliveredAt);
      return deliveredDate >= prevMonthRange.start && deliveredDate <= prevMonthRange.end;
    });

    // Truck warnings (critical only)
    const truckWarnings = warnings.filter(
      (w) => w.relatedType === 'truck' && w.severity === 'error'
    );

    // Driver warnings (critical only)
    const driverWarnings = warnings.filter(
      (w) => w.relatedType === 'driver' && w.severity === 'error'
    );

    // Truck document approvals
    const truckDocApprovalsCount = documentSubmissions.filter(
      (doc) => doc.status === 'pending' && doc.relatedType === 'truck'
    ).length;

    // Driver document + truck assignment approvals
    const driverApprovalsCount =
      documentSubmissions.filter(
        (doc) => doc.status === 'pending' && doc.relatedType === 'driver'
      ).length +
      truckAssignmentRequests.filter((req) => req.status === 'pending').length;

    // Total counts
    const totalTrips = trips.filter(
      (trip) => trip.status === 'in-progress' || trip.status === 'created'
    ).length;
    const totalTrucks = mockTrucks.length;
    const totalDrivers = mockDrivers.length;

    return {
      pendingApprovalCount: pendingApprovalTrips.length,
      completedThisMonth: completedThisMonth.length,
      completedLastMonth: completedLastMonth.length,
      truckWarningsCount: truckWarnings.length,
      driverWarningsCount: driverWarnings.length,
      truckDocApprovalsCount,
      driverApprovalsCount,
      totalTrips,
      totalTrucks,
      totalDrivers,
      hasData: totalTrucks > 0 || totalDrivers > 0 || trips.length > 0,
    };
  }, [trips, warnings, documentSubmissions, truckAssignmentRequests]);

  // Get current and previous month names
  const currentMonthName = getTurkishMonthName(new Date().getMonth());
  const prevMonthName = getTurkishMonthName(getPreviousMonth().month);

  // Empty state check
  if (!stats.hasData) {
    return (
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ana Sayfa</h1>
          <p className="text-gray-600 mt-1">{mockFleet.name}</p>
        </div>

        {/* Empty State / Onboarding */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Hoş geldiniz Naklos'a!</h2>
            <p className="text-gray-600 mb-8">Filonuzu kurmaya başlamak için:</p>
          </div>

          <div className="space-y-6 max-w-md mx-auto">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Araçlarınızı ekleyin</h3>
                <p className="text-sm text-gray-600 mb-3">Filonuzdaki tüm araçları sisteme kaydedin</p>
                <button
                  onClick={() => navigate('/manager/trucks')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  + Araç Ekle
                </button>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Sürücülerinizi tanımlayın</h3>
                <p className="text-sm text-gray-600 mb-3">Sürücü bilgilerini ve belgelerini girin</p>
                <button
                  onClick={() => navigate('/manager/drivers')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  + Sürücü Ekle
                </button>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">İlk seferinizi oluşturun</h3>
                <p className="text-sm text-gray-600 mb-3">Sefer planlaması yapın ve takibe başlayın</p>
                <button
                  onClick={() => navigate('/manager/trips')}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                >
                  + Sefer Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ana Sayfa</h1>
        <p className="text-gray-600 mt-1">{mockFleet.name}</p>
      </div>

      {/* Main Sections with Warning Badges */}
      <div className="grid gap-4 mb-8">
        {/* Seferler Card */}
        <button
          onClick={() => navigate(stats.pendingApprovalCount > 0 ? '/manager/trips?tab=pending' : '/manager/trips')}
          className={`relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-left border border-gray-200 group ${
            stats.pendingApprovalCount > 0 ? 'p-6 max-lg:pt-8' : 'p-6'
          }`}
        >
          {/* Warning Badge */}
          {stats.pendingApprovalCount > 0 && (() => {
            const badgeSize = getBadgeSize(stats.pendingApprovalCount);
            return (
              <div className={`absolute ${badgeSize.positionClass} ${badgeSize.sizeClass} bg-orange-500 rounded-full flex items-center justify-center text-white ${badgeSize.textClass} shadow-lg`}>
                {stats.pendingApprovalCount}
              </div>
            );
          })()}

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">
              📦
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Seferler</h3>
              {stats.pendingApprovalCount > 0 && (
                <p className="text-sm text-orange-600 font-medium">
                  {stats.pendingApprovalCount} sefer onay bekliyor
                </p>
              )}
              {stats.pendingApprovalCount === 0 && (
                <p className="text-sm text-gray-500">
                  Tüm seferler kontrol altında
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Toplam {stats.totalTrips} aktif sefer
              </p>
            </div>
            <span className="text-gray-400 text-2xl group-hover:text-gray-600 transition-colors">›</span>
          </div>
        </button>

        {/* Araçlar Card */}
        <button
          onClick={() => navigate(stats.truckDocApprovalsCount > 0 ? '/manager/trucks?tab=pending' : '/manager/trucks')}
          className={`relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-left border border-gray-200 group ${
            stats.truckWarningsCount > 0 || stats.truckDocApprovalsCount > 0 ? 'p-6 max-lg:pt-8' : 'p-6'
          }`}
        >
          {/* Warning Badge */}
          {stats.truckWarningsCount > 0 && (() => {
            const badgeSize = getBadgeSize(stats.truckWarningsCount);
            return (
              <div className={`absolute ${badgeSize.positionClass} ${badgeSize.sizeClass} bg-red-500 rounded-full flex items-center justify-center text-white ${badgeSize.textClass} shadow-lg`}>
                {stats.truckWarningsCount}
              </div>
            );
          })()}

          {/* Approval Badge (positioned to the left of warning badge if both exist) */}
          {stats.truckDocApprovalsCount > 0 && (() => {
            const badgeSize = getBadgeSize(stats.truckDocApprovalsCount);
            const positionClass = stats.truckWarningsCount > 0
              ? '-top-2 right-12 lg:-top-2 lg:right-12'
              : badgeSize.positionClass;
            return (
              <div className={`absolute ${positionClass} ${badgeSize.sizeClass} bg-orange-500 rounded-full flex items-center justify-center text-white ${badgeSize.textClass} shadow-lg`}>
                {stats.truckDocApprovalsCount}
              </div>
            );
          })()}

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">
              🚛
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Araçlar</h3>
              {stats.truckDocApprovalsCount > 0 && (
                <p className="text-sm text-orange-600 font-medium">
                  {stats.truckDocApprovalsCount} belge onay bekliyor
                </p>
              )}
              {stats.truckWarningsCount > 0 && (
                <p className="text-sm text-red-600 font-medium">
                  {stats.truckWarningsCount} araç uyarısı var
                </p>
              )}
              {stats.truckWarningsCount === 0 && stats.truckDocApprovalsCount === 0 && (
                <p className="text-sm text-gray-500">
                  Tüm belgeler güncel
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Toplam {stats.totalTrucks} araç
              </p>
            </div>
            <span className="text-gray-400 text-2xl group-hover:text-gray-600 transition-colors">›</span>
          </div>
        </button>

        {/* Sürücüler Card */}
        <button
          onClick={() => navigate(stats.driverApprovalsCount > 0 ? '/manager/drivers?tab=pending' : '/manager/drivers')}
          className={`relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-left border border-gray-200 group ${
            stats.driverWarningsCount > 0 || stats.driverApprovalsCount > 0 ? 'p-6 max-lg:pt-8' : 'p-6'
          }`}
        >
          {/* Warning Badge */}
          {stats.driverWarningsCount > 0 && (() => {
            const badgeSize = getBadgeSize(stats.driverWarningsCount);
            return (
              <div className={`absolute ${badgeSize.positionClass} ${badgeSize.sizeClass} bg-red-500 rounded-full flex items-center justify-center text-white ${badgeSize.textClass} shadow-lg`}>
                {stats.driverWarningsCount}
              </div>
            );
          })()}

          {/* Approval Badge (positioned to the left of warning badge if both exist) */}
          {stats.driverApprovalsCount > 0 && (() => {
            const badgeSize = getBadgeSize(stats.driverApprovalsCount);
            const positionClass = stats.driverWarningsCount > 0
              ? '-top-2 right-12 lg:-top-2 lg:right-12'
              : badgeSize.positionClass;
            return (
              <div className={`absolute ${positionClass} ${badgeSize.sizeClass} bg-orange-500 rounded-full flex items-center justify-center text-white ${badgeSize.textClass} shadow-lg`}>
                {stats.driverApprovalsCount}
              </div>
            );
          })()}

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">
              👤
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Sürücüler</h3>
              {stats.driverApprovalsCount > 0 && (
                <p className="text-sm text-orange-600 font-medium">
                  {stats.driverApprovalsCount} onay bekliyor
                </p>
              )}
              {stats.driverWarningsCount > 0 && (
                <p className="text-sm text-red-600 font-medium">
                  {stats.driverWarningsCount} sürücü uyarısı var
                </p>
              )}
              {stats.driverWarningsCount === 0 && stats.driverApprovalsCount === 0 && (
                <p className="text-sm text-gray-500">
                  Tüm belgeler güncel
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Toplam {stats.totalDrivers} sürücü
              </p>
            </div>
            <span className="text-gray-400 text-2xl group-hover:text-gray-600 transition-colors">›</span>
          </div>
        </button>
      </div>

      {/* Statistics Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          İstatistikler
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {/* Current Month Stats */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📅</span>
              <p className="text-sm font-medium text-blue-900">Bu Ay</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-blue-600">{stats.completedThisMonth}</p>
              {stats.completedThisMonth > stats.completedLastMonth && (
                <span className="text-2xl text-green-600">↑</span>
              )}
              {stats.completedThisMonth < stats.completedLastMonth && (
                <span className="text-2xl text-gray-500">↓</span>
              )}
            </div>
            <p className="text-sm text-blue-700 mt-1">Tamamlanan Sefer</p>
            <p className="text-xs text-blue-600 mt-1">{currentMonthName}</p>
          </div>

          {/* Previous Month Stats */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📅</span>
              <p className="text-sm font-medium text-gray-900">Geçen Ay</p>
            </div>
            <p className="text-4xl font-bold text-gray-600">{stats.completedLastMonth}</p>
            <p className="text-sm text-gray-700 mt-1">Tamamlanan Sefer</p>
            <p className="text-xs text-gray-600 mt-1">{prevMonthName}</p>
          </div>
        </div>
      </div>

      {/* All Clear State - Show Additional Stats */}
      {stats.pendingApprovalCount === 0 &&
       stats.truckWarningsCount === 0 &&
       stats.driverWarningsCount === 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Ek İstatistikler
          </h3>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Her şey yolunda! Ek istatistikler yakında eklenecek.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
