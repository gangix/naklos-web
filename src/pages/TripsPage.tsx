import { TRIPS } from '../constants/text';

const TripsPage = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{TRIPS.title}</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button className="px-4 py-2 text-primary-600 border-b-2 border-primary-600 font-medium">
          {TRIPS.active}
        </button>
        <button className="px-4 py-2 text-gray-600 font-medium">
          {TRIPS.completed}
        </button>
      </div>

      {/* Trip list */}
      <div className="space-y-3">
        {[
          {
            route: 'Istanbul → Ankara',
            client: 'Anadolu Gıda A.Ş.',
            truck: '34 ABC 123',
            revenue: '₺12,500',
          },
          {
            route: 'Istanbul → İzmir',
            client: 'Ege Tekstil Ltd.',
            truck: '34 DEF 456',
            revenue: '₺18,000',
          },
          {
            route: 'Ankara → Antalya',
            client: 'Akdeniz Mobilya',
            truck: '06 GHI 789',
            revenue: '₺22,000',
          },
        ].map((trip, index) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-gray-900">{trip.route}</p>
                <p className="text-sm text-gray-600 mt-1">{trip.client}</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {TRIPS.inTransit}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{trip.truck}</span>
              <span className="font-bold text-green-600">{trip.revenue}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TripsPage;
