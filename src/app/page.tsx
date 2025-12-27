import Link from "next/link";

export default function Home() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
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
      {/* 装饰性渐变圆形 */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-60 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(255,182,193,0.6) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-50 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(135,206,250,0.6) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-[-10%] left-[30%] w-[450px] h-[450px] rounded-full opacity-50 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(152,251,152,0.5) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-[20%] right-[20%] w-[350px] h-[350px] rounded-full opacity-40 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(221,160,221,0.6) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-[50%] left-[10%] w-[300px] h-[300px] rounded-full opacity-40 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(255,255,180,0.5) 0%, transparent 70%)",
        }}
      />

      {/* 主内容 */}
      <main className="relative z-10 flex flex-col items-center text-center px-6">
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold mb-8 tracking-tight"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          前端工程师求职指北
        </h1>
        
        <p className="text-gray-600 text-lg sm:text-xl mb-12 max-w-md">
          系统练习前端面试常考题，助你斩获心仪 Offer ✨
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/bagu"
            className="group relative inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-white rounded-full overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            }}
          >
            <span className="relative z-10 flex items-center gap-2">
              📚 八股文
            </span>
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: "linear-gradient(135deg, #f5576c 0%, #f093fb 100%)",
              }}
            />
          </Link>

          <Link
            href="/code-editor"
            className="group relative inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-white rounded-full overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            <span className="relative z-10 flex items-center gap-2">
              🚀 刷题
            </span>
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: "linear-gradient(135deg, #764ba2 0%, #f093fb 100%)",
              }}
            />
          </Link>
        </div>
      </main>

      {/* 底部装饰 */}
      <footer className="absolute bottom-6 text-gray-500 text-sm">
        Made with 💖 for Frontend Engineers
      </footer>
    </div>
  );
}
