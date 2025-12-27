fiber：

1、具体做了什么事情
2、具体场景的执行优先级
3、怎么进行任务的终止的

commit阶段过程

render阶段过程

如何实现时间切片

fiber为什么是性能飞跃

为什么react更适合B端大型项目

为什么说react的组件和逻辑抽象和复用比vue强

那 react自定义hooks 和 Vue3 composable 本质区别？

React 组件高度抽象和复用的自由有没有代价？

React 组合能力强会带来哪些坑？

hooks 原理

为什么只能在顶层

看过 hooks 相关的草案吗

hook的闭包陷阱 如何解决

为什么usestate返回数组而不是对象

useeffect如何实现

usestate如何实现

useEffect怎么支持async await

react.memo的第二个参数是什么 作用

memo为什么一定要和useMemo结合使用

ref useref forwardRef 区别和作用

useReducer的理解

能否之间把prop赋值给state

react组件间通信的方式

除了 redux mbox dva 还用过其他的 状态管理没

对比redux zustand 

redux中间件的原理 举个例子

redux的使用原则

react 做了哪些事件优化

说说react的事件代理

子组件portal能冒泡到父组件吗

组件状态保存keep-alive

路由懒加载原理

link标签和a标签的区别

实现useUpdate useAsyncEffect useDebounce useTimeout

对比class组件和hook模拟生命周期的实现方式

17 18 19新特性

函数组件和类组件的本质区别？代码层面如何判断

jsx转DOM过程

diff算法核心

react性能优化

说说useReducer

对比useReducer和useState

18以前为什么useState不能批量更新，18以后为什么可以： 18以前在浏览器原生事件（如 setTimeout、Promise 回调、addEventListener 内部）中，React 认为已经脱离了控制流，也就是他们的回调是在一个全新的、异步的、与 React 渲染无关的执行上下文中运行的，所以setstate无法批量更新
