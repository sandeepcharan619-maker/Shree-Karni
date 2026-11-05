export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse p-2">
      {/* Top Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-300 rounded-md"></div>
          <div className="h-4 w-72 bg-gray-200 rounded-md"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-gray-200 rounded-lg"></div>
          <div className="h-9 w-32 bg-gray-300 rounded-lg"></div>
        </div>
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-gray-200 rounded"></div>
              <div className="h-7 w-7 rounded-full bg-gray-200"></div>
            </div>
            <div className="h-6 w-28 bg-gray-300 rounded"></div>
            <div className="h-3 w-36 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>

      {/* Main Table / Grid skeleton */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 bg-gray-300 rounded"></div>
          <div className="h-8 w-60 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="space-y-3 pt-4">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div key={row} className="h-12 w-full bg-gray-100 rounded-lg flex items-center px-4 gap-4">
              <div className="h-4 w-10 bg-gray-200 rounded"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-4 w-28 bg-gray-200 rounded ml-auto"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
