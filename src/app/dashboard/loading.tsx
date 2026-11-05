export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-[1600px] mx-auto p-2">
      {/* Top Associate Profile Card + Banner Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Profile Card */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-xs border border-gray-100 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 shrink-0"></div>
            <div className="space-y-2 flex-1">
              <div className="h-5 w-36 bg-gray-300 rounded"></div>
              <div className="h-3 w-24 bg-gray-200 rounded"></div>
              <div className="h-3 w-32 bg-gray-100 rounded"></div>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100 grid grid-cols-3 gap-2">
            <div className="h-10 bg-gray-100 rounded"></div>
            <div className="h-10 bg-gray-100 rounded"></div>
            <div className="h-10 bg-gray-100 rounded"></div>
          </div>
        </div>

        {/* Right Banner + KPI Cards */}
        <div className="lg:col-span-8 flex flex-col justify-between gap-3">
          <div className="h-28 bg-gray-200 rounded-2xl w-full"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2 Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 h-64 bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
          <div className="h-5 w-40 bg-gray-200 rounded mb-4"></div>
          <div className="h-44 bg-gray-100 rounded"></div>
        </div>
        <div className="lg:col-span-5 h-64 bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
          <div className="h-5 w-40 bg-gray-200 rounded mb-4"></div>
          <div className="h-44 bg-gray-100 rounded"></div>
        </div>
      </div>
    </div>
  );
}
