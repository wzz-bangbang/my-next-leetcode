import Header from '@/components/Header';

export default function CodeEditorLoading() {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* 左侧侧边栏骨架 */}
        <div className="hidden md:flex w-64 flex-shrink-0 border-r border-gray-200 bg-white/80 backdrop-blur-sm flex-col">
          {/* 搜索框骨架 */}
          <div className="p-3 border-b border-gray-100">
            <div className="h-9 bg-gray-100 rounded-lg animate-pulse" />
          </div>

          {/* 分类列表骨架 */}
          <div className="flex-1 p-2 space-y-1 overflow-hidden">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-9 bg-gray-100 rounded animate-pulse" />
                {i < 2 && (
                  <div className="pl-4 space-y-1">
                    <div className="h-8 bg-gray-50 rounded animate-pulse" />
                    <div className="h-8 bg-gray-50 rounded animate-pulse" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 flex min-h-0">
          {/* 题目描述区骨架 */}
          <div className="w-[40%] border-r border-gray-200 bg-white/70 backdrop-blur-sm flex flex-col">
            {/* 标题栏 */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-12 bg-green-100 rounded animate-pulse" />
                <div className="h-5 w-16 bg-blue-100 rounded animate-pulse" />
              </div>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* 内容区 */}
            <div className="flex-1 p-4 space-y-3 overflow-hidden">
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-4/5 bg-gray-100 rounded animate-pulse" />
              <div className="h-20 w-full bg-gray-800/10 rounded-lg animate-pulse mt-4" />
              <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>

          {/* 代码编辑区骨架 */}
          <div className="flex-1 flex flex-col">
            {/* 代码编辑器 */}
            <div className="flex-[65] border-b border-gray-200 bg-white/70 backdrop-blur-sm p-2">
              <div className="h-full bg-gray-50 rounded-lg animate-pulse" />
            </div>

            {/* 执行结果区 */}
            <div className="flex-[35] bg-white/70 backdrop-blur-sm p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-20 bg-blue-100 rounded animate-pulse" />
                <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-24 bg-gray-800/10 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
