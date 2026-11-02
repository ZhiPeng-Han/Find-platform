# Find

面向 1976–2006 年有历史价值摄影器材（机身与镜头）的寄售、代买、寻物平台。每一台器材都附一本"器材护照"：检测数据、本机测试卷、历任主人和它的经历。

## 目录

- `docs/brainstorm.md`：第一轮构想讨论，包括可取之处、问题、入口、核心特色、3D 与历史故事的取舍、下一步
- `design/find.html`：三页可视化构想稿
  - 构想：时代判断、品类阶段、业务、入口、飞轮、AI 分工、路线图
  - 器材护照：以一台 Nikon FM2N 为例的护照页（人物、价格、数据均为示例）
  - 三十年图谱：1976–2006 年 58 台代表性机身与镜头，含检测关注点

构想稿在线版本：https://claude.ai/artifact/A9Wz1YDxcZ1BUBpLryTAyD

- `site/`：面向顾客的店铺页面（拟物风格，预览版）
  - `site/src/`：源文件（样式、数据、材质与相机绘制、控件、页面逻辑）
  - `site/build.py`：把源文件合并成 `site/index.html`，修改后运行 `python3 site/build.py`
  - 页面：首页、选购、商品详情（器材护照）、寄售与估价、帮我找、器材史、店主收件箱

店铺在线版本：https://claude.ai/artifact/6npfsRZCx5ZK69S2oAJF7C
