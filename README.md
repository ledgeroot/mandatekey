# MandateKey

用户侧「钥匙圈」仪表盘。消费 [Ledgeroot](../ledgeroot) 产出的证据流，让用户一屏看清"哪个 agent、能花多少、到何时"，并在出问题时一键撤销、把证据带走。

> 钱包管钱，MandateKey 管"谁被允许动钱"，以及"钱花出去后如何向任何人证明"。

---

## 四大功能

1. **统一授权清单** — 聚合 AP2 mandate、本地策略、x402 会话
2. **授权-执行一致性时间线** — 收据流实时渲染，越权消费自动标记
3. **一键撤销 / 熔断** — 按下即撤销全部授权，下一笔当场拒付留痕
4. **可验证证据包导出** — 收据 + Merkle 证明 + 锚定引用，离线三态验证

## 技术栈

Next.js · Tailwind v4 · wagmi v3 · viem v2 · React Query

数据源：本地 Ledgeroot SQLite（只读）+ 链上锚定事件，无后端、零服务器。

## 快速开始

```bash
# 1. 构建并打包 ledgeroot（本仓库以 file: 依赖引用其 tarball）
cd ../ledgeroot && npm install && npm run build && npm pack

# 2. 安装并启动仪表盘
cd ../mandatekey && npm install
npm run seed        # 写入演示 mandate + 收据
npm run dev         # http://localhost:3000
```

### 环境变量

| 变量 | 说明 |
|---|---|
| `LEDGEROOT_DB` | Ledgeroot 本地收据库路径（默认 `ledgeroot.sqlite`） |
| `NEXT_PUBLIC_ANCHOR_ADDRESS` | 锚定合约地址（用于读取 `latestRoot`） |
| `LEDGEROOT_RPC_URL` | Monad testnet RPC（默认 `https://testnet-rpc.monad.xyz`） |

## 仓库结构

```
app/
  page.tsx            仪表盘首页
  api/receipts        收据流（只读 Ledgeroot 本地库）
  api/mandates        授权清单 + 一键撤销
  api/verify          离线三态验证
  api/export          证据包导出
components/
  mandate-list        授权清单
  timeline            一致性时间线
  kill-switch         一键熔断
  anchor-status       链上锚定状态（wagmi）
  evidence-export     证据包导出
lib/                  wagmi 配置 + Monad 链 + 锚定 ABI
agent/demo.mjs        演示数据 seed 脚本
deploy/monad.ts       赛事部署配置
```

## 依赖声明

本仓库通过 `package.json` 依赖核心机芯 `ledgeroot`（本地开发用 `file:../ledgeroot/ledgeroot-0.1.0.tgz`，发布后改为 npm 包 `ledgeroot`）。这是自己的开源库，README 与仓库历史中已明确声明。
