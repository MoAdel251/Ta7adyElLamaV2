/* ==========================================================================
   UI primitives — toasts, modals, dropdowns, search palette
   ========================================================================== */
(function (global) {
  "use strict";

  const UI = {};
  let lastFocus = null;
  let escHandler = null;

  /* ---------- Toasts ---------- */
  UI.toast = function (opts) {
    if (typeof opts === "string") opts = { title: opts };
    const stack = document.getElementById("toast-stack");
    if (!stack) return;
    const type = opts.type || "info";
    const iconName = opts.icon || (type === "success" ? "check" : type === "error" ? "x" : type === "gold" ? "sparkles" : "info");
    const el = document.createElement("div");
    el.className = "toast " + type;
    el.setAttribute("role", "status");
    el.innerHTML =
      '<span class="toast-icon">' + U.icon(iconName) + "</span>" +
      '<div class="toast-body">' +
      '<div class="toast-title">' + U.esc(opts.title || "") + "</div>" +
      (opts.msg ? '<div class="toast-msg">' + U.esc(opts.msg) + "</div>" : "") +
      "</div>" +
      '<button class="toast-close" aria-label="' + U.esc(U.t("Dismiss", "إغلاق")) + '">' + U.icon("x") + "</button>";
    stack.appendChild(el);
    const remove = function () {
      el.classList.add("is-leaving");
      setTimeout(() => el.remove(), 220);
    };
    el.querySelector(".toast-close").addEventListener("click", remove);
    setTimeout(remove, opts.duration || 4200);
  };

  /* ---------- Modal ---------- */
  UI.closeModal = function () {
    const root = document.getElementById("modal-root");
    if (!root || !root.classList.contains("is-open")) return;
    root.classList.remove("is-open");
    document.body.style.removeProperty("overflow");
    setTimeout(() => {
      if (!root.classList.contains("is-open")) root.innerHTML = "";
    }, 220);
    if (escHandler) {
      document.removeEventListener("keydown", escHandler);
      escHandler = null;
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
  };

  UI.openModal = function (opts) {
    opts = opts || {};
    const root = document.getElementById("modal-root");
    if (!root) return function () {};
    lastFocus = document.activeElement;
    const sizeClass = opts.size === "wide" ? " wide" : opts.size === "slim" ? " slim" : "";
    root.innerHTML =
      '<div class="modal-scrim" data-close="1"></div>' +
      '<div class="modal' + sizeClass + '" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
      '<div class="modal-head">' +
      "<div>" +
      '<h2 id="modal-title">' + (opts.title || "") + "</h2>" +
      (opts.subtitle ? "<p>" + opts.subtitle + "</p>" : "") +
      "</div>" +
      '<button class="icon-btn" data-close="1" aria-label="' + U.esc(U.t("Close", "إغلاق")) + '">' + U.icon("x") + "</button>" +
      "</div>" +
      (opts.body ? '<div class="modal-body">' + opts.body + "</div>" : "") +
      (opts.footer ? '<div class="modal-foot">' + opts.footer + "</div>" : "") +
      "</div>";

    requestAnimationFrame(() => root.classList.add("is-open"));
    document.body.style.overflow = "hidden";

    root.querySelectorAll("[data-close]").forEach((el) => {
      el.addEventListener("click", UI.closeModal);
    });

    escHandler = function (e) {
      if (e.key === "Escape") UI.closeModal();
      if (e.key === "Tab") {
        const dialog = root.querySelector(".modal");
        if (!dialog) return;
        const nodes = Array.from(
          dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')
        ).filter((n) => n.offsetParent !== null);
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", escHandler);

    if (opts.onMount) opts.onMount(root, UI.closeModal);
    const focusTarget = root.querySelector(".modal-body input, .modal-body select, .modal-foot .btn, .modal .btn");
    if (focusTarget) setTimeout(() => focusTarget.focus(), 60);
    return UI.closeModal;
  };

  UI.confirm = function (opts) {
    return new Promise((resolve) => {
      UI.openModal({
        title: opts.title || U.t("Are you sure?", "هل أنت متأكد؟"),
        subtitle: opts.message || "",
        size: "slim",
        body: opts.body || "",
        footer:
          '<button class="btn btn-secondary" data-no>' + U.esc(opts.cancel || U.t("Cancel", "إلغاء")) + "</button>" +
          '<button class="btn ' + (opts.danger ? "btn-danger" : "btn-primary") + '" data-yes>' +
          U.esc(opts.confirm || U.t("Confirm", "تأكيد")) + "</button>",
        onMount: function (root, close) {
          root.querySelector("[data-no]").addEventListener("click", function () {
            close();
            resolve(false);
          });
          root.querySelector("[data-yes]").addEventListener("click", function () {
            close();
            resolve(true);
          });
          root.querySelectorAll(".modal-scrim, [data-close]").forEach((el) =>
            el.addEventListener("click", () => resolve(false))
          );
        },
      });
    });
  };

  /* ---------- Dropdowns ---------- */
  UI.initDropdowns = function () {
    document.addEventListener("click", function (e) {
      const trigger = e.target.closest("[data-dropdown]");
      const openMenus = document.querySelectorAll(".dropdown-menu.is-open");
      if (trigger) {
        e.preventDefault();
        const menu = document.getElementById(trigger.getAttribute("data-dropdown"));
        if (!menu) return;
        const wasOpen = menu.classList.contains("is-open");
        openMenus.forEach((m) => m.classList.remove("is-open"));
        if (!wasOpen) menu.classList.add("is-open");
        return;
      }
      if (!e.target.closest(".dropdown-menu")) openMenus.forEach((m) => m.classList.remove("is-open"));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") document.querySelectorAll(".dropdown-menu.is-open").forEach((m) => m.classList.remove("is-open"));
    });
  };

  /* ---------- Clipboard ---------- */
  UI.copy = function (text, message) {
    const done = function () {
      UI.toast({ title: message || U.t("Copied to clipboard", "تم النسخ"), icon: "check", type: "success" });
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallback());
    } else fallback();
    function fallback() {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { /* noop */ }
      ta.remove();
    }
  };

  /* ---------- Search palette ---------- */
  UI.searchIndex = function () {
    const pages = [
      { label: U.t("Home", "الرئيسية"), path: "#/", icon: "home", group: U.t("Pages", "الصفحات") },
      { label: U.t("Unified landing", "الواجهة الموحدة"), path: "#/", icon: "sparkles", group: U.t("Pages", "الصفحات") },
      { label: U.t("Mo Games dashboard", "لوحة مو جيمز"), path: "#/mo", icon: "sword", group: "Mo Games" },
      { label: U.t("Play now", "العب الآن"), path: "#/mo/play", icon: "play", group: "Mo Games" },
      { label: U.t("Quick match", "مباراة سريعة"), path: "#/mo/play?mode=quick", icon: "bolt", group: "Mo Games" },
      { label: U.t("Live matches", "المباريات المباشرة"), path: "#/mo/live", icon: "tv", group: "Mo Games" },
      { label: U.t("Leaderboard", "لوحة المتصدرين"), path: "#/mo/leaderboard", icon: "chart", group: "Mo Games" },
      { label: U.t("Friends", "الأصدقاء"), path: "#/mo/friends", icon: "users", group: "Mo Games" },
      { label: U.t("My profile", "ملفي الشخصي"), path: "#/mo/profile", icon: "user", group: "Mo Games" },
      { label: U.t("Settings", "الإعدادات"), path: "#/mo/settings", icon: "settings", group: "Mo Games" },
      { label: U.t("Tahady dashboard", "لوحة تحدي اللمة"), path: "#/tahady", icon: "trophy", group: "Tahady El Lamma" },
      { label: U.t("Tournaments", "البطولات"), path: "#/tahady/tournaments", icon: "trophy", group: "Tahady El Lamma" },
      { label: U.t("League standings", "جدول الدوري"), path: "#/tahady/league", icon: "chart", group: "Tahady El Lamma" },
      { label: U.t("كأس اللمة", "كأس اللمة"), path: "#/tahady/cup", icon: "medal", group: "Tahady El Lamma" },
      { label: U.t("Super El Nokhba", "سوبر النخبة"), path: "#/tahady/super", icon: "crown", group: "Tahady El Lamma" },
      { label: U.t("Admin", "الإدارة"), path: "#/admin", icon: "shield", group: U.t("Pages", "الصفحات") },
    ];
    const players = Store.db.players.map((p) => ({
      label: I18n.pick(p.name),
      meta: p.handle,
      path: "#/tahady/profile?id=" + p.id,
      icon: "user",
      group: U.t("Tahady players", "لاعبو تحدي اللمة"),
      avatarName: I18n.pick(p.name),
      hue: p.hue,
    }));
    Store.db.mo.rivals.forEach((p) => {
      players.push({
        label: I18n.pick(p.name),
        meta: p.handle,
        path: "#/mo/profile?id=" + p.id,
        icon: "user",
        group: U.t("Mo Games players", "لاعبو مو جيمز"),
        avatarName: I18n.pick(p.name),
        hue: p.hue,
      });
    });
    return pages.concat(players);
  };

  UI.openSearch = function () {
    const items = UI.searchIndex();
    const body =
      '<div class="palette-search">' + U.icon("search") +
      '<input id="palette-input" type="search" placeholder="' + U.esc(U.t("Search players, pages, tournaments…", "ابحث عن لاعب، صفحة، بطولة…")) + '" autocomplete="off" aria-label="' + U.esc(U.t("Search", "بحث")) + '"></div>' +
      '<div class="palette-results" id="palette-results"></div>' +
      '<div class="palette-hint"><span class="kbd">↑</span><span class="kbd">↓</span> ' + U.esc(U.t("to navigate", "للتنقل")) + ' <span class="kbd">↵</span> ' + U.esc(U.t("to open", "للفتح")) + "</div>";

    UI.openModal({
      title: U.t("Quick search", "بحث سريع"),
      size: "slim",
      body: body,
      onMount: function (root, close) {
        const input = root.querySelector("#palette-input");
        const results = root.querySelector("#palette-results");
        let active = 0;
        let filtered = items;

        function render() {
          if (!filtered.length) {
            results.innerHTML = '<div class="empty"><p>' + U.esc(U.t("No results found", "لا توجد نتائج")) + "</p></div>";
            return;
          }
          const groups = {};
          filtered.forEach((it, i) => {
            (groups[it.group] = groups[it.group] || []).push({ it, i });
          });
          results.innerHTML = Object.keys(groups)
            .map((g) => {
              return (
                '<div class="palette-group"><div class="palette-group-label">' + U.esc(g) + "</div>" +
                groups[g]
                  .map(({ it, i }) => {
                    return (
                      '<a class="palette-item' + (i === active ? " is-active" : "") + '" href="' + it.path + '" data-idx="' + i + '">' +
                      (it.avatarName ? U.avatar(it.avatarName, { size: "avatar-sm", hue: it.hue }) : '<span class="palette-ic">' + U.icon(it.icon) + "</span>") +
                      '<span class="palette-text"><strong>' + U.esc(it.label) + "</strong>" +
                      (it.meta ? '<small>' + U.esc(it.meta) + "</small>" : "") +
                      "</span></a>"
                    );
                  })
                  .join("") +
                "</div>"
              );
            })
            .join("");
          results.querySelectorAll(".palette-item").forEach((a) => {
            a.addEventListener("click", function () {
              close();
              Router.go(a.getAttribute("href").slice(1));
            });
            a.addEventListener("mouseenter", function () {
              active = Number(a.getAttribute("data-idx"));
              results.querySelectorAll(".palette-item").forEach((x) => x.classList.remove("is-active"));
              a.classList.add("is-active");
            });
          });
        }

        function update() {
          const q = input.value.trim().toLowerCase();
          filtered = !q
            ? items.slice(0, 14)
            : items.filter((it) => (it.label + " " + (it.meta || "") + " " + it.group).toLowerCase().includes(q)).slice(0, 30);
          active = 0;
          render();
        }

        input.addEventListener("input", update);
        input.addEventListener("keydown", function (e) {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            active = Math.min(active + 1, filtered.length - 1);
            render();
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            active = Math.max(active - 1, 0);
            render();
          } else if (e.key === "Enter" && filtered[active]) {
            e.preventDefault();
            const path = filtered[active].path;
            close();
            Router.go(path.slice(1));
          }
        });
        update();
        setTimeout(() => input.focus(), 80);
      },
    });
  };

  global.UI = UI;
})(window);
