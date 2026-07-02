---
publish: true
---

# 3_SwiftUI教程 (iOS 2026版 - PM 零基础精讲版)

> **本章学习目标**：掌握 SwiftUI 声明式 UI 核心设计原理，学会嵌套使用三大布局容器（VStack、HStack、ZStack）与 Spacer 弹簧，并看懂如何构建一个高保真景点卡片界面。

---

## 📖 1. 本章名词字典 (Glossary for PM)

| 英文技术名词 | 研发口头禅 | 大白话通俗解释 (PM Metaphor) |
| :--- | :--- | :--- |
| **View** | “万物皆为 View” | **“界面上的一块乐高积木”**。屏幕上的每一段文字（Text）、每一张图片（Image）、甚至每一个空白大容器，都是一个 View。 |
| **Modifier** | “用点语法加修饰符” | **“积木的外观彩色漆”**。挂载在 View 下方的点语法函数。用来改写积木的尺寸、颜色、圆角、字号等，顺序敏感。 |
| **SF Symbols** | “直接加载 SF 图标” | **“苹果官方免费矢量图标图库”**。系统内置的数千种高品质图标，可以用 `Image(systemName: "图标名")` 直接调用，支持随字号自适应放大缩小且不模糊。 |
| **Spacer** | “放个 Spacer 撑开” | **“无形的高能压缩弹簧”**。占位垫片。在布局轴向上无限向外膨胀挤压，把两侧的组件推到屏幕的两端。 |

---

## 🧭 2. 教程步骤逐步拆解 (Step-by-Step Breakdown)

### 2.1 三大布局容器（组装盒）排布规则
* **`VStack` (Vertical Stack - 垂直堆叠)**：盒子里面的积木**从上到下一行一行叠放**。
* **`HStack` (Horizontal Stack - 水平堆叠)**：盒子里面的积木**从左到右一列一列摆放**。
* **`ZStack` (Depth Stack - 深度堆叠)**：盒子里面的积木在三维深度上**前浪盖后浪层叠**。通常把背景底色放在最下面一格，卡片内容叠在上方。

### 2.2 避坑重点：双重 Padding 链条与阴影截断
在做“白色圆角带阴影的卡片”时，很多新手会写错修饰符顺序，导致文字紧贴卡片白边，或者卡片阴影被手机边框强行切掉。
* **正确的 Modifier 组合顺序**：
  1. 内容先加 `.padding()`：撑开**文字内容与白色底板边缘的内部间隙**。
  2. 绘制 `.background(白色圆角板)`：将文字外部染成白色圆角卡片底。
  3. 加一层 `.shadow(radius: 15)`：对这个染了白底的卡片生成柔软的立体投影。
  4. 再加一层 `.padding()`：撑开**白色卡片外边缘与手机屏幕侧边框的外部间距**。
* **大白话**：先画内层防挤压，再画背景上阴影，最后画外层防贴边。顺序一旦打乱（比如把 shadow 放在 background 前面），渲染就会发生灾难性的错乱。

---

## 💻 3. 代码逐句大白话解剖 (Line-by-Line Code Breakdown)

请看高保真尼亚加拉大瀑布（Niagara Falls）卡片视图的 `body` 块代码解剖：

```swift
var body: some View {
    ZStack {
        // 1. 底层：薄荷绿全屏背景，且强行忽略屏幕顶部的刘海和底部安全线
        Color.mint
            .ignoresSafeArea()
        
        // 2. 顶层：卡片主容器，内部靠左对齐，元素间距设为 20pt
        VStack(alignment: .leading, spacing: 20) {
            
            // 3. 景点大图：可调整尺寸、保持比例裁剪、剪切为 16 号圆角矩形
            Image("niagarafalls")
                .resizable()
                .scaledToFit()
                .clipShape(RoundedRectangle(cornerRadius: 16))
            
            // 4. 标题与评分行 (水平排列)
            HStack {
                Text("Niagara Falls")
                    .font(.title) // 大标题字号
                    .bold()       // 加粗
                
                Spacer() // 💡 弹簧：把标题推向最左边，把右侧评分推向最右边
                
                // 评分小容器 (垂直向右对齐)
                VStack(alignment: .trailing, spacing: 4) {
                    HStack(spacing: 2) {
                        Image(systemName: "star.fill") // 实心星星
                        Image(systemName: "star.fill")
                        Image(systemName: "star.fill")
                        Image(systemName: "star.fill")
                        Image(systemName: "star.leadinghalf.filled") // 半实心星星
                    }
                    Text("361 Reviews")
                }
                .foregroundStyle(.orange) // 评分整体染成橙色
                .font(.caption)           // 小字说明字号
            }
            
            // 5. 介绍文字
            Text("Come visit Niagara Falls for an experience of a lifetime!...")
                .font(.body)
        }
        // 6. 卡片大容器修饰符链 (顺序敏感！)
        .padding() // 内边距：撑开白卡片内边缘
        .background(
            RoundedRectangle(cornerRadius: 16)
                .foregroundStyle(.white) // 染白卡片底
        )
        .shadow(radius: 15) // 加软投影
        .padding() // 外边距：撑开手机物理边框与白卡片的空隙
    }
}
```

---

## 🛠 4. 编码提效技巧：代码折叠 (Code Folding)
当大括号嵌套极深时，使用折叠可以把长代码块收缩为 `...`，方便宏观阅读：
* **快速折叠当前代码块**：按住 **`Cmd + Option + 左方向键 (←)`**。
* **快速展开当前代码块**：按住 **`Cmd + Option + 右方向键 (→)`**。
* 也可以在 Xcode 顶部菜单：`Editor -> Code Folding -> Fold` 执行折叠。
