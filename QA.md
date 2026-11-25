# QA

交付前按变更／风险读取；方法与命令在此，结果留原 Issue/PR，项目特有坑见 [LESSONS](LESSONS.md)，权限／研究边界见 [AGENTS](AGENTS.md)。

## 范围与方法

- 从实际远端基线核对完整交付：已提交／暂存／未暂存／未跟踪；验收条件→行为／不变量→检查，不只读作者摘要或测正常路径。
- 行为变化：正例＋非法／缺失输入＋边界／状态转换；修复先复现、后加回归；测试须触达目标断言，哈希拒绝≠语义覆盖。禁弱化／跳过断言换绿。
- 按风险补测：隔离／权限→越界拒绝、白名单；持久化→重复／并发／中断／恢复；外部调用→超时／失败／未知结果；副作用→提交前后故障及已知事实保留；统计→手算／零分母／缺失／配对／门槛。
- 静态／模拟／真实模型／宿主证据分开；只声明实际检查的范围。不能靠阅读测试代码声称执行通过，也不能靠同源评分输出自证正确。
- 文档快路径：完整 diff 仅 Markdown且无行为／契约语义变化→查链接／锚点、单一归属／去重、命令／路径、完整 diff／秘密；否则跑相关回归。未改代码不自动豁免协议语义检查或远端要求。

## 命令

仓库根执行；工具链以 `container/package.json`／锁文件为准，测量运行器 Node≥22.22；安装用 `(cd container && npm ci)`，依赖变更同步锁文件。普通测试不要求真实模型调用。

```sh
# Runtime／运行器代码变化：
(cd container && npm run typecheck && npm test)
# 测量协议／数据／生成器／运行器变化另跑：
node experiments/measurement/act-or-verify/v1.0.0/generate.mjs --check
node experiments/measurement/act-or-verify/v1.0.0/check.mjs
node --test experiments/measurement/act-or-verify/v1.0.0/audit.test.mjs
# 所有交付：
git diff --check
git status --short
```

### 30 万条经历的保存／冻结回归（#50）

在 macOS 或 Linux 上用默认 fd 限额运行；不需要 `sudo`，不要为测试调高限额。脚本用临时目录创建并清理 30 万个合成事件文件（需数 GiB 可用空间），直接复用 [#38 复验](https://github.com/zuohaisu/self-model/issues/38#issuecomment-7056699565) 的夹具：先追加，再 `evolve`（内部 `saveMemory` → `freeze`），最后重载有效版本，核对单一候选 head、事件计数和完整键顺序。不启动 SDK 服务。

```sh
(cd container && npm ci && npm run build)
# macOS 另记 sysctl kern.maxfilesperproc；Linux 记 /proc/sys/fs/nr_open。
ulimit -Sn; ulimit -Hn
node experiments/local-runtime/repro-memory-300k.mjs
```

预期：退出 0、`verifiedEvents: 300000`、无 `EMFILE`，并输出夹具／复核／清理耗时、进程峰值 RSS（KiB）、fd 采样次数和观察到的最大 fd 数（约每 20 ms 采样，可能含采样目录自身，可能漏掉短峰值）。采样值不是硬上限；并发上限由单测另验。

## 判定与记录

- 发现记：位置／复现输入或命令／预期→实际／影响／证据；原因不明标假设，按影响而非措辞定严重性；修复后重跑目标及受影响回归。
- PR 正文维护“QA 摘要”：受检 SHA／环境／范围、实际命令／检查与通过／失败／跳过／未跑／未知、发现／修复／回归／残余风险、判定（验收满足／不满足／证据不足）。区分不同 SHA 的检查，不把旧结果写成当前重跑；阻塞不称通过，失败不隐去。
- 独立 QA 可先评论（标明复核者／受检 SHA），最终结论汇入正文；小任务几行，详细证据链接，更新替换、不追加流水账／summary 文件；Issue 只留交付链接与当前结论，可复用防护才晋升 LESSONS。
- CI 查实际 workflow／PR checks／保护或ruleset；无权限=未知，无checks≠PASS。推送后核对受检SHA、跟踪实际检查至终态；工程通过≠研究能力通过。
