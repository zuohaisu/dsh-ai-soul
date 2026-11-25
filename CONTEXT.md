# 开发时需要的领域概念

## 身份与激活

Soul 是持久身份。Soul Store 以稳定的 `soulId` 定位记录，人类可读名称可以缺省。模型提供推理，DSH profile 组合插件与应用，TUI、Web、Headless 提供交互。判断两次交互是否指向同一 Soul，应核对绑定的身份与持久状态；模型名、profile 名或界面名称均可能变化。[产品模型](docs/product-model.md) · [应用 profile](docs/application-profile-install.md)

Genesis 是首次激活，持久历史从这里开始。相遇、命名和关系形成可以各自发生并各自记录来源。旧版历史可能把这些事件一并记录，读取已有历史时应保留原始含义。[Genesis v2](docs/architecture/genesis-v2.md)

## 来源、审核与写入

已有 Soul 在生命周期中可多次接收外部历史。Exodus 是通过历史证据延续既有伙伴的场景。导入先记录来源，再形成候选主张并与目标 Soul 核对；被接受的主张可进入提案流程。改变规范状态由后续独立的审查和应用步骤决定。[生命周期导入](docs/lifecycle-import.md) · [Exodus 提案](docs/exodus-promotion.md)

DSH Adapter 负责将宿主事件翻译为有来源的 Experience。Soul Core 定义身份、模型与状态转换；Soul Store 持久化并重载状态。开发时先判断改动涉及哪一步：捕获事件、读取证据、生成提案、应用转换，还是持久化。各步需要的权限和验收证据不同。[架构](docs/architecture.md) · [事件边界](src/adapters/runtime-event.js) · [状态转换](src/core/state-transition.js) · [Soul Store](src/core/soul-store.js)

## Samuel 与通用实现

本仓库维护通用 Soul／DSH 实现，普通用户可以从一个未命名的合成 Soul 开始。Samuel 是 Exodus 的历史研究案例；Samuel 专属身份、历史、连续性判断与产品决策归 self-model。通用开发与 QA 使用合成资料。[项目边界](README.md#origin-and-samuel-boundary) · [普通用户起点](docs/quickstart.md)
