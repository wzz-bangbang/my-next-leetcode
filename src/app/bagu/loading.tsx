import Header from '@/components/Header';

export default function BaguLoading() {
  return (
    <div className="h-screen flex flex-col relative overflow-hidden bg-white">
      {/* 淡色装饰背景 */}
      <div className="page-bg-decoration page-bg-bagu-1" />
      <div className="page-bg-decoration page-bg-bagu-2" />

      <Header />
      
      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        {/* 左侧骨架 - PC端 */}
        <div
          className="hidden md:flex w-[32%] min-w-[260px] max-w-[400px] shrink-0 border-r border-purple-200/50 flex-col min-h-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(139,92,246,0.05) 0%, rgba(167,139,250,0.03) 100%), #ffffff',
          }}
        >
          {/* 头部骨架 */}
          <div className="px-3 md:px-4 py-2 md:py-3 border-b border-purple-200/50 bg-white/20 shrink-0">
            {/* 标题和统计 */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="h-4 w-20 bg-purple-200/50 rounded animate-pulse mb-1" />
                <div className="h-3 w-28 bg-gray-200/50 rounded animate-pulse" />
              </div>
            </div>
            {/* 随机模拟按钮骨架 */}
            <div className="h-8 w-full bg-pink-100/50 rounded-full animate-pulse mt-2.5" />
            {/* 筛选按钮骨架 */}
            <div className="flex gap-2 mt-2.5">
              <div className="h-7 flex-1 bg-green-100/50 rounded-full animate-pulse" />
              <div className="h-7 flex-1 bg-yellow-100/50 rounded-full animate-pulse" />
            </div>
          </div>
          
          {/* 分类列表骨架 */}
          <div className="flex-1 py-1 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="mb-0.5">
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-gray-200/50 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-gray-200/50 rounded animate-pulse" />
                  </div>
                  <div className="h-3 w-6 bg-gray-200/30 rounded animate-pulse" />
                </div>
                {i < 2 && (
                  <div className="bg-white/20 space-y-0.5">
                    <div className="pl-10 pr-3 py-2">
                      <div className="h-4 w-32 bg-gray-200/30 rounded animate-pulse" />
                    </div>
                    <div className="pl-10 pr-3 py-2">
                      <div className="h-4 w-40 bg-gray-200/30 rounded animate-pulse" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 右侧骨架 */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          {/* 移动端选择栏骨架 */}
          <div className="md:hidden shrink-0 px-2 py-1.5 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
            <div className="h-9 bg-purple-100/50 rounded-full animate-pulse" />
          </div>

          {/* PC端标题栏骨架 */}
          <div className="hidden md:block shrink-0 px-6 py-4 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="h-6 w-16 bg-purple-100 rounded-full animate-pulse" />
              <div className="flex items-center gap-2">
                <div className="h-7 w-16 bg-yellow-100/50 rounded-full animate-pulse" />
                <div className="h-7 w-16 bg-green-100/50 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="h-6 w-56 bg-gray-200 rounded animate-pulse" />
          </div>
          
          {/* 内容骨架 */}
          <div className="flex-1 p-2.5 sm:p-6 bg-white/30 backdrop-blur-sm space-y-4">
            <div className="h-4 w-full bg-gray-200/50 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-gray-200/50 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-200/50 rounded animate-pulse" />
            <div className="h-24 sm:h-32 w-full bg-gray-100/80 rounded-lg animate-pulse mt-4" />
            <div className="h-4 w-2/3 bg-gray-200/50 rounded animate-pulse" />
            <div className="h-4 w-4/5 bg-gray-200/50 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

