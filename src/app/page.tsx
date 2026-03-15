import Link from "next/link";
import Preloader from "@/components/Preloader";
import HomeLoginButton from "../components/HomeLoginButton";
import { BookOpenIcon, RocketIcon, SparklesIcon, HeartIcon } from "@/components/icons";
import { iconSize } from "@/styles/theme";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-white">
      {/* 右上角登录按钮 */}
      <HomeLoginButton />

      {/* 淡色装饰背景 */}
      <div
        className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(168, 85, 247, 0.6) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99, 102, 241, 0.6) 0%, transparent 70%)" }}
      />

      {/* 主内容 */}
      <main className="relative z-10 flex flex-col items-center text-center px-6">
        <h1
          className="text-4xl sm:text-5xl md:text-6xl font-bold mb-8 tracking-tight"
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #a855f7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          前端工程师求职指北
        </h1>

        <p className="text-gray-600 text-lg sm:text-xl mb-12 max-w-md flex items-center justify-center gap-1.5">
          系统练习前端面试常考题，助你斩获心仪 Offer
          <SparklesIcon size={iconSize.lg} className="text-yellow-500" />
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          {/* 八股题按钮 - 渐变边框 */}
          <Link
            href="/bagu"
            className="btn-gradient-border btn-gradient-bagu group inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <span className="flex items-center gap-2">
              <BookOpenIcon size={iconSize.lg} />
              八股题
            </span>
          </Link>

          {/* 手写题按钮 - 渐变边框 */}
          <Link
            href="/code-editor"
            className="btn-gradient-border btn-gradient-code group inline-flex items-center justify-center px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <span className="flex items-center gap-2">
              <RocketIcon size={iconSize.lg} />
              手写题
            </span>
          </Link>
        </div>
      </main>

      {/* 底部装饰 */}
      <footer className="absolute bottom-6 text-gray-400 text-sm flex items-center gap-1.5">
        Made with <HeartIcon size={iconSize.sm} className="text-pink-400" fill="currentColor" /> for Frontend Engineers
      </footer>

      {/* 预加载八股数据 */}
      <Preloader />
    </div>
  );
}
