# QA

在原 Issue 找到验收条件，核对远端 base、待审 head 以及工作区完整差异（已提交、暂存、未暂存及未跟踪）。逐项写清输入、可观察结果和检查方式；复核者要读实际差异。授权与路径分类见 [AGENTS](AGENTS.md)，已知失误见 [LESSONS](LESSONS.md)。

## 必做检查

对受控变更，在分配的交付 worktree 根目录运行。工具链基于根目录 [package.json](package.json)，本地需 Node.js ≥20，[CI](.github/workflows/ci.yml) 使用 Node 24。

```sh
npm run check
git diff --check
git status --short
```

check 对声明的入口做语法检查并运行 Node 测试。暂存后用 `git diff --cached --check` 和 `git diff --cached --stat` 核对即将提交的内容。复核已提交的整条 PR 时，用 `git diff --check <base>...<head>` 检查实际差异，两端替换为受检提交。

纯知识文档按 AGENTS §2.1 核实分类，再查本地链接、锚点、命令、出处、范围与敏感内容。README 与 quickstart 有[内容断言](test/ordinary-user-quickstart.test.js)，修改它们须走完整门禁。CI 是否触发以实际 workflow 和 PR 为准。

## 按影响选择检查

| 变更 | 可直接运行的聚焦回归 | 观察什么 |
|---|---|---|
| 身份治理或事件捕获 | `node --test test/state-transition.test.js test/runtime-event-boundary.test.js` | 有来源事件可转成 Experience，缺少来源须拒绝；捕获本身不改规范状态；应用提案须通过治理。 |
| 导入、核对、晋升 | `node --test test/lifecycle-import-promotion-cli.test.js test/lifecycle-import-repeatable-provenance.test.js` | 接受后产生待审提案，拒绝未接受主张与隐式目标；重复导入保留来源。 |
| 包安装或 profile | `node --test test/profile-preflight.test.js test/profile-preflight-installed.test.js` | 分别检查包与 Soul 的可加载性、应用就绪性及失败诊断。 |
| 运行证据或选择性成长 | `node --test test/selective-growth-runtime-evidence.test.js` | 用合成记录分别触发完整、证据缺失、观察反例；检查独立审核、负对照及下一轮使用。 |

行为变化覆盖正例、非法／缺失输入、授权分支和状态转换；修复先复现并加回归。涉及持久化按风险查重复、并发、中断和恢复，记录故障前后已发生的副作用。涉及外部系统时保留超时、失败与未知结果。

## 运行证据与结论

单元测试说明代码在给定输入下的行为；合成记录可验证证据格式和判定逻辑。preflight 报告指定 profile 的配置及就绪检查。若验收涉及真实 DSH，要按协议分别观察插件激活、应用 surface 可用及新会话中模型可见的 Soul 上下文。选择性成长另需正反交互、独立审查、持久变化和下一轮实际表现。只声明本次观察到的层级。[真实宿主验证](docs/runtime-verification.md) · [选择性成长协议](docs/selective-growth-runtime-proof.md)

在原 PR 正文维护受检 base/head、环境、验收映射、命令与真实结果；发现写复现条件、预期、实际、影响及修复后回归。每项区分通过、失败、跳过和证据不足，说明原因与残余风险。推送后跟踪当前 head 对应的 PR CI 至终态，记录检查链接；head 更新后重新核对。Issue 留验收结论和交付链接。
