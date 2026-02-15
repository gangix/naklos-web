import { TRUCKS } from '../constants/text';

const TrucksPage = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{TRUCKS.title}</h1>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        <button className="px-4 py-2 bg-primary-600 text-white rounded-full text-sm font-medium whitespace-nowrap">
          {TRUCKS.all}
        </button>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium whitespace-nowrap">
          {TRUCKS.available}
        </button>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium whitespace-nowrap">
          {TRUCKS.inTransit}
        </button>
        <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium whitespace-nowrap">
          {TRUCKS.maintenance}
        </button>
      </div>

      {/* Truck list */}
      <div className="space-y-3">
        {[
          { plate: '34 ABC 123', status: 'available', driver: 'Müsait' },
          { plate: '34 DEF 456', status: 'in-transit', driver: 'Mehmet Yılmaz' },
          { plate: '06 GHI 789', status: 'in-transit', driver: 'Ali Demir' },
          { plate: '34 JKL 012', status: 'available', driver: 'Müsait' },
        ].map((truck) => (
          <div key={truck.plate} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">{truck.plate}</p>
                <p className="text-sm text-gray-600 mt-1">{truck.driver}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  truck.status === 'available'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {truck.status === 'available' ? TRUCKS.available : TRUCKS.inTransit}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrucksPage;
