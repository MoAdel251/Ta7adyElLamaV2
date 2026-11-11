/* ==========================================================================
   Shell — shared navigation chrome for both platforms
   ========================================================================== */
(function (global) {
  "use strict";

  const Shell = {};

  function navItem(item, active) {
    const isActive = item.key === active;
    return (
      '<a class="nav-item' + (isActive ? " is-active" : "") + '" href="' + item.href + '"' +
      (isActive ? ' aria-current="page"' : "") + ">" +
      U.icon(item.icon) +
      "<span>" + U.esc(item.label) + "</span>" +
      (item.badge ? '<span class="nav-badge">' + item.badge + "</span>" : "") +
      "</a>"
    );
  }

  function navList(items, active) {
    return items
      .map((item) => {
        if (item.group) return '<div class="nav-group-label">' + U.esc(item.group) + "</div>";
        return navItem(item, active);
      })
      .join("");
  }

  function moNav(active) {
    const items = [
      { label: U.t("Home", "الرئيسية"), icon: "home", href: "#/mo", key: "mo" },
      { group: U.t("Play", "اللعب") },
      { label: U.t("Play Now", "العب الآن"), icon: "play", href: "#/mo/play", key: "play" },
      { label: U.t("Quick Match", "مباراة سريعة"), icon: "bolt", href: "#/mo/play?mode=quick", key: "quick" },
      { label: U.t("Challenge a Friend", "تحدَّ صديقًا"), icon: "users", href: "#/mo/play?mode=friend", key: "friend" },
      { label: U.t("Create Room", "غرفة خاصة"), icon: "lock", href: "#/mo/play?mode=room", key: "room" },
      { label: U.t("Live Matches", "مباريات مباشرة"), icon: "tv", href: "#/mo/live", key: "live", badge: "3" },
      { group: U.t("Compete", "المنافسة") },
      { label: U.t("Leaderboard", "لوحة المتصدرين"), icon: "chart", href: "#/mo/leaderboard", key: "leaderboard" },
      { label: U.t("Friends", "الأصدقاء"), icon: "users-round", href: "#/mo/friends", key: "friends" },
      { label: U.t("My Profile", "ملفي الشخصي"), icon: "user", href: "#/mo/profile", key: "profile" },
    ];
    return navList(items, active);
  }

  function tahadyNav(active) {
    const items = [
      { label: U.t("Overview", "نظرة عامة"), icon: "home", href: "#/tahady", key: "tahady" },
      { group: U.t("Competitions", "البطولات") },
      { label: U.t("الدوري العام", "الدوري العام"), icon: "chart", href: "#/tahady/league", key: "league" },
      { label: U.t("كأس اللمة", "كأس اللمة"), icon: "medal", href: "#/tahady/cup", key: "cup" },
      { label: U.t("سوبر النخبة", "سوبر النخبة"), icon: "crown", href: "#/tahady/super", key: "super" },
      { label: U.t("All Tournaments", "كل البطولات"), icon: "trophy", href: "#/tahady/tournaments", key: "tournaments" },
      { group: U.t("Players", "اللاعبون") },
      { label: U.t("Top Players", "أفضل اللاعبين"), icon: "star", href: "#/tahady/players", key: "players" },
      { label: U.t("Player Profile", "ملف اللاعب"), icon: "user", href: "#/tahady/profile", key: "tprofile" },
    ];
    return navList(items, active);
  }

  function adminNav(active) {
    const items = [
      { label: U.t("Overview", "نظرة عامة"), icon: "home", href: "#/admin", key: "admin" },
      { group: U.t("Manage", "الإدارة") },
      { label: U.t("Players", "اللاعبون"), icon: "users-round", href: "#/admin/players", key: "aplayers" },
      { label: U.t("Questions", "الأسئلة"), icon: "info", href: "#/admin/questions", key: "aquestions" },
      { label: U.t("Matches & Results", "المباريات والنتائج"), icon: "ball", href: "#/admin/matches", key: "amatches" },
      { label: U.t("Tournaments", "البطولات"), icon: "trophy", href: "#/admin/tournaments", key: "atournaments" },
      { label: U.t("Notifications", "الإشعارات"), icon: "bell", href: "#/admin/notifications", key: "anotifications" },
      { label: U.t("Platform Settings", "إعدادات المنصة"), icon: "settings", href: "#/admin/settings", key: "asettings" },
    ];
    return navList(items, active);
  }

  function brandInfo(platform) {
    if (platform === "tahady") {
      return {
        name: U.t("Tahady El Lamma", "تحدي اللمة"),
        sub: "TAHADY EL LAMMA",
        icon: "trophy",
        href: "#/tahady",
      };
    }
    if (platform === "admin") {
      return { name: U.t("Admin Console", "لوحة الإدارة"), sub: "MO ARENA", icon: "shield", href: "#/admin" };
    }
    return { name: U.t("Mo Games", "مو جيمز"), sub: "MO ARENA", icon: "bolt", href: "#/mo" };
  }

  function topbarMeta(platform, title, crumb) {
    return (
      '<div class="topbar-title">' +
      '<span class="crumb">' + U.esc(crumb || "") + "</span>" +
      "<strong>" + U.esc(title || "") + "</strong>" +
      "</div>"
    );
  }

  function notificationsMenu() {
    const list = Store.db.notifications.slice(0, 5);
    return (
      '<div class="dropdown-menu notif-menu" id="notif-menu" role="menu">' +
      '<div class="notif-head"><strong>' + U.esc(U.t("Notifications", "الإشعارات")) + "</strong>" +
      '<button class="btn btn-ghost btn-sm" data-action="mark-read">' + U.esc(U.t("Mark all read", "تحديد الكل كمقروء")) + "</button></div>" +
      (list.length
        ? list
            .map(
              (n) =>
                '<div class="notif' + (n.unread ? " is-unread" : "") + '">' +
                '<span class="notif-icon">' + U.icon(n.icon) + "</span>" +
                "<div>" +
                '<p class="strong">' + U.esc(I18n.pick(n.title)) + "</p>" +
                '<p class="muted">' + U.esc(I18n.pick(n.body)) + "</p>" +
                "<time>" + U.relTime(n.time) + "</time>" +
                "</div></div>"
            )
            .join("")
        : '<div class="empty" style="padding:28px 12px"><p>' + U.esc(U.t("You are all caught up", "لا توجد إشعارات جديدة")) + "</p></div>") +
      "</div>"
    );
  }

  function userMenu() {
    const level = Store.meLevel();
    return (
      '<div class="dropdown-menu" id="user-menu" role="menu">' +
      '<div class="user-menu-head">' + U.avatar(I18n.pick(Store.db.mo.me.name), { size: "avatar-lg", hue: Store.db.mo.me.hue }) +
      "<div><strong>" + U.esc(I18n.pick(Store.db.mo.me.name)) + "</strong>" +
      '<small class="muted">' + U.esc(Store.db.mo.me.handle) + " · Lv " + level.level + "</small></div></div>" +
      '<a href="#/mo/profile">' + U.icon("user") + U.esc(U.t("My profile", "ملفي الشخصي")) + "</a>" +
      '<a href="#/mo/settings">' + U.icon("settings") + U.esc(U.t("Settings", "الإعدادات")) + "</a>" +
      '<a href="#/tahady">' + U.icon("trophy") + U.esc(U.t("Tahady El Lamma", "تحدي اللمة")) + "</a>" +
      '<a href="#/admin">' + U.icon("shield") + U.esc(U.t("Admin console", "لوحة الإدارة")) + "</a>" +
      "<hr>" +
      '<button data-action="switch-lang">' + U.icon("globe") + U.esc(U.t("Switch to Arabic", "التبديل إلى الإنجليزية")) + "</button>" +
      '<button data-action="reset-demo" class="danger-item">' + U.icon("refresh") + U.esc(U.t("Reset demo data", "إعادة تعيين البيانات")) + "</button>" +
      "</div>"
    );
  }

  function sidebarCard(platform) {
    if (platform === "tahady") {
      const table = Store.table();
      const top = table[0];
      return (
        '<div class="sidebar-card">' +
        '<div class="row between" style="margin-bottom:10px"><span class="eyebrow">' + U.esc(U.t("League leader", "متدرّب الدوري")) + "</span>" + U.icon("crown", "i") + "</div>" +
        '<div class="row gap-2">' + U.avatar(I18n.pick(Store.player(top.id).name), { size: "avatar-sm", hue: Store.player(top.id).hue }) +
        '<div class="grow" style="min-width:0"><div class="strong small" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + U.esc(I18n.pick(Store.player(top.id).name)) + "</div>" +
        '<div class="xs muted">' + top.points + " " + U.esc(U.t("pts", "نقطة")) + " · " + U.esc(U.t("Round 2", "الجولة 2")) + "</div></div></div>" +
        '<div class="progress thin grad" style="margin-top:12px"><span style="width:' + Math.min(100, (top.points / 21) * 100) + '%"></span></div>' +
        "</div>"
      );
    }
    if (platform === "admin") {
      return (
        '<div class="sidebar-card">' +
        '<div class="eyebrow" style="margin-bottom:6px">' + U.esc(U.t("Demo workspace", "مساحة تجريبية")) + "</div>" +
        '<p class="xs muted">' + U.esc(U.t("Edits are stored locally in this browser. Connect the API to publish.", "التعديلات تُحفظ محليًا في المتصفح. اربط الـAPI للنشر.")) + "</p>" +
        "</div>"
      );
    }
    const level = Store.meLevel();
    return (
      '<div class="sidebar-card">' +
      '<div class="row between" style="margin-bottom:8px"><span class="eyebrow">' + U.esc(U.t("Season 04", "الموسم 04")) + '</span><span class="badge badge-purple">LV ' + level.level + "</span></div>" +
      '<div class="xp-row"><span>' + U.esc(U.t("Level progress", "تقدم المستوى")) + "</span><span>" + level.into + " / " + level.span + "</span></div>" +
      '<div class="progress grad"><span style="width:' + level.pct + '%"></span></div>' +
      "</div>"
    );
  }

  function bottomNav(platform, active) {
    let items;
    if (platform === "tahady") {
      items = [
        { label: U.t("Home", "الرئيسية"), icon: "home", href: "#/tahady", key: "tahady" },
        { label: U.t("Tournaments", "البطولات"), icon: "trophy", href: "#/tahady/tournaments", key: "tournaments" },
        { label: U.t("League", "الدوري"), icon: "chart", href: "#/tahady/league", key: "league" },
        { label: U.t("Cup", "الكأس"), icon: "medal", href: "#/tahady/cup", key: "cup" },
        { label: U.t("Profile", "ملفي"), icon: "user", href: "#/tahady/profile", key: "tprofile" },
      ];
    } else if (platform === "admin") {
      items = [
        { label: U.t("Overview", "عام"), icon: "home", href: "#/admin", key: "admin" },
        { label: U.t("Players", "اللاعبون"), icon: "users-round", href: "#/admin/players", key: "aplayers" },
        { label: U.t("Questions", "الأسئلة"), icon: "info", href: "#/admin/questions", key: "aquestions" },
        { label: U.t("Matches", "المباريات"), icon: "ball", href: "#/admin/matches", key: "amatches" },
        { label: U.t("More", "المزيد"), icon: "grid", href: "#/admin/settings", key: "asettings" },
      ];
    } else {
      items = [
        { label: U.t("Home", "الرئيسية"), icon: "home", href: "#/mo", key: "mo" },
        { label: U.t("Play", "العب"), icon: "play", href: "#/mo/play", key: "play" },
        { label: U.t("Ranks", "الترتيب"), icon: "chart", href: "#/mo/leaderboard", key: "leaderboard" },
        { label: U.t("Friends", "الأصدقاء"), icon: "users-round", href: "#/mo/friends", key: "friends" },
        { label: U.t("Profile", "ملفي"), icon: "user", href: "#/mo/profile", key: "profile" },
      ];
    }
    return (
      '<nav class="bottom-nav" aria-label="' + U.esc(U.t("Mobile navigation", "التنقل")) + '"><ul>' +
      items
        .map(
          (i) =>
            '<li><a href="' + i.href + '" class="' + (i.key === active ? "is-active" : "") + '"' +
            (i.key === active ? ' aria-current="page"' : "") + ">" + U.icon(i.icon) + "<span>" + U.esc(i.label) + "</span></a></li>"
        )
        .join("") +
      "</ul></nav>"
    );
  }

  Shell.app = function (opts) {
    const platform = opts.platform || "mo";
    const active = opts.active || "";
    const brand = brandInfo(platform);
    const nav = platform === "tahady" ? tahadyNav(active) : platform === "admin" ? adminNav(active) : moNav(active);
    const unread = Store.unreadCount();
    const me = Store.db.mo.me;
    const level = Store.meLevel();

    return (
      '<div class="app-shell" id="app-shell" data-platform="' + platform + '">' +
      '<aside class="sidebar" id="sidebar" aria-label="' + U.esc(U.t("Primary navigation", "التنقل الرئيسي")) + '">' +
      '<div class="sidebar-head">' +
      '<a class="brand" href="' + brand.href + '">' +
      '<span class="brand-mark">' + U.icon(brand.icon) + "</span>" +
      '<span class="brand-text">' + U.esc(brand.name) + "<small>" + U.esc(brand.sub) + "</small></span>" +
      "</a>" +
      "</div>" +
      '<nav class="sidebar-nav">' + nav + "</nav>" +
      '<div class="sidebar-foot">' +
      sidebarCard(platform) +
      '<a class="nav-item" href="#/" style="margin-top:10px">' + U.icon("grid") + "<span>" + U.esc(U.t("Back to arena", "العودة للأرينا")) + "</span></a>" +
      "</div>" +
      "</aside>" +
      '<div class="drawer-scrim" data-action="close-drawer"></div>' +
      '<div class="app-main">' +
      '<header class="topbar">' +
      '<button class="icon-btn menu-toggle" data-action="open-drawer" aria-label="' + U.esc(U.t("Open menu", "فتح القائمة")) + '">' + U.icon("menu") + "</button>" +
      '<button class="icon-btn nav-toggle" data-action="collapse-sidebar" aria-label="' + U.esc(U.t("Collapse sidebar", "طي الشريط الجانبي")) + '">' + U.icon("panel") + "</button>" +
      topbarMeta(platform, opts.title, opts.crumb) +
      '<div class="topbar-actions">' +
      '<button class="searchbox desktop-only" data-action="search" aria-label="' + U.esc(U.t("Search", "بحث")) + '">' +
      U.icon("search") + '<span class="grow" style="text-align:start;color:var(--faint);font-size:var(--fs-sm)">' +
      U.esc(U.t("Search players, pages…", "ابحث عن لاعب أو صفحة…")) + "</span><kbd>⌘K</kbd></button>" +
      '<button class="icon-btn" data-action="search" aria-label="' + U.esc(U.t("Search", "بحث")) + '">' + U.icon("search") + "</button>" +
      '<button class="icon-btn lang-btn" data-action="switch-lang" aria-label="' + U.esc(U.t("Switch language", "تغيير اللغة")) + '">' +
      '<span class="lang-code">' + (I18n.lang === "ar" ? "EN" : "ع") + "</span></button>" +
      '<div class="dropdown">' +
      '<button class="icon-btn" data-dropdown="notif-menu" aria-label="' + U.esc(U.t("Notifications", "الإشعارات")) + '" aria-haspopup="true">' +
      U.icon("bell") + (unread ? '<span class="dot"></span>' : "") + "</button>" +
      notificationsMenu() +
      "</div>" +
      '<div class="dropdown">' +
      '<button class="user-chip" data-dropdown="user-menu" aria-haspopup="true" aria-label="' + U.esc(U.t("Account menu", "قائمة الحساب")) + '">' +
      U.avatar(I18n.pick(me.name), { size: "avatar-sm", hue: me.hue }) +
      '<span class="meta"><strong>' + U.esc(I18n.pick(me.name).split(" ")[0]) + "</strong><span>LV " + level.level + "</span></span>" +
      '</button>' +
      userMenu() +
      "</div>" +
      "</div>" +
      "</header>" +
      '<main class="page ' + (opts.pageClass || "") + '" id="main">' + (opts.content || "") + "</main>" +
      "</div>" +
      bottomNav(platform, active) +
      "</div>"
    );
  };

  Shell.site = function (opts) {
    const links = [
      { label: U.t("Ecosystem", "المنظومة"), href: "#/", key: "home" },
      { label: U.t("Mo Games", "مو جيمز"), href: "#/mo", key: "mo" },
      { label: U.t("Tahady El Lamma", "تحدي اللمة"), href: "#/tahady", key: "tahady" },
      { label: U.t("Tournaments", "البطولات"), href: "#/tahady/tournaments", key: "tournaments" },
      { label: U.t("Leaderboard", "المتصدرون"), href: "#/mo/leaderboard", key: "leaderboard" },
    ];
    return (
      '<div class="site">' +
      '<header class="site-nav" id="site-nav">' +
      '<a class="brand" href="#/">' +
      '<span class="brand-mark">' + U.icon("sparkles") + "</span>" +
      '<span class="brand-text">Mo Arena<small>MO GAMES · تحدّي اللمة</small></span>' +
      "</a>" +
      '<nav class="site-links" aria-label="' + U.esc(U.t("Main navigation", "التنقل الرئيسي")) + '">' +
      links
        .map((l) => '<a href="' + l.href + '" class="' + (l.key === opts.active ? "is-active" : "") + '">' + U.esc(l.label) + "</a>")
        .join("") +
      "</nav>" +
      '<div class="site-actions">' +
      '<button class="icon-btn lang-btn" data-action="switch-lang" aria-label="' + U.esc(U.t("Switch language", "تغيير اللغة")) + '">' +
      '<span class="lang-code">' + (I18n.lang === "ar" ? "EN" : "ع") + "</span></button>" +
      '<a class="btn btn-secondary btn-sm site-login" href="#/mo">' + U.esc(U.t("Sign in", "تسجيل الدخول")) + "</a>" +
      '<a class="btn btn-primary btn-sm" href="#/mo">' + U.esc(U.t("Enter Arena", "ادخل الأرينا")) + U.icon("arrow", "i-arrow") + "</a>" +
      "</div>" +
      "</header>" +
      '<main class="site-main" id="main">' + (opts.content || "") + "</main>" +
      Shell.footer() +
      "</div>"
    );
  };

  Shell.footer = function () {
    return (
      '<footer class="site-footer">' +
      '<div class="container footer-grid">' +
      '<div class="footer-brand">' +
      '<a class="brand" href="#/"><span class="brand-mark">' + U.icon("sparkles") + "</span><span class=\"brand-text\">Mo Arena<small>MO GAMES · تحدّي اللمة</small></span></a>" +
      '<p class="small muted" style="margin-top:12px;max-width:34ch">' +
      U.esc(U.t("One arena. Two worlds. Real-time 1v1 football games and the region's most competitive football tournaments.", "أرينا واحدة وعالمان. مباريات كرة قدم 1 ضد 1 لحظية، وأقوى بطولات كرة القدم في المنطقة.")) +
      "</p>" +
      '<div class="footer-social" style="margin-top:16px">' +
      ['globe', 'users-round', 'tv', 'ball'].map((i) => '<a class="icon-btn" href="#/" aria-label="social">' + U.icon(i) + "</a>").join("") +
      "</div></div>" +
      '<div class="footer-col"><h4>' + U.esc(U.t("Platforms", "المنصات")) + "</h4>" +
      '<a href="#/mo">Mo Games</a><a href="#/tahady">Tahady El Lamma</a><a href="#/mo/play">' + U.esc(U.t("Play now", "العب الآن")) + "</a></div>" +
      '<div class="footer-col"><h4>' + U.esc(U.t("Competitions", "البطولات")) + "</h4>" +
      '<a href="#/tahady/league">' + U.esc(U.t("الدوري العام", "الدوري العام")) + "</a><a href=\"#/tahady/cup\">" + U.esc(U.t("كأس اللمة", "كأس اللمة")) + "</a><a href=\"#/tahady/super\">" + U.esc(U.t("سوبر النخبة", "سوبر النخبة")) + "</a></div>" +
      '<div class="footer-col"><h4>' + U.esc(U.t("Company", "الشركة")) + "</h4>" +
      '<a href="#/">' + U.esc(U.t("About", "من نحن")) + '</a><a href="#/">' + U.esc(U.t("Fair play", "اللعب النظيف")) + '</a><a href="#/admin">' + U.esc(U.t("Admin", "الإدارة")) + "</a></div>" +
      "</div>" +
      '<div class="container footer-bottom"><span>© 2026 Mo Arena. ' + U.esc(U.t("All rights reserved.", "جميع الحقوق محفوظة.")) + "</span>" +
      '<span class="tag">' + U.icon("shield") + U.esc(U.t("Secure gaming ecosystem", "منظومة ألعاب آمنة")) + "</span></div>" +
      "</footer>"
    );
  };

  Shell.syncChrome = function () {
    const shell = document.getElementById("app-shell");
    if (!shell) return;
    // Close mobile drawer on navigation
    shell.classList.remove("is-drawer-open");
    document.body.classList.remove("drawer-open");
  };

  Shell.bind = function (root) {
    const scope = root || document;
    const shell = scope.querySelector(".app-shell");

    scope.querySelectorAll("[data-action]").forEach((el) => {
      if (el.__bound) return;
      el.__bound = true;
      el.addEventListener("click", function (e) {
        const action = el.getAttribute("data-action");
        if (action === "open-drawer" && shell) {
          shell.classList.add("is-drawer-open");
          document.body.classList.add("drawer-open");
          const first = shell.querySelector(".sidebar a");
          if (first) setTimeout(() => first.focus(), 120);
        } else if (action === "close-drawer" && shell) {
          shell.classList.remove("is-drawer-open");
          document.body.classList.remove("drawer-open");
        } else if (action === "collapse-sidebar" && shell) {
          shell.classList.toggle("is-collapsed");
          localStorage.setItem("moarena.collapsed", shell.classList.contains("is-collapsed") ? "1" : "0");
        } else if (action === "search") {
          UI.openSearch();
        } else if (action === "switch-lang") {
          I18n.toggle();
        } else if (action === "mark-read") {
          e.preventDefault();
          Store.markAllRead();
          UI.toast({ title: U.t("Notifications marked as read", "تم تحديد الإشعارات كمقروءة"), type: "success" });
          Router.render();
        } else if (action === "reset-demo") {
          e.preventDefault();
          UI.confirm({
            title: U.t("Reset demo data?", "إعادة تعيين البيانات؟"),
            message: U.t("This restores the original sample season, matches and questions. It cannot be undone.", "سيعيد بيانات الموسم والمباريات والأسئلة الأصلية. لا يمكن التراجع."),
            confirm: U.t("Reset", "إعادة تعيين"),
            danger: true,
          }).then((ok) => {
            if (ok) {
              Store.reset();
              Router.render();
              UI.toast({ title: U.t("Demo data restored", "تم استعادة البيانات"), type: "success" });
            }
          });
        }
      });
    });

    // Restore collapsed sidebar
    if (shell && localStorage.getItem("moarena.collapsed") === "1") shell.classList.add("is-collapsed");

    // Landing nav elevation on scroll
    const siteNav = scope.querySelector("#site-nav");
    if (siteNav) {
      const onScroll = function () {
        siteNav.classList.toggle("is-scrolled", window.scrollY > 8);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    // Close drawer with Escape
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && shell) {
        shell.classList.remove("is-drawer-open");
        document.body.classList.remove("drawer-open");
      }
    });

    // Dropdown state cleanup
    UI.initDropdowns();
  };

  Shell.mount = function () {};

  global.Shell = Shell;
})(window);
