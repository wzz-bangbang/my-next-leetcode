import Header from "@/components/Header";

export default function BaguPage() {
  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
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
      {/* 公共头部 */}
      <Header />

      {/* 主内容 */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        <h1
          className="text-4xl sm:text-5xl font-bold mb-8 tracking-tight"
          style={{
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          📚 八股文
        </h1>

        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg max-w-2xl w-full">
          <p className="text-gray-600 text-center text-lg">
            🚧 内容建设中，敬请期待...
          </p>
          
          <div className="mt-8 text-gray-500 text-sm">
            <p className="mb-2">即将涵盖：</p>
            <ul className="list-disc list-inside space-y-1">
              <li>JavaScript 核心概念</li>
              <li>CSS 布局与样式</li>
              <li>浏览器原理</li>
              <li>网络协议</li>
              <li>React / Vue 框架原理</li>
              <li>性能优化</li>
              <li>前端工程化</li>
            </ul>
          </div>
        </div>
      </main>

      {/* 装饰性元素 */}
      <div
        className="absolute top-[10%] right-[10%] w-[300px] h-[300px] rounded-full opacity-40 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(240,147,251,0.5) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-[10%] left-[10%] w-[350px] h-[350px] rounded-full opacity-40 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(245,87,108,0.4) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

