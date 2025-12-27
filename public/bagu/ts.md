#### type interface的区别

interface 接口 可合并可多次定义，更适合定义对象或者api的标准和形状

type不可多次声明，可以定义任何类型，包括对象、联合类型、交叉类型、原始类型、元组

为什么项目里会引入 TS

#### TypeScript 与 JavaScript 的主要区别是什么

ts:  **静态类型**：类型在代码编写时确定。必须通过 **TS 编译器**（或 Babel/SWC 等）编译成 JS 后才能执行；编译时检查，**类型安全**高；JS 的**超集**，包含了 JS 的所有特性

js：动态类型，类型在执行时确定；运行时检查，**类型安全**低（运行时错误多） 

#### 什么是联合类型 (`|`) 和交叉类型 (`&`)

联合类型  | （或） 表示一个值可以是所列类型中的任意一种。

交叉类型  &   (且)  **表示一个值必须同时满足所列的**所有类型。常用于合并接口或类型，实现 Mixin 效果。一个交叉类型对象必须拥有所有类型的属性。

#### 谈谈 `any` 和 `unknown` 的区别，推荐使用哪一个

any **完全禁用**类型检查。可以赋值给任何类型，**破坏**类型安全。可以随意访问属性或调用方法，可能导致运行时错误。

unknow  **严格类型检查**，除非明确类型收窄，否则无法使用。只能赋值给 `any` 或 `unknown` 本身，**保持**类型安全。**必须先进行类型收窄**（如 `if (typeof x === 'string')`），才能操作。

更推荐unknow 提供了一个类型安全的占位符

#### 什么是类型断言 (`as Type`)？什么时候应该避免使用它

类型断言是告诉 TypeScript 编译器“我比你更清楚这个变量的实际类型”的一种方式。它不会改变变量的运行时类型，只在编译时起作用

**应避免使用的场景：**

- **不确定的情况下：** 任何你不 100% 确定类型的时候。错误的断言会**绕过 TS 的保护**，导致在运行时出现错误（这是 TS 极力避免的）。

- **可以进行类型收窄的情况下：** 应优先使用类型保护（`if`, `instanceof` 等）进行收窄，而不是使用断言

#### 解释 `keyof` 和 `typeof` 的用法

| **`typeof`** | **值到类型**。获取一个 JavaScript **变量**或**表达式**的类型。   | 常用于获取函数的返回值类型，或从常量对象中提取类型。  |
| ------------ | --------------------------------------------- | --------------------------- |
| **`keyof`**  | **键名提取**。获取一个**对象类型**中所有属性名组成的**联合字符串字面量类型**。 | 常用于泛型约束，确保传入的属性名是对象中真实存在的键。 |

```js
const User = {
    name: 'Alice',
    age: 30
};

// 1. typeof：获取 User 变量的类型
type UserType = typeof User; // 结果: { name: string; age: number; }

// 2. keyof typeof：获取 User 类型的所有键名
type UserKeys = keyof typeof User; // 结果: "name" | "age"
```

#### `strict` 模式在 `tsconfig.json` 中有什么作用？你认为哪个子选项最重要

**`"strict": true`** 是 `tsconfig.json` 中的一个总开关，它同时开启了一系列严格的类型检查规则。它的作用是**最大化地提升代码的类型安全性**。

我认为 **`strictNullChecks`**（严格空值检查）是最重要的子选项。

- **作用：** 默认情况下，`null` 和 `undefined` 可以赋值给任何类型。开启后，`null` 和 `undefined` 只能赋值给它们自己的类型或 `any`，除非类型定义中明确包含它们（如 `string | null`）。

#### <mark>什么是装饰器 (Decorators)？它们在 TypeScript 中有什么典型应用</mark>

饰器是一种特殊的声明，它能够附加到类、方法、属性或参数上，用于**修改或扩展**这些目标的功能或行为。它们是 **ES 阶段性提案**，TS 率先实现。

装饰器本质上就是一个**函数**。这个函数在运行时会被调用，它接收关于被装饰目标的元数据（如目标类、方法名、属性描述符等），并可以通过返回新的值来**修改或替换**被装饰目标的定义。

装饰器允许我们在不修改原有类结构和代码的情况下，通过注入元数据或实现额外逻辑，对现有功能进行扩展。

1. 语法

装饰器使用 `@expression` 的形式，紧挨着要装饰的声明之前。

```ts
@sealed // 这是一个装饰器
class Example {
    @logMethod // 这是另一个装饰器
    myMethod() { }
}
```

2. 启用

装饰器目前是 ECMAScript 的**阶段性提案**（Stage 3），不是标准的 JS 语法。要在 TypeScript 中使用它，必须在 `tsconfig.json` 中启用：

JSON

```json
{
  "compilerOptions": {
    "experimentalDecorators": true, // 必须开启
    "emitDecoratorMetadata": true   // 如果需要依赖注入等元数据，也需要开启
  }
}
```

3.类型：类 属性 方法 Getter/Setter 方法参数

作用

1 依赖注入 (DI) 和框架配置，装饰器（或等效的语法）来标记类和处理依赖注入。比如vue-property-decorator

2 混入 (Mixins) 或功能增强（类装饰器）：可以利用类装饰器返回一个新的构造函数，为类添加新方法或属性：

3.运行时 添加通用逻辑（方法装饰器）：方法装饰器常用于不修改原函数体的情况下，在其执行前后添加通用逻辑

当一个声明上有多个装饰器时，它们的执行顺序如下：

1. **参数装饰器 $\to$ 属性装饰器 $\to$ 方法/访问器装饰器 $\to$ 类装饰器**（从内向外，从上到下）。

2. **同一类型装饰器：** 如果同一目标上有多个装饰器，它们会像函数组合一样，**从下到上**（从右到左）执行。

#### 如何在 TypeScript 中处理第三方库没有类型定义的问题

当引入一个没有内置类型定义的第三方 JS 库时，需要手动为其添加类型声明，以让 TS 编译器识别其结构。

**处理步骤：**

1. **检查 `@types/` 库：** 首先尝试npm 生态系统中有没有针对这个第三方 JavaScript 库的**对应的类型定义库**。比如@types/jquery  @types/lodash，有的话安装库就行了

2. **创建自定义声明文件 (`.d.ts`)：** 如果 `@types` 包不存在，需要手动创建声明文件，通常命名为 `custom.d.ts` 或 `library-name.d.ts`。
   
   a.**模块声明：** 使用 `declare module` 声明整个模块的类型。

```typescript
// my-library.d.ts
declare module 'my-library' {
   // 声明库导出的函数
   export function initialize(config: object): void;
   // 声明库导出的类
   export class AwesomeClient {
       connect(): Promise<string>;
   }
   // 声明默认导出
   export default AwesomeClient;
}
```

    b.全局变量声明：如果库是注入全局变量的（如 jQuery），则使用 `declare var` 或 `declare function`。

这样，TypeScript 编译器就会信任您提供的类型信息，并在您的项目代码中提供类型检查和智能提示。

注意：全局/局部声明：
如果是declare module xx{...}，就只针对引用这个module的模块，如果是有顶层export就只针对导入这个文件的模块，如果直接declare xx且文件里没有任何顶层export就是全局的

这里的**全局**和**局部（模块）**指的完全是 **TypeScript 编译器**对您的代码和声明文件（`.d.ts`）中**类型和标识符作用域**的认识

##### Extract pick omit用法

###### Extract 提取

- 是一个内置的工具类型，它的作用是**从一个联合类型中，提取出符合特定条件的成员**，并组成一个新的联合类型。

- 可以把它理解为联合类型的“过滤器”。支持**子类型**的匹配

- 原理：遍历 `T` 中的每一个成员。如果该成员能够赋值给 `U`，就保留它（返回 `T`）；否则就丢弃它（返回 `never`）。 `type MyExtract<T, U> = T extends U ? T : never;`

```ts
type Result = Extract<Type, Union>;

type Status = 'success' | 'error' | 'loading' | 'waiting';
// 我只想从中提取出 'error' 和 'success'
type FinalStatus = Extract<Status, 'success' | 'error'>;
// 结果：'success' | 'error'


type MyData = string | number | boolean | (() => void);
// 提取出所有可以赋值给 Function 的类型
type OnlyFunction = Extract<MyData, Function>; // 结果：() => void
```

###### Exclude 排除

**Exclude** 就是 **Extract** 的反义词

`Exclude<T, U>`：排除 `T` 中属于 `U` 的

```ts
type Status = 'success' | 'error' | 'loading';
type NoError = Exclude<Status, 'error'>; // 结果：'success' | 'loading'
```

###### Pick（挑选）

`Pick<Type, Keys>` 允许你从一个类型中，选择一组特定的属性来构造新类型。

- **语法**：`Pick<T, K>`，其中 `T` 是源类型，`K` 是由 `T` 的键组成的联合类型。

- **适用场景**：当你只需要一个大型对象中的某几个字段时

- **实现**：它遍历 `K` 中的每一个键，并在 `T` 中找到对应的类型。

###### Omit（剔除）

`Omit<Type, Keys>` 与 `Pick` 相反，它会从一个类型中剔除指定的属性，剩下的属性组成新类型。

- **语法**：`Omit<T, K>`。

- **适用场景**：当你想复用一个类型，但其中某个字段不需要，或者需要被重新定义时

- **实现**：它结合了 `Exclude` 和 `Pick`。先从 `T` 的所有键中排除掉 `K`，再把剩下的键 `Pick` 出来。

```ts
type Hello = { a: string; b: string; c: number };

// 使用 Pick 挑选属性
type OnlyAB = Pick<Hello, 'a' | 'b'>;
// 结果为：
// type OnlyAB = { a: string; b: string;}
```

###### 对比：

- **`Extract Exclude`**：操作的是**联合类型**，第二个参数是类型集合。是从一堆类型选项里选出几个

- **`Pick Omit`** 处理的是对象类型,  第二个参数是属性集合，根据属性键进行选择或忽略

- **`Pick`**：可以理解为白名单操作的是**对象接口（Interface/Object Type）**。它是从一个对象的属性里选出几个。 `Pick` 会严格检查选择的键是否存在于原类型中，如果你 Pick 一个不存在的键，编译器会报错

- **Omit**：可以理解为黑名单。在使用 `Omit` 时，TS **不会**检查你剔除的键是否存在于原类型中（因为 `K extends keyof any`）。

```ts
interface User {
  id: string;
  name: string;
  age: number;
}
// 剔除 id 属性
type CreateUserDto = Omit<User, 'id'>;
/*
等同于：
type CreateUserDto = {
  name: string;
  age: number;
};
*/
```

##### typeof keyof 用法

`typeof` 和 `keyof` 通常结合使用来实现“从值推导类型”或“从类型提取键”。

**`typeof obj`** 将 **JS 变量** 转为 **TS 类型**

**`keyof Type`**  操作的是类型，不是值，获取**TS 类型** 的所有 **键的合集**。 所以 `keyof U` 是一个联合类型，它包含了 `U` 类型的所有键名（字符串字面量类型）

**`keyof typeof obj`** 直接获取一个 **JS 变量** 的所有 **键名**

```ts
const Config = {
  endpoint: "https://api.example.com",
  timeout: 5000,
  retries: 3
};

// 1. 先用 typeof 把值转成类型
type ConfigType = typeof Config; 
// 结果: { endpoint: string; timeout: number; retries: number }

// 2. 再用 keyof 拿到所有的键，这里typeof Config就是类型
type ConfigKeys = keyof typeof Config; 
// 结果: "endpoint" | "timeout" | "retries"

// 3. 结合你的需求：获取特定的部分类型
type NetworkConfig = Pick<typeof Config, 'endpoint' | 'timeout'>;


// keyof操作类型别名（也是类型）
type Point = {
  x: number;
  y: number;
};
type PointKeys = keyof Point;  // "x" | "y"
```

##### ts数据类型

- boolean（布尔类型）
- number（数字类型）
- string（字符串类型）
- array（数组类型）
- null 和 undefined 类型
- object 对象类型
- tuple（元组类型） 允许表示一个已知元素数量和类型的数组，各元素的类型不必相同
- enum（枚举类型）
- void 类型  用于标识方法返回值的类型，表示该方法没有返回值
- any（任意类型）可以指定任何类型的值，不进行类型检查而是通过编译阶段的检查
- unknow 不确定的类型 ：**严格类型检查**，除非明确类型收窄，否则无法使用。
- never 类型 代表从不会出现的值，是其他所有类型的子类型，可以赋值给任何类型

```
let tupleArr:[number, string, boolean];
tupleArr = [12, '34', true]; //ok
typleArr = [12, '34'] // no ok

enum Color {Red, Green, Blue}
let c: Color = Color.Green;
```

##### ts类

形式跟`ES6`十分的相似，`typescript`在此基础上添加了修饰符：

- 公共 public：可以自由的访问类程序里定义的成员
- 私有 private：只能够在该类的内部进行访问（ ES6私有字段用#表示（ES2022））
- 受保护 protected：除了在该类的内部可以访问，还可以在子类中仍然可以访问
- 只读属性`readonly`：只读属性必须在声明时或构造函数里被初始化
- static (ES6 也有) ：静态属性/方法：是类的属性而不是实例的属性，直接通过类调用

```ts
class Square {
    static width: number // 类的属性
    public static height: number
    public name: string;     // 公开（默认）
    private secret: string;  // 仅类内访问
    protected age: number;   // 类和子类访问
    readonly id: number;     // 只读属性 
    public readonly publicReadonly: string  // 只读
    static readonly PI: number = 3.14159; // static + readonly
    public static readonly staticPublicReadonly: string = "";
    // 方法类似
```

###### 抽象类

抽象类做为其它派生类的基类使用，它们一般不会直接被实例化，不同于接口，抽象类可以包含成员的实现细节

`abstract`关键字是用于定义抽象类和在抽象类内部定义抽象方法，如下所示：

```ts
abstract class Animal {
    abstract makeSound(): void;
    move(): void {
        console.log('roaming the earch...');
    }
}

class Cat extends Animal {
    makeSound() {
        console.log('miao miao')
    }
}
const cat = new Cat()
cat.makeSound() // miao miao
cat.move() // roaming the earch...
```

###### 和ES6对比

TypeScript 类在 ES6 类的基础上增加了**静态类型系统**和**面向对象增强特性**。主要区别有：

1. **类型注解**：属性、方法、参数都有明确类型

2. **访问修饰符**：`public/private/protected/readonly`

3. **抽象类和抽象方法**：不会直接被实例化，不同于接口，抽象类可以包含成员的实现细节

4. **额外语法**：装饰器、泛型等

**关键理解**：TypeScript 类是带类型的 ES6 类，大部分特性在编译后会被移除，最终生成标准的 JavaScript 类。

##### ts 函数

默认参数：es6写法

剩余参数：es6写法

可选参数：ts

和ES6对比：TypeScript 函数在 ES6 函数的基础上增加了**静态类型系统**。主要区别有：

1. **类型注解+更严格的编译时检查**：参数、返回值都有明确类型

2. **函数重载**：支持多个函数签名，提高类型安全

3. **泛型函数**：支持类型参数化，创建可复用的函数模板

4. **可选参数语法**：使用 `?` 明确表示可选参数

##### 泛型

泛型允许编写代码时使用一些以后才指定的类型，在实例化时作为参数指明这些类型

在`typescript`中，定义函数，接口或者类的时候，不预先定义好具体的类型，而在使用的时候在指定类型的一种特性

泛型通过`<>`的形式进行表述，可以声明：函数  接口  类

```
function returnItem<T>(para: T): T {
    return para
}
interface ReturnItemFn<T> {
    (para: T): T
}
class Stack<T> {
    private arr: T[] = []

    public push(item: T) {
        this.arr.push(item)
    }
}
```

##### 高级类型

- 交叉类型 `T & U`

- 联合类型 `T | U`

- 条件类型 `T extends U ? X : Y`

- 类型别名 ,可以是泛型 ,也可以使用类型别名来在属性里引用自己：
  
  ```ts
  type some = boolean | string
  type Container<T> = { value: T }
  type Tree<T> = {
      value: T;
      left: Tree<T>;
  }
  ```

- 类型索引：keyof，类似于 `Object.keys` ，用于获取一个接口中 Key 的联合类型。

- 类型约束：通过关键字 `extend` 进行约束，泛型内使用的主要作用是对泛型加以约束
  
  ```ts
  type BaseType = string | number | boolean
  // 这里表示 copy 的参数
  // 只能是字符串、数字、布尔这几种基础类型
  function copy<T extends BaseType>(arg: T): T {
    return arg
  }
  ```

- 映射类型：通过 `in` 关键字做类型的映射，遍历已有接口的 `key` 或者是遍历联合类型
  
  ```ts
  type Readonly<T> = {
      readonly [P in keyof T]: T[P];
  };
  interface Obj {
    a: string
    b: string
  }
  type ReadOnlyObj = Readonly<Obj>
  // 等同于
  interface ReadOnlyObj {
      readonly a: string;
      readonly b: string;
  }
  ```

##### 命名空间

解决命名污染，使用 `namespace` 来定义，类似模块化

```ts
namespace SomeNameSpaceName {
   export interface ISomeInterfaceName {      }
   export class SomeClassName {      }
}
// 使用
SomeNameSpaceName.SomeClassName
```

##### ts条件判断

T extends U ：是 TypeScript 的条件类型语法，用于判断类型 `T` 是否可以赋值给类型 `U`，类似于判断 `T` 是否为 `U` 的子类型（或相同类型）。在分布式条件下，如果 `T` 是联合类型，那么会拆开每个成员分别判断。

```ts
type A = 'a' | 'b' | 'c';
type B = 'a' | 'b';

// 判断 'a' 是否可以赋值给 B？可以，因为 'a' 在 B 中。
// 判断 'b' 是否可以赋值给 B？可以。
// 判断 'c' 是否可以赋值给 B？不可以。

// 所以 Exclude<A, B> 会计算：
// 'a' extends B ? never : 'a' → never
// 'b' extends B ? never : 'b' → never
// 'c' extends B ? never : 'c' → 'c'
// 合并：never | never | 'c' → 'c'
```

###### 为什么 `string | null extends null` 是 `false`？

**理解 `extends` 的含义**：在 TypeScript 中，`T extends U` 表示：

- **类型 T 的值可以安全地赋值给类型 U 的变量**

- 或者说：**类型 T 是类型 U 的子类型**

##### infer

只能在 **条件类型 (Conditional Types)** 的 `extends` 子句中使用。在类型的条件判断中，“声明”一个变量来捕获（提取）某个特定的类型。

可以理解为：infer告诉编译器：不要让我手动指定这个类型，请你根据当前的上下文，帮我**推断**出这里的具体类型并挂载到变量名下。

我不需要知道 R 是什么，我让 TS 自己去“挖”，不是开发者指定的，是编译器“猜”出来的。

对比泛型：本质上是**参数**，调用时具体什么类型是明确的

可以像正则表达式一样拆分字符串。

```ts
// 不需要知道 R 是什么，我让 TS 自己去“挖”
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : any;
// 使用时：
type Result = MyReturnType<() => string>; 
// TS 就像做“填空题”一样，把 () => string 和 (...args: any[]) => R 对齐，
// 发现 R 的位置刚好是 string，于是 R 就被赋值为 string。

// 拆分字符串
type GetColor<T> = T extends `color:${infer C}` ? C : "unknown";
type MyColor = GetColor<"color:red">; // "red"
```

##### 映射

映射类型是一种语法结构，它允许我们通过遍历键来创建新类型。在类型定义中，我们只能有一个映射类型，因为映射类型本身就是一个完整的类型定义。

- **映射类型不能重复**：一个类型定义中只能有一个 `[P in ...]` 映射
- 映射类型的本质是**遍历键集合并生成属性**。如果有两个映射类型，会产生冲突

##### \- + 用法

- `-` 只能用于 `readonly` 和 `?`，**不能用于 `private`/`protected`!**

- 这些操作只能在映射类型（`[P in keyof T]`）中使用

- 可以组合使用：`-readonly -?`

- 可以递归应用以处理嵌套对象

添加修饰符（默认或显式使用 `+`）

```ts
// 显式添加（可选写法）
type ExplicitReadonly<T> = {
  +readonly [P in keyof T]: T[P];  // 显式添加 readonly
};

type ExplicitPartial<T> = {
  +? [P in keyof T]: T[P];  // 显式添加 ?
};
```

移除修饰符（使用 `-`）

```ts
// 移除 readonly
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

// 移除可选（?）
type Required<T> = {
  [P in keyof T]-?: T[P];
};

// 同时移除 readonly 和 ?
type MutableRequired<T> = {
  -readonly [P in keyof T]-?: T[P];
};
```

#### 映射类型

遍历一个类型的属性，并对每个属性应用某种转换，生成新的类型。注意不能遍历私有属性

核心语法：`{ [K in Keys]: Type }`

常用场景：批量修改修饰符；批量转换属性；批量改变键名

语法支持：条件过滤，as 断言

注意：

 **一个类型内部只能有一个映射类型**

**映射不处理私有和受保护属性**

**映射类型会保留索引签名**

keyof any = string | number | symbol

#### 手写题目：

1. 实现一个 `Partial<T>` 类型，将 T 中的所有属性变为可选。

2. 实现一个 `Required<T>` 类型，将 T 中的所有属性变为必选。

3. 实现一个 `Readonly<T>` 类型，将 T 中的所有属性变为只读。

4. 实现一个 `Pick<T, K>` 类型，从 T 中选取一组属性 K。

5. 实现一个 `Record<K, T>` 类型，构造一个对象类型，其键名为 K，键值为 T。

6. 实现一个 `Exclude<T, U>` 类型，从 T 中排除那些可以赋值给 U 的类型。

7. 实现一个 `Extract<T, U>` 类型，从 T 中提取那些可以赋值给 U 的类型。

8. 实现一个 `Omit<T, K>` 类型，从 T 中排除一组属性 K。

9. 实现一个 `NonNullable<T>` 类型，从 T (联合类型) 中排除 null 和 undefined。

10. 实现一个 `Merge<T, U>` 类型，将 U 的类型合并到 T 中，如果有重复则覆盖。

11. 实现一个 `Mutable<T>` 类型，移除 T 中所有属性的只读修饰符。

12. 实现 `TupleToUnion<T>` 元祖转为联合类型

13. 实现深度`DeepReadonly<T>`类型，将 T 中的所有属性（深度遍历）变为只读。

14. 实现`ReturnType<T>`获取函数返回值类型

15. 实现 `Parameters<T>` 获取函数参数类型

16. 实现`ConstructorParameters<T>` - 获取构造函数参数

```ts
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

type MyRequired<T> = {
  [K in keyof T]-?: T[K];
};

type MyReadonly<T> = {
  readonly [K in keyof T]-?: T[K];
};

type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

type MyOmit1<T, K extends keyof T> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};
type MyOmit2<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

type MyRecord<K extends keyof any, V> = {
  [P in K]: V;
};

type MyExclude<T, U> = T extends U ? never : T;

type MyExtract<T, U> = T extends U ? T : never;

// 对象类型的 移除恰好是 null/undefined 的属性
type RemoveNull<T> = {
  [P in keyof T as T[P] extends null | undefined ? never : P]: T[P];
};
// 如果属性值类型中包含 null 或 undefined 就移除
type RemoveAnyNullable<T> = {
  [P in keyof T as null extends T[P]
    ? never
    : undefined extends T[P]
    ? never
    : P]: T[P];
};
// 联合类型的
type MyNonNullable<T> = T extends null | undefined ? never : T;
// 常这么用
type MakeNonNullable<T> = {
  [P in keyof T]: MyNonNullable<T[P]>;
};

type MyMerge<T, U> = Omit<T, keyof U> & U;
type MyMerge2<T, U> = {
  [K in keyof T | keyof U]: K extends keyof U
    ? U[K]
    : K extends keyof T
    ? T[K]
    : never;
};

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

type TupleToUnion<T extends any[]> = T[number];

type MyReturnType<T extends (...args) => any> = T extends (...args) => infer R
  ? R
  : never;

// prettier-ignore
type MyParametersType<T extends (...args) => any> =
  T extends (...args: infer R) => any ? R : never;

type MyConstructorParameters<T extends new (...args: any) => any> =
  T extends new (...args: infer R) => any ? R : never;

type DeepReadonly<T> = {
  readonly [P in keyof T]: P extends object ? DeepReadonly<T[P]> : T[P];
};
```

#### 其他题目：

什么是类型收窄（Type Narrowing）

TypeScript中的tsconfig.json重要配置有哪些？

联合类型和交叉类型的区别是什么？

TypeScript项目中如何处理模块化？

什么是条件类型？如何使用？

如何在TypeScript中处理异步操作？

TypeScript中如何实现接口继承？

装饰器是什么？如何使用？

什么是泛型？为什么要使用泛型？

什么是类型断言？如何使用？

TypeScript中的基本类型有哪些？

TypeScript与JavaScript的区别是什么？
