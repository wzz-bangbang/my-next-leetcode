#### tailwind

Tailwind 是一个原子化 CSS 框架，每个类名对应一个单独的 CSS 属性，通过组合类名来构建组件样式。  
 **优点**：1️⃣ 打包时只包含使用到的类，CSS 文件体积小；2️⃣ 响应式和状态样式有内置支持，熟悉后可快速阅读 HTML/JSX，无需跳转 CSS 文件。  
 **缺点**：1️⃣ HTML/JSX 中类名可能很长，阅读略困难；2️⃣ 对复杂动效和状态管理，需要组合更多类，前期学习成本高。

 简单一句话概括：**Tailwind 用类名组装替代传统 CSS，更轻量、可维护，但初学者上手和复杂交互处理略有挑战。**
#### less sass scss 作用

Less、Sass、SCSS*都是 CSS 预处理器。它们的作用是：

- **扩展 CSS 语言：** 引入了变量、嵌套、混合 (Mixins)、函数、继承、条件语句等编程特性，让 CSS 的编写更具逻辑性和可维护性。

- **提高开发效率：** 通过嵌套可以减少重复选择器；通过变量可以实现主题和统一管理颜色值。

- **编译到原生 CSS：** 浏览器无法直接识别预处理器的语法，因此它们都需要一个**编译 (Compile)** 过程，将其特有的语法转换为浏览器能理解的 **标准 CSS 文件**。

#### em rem

em 是以父元素font-size为基准，常用于局部比例计算
rem 是以页面根元素font-size为基准，常用于页面的整体适配

#### 小程序rpx和px在不同手机上有误差

误差的可能原因：当 `rpx` 换算成的 `px` 不是一个整数时，浏览器或小程序框架会进行取舍 。误差在小尺寸元素上（尤其是 1rpx 边框）表现最明显，因为取整直接影响了元素的显示或隐藏。

避免使用极小的 `rpx` 值。使用偶数的 rpx 值，必要时利用 CSS transform 缩放结合微元素 伪类解决。

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

1️. Canvas vs SVG 的本质区别

|特性|Canvas|SVG|
|---|---|---|
|绘制方式|**基于像素**，一次性绘制，渲染后不保留对象|**基于矢量**，DOM节点形式，每个图形元素可操作|
|更新|需要重绘整个画布或部分区域|可以单独操作某个元素，自动重渲染|
|性能|大量动态像素操作（游戏、动画）效率高|大量元素节点多时，性能可能下降|
|调试|不像 DOM 元素可直接 inspect，调试相对困难|可直接 inspect DOM 节点，样式、位置可见|
2️. 优缺点
 Canvas
- **优点**：
    - 适合大量动态渲染或复杂动画（游戏、可视化图表）
    - 渲染速度快，像素级控制灵活
- **缺点**：
    - 不保留对象，不容易对单个元素操作
    - 调试困难
    - 对响应式、交互事件支持有限
 SVG
- **优点**：
    - 矢量图形，缩放不失真
    - DOM 节点可操作，易调试，事件绑定方便
    - 适合图标、静态或轻量级动画
- **缺点**：
    - 大量节点性能开销大，不适合复杂动画或实时渲染

3️. 使用场景参考
- **Canvas**：游戏渲染、粒子动画、复杂图表、图像处理
- **SVG**：图标、流程图、矢量图、轻量动画、交互图表

总结：Canvas 是基于像素的绘制方式，渲染后不保留对象，适合大量动态渲染和复杂动画，但调试相对困难；SVG 是基于矢量的，每个元素都是 DOM 节点，可单独操作，适合图标、静态图、轻量动画。选择时一般原则：**动态、像素级操作选 Canvas，静态或矢量图形选 SVG**
#### HTML5 表单验证和自定义验证
1. HTML5 表单验证，原生提供了**内置验证属性**，常见的有：
	- **required**：必填字段
	- **type**：比如 `email`、`number`、`url`，浏览器会自动检查格式
	- **pattern**：自定义正则，匹配特定格式
	- **min / max / step**：数值范围限制
	- **maxlength / minlength**：字符长度限制
	- 特点：
		- 浏览器自动触发验证
		- 不需要 JS 代码
		- 用户体验好，移动端也会弹出原生提示
2. 自定义验证：有些场景 HTML5 自带的验证无法满足，比如：
	- 复杂密码规则
	- 异步验证（用户名是否已存在）
	- 联动验证（两个字段必须匹配）
   这时就需要**JavaScript 自定义验证**，常用方法：
	1. **oninput / onchange**：输入实时验证
	2. **onSubmit 拦截**：`form.addEventListener('submit', function(e) {...}`
总结：HTML5 表单验证主要分两类：一是浏览器原生验证，通过 `required`、`type`、`pattern`、`min/max` 等属性自动检查输入；二是自定义验证，通过 JavaScript 检查复杂逻辑或异步条件，并通过 Constraint Validation API 或表单 submit 事件阻止非法提交。原生验证简单易用，但灵活性有限，自定义验证可以覆盖更复杂的场景。
#### CSS3 动画性能优化方案

性能优化核心是**减少重排 (Reflow/Layout)** 和**重绘 (Repaint)**，并尽可能利用 GPU 加速。

1.使用 `transform` 和 `opacity` 进行动画： 只会触发**合成 (Compositing)**，不会触发重排和重绘，性能最高，可以直接利用 GPU 加速。

2.开启 GPU 硬件加速：`transform: translateZ(0);` 或 `will-change: transform, opacity;`，将元素提升到合成层，利用 GPU 渲染

3.使用 `will-change` 属性：

4.避免使用 `all` 进行transition：

5.**减少 DOM 元素和层次：

#### CSS 模块化和作用域方案

目的：
- **解决全局污染：** 默认情况下，CSS 所有的选择器都是全局的。不同组件同名的 `.title` 会相互覆盖。
- **提高复用性：** 像 JS 模块一样方便地导入、导出样式。
- **提升维护性：** 明确样式与组件的绑定关系，删除组件时能放心地删除其样式。

核心原理：
1. **命名约定/空间隔离：** 通过人为约定的规范（如 BEM）来模拟作用域。
2. **构建转换（哈希化）：** 通过构建工具（Webpack/Vite）自动重命名选择器。
    - **原理：** 当你导入一个 CSS 模块时，编译器会将你的类名（如 `.button`）转换成一个唯一的哈希字符串（如 `._button_x1y2z`）。
    - **映射：** 编译器会生成一个 JSON 映射表，让 JS 能够引用这个变色后的类名。

常见方案：
1. CSS Modules：基于 JS 映射的哈希化。开发者编写正常的 CSS 文件（通常命名为 `.module.css`），打包工具在构建时对类名进行转换增加hash，比如`._title_1a2b3_5`，并把引用处也做相同的修改。
2. Scoped CSS：基于属性选择器的隔离： 打包工具在编译模板时，会给该组件内所有的 DOM 节点加上一个唯一的属性，例如 `data-v-7ba5bd90`，同时将对应的 CSS 选择器转换增加属性选择。
3. Tailwind CSS：基于原子类的预扫描方案，不进行类名哈希化。优点是按需编译和极致复用。
#### 前端性能优化之 CSS 优化策略

1. **合并与压缩 CSS 文件：**

2. **利用媒体查询 (Media Queries) 按需加载：**
   
   使用 `<link rel="stylesheet" media="(max-width: 600px)" href="mobile.css">`，只有在符合条件时才加载相应样式。

3. **减少 CSS 嵌套和选择器复杂度：**
   
   复杂的选择器（如 `div > ul > li:last-child`）会增加浏览器计算匹配的成本。

4. 避免在 HTML 中使用内联样式 (`style="..."`)：内联样式会增加 HTML 文件体积，且不利于样式复用和缓存。

5. 将 `<link>` 标签放在 `<head>` 顶部：让浏览器尽快下载和解析 CSS，避免**白屏时间**过长。

#### 解释CSS中的BEM命名方法，并展示如何使用它来组织你的样式表。

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

#### 在一个复杂的页面上，用户操作导致多次不必要的DOM操作，你将如何优化它?

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
