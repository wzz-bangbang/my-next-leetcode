#### tailwind

#### less sass scss 作用

Less、Sass、SCSS*都是 CSS 预处理器。它们的作用是：

- **扩展 CSS 语言：** 引入了变量、嵌套、混合 (Mixins)、函数、继承、条件语句等编程特性，让 CSS 的编写更具逻辑性和可维护性。

- **提高开发效率：** 通过嵌套可以减少重复选择器；通过变量可以实现主题和统一管理颜色值。

- **编译到原生 CSS：** 浏览器无法直接识别预处理器的语法，因此它们都需要一个**编译 (Compile)** 过程，将其特有的语法转换为浏览器能理解的 **标准 CSS 文件**。

#### em rem

#### 小程序rpx和px在不同手机上有误差

误差的可能原因：当 `rpx` 换算成的 `px` 不是一个整数时，浏览器或小程序框架会进行取舍 。误差在小尺寸元素上（尤其是 1rpx 边框）表现最明显，因为取整直接影响了元素的显示或隐藏。

避免使用极小的 `rpx` 值。使用偶数的 rpx 值

#### 苹果手机1px

- **设备像素比 (DPR > 1)：** 在 iPhone 等高分屏设备上，`1px` (CSS 像素) 可能等于 $2$ 个或 $3$ 个物理像素。但开发者希望绘制的是**最细的 1 物理像素线**。

- **浏览器最小绘制限制：** 当你使用 `border: 1px solid #000;` 时，浏览器会将这个 CSS 像素值放大。如果你在 JavaScript 或 CSS 中尝试计算出 $0.5px$ 并应用，浏览器（尤其是 iOS 上的 Safari/WebView）可能会认为 $0.5px$ **低于其最小渲染阈值**，从而将该边框**优化（忽略）**掉，导致边框看起来被“隐藏”了。

解决方案：利用 CSS transform 缩放 (主流且有效)

该方案利用伪元素，将元素放大到 2 倍，然后使用 `transform: scale(0.5)` 缩放回 1 倍，达到 1 物理像素的边框效果。

#### meta标签

`<meta>` 标签用于定义 HTML 文档中的**元数据 (Metadata)**，即描述 HTML 文档本身的信息。它通常放在 `<head>` 标签内。

常见应用场景：

1. **字符集声明:** `<meta charset="UTF-8">`（**最重要**，定义文档的编码方式）。

2. **视口设置 (Viewport):** 移动端适配核心
   
   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
   
   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
   
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
   ```

#### 语义化标签的应用场景和优势

用恰当的 HTML 元素来描述内容的**结构和含义**，而不是仅仅关注其默认的样式

header nav main article section footer h1-h6  form等

可访问性 搜索引擎优化 可读性和可维护性  跨设备兼容性

#### Canvas vs SVG 的区别和选择

canvas 位图：图像复杂、像素操作多、需要频繁重绘

SVG 矢量图：图像简单、需要清晰缩放、需要与图形进行交互、需要良好的可访问性

#### HTML5 表单验证和自定义验证

#### CSS3 动画性能优化方案

性能优化核心是**减少重排 (Reflow/Layout)** 和**重绘 (Repaint)**，并尽可能利用 GPU 加速。

1.使用 `transform` 和 `opacity` 进行动画： 只会触发**合成 (Compositing)**，不会触发重排和重绘，性能最高，可以直接利用 GPU 加速。

2.开启 GPU 硬件加速：`transform: translateZ(0);` 或 `will-change: transform, opacity;`，将元素提升到合成层，利用 GPU 渲染

3.使用 `will-change` 属性：

4.避免使用 `all` 进行transition：

5.**减少 DOM 元素和层次：

#### 移动端 1px 边框问题解决方案

CSS `transform: scale()` 缩放 (主流推荐): 将元素的伪元素 (`::before` 或 `::after`) 设置为 `1px` 宽或高，然后通过 `transform: scale(0.5)` 将其在 Y 轴或 X 轴上缩放 50%

#### CSS 模块化和作用域方案

**CSS 模块化**的目的是解决 CSS 全局污染、命名冲突和样式依赖管理的问题。

#### 前端性能优化之 CSS 优化策略

1. **合并与压缩 CSS 文件：**

2. **利用媒体查询 (Media Queries) 按需加载：**
   
   使用 `<link rel="stylesheet" media="(max-width: 600px)" href="mobile.css">`，只有在符合条件时才加载相应样式。

3. **减少 CSS 嵌套和选择器复杂度：**
   
   复杂的选择器（如 `div > ul > li:last-child`）会增加浏览器计算匹配的成本。

4. 避免在 HTML 中使用内联样式 (`style="..."`)：内联样式会增加 HTML 文件体积，且不利于样式复用和缓存。

5. 将 `<link>` 标签放在 `<head>` 顶部：让浏览器尽快下载和解析 CSS，避免**白屏时间**过长。

#### ."请描述一个你如何使用SVG来增强网站视觉体验的情况。"

#### "解释CSS中的BEM命名方法，并展示如何使用它来组织你的样式表。

**BEM** 是 **Block (块)、Element (元素)、Modifier (修饰符)** 的缩写，是一种用于组织 CSS 类名的命名规范。它旨在解决 CSS 全局作用域带来的命名冲突和样式依赖问题，使样式代码更具可读性和可维护性。示例：.card__title--large   .card__image--dark

```css
.user-card {
    display: flex;
    padding: 20px;
    border: 1px solid #ccc;

    /* 2. Modifier: .user-card--vip (变体) */
    &--vip {
        border-color: gold;
        box-shadow: 0 0 5px gold;
    }
...
}
```

#### <mark>"你将如何处理跨浏览器的兼容性问题，尤其是在不同设备和操作系统上?"</mark>

- **制定统一的兼容性基线：**
  
  - 首先确定项目需要支持的**最低浏览器版本和设备范围**（如 IE11+、最近 2 个版本的 Chrome/Firefox/Safari/Edge、iOS 14+、Android 10+）。
  
  - **渐进增强 (Progressive Enhancement):** 优先保证核心功能在所有浏览器中可用，然后为现代浏览器添加高级功能和更优的体验。
  
  - **优雅降级 (Graceful Degradation):** 先为现代浏览器构建，然后确保在老旧浏览器中也能以合理的方式工作。

- **编码规范与工具：**
  
  - **CSS 前缀：** 使用 **Autoprefixer** 等工具，自动为 CSS3 属性（如 `transform`、`flex`、`grid`）添加必要的浏览器厂商前缀（如 `-webkit-`, `-moz-`）。
  
  - **CSS Reset/Normalize：** 使用 **Normalize.css** 或 **Reset.css** 来统一不同浏览器对标签默认样式的差异。
  
  - **Polyfills 和 Transpilers：**
    
    - 使用 **Babel** 将 ES6+ 的 JavaScript 语法编译为 ES5，以兼容老旧浏览器。
    
    - 使用 **Polyfills**（如 `core-js`）为老旧浏览器提供缺失的现代 API（如 `Promise`、`fetch`）。

- **兼容性处理技巧：**
  
  - **Flexbox/Grid 兼容性：** 明确知道哪些属性在旧版本浏览器上不支持，并提供备用方案（例如对不支持 Flexbox 的浏览器使用 `float` 布局）。
  
  - **特性检测：** 相比于用户代理 (UA) 检测，优先使用 **特性检测 (Feature Detection)**，如 Modernizr，来判断浏览器是否支持某一 CSS 或 JS 特性，并据此执行不同的代码分支。

- **测试与验证：**
  
  - 在真实的设备、操作系统和浏览器组合上进行测试。
  
  - 使用 **BrowserStack**、**Sauce Labs** 等云测试平台进行自动化和手动兼容性测试。
  
  - 利用 Chrome DevTools 的**设备模拟器**和**网络限速**功能进行快速调试

#### <mark>在一个复杂的页面上，用户操作导致多次不必要的DOM操作，你将如何优化它?</mark>

不必要的 DOM 操作是前端性能的常见瓶颈，因为它会频繁触发浏览器的 **重排 (Reflow/Layout)** 和 **重绘 (Repaint)**。优化策略核心是**减少操作次数**和**批量处理操作**。

1. **使用文档片段 (DocumentFragment) 批量操作：**
   
   - **原理：** `DocumentFragment` 是一个轻量级的容器，它**不是真实的 DOM 树的一部分**。将所有需要添加或修改的元素先插入到 `DocumentFragment` 中，然后只需进行**一次**操作，将 `DocumentFragment` 整体插入到 DOM 中。
   
   - **优化效果：** 只触发**一次**重排和重绘。

2. **避免频繁读写 DOM 属性：**
   
   - **问题：** 连续读取（如 `element.offsetWidth`）和写入（如 `element.style.width = '100px'`）操作会导致“强制同步布局”——浏览器为了保证读取到的值是最新的，会立即执行挂起的重排。
   
   - **优化：** 应该**先读取**所有需要的 DOM 属性，然后**集中进行写入**操作。

3. **使用防抖 (Debounce) 和节流 (Throttle)：**
   
   - **场景：** 针对用户输入、`resize`、`scroll`、`mousemove` 等高频触发的事件。
   
   - **防抖：** 将多次触发合并成一次，只在事件停止触发后执行一次（如搜索框输入）。
   
   - **节流：** 在一个时间周期内，事件只执行一次（如页面滚动）。

4. **使用 Virtual DOM (适用于组件化框架)：**
   
   - React、Vue 等框架通过 **Virtual DOM** 将所有的 DOM 操作放入内存中进行对比，计算出最小的更新路径，然后一次性批量应用到真实 DOM 上，从框架层面解决了不必要的 DOM 操作问题。

5. **用 CSS 类代替内联样式：**
   
   - 避免直接操作 `element.style`，因为它会导致样式计算和布局的开销。
   
   - **优化：** 预先定义好 CSS 类，通过增删改元素的 `className` 或 `classList` 来改变样式。

6. **将元素脱离文档流：**
   
   - 如果必须对一个元素进行多次复杂的 DOM 操作，可以先通过设置 `display: none` 或将其从 DOM 中移除，进行操作，然后重新插入/显示。脱离文档流的操作不会触发整个页面的重排。
