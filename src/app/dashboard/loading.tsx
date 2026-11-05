export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-[1600px] mx-auto p-2">
      {/* Universal Page Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-200">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-gray-300 rounded-md"></div>
          <div className="h-4 w-72 bg-gray-200 rounded-md"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 bg-gray-200 rounded-lg"></div>
          <div className="h-9 w-32 bg-gray-300 rounded-lg"></div>
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-gray-200 rounded"></div>
              <div className="h-6 w-6 rounded-full bg-gray-200"></div>
            </div>
            <div className="h-6 w-24 bg-gray-300 rounded"></div>
            <div className="h-3 w-32 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>

      {/* Main Content / Table Skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="h-5 w-44 bg-gray-300 rounded"></div>
          <div className="h-8 w-64 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="h-12 w-full bg-gray-50 rounded-lg flex items-center px-4 gap-4">
              <div className="h-4 w-8 bg-gray-200 rounded"></div>
              <div className="h-4 w-36 bg-gray-200 rounded"></div>
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-4 w-28 bg-gray-200 rounded"></div>
              <div className="h-4 w-20 bg-gray-200 rounded ml-auto"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
