import Header from '@/components/Header';

export default function BaguLoading() {
  return (
    <div
      className="h-screen flex flex-col relative overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(255, 182, 193, 0.4) 0%,
            rgba(152, 251, 152, 0.3) 25%,
            rgba(135, 206, 250, 0.4) 50%,
            rgba(221, 160, 221, 0.3) 75%,
            rgba(255, 255, 224, 0.4) 100%
          )
        `,
      }}
    >
      <Header />
      
      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        {/* 左侧骨架 - PC端 */}
        <div
          className="hidden md:flex w-[32%] min-w-[260px] max-w-[400px] flex-shrink-0 backdrop-blur-md border-r border-purple-200/50 flex-col min-h-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(139,92,246,0.15) 0%, rgba(167,139,250,0.1) 100%)',
          }}
        >
          <div className="px-4 py-3 border-b border-purple-200/50 bg-white/20 flex-shrink-0">
            <div className="h-4 w-24 bg-purple-200/50 rounded animate-pulse mb-2" />
            <div className="h-3 w-32 bg-gray-200/50 rounded animate-pulse" />
          </div>
          
          <div className="flex-1 p-4 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-8 bg-white/30 rounded animate-pulse" />
                {i < 2 && (
                  <div className="pl-6 space-y-1">
                    <div className="h-6 bg-white/20 rounded animate-pulse" />
                    <div className="h-6 bg-white/20 rounded animate-pulse" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 右侧骨架 */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          {/* 移动端选择栏骨架 */}
          <div className="md:hidden flex-shrink-0 px-3 py-2.5 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
            <div className="h-12 bg-white/60 rounded-lg animate-pulse" />
          </div>

          {/* 标题栏骨架 */}
          <div className="flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-16 bg-purple-100 rounded-full animate-pulse" />
              <div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" />
            </div>
            <div className="h-5 sm:h-6 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          
          {/* 内容骨架 */}
          <div className="flex-1 p-3 sm:p-6 bg-white/30 backdrop-blur-sm space-y-4">
            <div className="h-4 w-full bg-gray-200/50 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-200/50 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-200/50 rounded animate-pulse" />
            <div className="h-24 sm:h-32 w-full bg-gray-800/20 rounded-lg animate-pulse mt-4" />
            <div className="h-4 w-2/3 bg-gray-200/50 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

