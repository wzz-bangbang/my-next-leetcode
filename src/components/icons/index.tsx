/**
 * 统一导出项目使用的 Lucide 图标
 * 方便管理和后续维护
 */
import {
  // 导航和通用
  BookOpen,
  Rocket,
  Star,
  Heart,

  // 分类图标 - 八股文
  FileText,
  BookType,
  Palette,
  Atom,
  Globe,
  Wifi,
  Triangle,
  Wrench,
  RefreshCcw,
  Lightbulb,
  Smartphone,
  Bot,
  WandSparkles,
  Scale,
  Users,
  FileCode,

  // 分类图标 - 代码题
  Search,
  PenTool,
  Calculator,

  // 功能图标
  Copy,
  ClipboardList,
  Dices,
  X,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Check,
  Clock,
  Play,
  Monitor,
  CircleX,
  Save,
  Trash2,
  FileDown,
  FlaskConical,
  HelpCircle,
  Menu,

  // 状态和装饰
  Sparkles,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

// 统一的图标样式 props
export interface IconProps {
  size?: number;
  className?: string;
}

// 导航图标
export const BookOpenIcon = BookOpen;
export const RocketIcon = Rocket;
export const StarIcon = Star;
export const StarFilledIcon = ({ size = 16, className = '' }: IconProps) => (
  <Star size={size} className={className} fill="currentColor" />
);
export const HeartIcon = Heart;

// 八股文分类图标
export const JsBasicIcon = FileText;        // JS基础 - 📜
export const TypeScriptIcon = BookType;     // TypeScript - 📘
export const CssHtmlIcon = Palette;         // CSS & HTML - 🎨
export const ReactIcon = Atom;              // React - ⚛️
export const VueIcon = ({ size = 16, className = '' }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M24 1.61h-9.94L12 5.16 9.94 1.61H0l12 20.78L24 1.61zM12 14.08L5.16 2.23h4.43L12 6.41l2.41-4.18h4.43L12 14.08z"/>
  </svg>
);                                          // Vue - 💚
export const BrowserIcon = Globe;           // 浏览器 - 🌐
export const NetworkIcon = Wifi;            // 网络 - 📶
export const NextjsIcon = Triangle;         // Next.js - ▲
export const EngineeringIcon = Wrench;      // 工程化 - 🔧
export const CicdIcon = RefreshCcw;         // CI&CD - 🚀->🔄
export const OpenQuestionsIcon = Lightbulb; // 开放题 - 💡
export const MiniprogramIcon = Smartphone;  // 小程序 - 📱
export const AiToolsIcon = Bot;    // AI工具 - 🧠
export const AiFrontendIcon = WandSparkles; // AI前端开发 - ✨
export const TechSelectionIcon = Scale;     // 技术选型 - ⚖️
export const TeamworkIcon = Users;          // 工作协作 - 🤝->👥

// 代码题分类图标
export const JsAnalysisIcon = Search;       // JS代码分析题 - 🔍
export const JsHandwriteIcon = PenTool;     // JS手写题 - ✍️
export const TsTypeIcon = BookType;         // TS类型题 - 📘
export const AlgorithmIcon = Calculator;    // 算法题 - 🧮

// 功能图标
export const CopyIcon = Copy;               // 复制 - 📋
export const ClipboardIcon = ClipboardList; // 执行结果 - 📋
export const DiceIcon = Dices;              // 随机模拟 - 🎲
export const CloseIcon = X;                 // 关闭 - ✕
export const ChevronRightIcon = ChevronRight; // 展开箭头 - ▶
export const ChevronDownIcon = ChevronDown;
export const ChevronLeftIcon = ChevronLeft;
export const CheckIcon = Check;             // 完成 - ✅
export const ClockIcon = Clock;             // 等待 - ⏳
export const PlayIcon = Play;               // 执行 - ▶
export const MonitorIcon = Monitor;         // Console - 🖥️
export const ErrorIcon = CircleX;           // 错误 - ❌
export const SaveIcon = Save;               // 保存 - 💾
export const TrashIcon = Trash2;            // 清空 - 🗑️
export const TemplateIcon = FileDown;       // 模板 - 📋
export const TestIcon = FlaskConical;       // 用例 - 🧪
export const QuestionIcon = HelpCircle;     // 暂无内容 - ❓
export const MenuIcon = Menu;               // 菜单 - ☰

// 状态和装饰图标
export const SparklesIcon = Sparkles;       // 装饰 - ✨
export const ArrowLeftIcon = ArrowLeft;     // 上一题 - ←
export const ArrowRightIcon = ArrowRight;   // 下一题 - →
export const FileIcon = FileCode;           // 默认文件图标 - 📄
export const NoteIcon = ({ size = 16, className = '' }: IconProps) => (
  <FileText size={size} className={className} />
);                                          // 暂无答案 - 📝
export const ComputerIcon = Monitor;        // 请使用电脑 - 💻
