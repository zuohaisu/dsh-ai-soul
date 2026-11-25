# 仍需主动防范的问题

按改动触发阅读。条目保留曾经暴露的问题、下一次要做的检查和可复核的出处；本次运行结果写回原 PR。

- **修改 profile 安装、组合或 preflight 时**，分别检查 Soul 可加载和应用界面就绪。曾出现插件已激活、Soul 已加载，却没有可交互界面的情况。保留“运行就绪但应用未就绪”的回归，并观察两个独立结果。若验收承诺实际交互，再按宿主协议检查界面和新会话的模型可见上下文。[历史观察](docs/evolution/2026-08-27-profile-readiness-has-two-layers.md) · [回归](test/profile-preflight.test.js) · [宿主协议](docs/runtime-verification.md)
- **修改导入审查或 promotion 时**，以 accepted claim 验证输出仍是未审提案，带目标基线和来源；再用未接受的 claim 或缺少显式目标的输入验证拒绝。把 claim 的接受当成写权限会绕过独立的状态转换审查。[治理决定](docs/evolution/2026-08-27-review-acceptance-is-not-mutation-authority.md) · [CLI 回归](test/lifecycle-import-promotion-cli.test.js)
- **修改选择性成长或其证据验证器时**，同时观察重要交互和普通交互。重要交互要能追溯到审查、持久变化及下一轮使用；普通交互应无晋升提案且规范认知不变。缺少负对照记录时标为证据不足，观察到普通交互被晋升时判失败。[判据](docs/evolution/2026-09-06-selective-growth-requires-a-negative-control.md) · [验证器回归](test/selective-growth-runtime-evidence.test.js)
