"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Locale = "en" | "zh";

/**
 * English is the default and the fallback for every key. The choice is stored
 * locally and read once at module load on the client; `useSyncExternalStore`
 * serves the server snapshot ("en") during hydration and the stored value
 * immediately after, which is what keeps a zh reader from tripping a hydration
 * mismatch.
 */
const STORAGE_KEY = "mandatekey.locale";
const listeners = new Set<() => void>();

function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "zh";
}

let current: Locale = "en";
if (typeof window !== "undefined") {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isLocale(stored)) current = stored;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setLocale(locale: Locale): void {
  if (locale === current) return;
  current = locale;
  window.localStorage.setItem(STORAGE_KEY, locale);
  applyDocumentLang(locale);
  for (const listener of listeners) listener();
}

/** Keep `<html lang>` in step, so screen readers switch voice with the UI. */
export function applyDocumentLang(locale: Locale): void {
  document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
}

export function useLocale(): Locale {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => "en" as Locale,
  );
}

/** Locale tag for `toLocaleString` and friends. */
export function dateLocale(locale: Locale): string {
  return locale === "zh" ? "zh-CN" : "en-US";
}

/*
 * Engine output is deliberately absent from this dictionary. Policy reasons,
 * status values (verified / tampered / incomplete / paid / denied) and every
 * hash stay verbatim in both languages: they are the evidence, and the screen
 * must not paraphrase what the receipt proves.
 */
const en = {
  "app.tagline":
    "Which agents are authorized, to spend what, until when, and the evidence that they did.",

  "lang.label": "Language",

  "kill.action": "Kill switch",
  "kill.busy": "Revoking…",
  "kill.confirm": "Revoke every agent authorization?",
  "kill.failed": "Kill switch failed.",
  "kill.done": "Revoked {count} mandate(s). The next payment will be denied.",

  "anchor.section": "Anchoring",
  "anchor.notConfigured": "No anchor contract configured (NEXT_PUBLIC_ANCHOR_ADDRESS).",
  "anchor.none": "Not anchored yet. Run npm run anchor in the ledgeroot repo.",
  "anchor.epoch": "epoch {epoch}",
  "anchor.covers": "covers {covered} of {total} receipts",
  "anchor.root": "Root",
  "anchor.unreadable": "Could not read the anchor contract",
  "anchor.rootMatch": "root matches latestRoot",
  "anchor.rootMismatch": "root differs from latestRoot",
  "anchor.epochMatch": "epoch matches the counter",
  "anchor.epochMismatch": "epoch differs (local {local}, chain {chain})",
  "anchor.contractMatch": "anchored to this contract",
  "anchor.contractMismatch": "anchored to a different contract",
  "anchor.explorer": "View the anchor transaction on Monad Explorer",

  "verify.section": "Verification",
  "verify.meaning.verified":
    "Every receipt recomputes to its own hash and every signature checks out.",
  "verify.meaning.tampered": "Bytes were checked and do not match. Something was changed.",
  "verify.meaning.incomplete":
    "Evidence is missing, so a check could not run. Not the same as tampered.",
  "verify.anchored": "{count} receipts · anchored at epoch {epoch}",
  "verify.unanchored": "{count} receipts · not anchored",
  "verify.issues": "{count} issue(s) reported",

  "evidence.section": "Evidence",
  "evidence.body":
    "Receipts, the anchor record, the JWKS and a standalone verifier in one zip. Unzip it and run node verify.mjs: no server, and nothing installed from us.",
  "evidence.action": "Download bundle",
  "evidence.busy": "Exporting…",
  "evidence.failed": "Export failed: {error}",

  "mandates.section": "Authorizations",
  "mandates.empty": "No authorizations yet.",
  "mandates.emptyHint": "Issue one from the agent host with ledgeroot_mandate_sign.",
  "mandates.error": "Could not read authorizations: {error}",
  "mandates.trace": "Trace this authorization's receipts",
  "mandates.tracing": "tracing",
  "mandates.revoked": "revoked",
  "mandates.expired": "expired",
  "mandates.unbound": "unbound agent",
  "mandates.perPayment": "max {amount} USDC per payment",
  "mandates.spent": "spent {spent} / {total} USDC",
  "mandates.expiresAt": "expires {date}",

  "timeline.section": "Timeline",
  "timeline.empty": "No receipts yet. A payment will show up here.",
  "timeline.error": "Could not read receipts: {error}",
  "timeline.byTask": "By task",
  "timeline.taskLine": "{count} payments · {total} USDC",
  "timeline.taskBlocked": " · {count} blocked",
  "timeline.status.paid": "paid",
  "timeline.status.denied": "blocked",
  "timeline.status.overAuthorized": "over-authorized",
  "timeline.mandate": "mandate",
  "timeline.task": "task",
  "timeline.overAuthorized": "over-authorized: {reasons}",
  "timeline.cumulative": "{spent} / {limit} USDC",
  "timeline.tracing": "tracing {id}",
  "timeline.clear": "clear",

  "footer.provenance":
    "Reads the local Ledgeroot ledger and the anchor contract. No backend, no account, nothing leaves this machine.",
} as const;

export type MessageKey = keyof typeof en;

const zh: Record<MessageKey, string> = {
  "app.tagline": "哪些 agent 被授权、能花多少、到什么时候，以及它们确实花了的证据。",

  "lang.label": "语言",

  "kill.action": "一键熔断",
  "kill.busy": "撤销中…",
  "kill.confirm": "撤销全部 agent 授权？",
  "kill.failed": "熔断失败。",
  "kill.done": "已撤销 {count} 条授权。下一笔支付会被拒付。",

  "anchor.section": "链上锚定",
  "anchor.notConfigured": "未配置锚定合约（NEXT_PUBLIC_ANCHOR_ADDRESS）。",
  "anchor.none": "尚未锚定。在 ledgeroot 仓库运行 npm run anchor。",
  "anchor.epoch": "epoch {epoch}",
  "anchor.covers": "覆盖 {covered} / {total} 张收据",
  "anchor.root": "根",
  "anchor.unreadable": "无法读取锚定合约",
  "anchor.rootMatch": "根与 latestRoot 一致",
  "anchor.rootMismatch": "根与 latestRoot 不一致",
  "anchor.epochMatch": "epoch 与计数器一致",
  "anchor.epochMismatch": "epoch 不一致（本地 {local}，链上 {chain}）",
  "anchor.contractMatch": "锚定于本合约",
  "anchor.contractMismatch": "锚定于另一个合约",
  "anchor.explorer": "在 Monad 浏览器中查看锚定交易",

  "verify.section": "离线三态验证",
  "verify.meaning.verified": "每张收据都重算出自哈希，每个签名都验过。",
  "verify.meaning.tampered": "字节被核对过且不吻合，有东西被改过。",
  "verify.meaning.incomplete": "证据缺失，有一项检查没能跑。这与「篡改」不是一回事。",
  "verify.anchored": "{count} 张收据 · 锚定 epoch {epoch}",
  "verify.unanchored": "{count} 张收据 · 尚未锚定",
  "verify.issues": "报告 {count} 个问题",

  "evidence.section": "可验证证据包",
  "evidence.body":
    "收据、锚定记录、JWKS 和一个独立验证器，打成一个 zip。解压后运行 node verify.mjs：不需要服务器，也不用装我们的任何东西。",
  "evidence.action": "导出证据包",
  "evidence.busy": "导出中…",
  "evidence.failed": "导出失败：{error}",

  "mandates.section": "授权清单",
  "mandates.empty": "还没有授权。",
  "mandates.emptyHint": "在 agent 宿主里用 ledgeroot_mandate_sign 签发一张。",
  "mandates.error": "无法读取授权：{error}",
  "mandates.trace": "追踪这张授权令对应的收据",
  "mandates.tracing": "追踪中",
  "mandates.revoked": "已撤销",
  "mandates.expired": "已过期",
  "mandates.unbound": "未绑定 agent",
  "mandates.perPayment": "单笔上限 {amount} USDC",
  "mandates.spent": "已用 {spent} / 累计上限 {total} USDC",
  "mandates.expiresAt": "有效期至 {date}",

  "timeline.section": "一致性时间线",
  "timeline.empty": "还没有收据。发生支付后会出现在这里。",
  "timeline.error": "无法读取收据：{error}",
  "timeline.byTask": "按任务",
  "timeline.taskLine": "{count} 笔 · {total} USDC",
  "timeline.taskBlocked": " · {count} 拦截",
  "timeline.status.paid": "已付",
  "timeline.status.denied": "已拦截",
  "timeline.status.overAuthorized": "越权",
  "timeline.mandate": "授权令",
  "timeline.task": "任务",
  "timeline.overAuthorized": "越权：{reasons}",
  "timeline.cumulative": "累计 {spent} / 上限 {limit} USDC",
  "timeline.tracing": "追踪 {id}",
  "timeline.clear": "清除",

  "footer.provenance": "只读取本地 Ledgeroot 账本与链上锚定合约。没有后端、没有账号，数据不出本机。",
};

const DICT: Record<Locale, Record<MessageKey, string>> = { en, zh };

export type MessageVars = Record<string, string | number>;

function format(template: string, vars?: MessageVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/** Translate a key for the current locale. Re-renders when the locale changes. */
export function useT(): (key: MessageKey, vars?: MessageVars) => string {
  const locale = useLocale();
  return useCallback((key: MessageKey, vars?: MessageVars) => format(DICT[locale][key], vars), [
    locale,
  ]);
}
