/* ==========================================================================
   Shared domain components (both platforms)
   ========================================================================== */
(function (global) {
  "use strict";

  const Comp = {};

  Comp.sectionHead = function (title, sub, action) {
    return (
      '<div class="section-head">' +
      "<div><h2>" + U.esc(title) + "</h2>" + (sub ? "<p>" + U.esc(sub) + "</p>" : "") + "</div>" +
      (action || "") +
      "</div>"
    );
  };

  Comp.panelHead = function (title, sub, action) {
    return (
      '<div class="panel-head"><div><h2>' + U.esc(title) + "</h2>" +
      (sub ? '<div class="sub">' + U.esc(sub) + "</div>" : "") +
      "</div>" + (action || "") + "</div>"
    );
  };

  Comp.stat = function (opts) {
    return (
      '<div class="stat">' +
      '<div class="stat-icon">' + U.icon(opts.icon || "chart") + "</div>" +
      '<div class="stat-label">' + U.esc(opts.label) + "</div>" +
      '<div class="stat-value">' + opts.value + (opts.suffix ? " <small>" + U.esc(opts.suffix) + "</small>" : "") + "</div>" +
      (opts.foot ? '<div class="stat-foot">' + opts.foot + "</div>" : "") +
      "</div>"
    );
  };

  Comp.statusBadge = function (status) {
    const map = {
      live: ['badge-live', '<span class="dot-live"></span>', U.t("Live", "مباشر")],
      upcoming: ["badge-purple", U.icon("clock"), U.t("Upcoming", "قادمة")],
      completed: ["badge-gold", U.icon("trophy"), U.t("Completed", "مكتملة")],
      open: ["badge-green", U.icon("check"), U.t("Open", "مفتوحة")],
      qualifying: ["badge-cyan", U.icon("bolt"), U.t("In progress", "جارية")],
      scheduled: ["badge-purple", U.icon("calendar"), U.t("Scheduled", "مجدولة")],
      knockout: ["badge-gold", U.icon("sword"), U.t("Knockout", "خروج المغلوب")],
    };
    const v = map[status] || map.upcoming;
    return '<span class="badge ' + v[0] + '">' + v[1] + U.esc(v[2]) + "</span>";
  };

  Comp.tournamentCard = function (t) {
    const champion = t.championId ? Store.player(t.championId) : null;
    return (
      '<article class="card card-hover tcard ' + (t.kind || "") + '">' +
      '<div class="tcard-art">' +
      '<span class="status-float">' + Comp.statusBadge(t.status) + "</span>" +
      '<span class="art-icon">' + U.icon(t.icon) + "</span>" +
      "</div>" +
      '<div class="tcard-body">' +
      "<div><h3>" + U.esc(I18n.pick(t.name)) + "</h3>" +
      '<p class="desc">' + U.esc(I18n.pick(t.desc)) + "</p></div>" +
      '<div class="tcard-meta">' +
      (t.stage ? "<span>" + U.icon("flag") + U.esc(I18n.pick(t.stage)) + "</span>" : "") +
      (t.participants ? "<span>" + U.icon("users") + t.participants + " " + U.esc(U.t("players", "لاعب")) + "</span>" : "") +
      (t.date ? "<span>" + U.icon("calendar") + U.esc(U.dateShort(t.date)) + "</span>" : "") +
      "</div>" +
      (champion
        ? '<div class="champion-banner">' + U.icon("crown") + "<div><strong>" + U.esc(I18n.pick(champion.name)) + "</strong><span>" + U.esc(U.t("Champion", "البطل")) + "</span></div></div>"
        : "") +
      '<div class="tcard-foot">' +
      '<a class="btn btn-sm ' + (t.kind === "super" ? "btn-primary" : t.kind === "cup" ? "btn-gold" : "btn-green") + '" href="' + t.href + '">' +
      U.esc(t.cta || U.t("View details", "عرض التفاصيل")) + U.icon("arrow", "i-arrow") + "</a>" +
      (t.secondary ? t.secondary : "") +
      "</div></div></article>"
    );
  };

  Comp.moMatchRow = function (m) {
    const opp = Store.moPlayer(m.opponent);
    const won = m.scoreMe > m.scoreOpp;
    const game = Store.db.mo.games.find((g) => g.id === m.game);
    return (
      '<div class="match-row">' +
      '<div class="match-opp me">' +
      U.avatar(I18n.pick(Store.db.mo.me.name), { size: "avatar-sm", hue: Store.db.mo.me.hue }) +
      '<div class="who"><strong>' + U.esc(U.t("You", "أنت")) + "</strong><span>" + U.esc(U.dateShort(m.date)) + "</span></div>" +
      "</div>" +
      '<div class="match-score ' + (won ? "win" : "loss") + '">' + m.scoreMe + " – " + m.scoreOpp + "</div>" +
      '<div class="match-opp">' +
      (opp ? U.avatar(I18n.pick(opp.name), { size: "avatar-sm", hue: opp.hue }) : "") +
      '<div class="who"><strong>' + U.esc(opp ? I18n.pick(opp.name) : "—") + "</strong><span>" + U.esc(I18n.pick(game ? game.name : { en: "", ar: "" })) + "</span></div>" +
      "</div>" +
      '<div class="match-tag">' + U.esc(U.t(won ? "Victory" : "Defeat", won ? "فوز" : "خسارة")) + "</div>" +
      "</div>"
    );
  };

  Comp.playerMini = function (player, rank, link) {
    return (
      '<a class="player-cell" href="' + (link || "#/mo/profile?id=" + player.id) + '" style="color:inherit">' +
      '<span class="pos-badge ' + (rank <= 3 ? "pos-" + rank : "") + '">' + rank + "</span>" +
      U.avatar(I18n.pick(player.name), { size: "avatar-sm", hue: player.hue }) +
      '<span><span class="name">' + U.esc(I18n.pick(player.name)) + "</span></span>" +
      "</a>"
    );
  };

  Comp.empty = function (icon, title, text, action) {
    return (
      '<div class="empty"><div class="empty-icon">' + U.icon(icon) + "</div>" +
      "<h3>" + U.esc(title) + "</h3>" +
      "<p>" + U.esc(text) + "</p>" +
      (action || "") + "</div>"
    );
  };

  Comp.formDots = function (form) {
    return (
      '<span class="form-dots">' +
      form
        .slice(-5)
        .map((f) => '<i class="' + f + '" aria-label="' + U.esc(f === "w" ? U.t("Win", "فوز") : f === "d" ? U.t("Draw", "تعادل") : U.t("Loss", "خسارة")) + '">' + f.toUpperCase() + "</i>")
        .join("") +
      "</span>"
    );
  };

  Comp.leagueRows = function (rows, opts) {
    opts = opts || {};
    return rows
      .map((r, i) => {
        const p = Store.player(r.id);
        const pos = i + 1;
        return (
          '<tr class="' + (pos <= 4 ? "is-qualify" : "") + '">' +
          '<td class="col-pos"><span class="pos-badge ' + (pos <= 3 ? "pos-" + pos : "") + '">' + pos + "</span></td>" +
          '<td class="col-player"><a class="player-cell" href="#/tahady/profile?id=' + p.id + '">' +
          U.avatar(I18n.pick(p.name), { size: "avatar-sm", hue: p.hue }) +
          '<span><span class="name">' + U.esc(I18n.pick(p.name)) + "</span>" +
          '<span class="sub">' + U.esc(p.handle) + "</span></span></a></td>" +
          '<td class="num">' + r.played + "</td>" +
          '<td class="num">' + r.won + "</td>" +
          '<td class="num">' + r.drawn + "</td>" +
          '<td class="num">' + r.lost + "</td>" +
          '<td class="num">' + (r.gd > 0 ? "+" + r.gd : r.gd) + "</td>" +
          (opts.hideForm ? "" : '<td class="num">' + Comp.formDots(r.form) + "</td>") +
          '<td class="num points">' + r.points + "</td>" +
          "</tr>"
        );
      })
      .join("");
  };

  Comp.sparkline = function (values, opts) {
    opts = opts || {};
    const w = opts.width || 120;
    const h = opts.height || 34;
    const max = Math.max.apply(null, values.concat([1]));
    const min = Math.min.apply(null, values.concat([0]));
    const range = max - min || 1;
    const step = w / (values.length - 1 || 1);
    const pts = values.map((v, i) => [i * step, h - ((v - min) / range) * (h - 4) - 2]);
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const area = d + " L" + w + " " + h + " L0 " + h + " Z";
    const id = "sp-" + Math.random().toString(36).slice(2, 7);
    return (
      '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + " " + h + '" fill="none" aria-hidden="true" style="overflow:visible">' +
      "<defs><linearGradient id=\"" + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + (opts.color || "#8B6BFF") + '" stop-opacity=".4"/>' +
      '<stop offset="1" stop-color="' + (opts.color || "#8B6BFF") + '" stop-opacity="0"/>' +
      "</linearGradient></defs>" +
      '<path d="' + area + '" fill="url(#' + id + ')"/>' +
      '<path d="' + d + '" stroke="' + (opts.color || "#8B6BFF") + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
      "</svg>"
    );
  };

  global.Comp = Comp;
})(window);
