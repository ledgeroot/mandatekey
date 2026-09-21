# MandateKey

> **行业造好了锁，没人造钥匙圈；造好了刹车，没人造黑匣子。**

用户侧「钥匙圈」仪表盘。消费 [Ledgeroot](../ledgeroot) 产出的证据流，让用户一屏看清"哪个 agent、能花多少、到何时"，并在出问题时一键撤销、把证据带走。

> 钱包管钱，MandateKey 管"谁被允许动钱"，以及"钱花出去后如何向任何人证明"。

---

## 四大功能

1. **统一授权清单** — 列出全部 mandate：单笔上限、累计上限、到期时间、已用额度；已撤销的灰显为「已撤销」而不是消失
2. **授权-执行一致性时间线** — 收据流实时渲染（每 3 秒轮询），越权标红告警，多笔支付按任务聚合
3. **一键撤销 / 熔断** — 按下即撤销全部授权，清单当场翻转，下一笔当场拒付留痕
4. **可验证证据包导出** — 一键下载 zip：收据 + 锚定记录 + **逐张收据的 Merkle 包含证明** + JWKS 公钥 + 独立验证脚本；解压后 `node verify.mjs` 三态验证（`verified / tampered / incomplete`）

> ⚠️ **与实现的边界**：本仓库目前只聚合 Ledgeroot 的 `mandates` 表——AP2 mandate 导入、本地策略清单与 x402 会话尚未汇总进这一视图。包含证明只覆盖**已锚定 epoch 内**的收据；锚定之后新增的收据要等下一次锚定才进证明。

## 技术栈

Next.js · Tailwind v4 · wagmi v3 · viem v2 · React Query

数据源：本地 Ledgeroot SQLite（只读）+ 链上锚定事件，无后端、零服务器。

## 快速开始

```bash
# 1. 安装依赖（ledgeroot 来自 npm registry）
npm install

# 2. 写入演示 mandate + 收据
npm run seed

# 3. （可选）把当前 epoch 根锚定到 Monad testnet
#    在 ledgeroot 仓库执行——锚定私钥只留在写侧，本仓库不持有
cd ../ledgeroot && npm run anchor -- --db ./ledgeroot.sqlite && cd ../mandatekey

# 4. 启动仪表盘
npm run dev         # http://localhost:3000
```

> 跑完第 3 步，首页「链上锚定」卡片会显示本地锚定记录与链上 `latestRoot` 是否一致；
> 没跑第 3 步则显示「尚未锚定」——它不会伪造一个根。
>
> 仪表盘每 3 秒轮询一次收据流，所以 agent 花钱时收据会自动出现；熔断等操作会立即
> 触发一次刷新，不必手按 F5。

> ⚠️ **`npm run seed` 写的是 `LEDGEROOT_DB` 指向的那个库，而且是追加、不清库。** 它走的是
> dry-run 支付通道，所以那些收据的 `txHash` 是仿真值——离线验证能过，`--check-chain` 会
> （正确地）判为不符。**如果你已经用真实支付跑过账本，不要把 seed 跑在同一个库上**，换一个
> 库路径（`LEDGEROOT_DB=/tmp/demo.sqlite npm run seed`）。
>
> seed 本身不再手搓收据：它调用引擎的 `handlePay`，所以策略判定、六段、签名、哈希链都是真的。

### 环境变量

| 变量 | 说明 |
|---|---|
| `LEDGEROOT_DB` | Ledgeroot 本地收据库路径（默认 `ledgeroot.sqlite`） |
| `LEDGEROOT_SIGNING_KEY` | 收据签名密钥（32 字节 hex seed）。Ledgeroot 用它签收据，MandateKey 用它验归属，两边必须一致；不设则收据验证为 `incomplete` 而非 `verified` |
| `LEDGEROOT_DRY_RUN` | 演示用：派生确定性临时密钥，seed 与仪表盘无需配置即可对上（**禁止用于真实支付**） |
| `NEXT_PUBLIC_ANCHOR_ADDRESS` | 锚定合约地址（用于读取 `latestRoot`） |
| `LEDGEROOT_RPC_URL` | Monad testnet RPC（默认 `https://testnet-rpc.monad.xyz`） |

## 仓库结构

```
app/
  page.tsx            仪表盘首页
  api/receipts        收据流（只读 Ledgeroot 本地库）
  api/mandates        授权清单 + 一键撤销
  api/verify          离线三态验证
  api/export          证据包导出（zip：收据 + 锚定 + 包含证明 + JWKS + 验证脚本）
  api/consistency     授权-执行一致性分析
  api/anchor          当前 epoch 根 + 最近一次锚定记录
components/
  mandate-list        授权清单（额度进度）
  timeline            一致性时间线
  kill-switch         一键熔断
  anchor-status       链上锚定状态与链上/本地一致性（wagmi）
  verification-panel  离线三态验证结果
  evidence-export     证据包导出（zip）
lib/                  wagmi 配置 · Monad 链 · 锚定 ABI · 轮询/刷新总线 · zip 打包
agent/demo.mjs        演示数据 seed 脚本
```

## 依赖声明

本仓库通过 `package.json` 依赖 npm 包 `ledgeroot`（`^0.5.0`）。这是自己的开源库，README 与仓库历史中已明确声明。
