---
name: "开发任务"
about: "定义一项可独立验收、可由一个最终提交交付的任务"
title: ""
labels: ""
assignees: ""
---

## 目标
谁在什么条件下会观察到什么变化？为什么需要这次修改？

## 当前证据与上下文
- 已有实现或决定、具体缺口、可复核的复现或出处。
- 只列本任务需要的规格、代码或测试入口，注明读取原因；列出依赖、当前未知和核实方式。
- 开发从 [AGENTS](https://github.com/zuohaisu/dsh-ai-soul/blob/main/AGENTS.md) 开始，领域语义见 [CONTEXT](https://github.com/zuohaisu/dsh-ai-soul/blob/main/CONTEXT.md)，按改动查 [LESSONS](https://github.com/zuohaisu/dsh-ai-soul/blob/main/LESSONS.md)。

## 范围
写明交付物、涉及的组件／权限边界及明确排除的内容。

## 验收
- [ ] 给定正常条件，说明预期行为和验证方法。
- [ ] 给定一项关键失败、越权或边界条件，说明预期结果和检查方法；不适用时写明原因。
- [ ] 指明所需证据层级与交付位置。涉及宿主或模型可见性时写明要观察的实际行为。验证方法见 [QA](https://github.com/zuohaisu/dsh-ai-soul/blob/main/QA.md)。

## 实施起点
先查哪条路径、复现哪个现象或确认哪个前置条件？领取与交付时再记录实际归属、分支、受检提交和 PR。
