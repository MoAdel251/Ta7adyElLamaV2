/* ==========================================================================
   Core utilities
   ========================================================================== */
(function (global) {
  "use strict";

  const U = {};

  U.$ = (sel, root) => (root || document).querySelector(sel);
  U.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  U.esc = function (value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  U.icon = function (name, cls) {
    return (
      '<svg class="i' +
      (cls ? " " + cls : "") +
      '" aria-hidden="true" focusable="false"><use href="#i-' +
      name +
      '"></use></svg>'
    );
  };

  U.n = (value) => Number(value || 0).toLocaleString("en-US");
  U.clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  U.pct = (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0);

  U.t = function (en, ar) {
    return (global.I18n && I18n.lang === "ar") ? ar : en;
  };

  U.uid = function (prefix) {
    return (prefix || "id") + "-" + Math.random().toString(36).slice(2, 9);
  };

  // Deterministic PRNG so demo season data stays stable between reloads.
  U.rng = function (seed) {
    let s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  };

  U.hash = function (str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  U.initials = function (name) {
    const parts = String(name || "").replace(/[^\p{L}\p{N} ]/gu, " ").trim().split(/\s+/);
    if (!parts.length || !parts[0]) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  U.avatarHue = function (name) {
    return U.hash(String(name)) % 360;
  };

  U.avatar = function (name, opts) {
    opts = opts || {};
    const hue = opts.hue != null ? opts.hue : U.avatarHue(name);
    const size = opts.size || "";
    const ring = opts.ring ? " avatar-ring" : "";
    const gold = opts.gold ? " avatar-gold" : "";
    const style =
      " style=\"--av-bg:linear-gradient(140deg,hsl(" +
      hue +
      " 68% 58%),hsl(" +
      ((hue + 58) % 360) +
      " 72% 46%))\"";
    const inner = opts.img
      ? '<img src="' + U.esc(opts.img) + '" alt="" loading="lazy">'
      : U.esc(U.initials(name));
    return (
      '<span class="avatar ' +
      size +
      ring +
      gold +
      '"' +
      style +
      (opts.title ? ' title="' + U.esc(opts.title) + '"' : "") +
      ">" +
      inner +
      "</span>"
    );
  };

  U.avatarWithStatus = function (name, status, opts) {
    opts = opts || {};
    return (
      '<span class="avatar-wrap">' +
      U.avatar(name, opts) +
      '<span class="avatar-status ' +
      (status === "online" ? "is-online" : status === "ingame" ? "is-ingame" : "") +
      '"></span></span>'
    );
  };

  U.dateShort = function (iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const lang = global.I18n && I18n.lang === "ar" ? "ar-EG" : "en-GB";
    return d.toLocaleDateString(lang, { day: "numeric", month: "short" });
  };

  U.timeShort = function (iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    const lang = global.I18n && I18n.lang === "ar" ? "ar-EG" : "en-GB";
    return d.toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" });
  };

  U.relTime = function (iso) {
    const d = new Date(iso).getTime();
    if (isNaN(d)) return "";
    const diff = Date.now() - d;
    const mins = Math.round(diff / 60000);
    if (mins < 1) return U.t("Just now", "الآن");
    if (mins < 60) return U.t(mins + "m ago", "منذ " + mins + " د");
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return U.t(hrs + "h ago", "منذ " + hrs + " س");
    const days = Math.round(hrs / 24);
    if (days < 7) return U.t(days + "d ago", "منذ " + days + " يوم");
    return U.dateShort(iso);
  };

  U.daysFromNow = function (days) {
    return new Date(Date.now() + days * 86400000).toISOString();
  };

  U.priceEgp = function (n) {
    return U.n(n) + " EGP";
  };

  U.debounce = function (fn, wait) {
    let t;
    return function () {
      const args = arguments;
      const ctx = this;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(ctx, args), wait);
    };
  };

  U.hexToRgba = function (hex, alpha) {
    const h = hex.replace("#", "");
    const bigint = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
  };

  global.U = U;
})(window);
