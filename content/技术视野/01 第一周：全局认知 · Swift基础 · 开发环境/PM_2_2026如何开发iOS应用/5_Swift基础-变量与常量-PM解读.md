---
publish: true
---

# 5_Swift基础-变量与常量 (iOS 2026版 - PM 零基础精讲版)

> **本章学习目标**：掌握轻量级代码测试工具 Xcode Playground 的使用，理解 Swift 变量（var）与常量（let）的底层内存逻辑，分清四大核心数据类型，并学会为您的卡牌游戏进行基础数据建模。

---

## 📖 1. 本章名词字典 (Glossary for PM)

| 英文技术名词 | 研发口头禅 | 大白话通俗解释 (PM Metaphor) |
| :--- | :--- | :--- |
| **Playground** | “在 Playground 里跑段代码” | **“极简草稿练习纸”**。Xcode 内置的独立轻量代码运行环境。无需创建完整的手机 App、无需拉起模拟器，写完代码一秒内直接在控制台输出计算结果，极速练手利器。 |
| **Redeclaration** | “报错：重复声明” | **“重造已有的抽屉”**。Swift 的底线规则。在同一块代码里，一个箱子名只能用 var 或 let **创建一次**。后续改写数值直接写名字，绝不准再次加 var/let。 |
| **Type Inference** | “编译器自动类型推断” | **“一眼定乾坤的自动归类员”**。Swift 的智能机制。写代码时不写 `: Int`。如果你写 `var score = 10`，电脑看它没小数点，自动把箱子定性为 Int 整数箱。 |
| **Type Safety** | “类型安全卡死” | **“铁面无私的安检员”**。一旦某个变量被归类为 Int 整数。如果你在后续代码写 `score = "Hello"`，编译器在编译时会直接报红线报错，不允许打包。 |

---

## 🧭 2. 教程步骤逐步拆解 (Step-by-Step Breakdown)

### 2.1 启动 Playground 进行测试
1. 在 Xcode 菜单栏选择 `File -> New -> Playground`。选择 **iOS -> Blank** 模板。
2. 鼠标悬停在左侧的代码行号上，会出现一个 **蓝色三角形的 Play 运行按钮**。
3. 点击它，Playground 会自动编译并运行从第一行到当前行的所有代码，并将 print 的日志瞬间打在底部的 **Console 控制台** 上（快捷键 `Cmd + Shift + Y` 开关控制台）。

---

## 💻 3. 代码逐句大白话解剖 (Line-by-Line Code Breakdown)

请看 Playground 中关于变量、常量的基本运算代码解剖：

```swift
import UIKit

// ==================== 1. 常量 (锁死保险箱 let) ====================
let gameTitle = "War Card Game"
print(gameTitle) // 控制台输出: War Card Game
// gameTitle = "New Game" // ❌ 这一行若取消注释会报错！因为 let 常量不可修改值

// ==================== 2. 变量 (可变抽屉 var) ====================
// 显式标注这三个箱子只能装 Int (整数)
var playerScore: Int = 0
var cpuScore: Int = 0

// 3. 模拟玩家赢了一局：数值累加
// 方式 A：传统写法
playerScore = playerScore + 1 // 拿出现在 playerScore 的值 (0) 加 1，再塞回自身。此时为 1

// 方式 B：简写自增赋值运算符
playerScore += 1 // 💡 大白话：等同于 playerScore = playerScore + 1。此时累加到 2

print("当前 Player 分数: \(playerScore)") // 字符串插值输出: 当前 Player 分数: 2

// 4. 模拟电脑赢了
cpuScore += 1
print("当前 CPU 分数: \(cpuScore)") // 输出: 当前 CPU 分数: 1
```

---

## 🏗 5. 实战数据建模：将游戏状态（State）抽象为变量

结合我们上一话设计的 War Card Game UI 界面，我们需要在代码底层用常量和变量把游戏的状态定义出来，这就叫**数据建模（Data Modeling）**：

```swift
// 💡 用 Swift 变量声明游戏底盘数据：

let maxRounds = 12 // 1. 游戏单局最大轮数设为 12。恒定不变，用 let

var playerScore = 0 // 2. 玩家分数。游戏运行中会变化，用 var
var cpuScore = 0    // 3. 电脑分数。会变，用 var

var playerCardName = "card3"  // 4. 玩家当前卡牌图片名。会变，用 var
var cpuCardName = "card11"    // 5. 电脑当前卡牌图片名。会变，用 var

var isDealing = false // 6. “发牌动画中”的布尔值开关。状态会变，用 var
```

#### 🔍 建模思路解剖：
* **为什么图片名设为字符串 `String` 变量**：
  * 因为在 Assets 仓库里，我们的卡牌图片是以 `"card2"` 到 `"card14"` 的文字来命名的。
  * 设为字符串变量，后续我们随机算出数字 `5` 时，可以用代码动态拼接成 `"card5"` 塞给 `playerCardName`。
  * 只要这个变量值一改，SwiftUI 界面上的卡牌图片就会**自动热重载更新为 5 号牌**，实现数据驱动界面。
* **为什么要把 `maxRounds` 设为 `let`**：
  * 因为游戏的最大轮数在开发时就规定死了是 12 轮，不需要在玩游戏的过程中被修改。
  * 设为 `let` 可以防止其他研发写错逻辑误改了总轮数，在底层锁死核心规则。
