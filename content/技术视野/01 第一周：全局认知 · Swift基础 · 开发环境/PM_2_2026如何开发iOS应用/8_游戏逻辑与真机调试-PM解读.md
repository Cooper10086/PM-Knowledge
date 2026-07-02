---
publish: true
---

# 8_游戏逻辑与真机调试 (iOS 2026版 - PM 零基础精讲版)

> **本章学习目标**：掌握变量作用域（Scope）的生命范围，理解 `@State` 响应式状态管理机制（数据如何自动驱动 UI 刷新），完成发牌逻辑判定算法编写，并学会将 App 免费部署在自己的 iPhone 真机上测试。

---

## 📖 1. 本章名词字典 (Glossary for PM)

| 英文技术名词 | 研发口头禅 | 大白话通俗解释 (PM Metaphor) |
| :--- | :--- | :--- |
| **Scope** | “出了作用域无法访问” | **“防泄漏密闭玻璃房”**。变量的寿命和可见范围。通常由声明它的大括号 `{}` 决定。出了自己大括号的界限，变量自动死亡销毁，强行读取会报错。 |
| **`@State`** | “把属性标记为 @State” | **“自动广播的数据开关”**。状态属性。被修饰的变量一旦发生数据改动，SwiftUI 会自动重新计算并**瞬间刷新屏幕上绑定了这个变量的文本或图片**，免去手动刷屏代码。 |
| **Int.random(in:)** | “随机数生成” | **“在指定范围内摇骰子”**。用来随机抽取整数的方法。参数 `in: 2...14` 表示包含 2 和 14 之间的任何整数。 |
| **Developer Mode** | “开启手机开发者模式” | **“解除真机沙盒权限锁”**。iOS 16 之后为了手机防黑客安全新增的开关。开启后，我们才能用数据线将自己写的测试包塞进手机运行。 |

---

## 🧭 2. 教程步骤逐步拆解 (Step-by-Step Breakdown)

### 2.1 搞懂“数据如何驱动界面（@State 循环圈）”
在没有 `@State` 前，如果分数 `playerScore` 从 0 变成 1，界面上显示的数字并不会自动改变，研发必须写繁琐的“重绘”代码。
* **`@State` 的魔力机制**：
  1. 用户点击 Deal 按钮。
  2. 触发 `dealCards()` 逻辑，计算出新分数：`playerScore += 1`。
  3. 系统检测到被 `@State` 标记的 `playerScore` 变了。
  4. 电脑自动在 `body` 视图树里找哪个 Text 绑定了 `String(playerScore)`。
  5. 系统自动差分重绘该 Text 组件，玩家瞬间看到屏幕上的分数“跳动”更新。

### 2.2 免费将 App 部署到自己的物理 iPhone 上运行
不需要交 100 美元的开发者年费，按照以下 5 步即可用个人 Apple ID 免费安装在自己手机上：
1. **数据线连接**：连上 Mac，在手机弹窗选择 **“信任此电脑”** 并输密码。
2. **处理版本低报错**：如果提示手机 iOS 系统低，在项目配置 General 的 **Minimum Deployment Target** 里把支持的最低版本降低（如降到 iOS 17.0）。
3. **配置账号签名**：Xcode 设置里添加你的个人 Apple ID。在项目设置的 **Signing & Capabilities** 页面勾选 **“Automatically manage signing”**，并在 Team 框选择你的个人账号。
4. **信任证书**：Run 部署后手机桌面上会出现 App 图标，但点开会闪退提示“不受信任的开发商”。在手机上打开 `设置 -> 通用 -> VPN与设备管理`，找到你的邮箱账号点击“信任”。
5. **开启开发者模式**：在手机 `设置 -> 隐私与安全` 最底部找到 **开发者模式 (Developer Mode)** 并开启，根据提示重启手机并确认。
* **时效性提示**：免费免签的 App 在手机上**只有 7 天有效期**。7 天后打开会闪退。**续期方案**：只需再次连上电脑，用 Xcode 重新点一次 Run，就会自动再续签 7 天。

---

## 💻 3. 代码逐句大白话解剖 (Line-by-Line Code Breakdown)

请看 War Card Game 最终完整跑通游戏对战逻辑的代码解剖：

```swift
import SwiftUI

struct ContentView: View {
    
    // 1. 声明四个被 @State 修饰的状态属性。值一旦改变，UI 会瞬间跟着重绘！
    @State var playerCard = "back" // 初始牌面为背面图 back
    @State var cpuCard = "back"
    @State var playerScore = 0
    @State var cpuScore = 0
    
    var body: some View {
        ZStack {
            Image("background-plain")
                .resizable()
                .ignoresSafeArea()
            
            VStack {
                Spacer()
                Image("logo")
                Spacer()
                
                // 2. 卡牌图片与状态变量绑定
                HStack(spacing: 20) {
                    Spacer()
                    Image(playerCard) // 读取当前变量对应的图片名（如 "card5"）
                    Spacer()
                    Image(cpuCard)
                    Spacer()
                }
                
                Spacer()
                
                // 3. 点击按钮，启动 dealCards 机器
                Button(action: {
                    dealCards()
                }, label: {
                    Image("button")
                })
                
                Spacer()
                
                // 记分板区域
                HStack {
                    Spacer()
                    VStack {
                        Text("Player")
                            .font(.headline)
                            .padding(.bottom, 10.0)
                        
                        // 4. 数值转文本绑定
                        Text(String(playerScore))
                            .font(.largeTitle)
                    }
                    Spacer()
                    VStack {
                        Text("CPU")
                            .font(.headline)
                            .padding(.bottom, 10.0)
                        Text(String(cpuScore))
                            .font(.largeTitle)
                    }
                    Spacer()
                }
                .foregroundStyle(.white)
                
                Spacer()
            }
        }
    }
    
    // ==================== 5. 核心判定业务逻辑函数 ====================
    func dealCards() {
        // A. 摇骰子：随机生成 2 到 14 之间的整数
        let playerValue = Int.random(in: 2...14)
        let cpuValue = Int.random(in: 2...14)
        
        // B. 拼装图片名并赋给状态属性，驱动界面发生换牌变化
        playerCard = "card" + String(playerValue) // 比如随机到 5，变成 "card5"
        cpuCard = "card" + String(cpuValue)     // 比如随机到 13，变成 "card13"
        
        // C. 比大小，得分累加
        if playerValue > cpuValue {
            playerScore += 1 // 玩家赢，加一分
        } else if cpuValue > playerValue {
            cpuScore += 1    // 电脑赢，加一分
        }
        // 平局则双方分数都不变，直接跳过
    }
}
```

---

## 🧭 6. 独立开发后续进阶路线
当您完成首款卡牌游戏后，如果想继续扩大您的“积木库”以独立做出其他 App，建议优先攻克以下三大高级布局视图：
1. **`List` (列表)**：用来展示纵向大量滚动的单元格列表（如微信会话列表）。具备内置的内存复用机制，极为省电。
2. **`TabView` (底部导航标签页栏)**：App 最外层的标签骨架栏（如微信下面的“微信、通讯录、发现、我”）。
3. **`LazyVGrid` (懒加载网格)**：多列密集网格排列容器（如小红书的双列图片瀑布流、手机相册的九宫格）。
