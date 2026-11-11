/* ==========================================================================
   Landing — unified ecosystem
   ========================================================================== */
(function (global) {
  "use strict";

  const LandingPage = {};

  LandingPage.render = function () {
    const lb = Store.leaderboard("xp");
    const top3 = lb.slice(0, 3);
    const table = Store.table();
    const cup = Store.db.cup;
    const sup = Store.db.superCup;
    const me = Store.db.mo.me;
    const level = Store.meLevel();

    const podium = top3
      .map((p, i) => {
        const cls = i === 0 ? "first" : i === 1 ? "second" : "third";
        const label = i === 0 ? U.t("Champion", "المتصدر") : i === 1 ? U.t("Runner-up", "الوصيف") : U.t("Third place", "الثالث");
        return (
          '<a class="podium-card ' + cls + '" href="#/mo/profile?id=' + p.id + '">' +
          (i === 0 ? '<span class="crown-float">' + U.icon("crown") + "</span>" : "") +
          '<span class="podium-rank">' + (i + 1) + "</span>" +
          U.avatar(I18n.pick(p.name), { size: i === 0 ? "avatar-xl" : "avatar-lg", hue: p.hue, gold: i === 0 }) +
          '<div class="p-name">' + U.esc(I18n.pick(p.name)) + "</div>" +
          '<div class="p-meta">' + U.esc(label) + "</div>" +
          '<div class="p-xp">' + U.n(p.xp) + ' <small>XP</small></div>' +
          "</a>"
        );
      })
      .join("");

    const competitions = [
      {
        kind: "league",
        name: { en: "الدوري العام", ar: "الدوري العام" },
        desc: {
          en: "Two rounds, eight players, one league table. The top four qualify for the cup.",
          ar: "دوران وثمانية لاعبين وجدول واحد. أفضل أربعة يتأهلون للكأس.",
        },
        icon: "chart",
        href: "#/tahady/league",
        status: "qualifying",
        stage: { en: "Round 2 · Matchday 3", ar: "الجولة 2 · الجولة 3" },
        participants: 8,
        cta: U.t("View standings", "شاهد الترتيب"),
      },
      {
        kind: "cup",
        name: { en: "كأس اللمة", ar: "كأس اللمة" },
        desc: {
          en: "The four league qualifiers meet in knockout semi-finals and a winner-takes-all final.",
          ar: "أفضل أربعة في الدوري يلتقون في نصف نهائي إقصائي ونهائي لا يقبل القسمة.",
        },
        icon: "medal",
        href: "#/tahady/cup",
        status: "completed",
        stage: { en: "Final · Completed", ar: "النهائي · مكتمل" },
        participants: 4,
        championId: cup.champion,
        cta: U.t("View bracket", "شاهد شجرة البطولة"),
      },
      {
        kind: "super",
        name: { en: "سوبر النخبة", ar: "سوبر النخبة" },
        desc: {
          en: "League champion versus cup champion — the season's ultimate head-to-head.",
          ar: "بطل الدوري ضد بطل الكأس — المواجهة الأغلى في الموسم.",
        },
        icon: "crown",
        href: "#/tahady/super",
        status: "upcoming",
        stage: { en: "Final · Scheduled", ar: "النهائي · مجدول" },
        participants: 2,
        date: sup.date,
        cta: U.t("Match preview", "معاينة المباراة"),
      },
    ]
      .map(Comp.tournamentCard)
      .join("");

    const announce = Store.db.announcements.slice(0, 3);

    const content =
      /* Hero */
      '<section class="hero">' +
      '<div class="container hero-grid">' +
      '<div class="hero-copy">' +
      '<span class="hero-pill"><span class="dot-live"></span>' + U.esc(U.t("Season 04 · live now", "الموسم 04 · انطلق الآن")) + "</span>" +
      '<h1 class="display">' + U.esc(U.t("Your Game.", "لعبتك.")) + "<br><span class=\"gradient-text\">" + U.esc(U.t("Your Challenge.", "تحديك.")) + "</span><br>" + U.esc(U.t("Your Victory.", "فوزك.")) + "</h1>" +
      '<p class="hero-sub">' + U.esc(U.t("Two worlds, one arena. Play real-time 1v1 football games on Mo Games, then follow every round of the region's most competitive football championship on Tahady El Lamma.", "عالمان وأرينا واحدة. العب مباريات كرة قدم 1 ضد 1 لحظية على مو جيمز، وتابع كل جولة في أقوى بطولة كرة قدم على تحدي اللمة.")) + "</p>" +
      '<div class="hero-cta">' +
      '<a class="btn btn-primary btn-lg" href="#/mo">' + U.icon("play") + U.esc(U.t("Start Playing", "ابدأ اللعب")) + "</a>" +
      '<a class="btn btn-secondary btn-lg" href="#/tahady/tournaments">' + U.icon("trophy") + U.esc(U.t("Explore Tournaments", "استكشف البطولات")) + "</a>" +
      "</div>" +
      '<div class="hero-stats">' +
      '<div class="hero-stat"><strong>128,400</strong><span>' + U.esc(U.t("Active players", "لاعب نشط")) + "</span></div>" +
      '<div class="hero-stat"><strong>1.24M</strong><span>' + U.esc(U.t("Matches played", "مباراة ملعوبة")) + "</span></div>" +
      '<div class="hero-stat"><strong>3</strong><span>' + U.esc(U.t("Official competitions", "بطولات رسمية")) + "</span></div>" +
      "</div></div>" +

      /* Visual */
      '<div class="hero-visual">' +
      '<div class="orbit-ring"></div><div class="orbit-ring ring-2"></div>' +
      '<span class="hero-trophy">' + U.icon("trophy") + "</span>" +
      '<div class="float-chip chip-a">' + U.icon("flame") + "<div><strong>" + U.esc(U.t("4 win streak", "4 انتصارات متتالية")) + "</strong><span>" + U.esc(U.t("1v1 ranked", "تصنيف 1 ضد 1")) + "</span></div></div>" +
      '<div class="duel-card">' +
      '<div class="duel-top"><span class="badge badge-live"><span class="dot-live"></span>' + U.esc(U.t("Live duel", "مبارزة مباشرة")) + '</span><span class="tag">' + U.icon("clock") + "00:07</span></div>" +
      '<div class="duel-sides">' +
      '<div class="duel-player">' + U.avatar(I18n.pick(me.name), { size: "avatar-lg", hue: me.hue }) +
      "<strong>" + U.esc(U.t("You", "أنت")) + "</strong><span>LV " + level.level + "</span></div>" +
      '<div class="duel-vs">VS</div>' +
      '<div class="duel-player">' + U.avatar(I18n.pick(Store.moPlayer("r1").name), { size: "avatar-lg", hue: Store.moPlayer("r1").hue }) +
      "<strong>" + U.esc(I18n.pick(Store.moPlayer("r1").name)) + "</strong><span>LV 33</span></div>" +
      "</div>" +
      '<div class="duel-score"><span>7</span><em>:</em><span>5</span></div>' +
      '<div class="duel-q">' + U.esc(U.t("Which country won the 2022 FIFA World Cup?", "أي دولة فازت بكأس العالم 2022؟")) + "</div>" +
      '<div class="duel-timer"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>' +
      "</div>" +
      '<div class="float-chip chip-b">' + U.icon("check") + "<div><strong>" + U.esc(U.t("+150 XP", "+150 XP")) + "</strong><span>" + U.esc(U.t("Correct answer", "إجابة صحيحة")) + "</span></div></div>" +
      "</div></div></section>" +

      /* Platform selection */
      '<section class="section" id="platforms">' +
      '<div class="container">' +
      Comp.sectionHead(
        U.t("Choose your arena", "اختر أرينتك"),
        U.t("One account, one identity, two distinct competitive experiences.", "حساب واحد وهوية واحدة وتجربتان تنافسيتان مختلفتان.")
      ) +
      '<div class="platform-grid">' +
      '<article class="platform-card mo">' +
      '<div class="platform-art"></div>' +
      '<span class="platform-watermark">' + U.icon("sword") + "</span>" +
      '<div class="platform-body">' +
      '<span class="platform-tag">' + U.icon("bolt") + U.esc(U.t("1v1 Real-time", "1 ضد 1 لحظية")) + "</span>" +
      "<h3>Mo Games</h3>" +
      "<p>" + U.esc(U.t("Challenge players in real-time 1v1 competitions. Fast questions, live scores, and a ladder that rewards every win.", "تحدَّ لاعبين في مباريات 1 ضد 1 لحظية. أسئلة سريعة، نتائج مباشرة، وسلّم يكافئ كل انتصار.")) + "</p>" +
      '<div class="platform-meta">' +
      '<span class="badge badge-purple">' + U.icon("bolt") + U.esc(U.t("Quick Match", "مباراة سريعة")) + "</span>" +
      '<span class="badge">' + U.icon("lock") + U.esc(U.t("Private rooms", "غرف خاصة")) + "</span>" +
      '<span class="badge">' + U.icon("chart") + U.esc(U.t("Ranked ladder", "سلّم التصنيف")) + "</span>" +
      "</div>" +
      '<div class="platform-cta"><a class="btn btn-primary" href="#/mo">' + U.esc(U.t("Start Playing", "ابدأ اللعب")) + U.icon("arrow", "i-arrow") + "</a>" +
      '<a class="btn btn-ghost" href="#/mo/leaderboard">' + U.esc(U.t("Leaderboard", "المتصدرون")) + "</a></div>" +
      "</div></article>" +

      '<article class="platform-card tahady">' +
      '<div class="platform-art"></div>' +
      '<span class="platform-watermark">' + U.icon("trophy") + "</span>" +
      '<div class="platform-body">' +
      '<span class="platform-tag">' + U.icon("trophy") + U.esc(U.t("Football championship", "بطولة كرة القدم")) + "</span>" +
      '<h3>تحدي اللمة</h3>' +
      "<p>" + U.esc(U.t("Join football competitions, leagues, and championships. Every round counts, every point matters.", "شارك في البطولات والدوري والكأس. كل جولة تُحسب وكل نقطة تفرق.")) + "</p>" +
      '<div class="platform-meta">' +
      '<span class="badge badge-green">' + U.icon("chart") + U.esc(U.t("الدوري العام", "الدوري العام")) + "</span>" +
      '<span class="badge badge-gold">' + U.icon("medal") + U.esc(U.t("كأس اللمة", "كأس اللمة")) + "</span>" +
      '<span class="badge badge-purple">' + U.icon("crown") + U.esc(U.t("سوبر النخبة", "سوبر النخبة")) + "</span>" +
      "</div>" +
      '<div class="platform-cta"><a class="btn btn-green" href="#/tahady/tournaments">' + U.esc(U.t("Explore Tournaments", "استكشف البطولات")) + U.icon("arrow", "i-arrow") + "</a>" +
      '<a class="btn btn-ghost" href="#/tahady/league">' + U.esc(U.t("League table", "جدول الدوري")) + "</a></div>" +
      "</div></article>" +
      "</div>" +
      '<div class="feature-strip" style="margin-top:24px">' +
      [
        { i: "shield", t: U.t("Fair play first", "اللعب النظيف أولًا"), d: U.t("Anti-cheat checks and transparent results.", "فحص للنزاهة ونتائج شفافة.") },
        { i: "bolt", t: U.t("Real-time by design", "لحظي بالتصميم"), d: U.t("Live scores and instant match updates.", "نتائج مباشرة وتحديثات فورية.") },
        { i: "globe", t: U.t("Arabic & English", "عربي وإنجليزي"), d: U.t("Full RTL support, tuned typography.", "دعم كامل للعربية واتجاه RTL.") },
        { i: "trophy", t: U.t("Season-long rewards", "مكافآت طوال الموسم"), d: U.t("XP, badges and championship glory.", "XP وشارات ومجد البطولات.") },
      ]
        .map(
          (f) =>
            '<div class="feature-mini"><span class="icon-box">' + U.icon(f.i) + "</span><div><strong>" + U.esc(f.t) + "</strong><p>" + U.esc(f.d) + "</p></div></div>"
        )
        .join("") +
      "</div>" +
      "</div></section>" +

      /* Competitions */
      '<section class="section" id="competitions" style="padding-top:0">' +
      '<div class="container">' +
      Comp.sectionHead(
        U.t("Featured competitions", "بطولات مميزة"),
        U.t("The three official Tahady El Lamma competitions, live from the current season.", "البطولات الرسمية الثلاث لتحدي اللمة من الموسم الحالي."),
        '<a class="link-arrow" href="#/tahady/tournaments">' + U.esc(U.t("All tournaments", "كل البطولات")) + U.icon("arrow") + "</a>"
      ) +
      '<div class="tournament-grid">' + competitions + "</div>" +
      "</div></section>" +

      /* Stats band */
      '<section class="section" style="padding-block:0">' +
      '<div class="container"><div class="stat-band">' +
      [
        { v: "128.4K", l: U.t("Registered players", "لاعب مسجل") },
        { v: "1.24M", l: U.t("1v1 matches played", "مباراة 1 ضد 1") },
        { v: "42", l: U.t("Tournaments hosted", "بطولة مستضافة") },
        { v: "98.6%", l: U.t("Matches without disputes", "مباريات بدون نزاعات") },
      ]
        .map((s) => '<div class="stat-band-item"><strong>' + s.v + "</strong><span>" + U.esc(s.l) + "</span></div>")
        .join("") +
      "</div></div></section>" +

      /* Top players + activity */
      '<section class="section" id="rankings">' +
      '<div class="container">' +
      Comp.sectionHead(
        U.t("Top players this season", "أفضل لاعبي الموسم"),
        U.t("Ranked by XP earned across ranked 1v1 matches.", "مرتبون حسب XP من مباريات التصنيف 1 ضد 1."),
        '<a class="btn btn-secondary btn-sm" href="#/mo/leaderboard">' + U.esc(U.t("Full leaderboard", "لوحة المتصدرين كاملة")) + "</a>"
      ) +
      '<div class="podium">' + podium + "</div>" +
      "</div></section>" +

      /* Activity + announcements */
      '<section class="section" style="padding-top:0">' +
      '<div class="container" style="display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,0.95fr);gap:24px;align-items:start" id="landing-bottom">' +
      '<div class="card panel">' +
      Comp.panelHead(U.t("Recent activity", "أحدث النشاط"), U.t("Across both platforms, right now", "عبر المنصتين، الآن")) +
      '<div class="panel-body" style="padding-top:4px;padding-bottom:8px">' +
      Store.db.activity
        .slice(0, 6)
        .map(
          (a) =>
            '<div class="activity-item"><span class="activity-ic ' + a.type + '">' + U.icon(a.type === "win" ? "sword" : a.type === "tournament" ? "trophy" : "sparkles") + "</span>" +
            "<div><p>" + U.esc(I18n.pick(a.text)) + "</p><time>" + U.relTime(a.time) + "</time></div></div>"
        )
        .join("") +
      "</div></div>" +
      '<div class="stack gap-4">' +
      Store.db.announcements
        .slice(0, 3)
        .map(
          (a) =>
            '<article class="announce ' + a.accent + '">' +
            '<div class="a-meta"><span class="badge badge-' + (a.accent === "purple" ? "purple" : a.accent === "cyan" ? "cyan" : "green") + '">' + U.esc(a.tag) + "</span><time class=\"xs muted\">" + U.relTime(a.date) + "</time></div>" +
            "<h3>" + U.esc(I18n.pick(a.title)) + "</h3>" +
            "<p>" + U.esc(I18n.pick(a.body)) + "</p></article>"
        )
        .join("") +
      "</div></div></section>" +

      /* CTA */
      '<section class="section" style="padding-top:0">' +
      '<div class="container"><div class="dash-hero" style="align-items:center">' +
      "<div><span class=\"eyebrow\">" + U.esc(U.t("Ready when you are", "جاهز متى شئت")) + "</span>" +
      "<h1 style=\"margin-top:10px\">" + U.esc(U.t("Your next victory starts here.", "انتصارك القادم يبدأ هنا.")) + "</h1>" +
      '<p class="sub">' + U.esc(U.t("Join 128,400 players competing every day across Mo Games and Tahady El Lamma.", "انضم إلى 128,400 لاعب يتنافسون يوميًا في مو جيمز وتحدي اللمة.")) + "</p>" +
      '<div class="dash-hero-actions"><a class="btn btn-primary btn-lg" href="#/mo/play">' + U.icon("bolt") + U.esc(U.t("Play a quick match", "العب مباراة سريعة")) + "</a>" +
      '<a class="btn btn-secondary btn-lg" href="#/tahady">' + U.esc(U.t("Open Tahady dashboard", "افتح لوحة تحدي اللمة")) + "</a></div></div>" +
      '<div class="dash-hero-side"><div class="season-chip"><span>' + U.esc(U.t("Season", "الموسم")) + "</span><strong>04 · 2026</strong></div>" +
      '<div class="season-chip"><span>' + U.esc(U.t("League leader", "متصدر الدوري")) + "</span><strong>" + U.esc(I18n.pick(Store.player(table[0].id).name)) + "</strong></div>" +
      '<div class="season-chip"><span>' + U.esc(U.t("Cup champion", "بطل الكأس")) + "</span><strong>" + U.esc(I18n.pick(Store.player(cup.champion).name)) + "</strong></div></div>" +
      "</div></div></section>";

    return {
      title: U.t("Your Game. Your Challenge. Your Victory.", "لعبتك. تحديك. فوزك."),
      html: Shell.site({ active: "home", content: content }),
      mount: function () {
        // Ensure the landing activity/announcement grid collapses on small screens
        const bottom = document.getElementById("landing-bottom");
        if (bottom) {
          const mq = window.matchMedia("(max-width: 900px)");
          const apply = function () {
            bottom.style.gridTemplateColumns = mq.matches ? "minmax(0,1fr)" : "minmax(0,1.25fr) minmax(0,0.95fr)";
          };
          apply();
          mq.addEventListener("change", apply);
        }
      },
    };
  };

  LandingPage.notFound = function () {
    return {
      title: "404",
      html: Shell.site({
        active: "",
        content:
          '<div class="error-page"><div><div class="code">404</div>' +
          "<h1>" + U.esc(U.t("This arena does not exist", "هذه الأرينا غير موجودة")) + "</h1>" +
          '<p class="muted" style="margin:10px 0 20px">' + U.esc(U.t("The page you are looking for was moved or never existed.", "الصفحة التي تبحث عنها نُقلت أو لم توجد.")) + "</p>" +
          '<a class="btn btn-primary" href="#/">' + U.icon("home") + U.esc(U.t("Back to arena", "العودة للأرينا")) + "</a></div></div>",
      }),
    };
  };

  global.LandingPage = LandingPage;
})(window);
