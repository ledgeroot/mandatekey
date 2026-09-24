<div align="center">

# MandateKey

### 面向 agent 授权令的钥匙圈 —— 哪个 agent、能花多少、到何时

**行业造好了锁，没人造钥匙圈；造好了刹车，没人造黑匣子。**

![Next.js](https://img.shields.io/badge/next.js-16-black)
![Storage](https://img.shields.io/badge/storage-local%20SQLite-informational)
![Backend](https://img.shields.io/badge/backend-none-informational)
![Hosting](https://img.shields.io/badge/hosting-local%20only-lightgrey)

[English](./README.md) · **中文**

</div>

---

MandateKey 是 [Ledgeroot](https://github.com/ledgeroot/ledgeroot) 的**仪表盘那一半**：消费引擎写出的证据流，在一屏里回答用户的三个问题——**哪些 agent 被授权、能花多少、到何时**——然后让用户一键切断，并把证据带走。

> 钱包管钱。MandateKey 管**谁被允许动钱**，以及**钱花出去后如何向任何人证明**。

它读本地的 Ledgeroot SQLite 库与链上锚定合约。**没有后端、没有服务器**：浏览器访问的是跑在你机器上的 Next.js 路由处理器，它们读 SQLite 和一个 RPC 端点。没有任何数据离开本机。

---

## 看到什么

四条横带，对着一个有真实结算的账本：

| 横带 | 显示什么 |
|---|---|
| **顶栏** | 名称、一句话说明、语言切换和熔断。熔断是页面上唯一"大声"的元素，这是刻意的 |
| **状态条** | 同一份账本的三格读数，用发丝线分隔：**链上锚定**（epoch、覆盖范围、根，以及三条链上结论：根、epoch、这条记录提交给了哪个合约）、**离线三态验证**（`verified` / `tampered` / `incomplete`，并列出产生该结论的具体问题）、**可验证证据包**（一个 zip：收据 + 锚定记录 + 逐张收据的包含证明 + JWKS + 一个你可以自己跑的验证脚本） |
| **授权清单** | 每条授权的单笔上限、累计上限、到期时间与已用额度。已撤销的那条留在屏幕上并显示 `已撤销`；已过期的标注出来而不是藏起来——一条凭空消失的行，比一条明显死掉的行，给用户的信息更少 |
| **一致性时间线** | 收据流：先是状态，然后是意图、对手方与端点、这笔钱属于哪张授权令，以及被拦下时的策略原因。越权的会把理由一并列出 |

每条收据都写明它的授权令，点任意一侧即可追踪这一对：该授权令的收据带上强调色标记，其余淡出。**没有任何东西被隐藏**，所以切换时不会让人以为账本变了。

**默认英文**，顶栏一点即切中文；选择会记在本地，`<html lang>` 跟着变。**引擎输出永不翻译**：策略原因、状态值和每一个哈希都保持原样，因为它们就是证据。

账本类视图每 3 秒轮询一次，锚定那一格每 5 秒，所以 agent 花钱时收据会自动出现。但**操作不会等着轮询**：按下熔断，所有视图当场被拉前刷新。

设计决策与 token 体系见 [PRODUCT.md](./PRODUCT.md) 与 [DESIGN.md](./DESIGN.md)。

---

## 快速开始

### 1. 离线跑一遍（不用钱包、不用网络）

```bash
npm install
npm run seed        # 通过引擎的 dry-run 通道写入演示授权 + 收据
npm run dev         # http://localhost:3000
```

### 2. 指向一个有真实支付的账本

```bash
# 与引擎写入的是同一个库
LEDGEROOT_DB=/absolute/path/ledgeroot.sqlite npm run dev
```

锚定在**写入侧**，属于引擎——锚定私钥永远不进这个仓库：

```bash
cd ../ledgeroot && npm run anchor -- --db ./ledgeroot.sqlite
```

在这一步之前，锚定面板会明说这个账本尚未锚定。**它不会伪造一个根。**

> ⚠️ **`npm run seed` 是往 `LEDGEROOT_DB` 指向的库里追加，不清库。** 它走 dry-run 支付通道，所以那些收据的 `txHash` 是仿真值：离线验证能过，`--check-chain` 会（正确地）与它们不符。**如果那个库里已经有真实支付，不要往里 seed** —— 换一个路径（`LEDGEROOT_DB=/tmp/demo.sqlite npm run seed`）。
>
> seed 不手搓收据。它调用引擎的 `handlePay`，所以策略判定、报价段与交付段、签名、哈希链全都是引擎生成的原样。只有结算是仿真的。

---

## 为什么需要 MandateKey？

- **一屏，而不是每个协议一个孤岛。** 引擎负责写授权与收据；这里是人真正能看到它们的地方。
- **写入侧握钥匙。** 锚定与支付签名都在 [Ledgeroot](https://github.com/ledgeroot/ledgeroot)。本仓库只持有**收据签名种子**（验归属需要它），从不持有能动钱的那把钥匙。
- **撤销必须是可见的。** 按下熔断，每一行翻成 `已撤销`，下一笔支付被拒并留痕——用户是**看见**翻转，而不是从一个空列表里**推断**出来。
- **证据是能交出去的。** 导出的是一个 zip，第三方用 `node verify.mjs` 就能验——不装我们的任何东西，也不连回我们。
- **它不粉饰数据。** 已撤销的授权仍然列在那里；越权的支付标红；验不了的事情报 `incomplete` 而不是 `verified`——面板呈现的是**引擎的结论**，不是它自己的意见。
- **无后端、无遥测、无账号。** 对账本只读，唯一的例外是撤销标记。

---

## 它处在什么位置

| | [Ledgeroot](https://github.com/ledgeroot/ledgeroot) —— 机芯 | MandateKey —— 表盘 |
|---|---|---|
| 角色 | **写入侧**：授权、fail-closed 策略、收据、锚定 | **读取侧**：授权清单、一致性视图、撤销、证据导出 |
| 跑在 | agent 的 MCP 宿主里，挨着钱包 | 浏览器里，挨着人 |
| 持有 | 支付密钥与锚定密钥 | 收据签名种子，没有任何动钱的钥匙 |

> ⚠️ **聚合是部分的。** 本仪表盘读的是引擎的 `mandates` 表。AP2 导入的授权、本地策略清单与 x402 会话**尚未**汇总进同一个视图——见 [已知边界](#已知边界)。

---

## 证据包

一键产出 `ledgeroot-evidence.zip`：

| 文件 | 内容 |
|---|---|
| `receipts.json` | 全部收据，按追加顺序 |
| `anchor.json` | 链上锚定记录，或 `null` |
| `proofs.json` | 锚定所覆盖的每张收据一条 Merkle 包含证明，形如 `{receiptId, index, size, path}` |
| `jwks.json` | 签发方公钥，无需连回即可验签 |
| `epoch-root.json` | 当前全量收据的根 |
| `verify.mjs` | 独立验证脚本 |
| `README.txt` | 一次通过**建立**了什么、**没有**建立什么 |

```bash
npm install ledgeroot
node verify.mjs     # 退出码 0 verified · 1 tampered · 2 incomplete · 3 无法读取
```

一次通过的含义是：每张收据的哈希与内容相符、每张都回指上一张、每个签名都由 `jwks.json` 里的密钥签发，且——在已锚定的情况下——收据能重算出锚定根、每条包含证明都能到达该根。**只改坏一条证明路径**，它会报 `tampered` 并指名那张收据，而链校验与锚定校验仍然通过。

---

## 三态验证

三态验证面板原样呈现引擎的验证结论；这三个状态的定义属于引擎，完整说明见[引擎 README](https://github.com/ledgeroot/ledgeroot/blob/main/README.zh-CN.md)。

| 状态 | 含义 |
|---|---|
| `verified` | 全部检查通过 |
| `tampered` | **字节被检查过，对不上** |
| `incomplete` | **证据缺失或取不到** —— 与"被篡改"不是一回事，且**绝不放行** |

这个面板存在的理由：没人看得见的结论，不构成卖点。它显示的是产生该状态的**具体问题**，而不只是颜色。

---

## 锚定状态

两条结论，来自两次独立的合约读取：

- **根** —— 本地锚定记录的根 对比 链上的 `latestRoot`
- **epoch** —— 本地锚定的 epoch 对比 链上的 `lastEpoch`

**根对得上、epoch 对不上**，含义是：本账本记录的最后一次锚定，不是合约看到的最后一次——可能是本地记录过期，也可能是另一台机器用同一把 key 锚过。之所以值得展示，是因为这正是那种**平时不会被发现**的漂移形态。

---

## API 路由

| 路由 | 作用 |
|---|---|
| `GET /api/mandates` | 全部授权及其撤销状态，附已用额度 |
| `POST /api/mandates/revoke` | 撤销一条（传 `mandateId`）或全部（熔断） |
| `GET /api/receipts` | 原始收据流 |
| `GET /api/consistency` | 事后复核：已付收据对比其授权 |
| `GET /api/verify` | 引擎的三态结论 |
| `GET /api/anchor` | 当前 epoch 根 + 最近一次锚定记录 |
| `GET /api/export` | 证据包（zip） |

---

## 环境变量

| 变量 | 说明 |
|---|---|
| `LEDGEROOT_DB` | Ledgeroot SQLite 库路径（默认 `ledgeroot.sqlite`） |
| `LEDGEROOT_SIGNING_KEY` | 收据签名种子（32 字节 hex）。引擎用它签，本仪表盘用它验归属，**两边必须一致**。不设 → 收据验证为 `incomplete` |
| `LEDGEROOT_DRY_RUN` | `true` 会派生确定性临时密钥，seed 与仪表盘无需配置即可对上（**禁止用于真实支付**） |
| `NEXT_PUBLIC_ANCHOR_ADDRESS` | Monad 主网上的锚定合约地址，由浏览器读取以渲染锚定面板。必须是引擎实际锚定的那个合约——不同链会报 root 不匹配 |

---

## 已知边界

诚实的那一节。这些是**当前实现**的边界，不是对设计意图的否定。

| 边界 | 现状 |
|---|---|
| **聚合是部分的** | 只读引擎的 `mandates` 表。AP2 导入的授权、本地策略与 x402 会话没有汇总进同一视图 |
| **没有签发 UI** | 授权在写入侧签发（`ledgeroot_mandate_sign`）。仪表盘能撤销，但**不能签发**——"一句人话 + 一个确认键"是目标，**这里还没做** |
| **ERC-8004 没有接** | 没有 agent 卡、没有声誉视图。引擎存了 `agentId` 字段；没有任何东西校验或展示它 |
| **本仓库没有测试** | 只有 `npm run typecheck` 与 `npm run build`。测试在引擎那边（129 个） |
| **只能在本地跑** | 没有托管实例，评估它意味着把它跑起来。同时也意味着浏览器与数据库被假定在同一台机器上 |
| **包含证明只覆盖一个 epoch** | 证明只发给最近一次锚定覆盖的那些收据；之后追加的要等下一次锚定 |
| **它持有签名种子** | 验归属要推导签发方公钥，而引擎的 API 需要一个种子来做这件事。只读部署本该只持有公钥那一半 |
| **本仓库未声明许可证** | 它读取的引擎是 MIT |
| **只读，只有一个例外** | 仪表盘只写一样东西：熔断按钮背后的本地 `revoked` 标记 |

---

## 仓库结构

```text
app/
  page.tsx            仪表盘首页
  api/mandates        授权清单 + 撤销
  api/receipts        原始收据流
  api/consistency     授权-执行一致性分析
  api/verify          三态验证
  api/export          证据包（zip）
  api/anchor          epoch 根 + 最近一次锚定记录
components/
  app-header          名称、说明、语言切换、熔断
  status-strip        工作区上方那三格发丝线读数
  mandate-list        授权清单：额度进度、撤销 / 过期状态
  timeline            收据流：任务汇总、越权标记、授权令追踪
  kill-switch         一键撤销全部授权
  anchor-status       链上锚定 + 三条链上结论（wagmi）
  verification-panel  三态结论
  evidence-export     证据包下载
  language-toggle     EN / 中文 分段控件
  skeleton            加载占位，不用转圈
lib/
  i18n.ts             文案表（en / zh）+ locale 存储；默认 en
  format.ts           哈希中段省略
  selection-bus.ts    当前追踪哪张授权令
  wagmi.ts chains.ts  钱包/链配置 + 区块浏览器链接
  anchor.ts           锚定 ABI + 地址
  use-poll.ts         各视图的定时轮询
  refresh-bus.ts      让一次操作立刻刷新各视图
  zip.ts              stored-entry ZIP 打包（无依赖）
  verify-bundle.ts    随证据包一起交付的验证脚本
  issuer-keys.ts      签名密钥的公钥那一半
agent/demo.mjs        演示数据 seed，走引擎
```

---

## 依赖声明

本仓库通过 `package.json` 依赖 **`ledgeroot`** npm 包，那是**我们自己的开源库**（源码：[ledgeroot](https://github.com/ledgeroot/ledgeroot)）。它在 `package.json` 里声明，其 README 与仓库历史也已写明。这里没有任何东西是对第三方引擎的重新包装。

---

## 许可证

**本仓库尚未声明许可证。** 它读取的引擎是 [MIT](https://github.com/ledgeroot/ledgeroot/blob/main/LICENSE)。

<div align="center">

### 行业造好了锁，没人造钥匙圈。

**[把它跑起来，自己验收据。](#快速开始)**

📖 **[English README](./README.md)** · ⚙️ **[机芯](https://github.com/ledgeroot/ledgeroot)** · 🗺️ **[Roadmap](https://github.com/ledgeroot/ledgeroot/blob/main/docs/roadmap.md)** · 🛡️ **[威胁全景](https://github.com/ledgeroot/ledgeroot/blob/main/docs/landscape.md)**

<sub>无后端 · 无遥测 · 无私钥 · 证据无需依赖我们即可验证</sub>

</div>
