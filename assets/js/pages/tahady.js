/* ==========================================================================
   Tahady El Lamma — season overview, league, cup, super cup, players and
   player profiles. Tournament rules:
   · Top four of الدوري العام round 1 qualify for كأس اللمة
   · League champion + كأس اللمة champion play سوبر النخبة
   · If one player wins both, the cup runner-up takes the second spot
   ========================================================================== */
(function (global) {
  "use strict";

  const TahadyPages = {};

  /* ---------------------------------------------------------------------- */
  /* Helpers                                                                */
  /* ---------------------------------------------------------------------- */
  function pl(id) {
    return Store.player(id);
  }

  function pname(id) {
    const p = pl(id);
    return p ? I18n.pick(p.name) : "—";
  }

  function pavatar(id, size) {
    const p = pl(id);
    return p ? U.avatar(I18n.pick(p.name), { size: size || "avatar-sm", hue: p.hue }) : "";
  }

  function leagueStats() {
    const all = Store.db.league.matchdays;
    const played = all.filter((md) => md.played);
    let goals = 0;
    played.forEach((md) =>
      md.matches.forEach((m) => {
        goals += (m.scoreA || 0) + (m.scoreB || 0);
      })
    );
    return {
      totalMatchdays: all.length,
      playedMatchdays: played.length,
      matchesPlayed: played.reduce((sum, md) => sum + md.matches.length, 0),
      matchesTotal: all.reduce((sum, md) => sum + md.matches.length, 0),
      goals: goals,
    };
  }

  function currentMatchday() {
    return Store.db.league.matchdays.find((md) => !md.played) || null;
  }

  function fixtureRow(m, opts) {
    opts = opts || {};
    const a = pl(m.a);
    const b = pl(m.b);
    if (!a || !b) return "";
    const score =
      opts.score && m.scoreA != null
        ? '<span class="fixture-score" dir="ltr">' + m.scoreA + " – " + m.scoreB + "</span>"
        : '<span class="vs">VS</span>';
    return (
      '<div class="fixture">' +
      '<div class="teams">' +
      '<div class="team">' + pavatar(a.id, "avatar-xs") + "<strong>" + U.esc(I18n.pick(a.name)) + "</strong></div>" +
      score +
      '<div class="team right"><strong>' + U.esc(I18n.pick(b.name)) + "</strong>" + pavatar(b.id, "avatar-xs") + "</div>" +
      "</div>" +
      "<time>" + U.esc(U.dateShort(m.date)) + " · " + U.esc(U.timeShort(m.date)) + "</time>" +
      "</div>"
    );
  }

  function leagueRow(r, pos, opts) {
    opts = opts || {};
    const p = pl(r.id);
    if (!p) return "";
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
      '<td class="num">' + (opts.hideForm ? "—" : Comp.formDots(r.form)) + "</td>" +
      '<td class="num points">' + r.points + "</td>" +
      "</tr>"
    );
  }

  function leagueHead(hideForm) {
    return (
      "<thead><tr>" +
      '<th class="col-pos">#</th>' +
      '<th class="col-player">' + U.esc(U.t("Player", "اللاعب")) + "</th>" +
      '<th class="num">' + U.esc(U.t("P", "ل")) + "</th>" +
      '<th class="num">' + U.esc(U.t("W", "ف")) + "</th>" +
      '<th class="num">' + U.esc(U.t("D", "ت")) + "</th>" +
      '<th class="num">' + U.esc(U.t("L", "خ")) + "</th>" +
      '<th class="num">' + U.esc(U.t("GD", "ف.أ")) + "</th>" +
      (hideForm ? "" : '<th class="num">' + U.esc(U.t("Form", "الحالة")) + "</th>") +
      '<th class="num">' + U.esc(U.t("Pts", "نقاط")) + "</th>" +
      "</tr></thead>"
    );
  }

  function cutLine() {
    return '<tr class="qualify-line"><td colspan="9"></td></tr>';
  }

  function leagueSnapshot(limit) {
    const table = Store.table();
    const rows = table.slice(0, limit || 6);
    return (
      '<div class="table-wrap"><table class="table league-table">' +
      leagueHead(false) +
      "<tbody>" +
      rows.map((r, i) => leagueRow(r, i + 1)).join("") +
      "</tbody></table></div>" +
      '<div class="table-footnote">' +
      '<span class="row gap-1"><i class="legend-dot green"></i>' + U.esc(U.t("Top four qualify for كأس اللمة", "أفضل أربعة يتأهلون لكأس اللمة")) + "</span>" +
      '<a class="btn btn-ghost btn-sm" href="#/tahady/league">' + U.esc(U.t("Full table", "الجدول الكامل")) + U.icon("arrow", "i-arrow") + "</a>" +
      "</div>"
    );
  }

  function topPlayersPanel(limit) {
    const table = Store.table().slice(0, limit || 5);
    return (
      '<div class="panel">' +
      Comp.panelHead(
        U.t("Top players", "أفضل اللاعبين"),
        U.t("Ranked by points, goal difference and goals", "حسب النقاط وفارق الأهداف ثم الأهداف"),
        '<a class="btn btn-ghost btn-sm" href="#/tahady/players">' + U.esc(U.t("All players", "كل اللاعبين")) + "</a>"
      ) +
      '<div class="panel-body" style="padding-top:6px;padding-bottom:6px">' +
      table
        .map((r, i) => {
          const p = pl(r.id);
          return (
            '<a class="player-cell rank-row" href="#/tahady/profile?id=' + p.id + '">' +
            '<span class="pos-badge ' + (i < 3 ? "pos-" + (i + 1) : "") + '">' + (i + 1) + "</span>" +
            U.avatar(I18n.pick(p.name), { size: "avatar-sm", hue: p.hue }) +
            '<span class="grow"><span class="name">' + U.esc(I18n.pick(p.name)) + "</span>" +
            '<span class="sub">' + r.won + " " + U.esc(U.t("wins", "فوز")) + " · " + r.played + " " + U.esc(U.t("played", "مباراة")) + "</span></span>" +
            '<span class="points">' + r.points + "</span>" +
            "</a>"
          );
        })
        .join("") +
      "</div></div>"
    );
  }

  function announcementsPanel(limit) {
    return (
      '<div class="panel">' +
      Comp.panelHead(U.t("Announcements", "الإعلانات"), U.t("Season updates from the organisers", "تحديثات الموسم من المنظمين")) +
      '<div class="panel-body" style="padding-top:4px;padding-bottom:4px">' +
      Store.db.announcements
        .slice(0, limit || 3)
        .map(
          (a) =>
            '<div class="activity-item">' +
            '<span class="activity-ic ' + (a.accent === "green" ? "win" : a.accent === "purple" ? "achievement" : "tournament") + '">' +
            U.icon("bell") + "</span>" +
            "<div><p>" + U.esc(I18n.pick(a.title)) + '</p><time>' + U.relTime(a.date) + "</time></div>" +
            "</div>"
        )
        .join("") +
      "</div></div>"
    );
  }

  function tournamentCards() {
    const league = leagueStats();
    const table = Store.table();
    const cup = Store.db.cup;
    const sup = Store.db.superCup;
    const next = Store.upcomingLeague(1)[0];
    const md = currentMatchday();
    const stage = md
      ? U.t("Round " + md.round + " · Matchday " + md.matchday, "الجولة " + md.round + " · الجولة " + md.matchday)
      : U.t("Season complete", "انتهى الموسم");

    return [
      {
        kind: "",
        status: "qualifying",
        icon: "chart",
        name: { en: "الدوري العام", ar: "الدوري العام" },
        desc: {
          en: "Eight players, six matchdays. The top four after round one move on to the cup.",
          ar: "ثمانية لاعبين وست جولات. أفضل أربعة بعد الجولة الأولى يتأهلون إلى الكأس.",
        },
        stage: { en: stage, ar: stage },
        participants: 8,
        date: next ? next.date : null,
        href: "#/tahady/league",
        cta: U.t("League table", "جدول الدوري"),
        secondary: '<span class="badge badge-green">' + U.icon("crown") + U.esc(I18n.pick(pl(table[0].id).name).split(" ")[0]) + "</span>",
      },
      {
        kind: "cup",
        status: "completed",
        icon: "medal",
        name: { en: "كأس اللمة", ar: "كأس اللمة" },
        desc: {
          en: "Four qualifiers, straight knockout. Draws are settled by a penalty shoot-out.",
          ar: "أربعة متأهلين بنظام خروج المغلوب. التعادل يُحسم بركلات الترجيح.",
        },
        stage: { en: U.t("Final · Completed", "النهائي · مكتمل"), ar: U.t("Final · Completed", "النهائي · مكتمل") },
        participants: 4,
        date: cup.final.date,
        championId: cup.champion,
        href: "#/tahady/cup",
        cta: U.t("View bracket", "عرض شجرة البطولة"),
      },
      {
        kind: "super",
        status: "upcoming",
        icon: "crown",
        name: { en: "سوبر النخبة", ar: "سوبر النخبة" },
        desc: {
          en: "The league champion faces the cup champion for the season's ultimate title.",
          ar: "بطل الدوري يواجه بطل الكأس على لقب الموسم الأغلى.",
        },
        stage: { en: U.t("Final · Scheduled", "النهائي · مجدول"), ar: U.t("Final · Scheduled", "النهائي · مجدول") },
        participants: 2,
        date: sup.date,
        href: "#/tahady/super",
        cta: U.t("Match preview", "معاينة المباراة"),
      },
    ];
  }

  function rulesPanel() {
    const rules = [
      {
        en: "Four qualified players from the first round of الدوري العام advance to كأس اللمة.",
        ar: "أفضل أربعة لاعبين من الجولة الأولى للدوري العام يتأهلون إلى كأس اللمة.",
      },
      {
        en: "The league champion qualifies as the first participant in سوبر النخبة.",
        ar: "بطل الدوري يتأهل كالمشارك الأول في سوبر النخبة.",
      },
      {
        en: "The كأس اللمة champion qualifies as the second participant.",
        ar: "بطل كأس اللمة يتأهل كالمشارك الثاني.",
      },
      {
        en: "If the same player wins both the league and the cup, the كأس اللمة runner-up qualifies instead.",
        ar: "إذا فاز نفس اللاعب بالدوري والكأس، يتأهل وصيف كأس اللمة بدلًا منه.",
      },
    ];
    return (
      '<div class="panel">' +
      Comp.panelHead(U.t("Competition rules", "قواعد البطولة"), U.t("How qualification works across the season", "كيفية التأهل عبر الموسم")) +
      '<div class="panel-body"><div class="rules-list">' +
      rules
        .map(
          (r, i) =>
            '<div class="rule"><span class="n">' + (i + 1) + "</span><span>" + U.esc(U.t(r.en, r.ar)) + "</span></div>"
        )
        .join("") +
      "</div></div></div>"
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Overview                                                               */
  /* ---------------------------------------------------------------------- */
  TahadyPages.home = function () {
    const table = Store.table();
    const cup = Store.db.cup;
    const sup = Store.db.superCup;
    const ls = leagueStats();
    const md = currentMatchday();
    const upcoming = Store.upcomingLeague(4);
    const recent = Store.recentLeague(4);
    const leader = pl(table[0].id);
    const cupChamp = pl(cup.champion);
    const next = upcoming[0];

    const content = `
      <div class="page-head" style="margin-bottom:20px">
        <div>
          <div class="breadcrumbs"><a href="#/">${U.esc(U.t("Arena", "الأرينا"))}</a><span class="sep">/</span><span>Tahady El Lamma</span></div>
          <h1>${U.esc(U.t("Tahady El Lamma", "تحدي اللمة"))}</h1>
          <p>${U.esc(U.t("The home of الدوري العام, كأس اللمة and سوبر النخبة — one season, three trophies.", "بيت الدوري العام وكأس اللمة وسوبر النخبة — موسم واحد وثلاثة ألقاب."))}</p>
        </div>
        <div class="row gap-2">
          <span class="badge badge-green">${U.icon("calendar")}${U.esc(U.t("Season 2026", "موسم 2026"))}</span>
          <span class="badge badge-purple">${U.icon("shield")}${U.esc(U.t("Official", "رسمي"))}</span>
        </div>
      </div>

      <section class="comp-hero">
        <div>
          <span class="eyebrow">${U.icon("crown")}${U.esc(U.t("Super El Nokhba", "سوبر النخبة"))}</span>
          <h1>${U.esc(U.t("The season finale is set", "نهائي الموسم جاهز"))}</h1>
          <p class="sub">${U.esc(
            U.t(
              "Two champions, one title. The league winner takes on the cup winner for the ultimate bragging rights.",
              "بطلان ولقب واحد. متصدر الدوري يواجه بطل الكأس على لقب الموسم الأغلى."
            )
          )}</p>
          <div class="dash-hero-actions">
            <a class="btn btn-primary" href="#/tahady/super">${U.icon("play")}${U.esc(U.t("Match preview", "معاينة المباراة"))}</a>
            <a class="btn btn-secondary" href="#/tahady/league">${U.icon("chart")}${U.esc(U.t("League table", "جدول الدوري"))}</a>
          </div>
        </div>
        <div class="comp-hero-side">
          <div class="round-row"><span>${U.esc(U.t("League leader", "متصدر الدوري"))}</span>
            <strong class="row gap-2">${pavatar(leader.id, "avatar-xs")}${U.esc(I18n.pick(leader.name))}</strong></div>
          <div class="round-row"><span>${U.esc(U.t("Cup champion", "بطل الكأس"))}</span>
            <strong class="row gap-2">${pavatar(cupChamp.id, "avatar-xs")}${U.esc(I18n.pick(cupChamp.name))}</strong></div>
          <div class="round-row"><span>${U.esc(U.t("Final date", "موعد النهائي"))}</span><strong>${U.esc(U.dateShort(sup.date))}</strong></div>
          <div class="round-row"><span>${U.esc(U.t("Status", "الحالة"))}</span>${Comp.statusBadge("upcoming")}</div>
        </div>
      </section>

      <div class="grid-4" style="margin-top:var(--s-5)">
        ${Comp.stat({ icon: "users", label: U.t("Registered players", "اللاعبون"), value: "8", suffix: U.t("elite", "نخبة") })}
        ${Comp.stat({ icon: "ball", label: U.t("League matches", "مباريات الدوري"), value: '<span dir="ltr">' + ls.matchesPlayed + " / " + ls.matchesTotal + "</span>" })}
        ${Comp.stat({ icon: "target", label: U.t("Goals scored", "الأهداف"), value: ls.goals })}
        ${Comp.stat({ icon: "flag", label: U.t("Current stage", "المرحلة الحالية"), value: md ? "MD " + md.matchday : "—", foot: U.esc(md ? U.t("Round 2 in progress", "الجولة الثانية جارية") : U.t("Season complete", "انتهى الموسم")) })}
      </div>

      <div class="grid-2" style="margin-top:var(--s-5)">
        <div class="panel">
          ${Comp.panelHead(
            U.t("Upcoming fixtures", "المباريات القادمة"),
            U.t("Next kick-offs in الدوري العام", "مباريات الدوري العام القادمة"),
            '<a class="btn btn-ghost btn-sm" href="#/tahady/league">' + U.esc(U.t("All fixtures", "كل المباريات")) + U.icon("arrow", "i-arrow") + "</a>"
          )}
          <div>${upcoming.map((m) => fixtureRow(m)).join("") || Comp.empty("calendar", U.t("No fixtures", "لا مباريات"), U.t("The season schedule will appear here.", "سيظهر جدول الموسم هنا."))}</div>
        </div>
        <div class="panel">
          ${Comp.panelHead(
            U.t("Latest results", "أحدث النتائج"),
            U.t("Most recent league scorelines", "آخر نتائج الدوري"),
            '<span class="badge badge-green">' + U.icon("check") + U.esc(U.t("Verified", "موثقة")) + "</span>"
          )}
          <div>${recent.map((m) => fixtureRow(m, { score: true })).join("") || Comp.empty("ball", U.t("No results yet", "لا نتائج بعد"), "")}</div>
        </div>
      </div>

      <div class="tahady-grid" style="margin-top:var(--s-5)">
        <div class="panel league-panel">
          ${Comp.panelHead(
            U.t("League snapshot", "ملخص الدوري"),
            U.t("Round 2 table · top four highlighted", "جدول الجولة الثانية · أفضل أربعة مميزون"),
            '<span class="badge badge-cyan">' + U.icon("flag") + U.esc(U.t("Live table", "جدول مباشر")) + "</span>"
          )}
          ${leagueSnapshot(6)}
        </div>
        <div class="stack gap-4">
          ${topPlayersPanel(5)}
          ${announcementsPanel(3)}
        </div>
      </div>

      <section class="section" style="padding-bottom:0">
        ${Comp.sectionHead(U.t("The three trophies", "البطولات الثلاث"), U.t("Follow every stage of the season", "تابع كل مرحلة من الموسم"))}
        <div class="tournament-grid">
          ${tournamentCards().map((t) => Comp.tournamentCard({ ...t, secondary: "" })).join("")}
        </div>
      </section>

      ${next ? `
      <div class="cta-band" style="margin-top:var(--s-6)">
        <div>
          <span class="eyebrow">${U.icon("calendar")}${U.esc(U.t("Next matchday", "الجولة القادمة"))}</span>
          <h2>${U.esc(U.t("Matchday " + (md ? md.matchday : ""), "الجولة " + (md ? md.matchday : "")))} · ${U.esc(U.dateShort(next.date))}</h2>
          <p>${U.esc(U.t("Four matches, one table. Every goal counts toward qualification.", "أربع مباريات وجدول واحد. كل هدف يهم في التأهل."))}</p>
        </div>
        <a class="btn btn-primary" href="#/tahady/league">${U.esc(U.t("Open league", "افتح الدوري"))}${U.icon("arrow", "i-arrow")}</a>
      </div>` : ""}
    `;

    return { html: Shell.app({ platform: "tahady", active: "tahady", title: U.t("Overview", "نظرة عامة"), crumb: "Tahady El Lamma", content: content }), title: U.t("Tahady El Lamma", "تحدي اللمة") };
  };

  /* ---------------------------------------------------------------------- */
  /* All tournaments                                                        */
  /* ---------------------------------------------------------------------- */
  TahadyPages.tournaments = function () {
    const cup = Store.db.cup;
    const ls = leagueStats();
    const sup = Store.db.superCup;
    const timeline = [
      {
        name: U.t("الدوري العام · Round 1", "الدوري العام · الجولة الأولى"),
        date: Store.db.league.matchdays[0].matches[0].date,
        status: "completed",
      },
      {
        name: U.t("كأس اللمة · Semi-finals", "كأس اللمة · نصف النهائي"),
        date: cup.semifinals[0].date,
        status: "completed",
      },
      {
        name: U.t("كأس اللمة · Final", "كأس اللمة · النهائي"),
        date: cup.final.date,
        status: "completed",
      },
      {
        name: U.t("الدوري العام · Round 2", "الدوري العام · الجولة الثانية"),
        date: (currentMatchday() || {}).matches ? currentMatchday().matches[0].date : null,
        status: "qualifying",
      },
      {
        name: U.t("سوبر النخبة · Final", "سوبر النخبة · النهائي"),
        date: sup.date,
        status: "upcoming",
      },
    ];

    const content = `
      <div class="page-head" style="margin-bottom:20px">
        <div>
          <div class="breadcrumbs"><a href="#/tahady">${U.esc(U.t("Tahady", "تحدي اللمة"))}</a><span class="sep">/</span><span>${U.esc(U.t("Tournaments", "البطولات"))}</span></div>
          <h1>${U.esc(U.t("Tournaments", "البطولات"))}</h1>
          <p>${U.esc(U.t("Three competitions, one season. Every stage feeds the next.", "ثلاث بطولات في موسم واحد. كل مرحلة تؤدي إلى التالية."))}</p>
        </div>
        <span class="badge badge-green">${U.icon("shield")}${U.esc(U.t("Season 2026", "موسم 2026"))}</span>
      </div>

      <div class="tournament-grid">
        ${tournamentCards().map((t) => Comp.tournamentCard(t)).join("")}
      </div>

      <div class="grid-2" style="margin-top:var(--s-5)">
        ${rulesPanel()}
        <div class="panel">
          ${Comp.panelHead(U.t("Season calendar", "تقويم الموسم"), U.t("Key dates across all three competitions", "أهم المواعيد في البطولات الثلاث"))}
          <div>
            ${timeline
              .map(
                (t) =>
                  '<div class="fixture"><div class="teams"><strong>' + U.esc(t.name) + "</strong></div>" +
                  Comp.statusBadge(t.status) +
                  "<time>" + U.esc(t.date ? U.dateShort(t.date) : "—") + "</time></div>"
              )
              .join("")}
          </div>
        </div>
      </div>

      <div class="panel" style="margin-top:var(--s-5)">
        ${Comp.panelHead(U.t("Season at a glance", "الموسم في أرقام"), "")}
        <div class="panel-body grid-4">
          ${Comp.stat({ icon: "users", label: U.t("Players", "اللاعبون"), value: "8" })}
          ${Comp.stat({ icon: "ball", label: U.t("Matches played", "مباريات لعبت"), value: ls.matchesPlayed })}
          ${Comp.stat({ icon: "target", label: U.t("Goals", "الأهداف"), value: ls.goals })}
          ${Comp.stat({ icon: "medal", label: U.t("Trophies decided", "ألقاب محسومة"), value: "1", suffix: U.t("of 3", "من 3") })}
        </div>
      </div>
    `;

    return { html: Shell.app({ platform: "tahady", active: "tournaments", title: U.t("Tournaments", "البطولات"), crumb: "Tahady El Lamma", content: content }), title: U.t("Tournaments", "البطولات") };
  };

  /* ---------------------------------------------------------------------- */
  /* League                                                                 */
  /* ---------------------------------------------------------------------- */
  TahadyPages.league = function (query) {
    const round = query && String(query.round) === "1" ? 1 : 2;
    const table = Store.table(round);
    const fullTable = Store.table();
    const ls = leagueStats();
    const md = currentMatchday();
    const top4 = table.slice(0, 4);
    const rest = table.slice(4);
    const scorers = Store.leagueTopScorers();
    const leader = pl(fullTable[0].id);

    const content = `
      <div class="page-head" style="margin-bottom:20px">
        <div>
          <div class="breadcrumbs"><a href="#/tahady">${U.esc(U.t("Tahady", "تحدي اللمة"))}</a><span class="sep">/</span><span>${U.esc(U.t("Tournaments", "البطولات"))}</span></div>
          <h1>${U.esc(U.t("الدوري العام", "الدوري العام"))}</h1>
          <p>${U.esc(U.t("Six matchdays, eight players, and a top-four cut that decides the cup seeds.", "ست جولات وثمانية لاعبين وخط تأهل لأفضل أربعة يحدد بذور الكأس."))}</p>
        </div>
        ${Comp.statusBadge("qualifying")}
      </div>

      <section class="comp-hero">
        <div>
          <span class="eyebrow">${U.icon("chart")}${U.esc(U.t("League", "الدوري"))}</span>
          <h1>${U.esc(U.t("Round 2 · the race for the top", "الجولة الثانية · سباق القمة"))}</h1>
          <p class="sub">${U.esc(U.t("Round 1 set the cup seeds. Round 2 now decides the league champion and the first Super El Nokhba finalist.", "الجولة الأولى حددت بذور الكأس، والثانية تحدد بطل الدوري وأول متأهل لسوبر النخبة."))}</p>
          <div class="dash-hero-actions">
            <span class="badge badge-gold">${U.icon("crown")}${U.esc(I18n.pick(leader.name))}</span>
            <span class="badge badge-green">${U.esc(U.t("Leader", "المتصدر"))}</span>
          </div>
        </div>
        <div class="comp-hero-side">
          <div class="round-row"><span>${U.esc(U.t("Current matchday", "الجولة الحالية"))}</span><strong>${md ? md.matchday : "—"} / 3</strong></div>
          <div class="round-row"><span>${U.esc(U.t("Matches played", "مباريات لعبت"))}</span><strong dir="ltr">${ls.matchesPlayed} / ${ls.matchesTotal}</strong></div>
          <div class="round-row"><span>${U.esc(U.t("Goals scored", "الأهداف"))}</span><strong>${ls.goals}</strong></div>
          <div class="round-row"><span>${U.esc(U.t("Cup seeds", "بذور الكأس"))}</span><strong>${U.esc(U.t("Top 4 of round 1", "أفضل 4 من الجولة 1"))}</strong></div>
        </div>
      </section>

      <div class="panel league-panel" style="margin-top:var(--s-5)">
        <div class="league-toolbar">
          <div class="tabs" role="tablist" aria-label="${U.esc(U.t("League round", "جولة الدوري"))}">
            <a class="tab ${round === 1 ? "is-active" : ""}" href="#/tahady/league?round=1" role="tab" aria-selected="${round === 1}">${U.esc(U.t("Round 1", "الجولة الأولى"))}</a>
            <a class="tab ${round === 2 ? "is-active" : ""}" href="#/tahady/league?round=2" role="tab" aria-selected="${round === 2}">${U.esc(U.t("Round 2", "الجولة الثانية"))}</a>
          </div>
          <div class="row gap-2 wrap">
            <span class="badge badge-green">${U.icon("flag")}${U.esc(U.t("Top 4 qualify", "أفضل 4 يتأهلون"))}</span>
            <span class="badge league-cols-hint">${U.esc(U.t("P · W · D · L · GD · Pts", "ل · ف · ت · خ · ف.أ · نقاط"))}</span>
          </div>
        </div>
        <div class="table-wrap">
          <table class="table league-table">
            ${leagueHead(false)}
            <tbody>
              ${top4.map((r, i) => leagueRow(r, i + 1)).join("")}
              ${cutLine()}
              ${rest.map((r, i) => leagueRow(r, i + 5)).join("")}
            </tbody>
          </table>
        </div>
        <div class="table-footnote">
          <span class="row gap-1"><i class="legend-dot green"></i>${U.esc(U.t("Qualification zone — top four of Round 1 enter كأس اللمة", "منطقة التأهل — أفضل أربعة في الجولة الأولى يدخلون كأس اللمة"))}</span>
          <span class="muted">${U.esc(round === 1 ? U.t("Round 1 is complete and seeded the cup.", "اكتملت الجولة الأولى وحددت بذور الكأس.") : U.t("Round 2 decides the league title.", "الجولة الثانية تحدد لقب الدوري."))}</span>
        </div>
      </div>

      <div class="tahady-grid" style="margin-top:var(--s-5)">
        <div class="stack gap-4">
          <div class="panel">
            ${Comp.panelHead(U.t("Fixtures", "المباريات القادمة"), U.t("Upcoming kick-offs", "المواعيد القادمة"))}
            <div>${Store.upcomingLeague(4).map((m) => fixtureRow(m)).join("") || Comp.empty("calendar", U.t("No fixtures left", "لا مباريات متبقية"), "")}</div>
          </div>
          <div class="panel">
            ${Comp.panelHead(U.t("Results", "النتائج"), U.t("Latest league scorelines", "آخر نتائج الدوري"))}
            <div>${Store.recentLeague(4).map((m) => fixtureRow(m, { score: true })).join("")}</div>
          </div>
        </div>
        <div class="stack gap-4">
          <div class="panel">
            ${Comp.panelHead(U.t("Top scorers", "الهدافون"), U.t("Goals scored in الدوري العام", "أهداف الدوري العام"))}
            <div class="panel-body" style="padding-top:4px;padding-bottom:4px">
              ${scorers
                .map(
                  (s, i) =>
                    '<a class="player-cell rank-row" href="#/tahady/profile?id=' + s.id + '">' +
                    '<span class="pos-badge ' + (i < 3 ? "pos-" + (i + 1) : "") + '">' + (i + 1) + "</span>" +
                    pavatar(s.id, "avatar-sm") +
                    '<span class="grow"><span class="name">' + U.esc(pname(s.id)) + "</span>" +
                    '<span class="sub">' + U.esc(U.t("Goals", "أهداف")) + "</span></span>" +
                    '<span class="points">' + s.goals + "</span></a>"
                )
                .join("")}
            </div>
          </div>
          <div class="panel">
            ${Comp.panelHead(U.t("Qualification", "التأهل"), "")}
            <div class="panel-body">
              <div class="rules-list">
                <div class="rule"><span class="n">1</span><span>${U.esc(U.t("Top four after Round 1 advance to كأس اللمة.", "أفضل أربعة بعد الجولة الأولى يتأهلون لكأس اللمة."))}</span></div>
                <div class="rule"><span class="n">2</span><span>${U.esc(U.t("The league champion qualifies for سوبر النخبة.", "بطل الدوري يتأهل لسوبر النخبة."))}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    return {
      html: Shell.app({ platform: "tahady", active: "league", title: U.t("الدوري العام", "الدوري العام"), crumb: U.t("Tournaments", "البطولات"), content: content }),
      title: U.t("الدوري العام", "الدوري العام"),
    };
  };

  /* ---------------------------------------------------------------------- */
  /* Cup                                                                    */
  /* ---------------------------------------------------------------------- */
  TahadyPages.cup = function () {
    const cup = Store.db.cup;
    const champion = pl(cup.champion);
    const runnerUp = pl(cup.runnerUp);
    const seeds = cup.seeds.map((id, i) => ({ id: id, seed: i + 1 }));
    const roundOneTable = Store.table(1);

    function tieCard(m, label, isFinal) {
      const winner = m.pens ? (m.pens[0] > m.pens[1] ? m.a : m.b) : m.scoreA >= m.scoreB ? m.a : m.b;
      function side(id) {
        const p = pl(id);
        const isWinner = id === winner;
        const pens = m.pens ? (id === m.a ? m.pens[0] : m.pens[1]) : null;
        return (
          '<div class="tie-team ' + (isWinner ? "winner" : "") + '">' +
          pavatar(id, "avatar-xs") +
          '<span class="name">' + U.esc(I18n.pick(p.name)) + "</span>" +
          '<span class="sc">' + (id === m.a ? m.scoreA : m.scoreB) +
          (pens != null ? ' <span class="pens">(' + pens + ")</span>" : "") + "</span>" +
          "</div>"
        );
      }
      return (
        '<div class="tie ' + (isFinal ? "is-final" : "") + '">' +
        '<div class="tie-head"><span>' + U.esc(label) + "</span>" +
        (m.pens ? '<span class="tag">' + U.esc(U.t("Penalties", "ترجيح")) + "</span>" : "") +
        "</div>" +
        side(m.a) + side(m.b) +
        '<div class="tie-date">' + U.esc(U.dateShort(m.date)) + " · " + U.esc(U.timeShort(m.date)) + "</div>" +
        "</div>"
      );
    }

    const content = `
      <div class="page-head" style="margin-bottom:20px">
        <div>
          <div class="breadcrumbs"><a href="#/tahady">${U.esc(U.t("Tahady", "تحدي اللمة"))}</a><span class="sep">/</span><span>${U.esc(U.t("Tournaments", "البطولات"))}</span></div>
          <h1>${U.esc(U.t("كأس اللمة", "كأس اللمة"))}</h1>
          <p>${U.esc(U.t("The top four from Round 1 meet in a straight knockout bracket.", "أفضل أربعة من الجولة الأولى يتقابلون في نظام خروج المغلوب."))}</p>
        </div>
        ${Comp.statusBadge("completed")}
      </div>

      <section class="comp-hero" style="border-color:rgba(232,183,90,.3)">
        <div>
          <span class="eyebrow">${U.icon("medal")}${U.esc(U.t("Cup final", "نهائي الكأس"))}</span>
          <h1>${U.esc(U.t("A champion is crowned", "تاج البطل"))}</h1>
          <p class="sub">${U.esc(U.t("Four qualifiers entered, one lifted the trophy. Draws were settled from the spot.", "أربعة متأهلين دخلوا وبطل واحد رفع الكأس. التعادل حُسم من علامة الجزاء."))}</p>
          <div class="dash-hero-actions">
            <span class="badge badge-gold">${U.icon("crown")}${U.esc(I18n.pick(champion.name))}</span>
            <span class="badge">${U.esc(U.t("Runner-up", "الوصيف"))}: ${U.esc(I18n.pick(runnerUp.name))}</span>
          </div>
        </div>
        <div class="comp-hero-side">
          <div class="round-row"><span>${U.esc(U.t("Final date", "موعد النهائي"))}</span><strong>${U.esc(U.dateShort(cup.final.date))}</strong></div>
          <div class="round-row"><span>${U.esc(U.t("Final score", "نتيجة النهائي"))}</span><strong dir="ltr">${cup.final.scoreA} – ${cup.final.scoreB}${cup.final.pens ? " (" + cup.final.pens.join("–") + ")" : ""}</strong></div>
          <div class="round-row"><span>${U.esc(U.t("Seeds", "البذور"))}</span><strong>${U.esc(U.t("Top 4 · Round 1", "أفضل 4 · الجولة 1"))}</strong></div>
          <div class="round-row"><span>${U.esc(U.t("Format", "النظام"))}</span><strong>${U.esc(U.t("Knockout", "خروج المغلوب"))}</strong></div>
        </div>
      </section>

      <div class="panel" style="margin-top:var(--s-5)">
        ${Comp.panelHead(U.t("Knockout bracket", "شجرة البطولة"), U.t("Semi-finals, final and champion", "نصف النهائي والنهائي والبطل"))}
        <div class="bracket">
          <div class="bracket-round">
            <div class="bracket-round-label">${U.esc(U.t("Semi-finals", "نصف النهائي"))}</div>
            ${cup.semifinals.map((m, i) => tieCard(m, U.t("Semi-final " + (i + 1), "نصف النهائي " + (i + 1)))).join("")}
          </div>
          <div class="bracket-round">
            <div class="bracket-round-label">${U.esc(U.t("Final", "النهائي"))}</div>
            ${tieCard(cup.final, U.t("Final", "النهائي"), true)}
          </div>
          <div class="bracket-round">
            <div class="bracket-round-label">${U.esc(U.t("Champion", "البطل"))}</div>
            <div class="champion-box">
              <span class="crown-float">${U.icon("crown")}</span>
              <div class="lbl">${U.esc(U.t("كأس اللمة · Champion", "بطل كأس اللمة"))}</div>
              ${U.avatar(I18n.pick(champion.name), { size: "avatar-xl", hue: champion.hue, gold: true })}
              <h3>${U.esc(I18n.pick(champion.name))}</h3>
              <p class="xs muted">${U.esc(champion.handle)}</p>
              <a class="btn btn-secondary btn-sm" style="margin-top:12px" href="#/tahady/profile?id=${champion.id}">${U.esc(U.t("View profile", "عرض الملف"))}</a>
            </div>
          </div>
        </div>
        <div class="bracket-note">${U.icon("info")}<span>${U.esc(U.t("Knockout ties level after normal time are decided by a penalty shoot-out. The cup winner qualifies for سوبر النخبة unless they also win the league.", "مباريات خروج المغلوب التي تنتهي بالتعادل تُحسم بركلات الترجيح. بطل الكأس يتأهل لسوبر النخبة إلا إذا فاز بالدوري أيضًا."))}</span></div>
      </div>

      <div class="tahady-grid" style="margin-top:var(--s-5)">
        <div class="panel">
          ${Comp.panelHead(U.t("Cup seeds", "بذور الكأس"), U.t("Qualified from Round 1 of الدوري العام", "تأهلوا من الجولة الأولى للدوري العام"))}
          <div class="table-wrap">
            <table class="table" style="min-width:0">
              ${leagueHead(false)}
              <tbody>
                ${seeds
                  .map((s) => {
                    const row = roundOneTable.find((r) => r.id === s.id);
                    return leagueRow({ ...row, played: row.played }, s.seed);
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
        <div class="stack gap-4">
          ${rulesPanel()}
          <div class="panel">
            ${Comp.panelHead(U.t("Final in numbers", "النهائي في أرقام"), "")}
            <div class="panel-body">
              <div class="round-row"><span>${U.esc(U.t("Goals in the final", "أهداف النهائي"))}</span><strong>${cup.final.scoreA + cup.final.scoreB}</strong></div>
              <div class="round-row"><span>${U.esc(U.t("Decided by penalties", "حُسم بالترجيح"))}</span><strong>${U.esc(cup.final.pens ? U.t("Yes", "نعم") : U.t("No", "لا"))}</strong></div>
              <div class="round-row"><span>${U.esc(U.t("Teams", "الفرق"))}</span><strong>4</strong></div>
              <div class="round-row"><span>${U.esc(U.t("Matches", "المباريات"))}</span><strong>3</strong></div>
            </div>
          </div>
        </div>
      </div>
    `;

    return { html: Shell.app({ platform: "tahady", active: "cup", title: U.t("كأس اللمة", "كأس اللمة"), crumb: U.t("Tournaments", "البطولات"), content: content }), title: U.t("كأس اللمة", "كأس اللمة") };
  };

  /* ---------------------------------------------------------------------- */
  /* Super El Nokhba                                                        */
  /* ---------------------------------------------------------------------- */
  TahadyPages.super = function () {
    const sup = Store.db.superCup;
    const cup = Store.db.cup;
    const a = pl(sup.participantA);
    const b = pl(sup.participantB);
    const leagueRows = Store.table();

    const content = `
      <div class="page-head" style="margin-bottom:20px">
        <div>
          <div class="breadcrumbs"><a href="#/tahady">${U.esc(U.t("Tahady", "تحدي اللمة"))}</a><span class="sep">/</span><span>${U.esc(U.t("Tournaments", "البطولات"))}</span></div>
          <h1>${U.esc(U.t("سوبر النخبة", "سوبر النخبة"))}</h1>
          <p>${U.esc(U.t("The season's ultimate final: league champion against cup champion.", "النهائي الأغلى في الموسم: بطل الدوري ضد بطل الكأس."))}</p>
        </div>
        ${Comp.statusBadge("upcoming")}
      </div>

      <section class="super-card">
        <div class="row between wrap gap-3">
          <div>
            <span class="eyebrow">${U.icon("crown")}${U.esc(U.t("Super El Nokhba · Final", "سوبر النخبة · النهائي"))}</span>
            <h1 style="margin-top:6px">${U.esc(U.t("One match. One champion.", "مباراة واحدة. بطل واحد."))}</h1>
          </div>
          <span class="badge badge-purple">${U.icon("calendar")}${U.esc(U.dateShort(sup.date))} · ${U.esc(U.timeShort(sup.date))}</span>
        </div>

        <div class="super-versus">
          <div>
            ${U.avatar(I18n.pick(a.name), { size: "avatar-2xl", hue: a.hue, ring: true })}
            <h3>${U.esc(I18n.pick(a.name))}</h3>
            <div class="role">${U.esc(U.t("League champion", "بطل الدوري"))}</div>
            <span class="badge badge-gold" style="margin-top:8px">${U.icon("chart")}#1 · ${leagueRows[0].points} ${U.esc(U.t("pts", "نقطة"))}</span>
          </div>
          <div class="super-vs">VS</div>
          <div>
            ${U.avatar(I18n.pick(b.name), { size: "avatar-2xl", hue: b.hue, ring: true })}
            <h3>${U.esc(I18n.pick(b.name))}</h3>
            <div class="role">${b.id === cup.champion ? U.esc(U.t("Cup champion", "بطل الكأس")) : U.esc(U.t("Cup runner-up", "وصيف الكأس"))}</div>
            <span class="badge badge-cyan" style="margin-top:8px">${U.icon("medal")}${U.esc(b.id === cup.champion ? U.t("Cup champion", "بطل الكأس") : U.t("Cup runner-up", "وصيف الكأس"))}</span>
          </div>
        </div>

        <div class="super-note">${U.icon("info")}<span>${U.esc(I18n.pick(sup.note))}</span></div>

        <div class="row gap-3 wrap" style="margin-top:var(--s-5);justify-content:center">
          <button class="btn btn-primary" data-remind>${U.icon("bell")}${U.esc(U.t("Remind me", "ذكّرني"))}</button>
          <a class="btn btn-secondary" href="#/tahady/league">${U.icon("chart")}${U.esc(U.t("League table", "جدول الدوري"))}</a>
          <a class="btn btn-ghost" href="#/tahady/cup">${U.icon("medal")}${U.esc(U.t("Cup bracket", "شجرة الكأس"))}</a>
        </div>
      </section>

      <div class="tahady-grid" style="margin-top:var(--s-5)">
        <div class="stack gap-4">
          <div class="panel">
            ${Comp.panelHead(U.t("How this final was set", "كيف تشكّل هذا النهائي"), U.t("Qualification path", "مسار التأهل"))}
            <div class="panel-body">
              <div class="rules-list">
                <div class="rule"><span class="n">1</span><span><strong>${U.esc(I18n.pick(a.name))}</strong> — ${U.esc(U.t("league champion after six matchdays.", "بطل الدوري بعد ست جولات."))}</span></div>
                <div class="rule"><span class="n">2</span><span><strong>${U.esc(I18n.pick(b.name))}</strong> — ${U.esc(b.id === cup.champion ? U.t("كأس اللمة champion.", "بطل كأس اللمة.") : U.t("كأس اللمة runner-up, promoted because the league winner also won the cup.", "وصيف كأس اللمة، تأهل لأن بطل الدوري فاز بالكأس أيضًا."))}</span></div>
                <div class="rule"><span class="n">3</span><span>${U.esc(U.t("One decisive match decides the Super El Nokhba title.", "مباراة واحدة حاسمة تحدد لقب سوبر النخبة."))}</span></div>
              </div>
            </div>
          </div>
          <div class="panel">
            ${Comp.panelHead(U.t("Head to head", "المواجهات المباشرة"), U.t("League meetings this season", "مواجهات الدوري هذا الموسم"))}
            <div>
              ${Store.db.league.matchdays
                .flatMap((md) => md.matches.map((m) => ({ ...m, matchday: md.matchday })))
                .filter((m) => (m.a === a.id && m.b === b.id) || (m.a === b.id && m.b === a.id))
                .map((m) => fixtureRow(m, { score: m.played }))
                .join("") || Comp.empty("sword", U.t("No meetings yet", "لا مواجهات بعد"), U.t("The final will be their first meeting this season.", "سيكون النهائي أول مواجهة بينهما هذا الموسم."))}
            </div>
          </div>
        </div>
        <div class="stack gap-4">
          ${rulesPanel()}
          <div class="panel">
            ${Comp.panelHead(U.t("Final details", "تفاصيل النهائي"), "")}
            <div class="panel-body">
              <div class="round-row"><span>${U.esc(U.t("Kick-off", "الانطلاق"))}</span><strong>${U.esc(U.dateShort(sup.date))}</strong></div>
              <div class="round-row"><span>${U.esc(U.t("Time", "التوقيت"))}</span><strong>${U.esc(U.timeShort(sup.date))}</strong></div>
              <div class="round-row"><span>${U.esc(U.t("Format", "النظام"))}</span><strong>${U.esc(U.t("Single match", "مباراة واحدة"))}</strong></div>
              <div class="round-row"><span>${U.esc(U.t("Participants", "المشاركون"))}</span><strong>2</strong></div>
            </div>
          </div>
        </div>
      </div>
    `;

    return {
      html: Shell.app({ platform: "tahady", active: "super", title: U.t("سوبر النخبة", "سوبر النخبة"), crumb: U.t("Tournaments", "البطولات"), content: content }),
      title: U.t("سوبر النخبة", "سوبر النخبة"),
      mount: function (root) {
        const btn = root.querySelector("[data-remind]");
        if (btn) {
          btn.addEventListener("click", function () {
            UI.toast({
              title: U.t("Reminder set", "تم ضبط التذكير"),
              msg: U.t("We'll notify you before سوبر النخبة kicks off.", "سنذكرك قبل انطلاق سوبر النخبة."),
              type: "success",
            });
          });
        }
      },
    };
  };

  /* ---------------------------------------------------------------------- */
  /* Players                                                                */
  /* ---------------------------------------------------------------------- */
  TahadyPages.players = function () {
    const table = Store.table();
    const scorers = Store.leagueTopScorers();
    const maxGoals = Math.max.apply(null, scorers.map((s) => s.goals).concat([1]));

    const content = `
      <div class="page-head" style="margin-bottom:20px">
        <div>
          <div class="breadcrumbs"><a href="#/tahady">${U.esc(U.t("Tahady", "تحدي اللمة"))}</a><span class="sep">/</span><span>${U.esc(U.t("Players", "اللاعبون"))}</span></div>
          <h1>${U.esc(U.t("Top players", "أفضل اللاعبين"))}</h1>
          <p>${U.esc(U.t("The eight competitors chasing the season's three trophies.", "ثمانية منافسون يطاردون ألقاب الموسم الثلاثة."))}</p>
        </div>
        <span class="badge badge-green">${U.icon("users")}8 ${U.esc(U.t("players", "لاعبين"))}</span>
      </div>

      <div class="players-grid">
        ${table
          .map((r, i) => {
            const p = pl(r.id);
            const honours = [];
            if (Store.db.cup.champion === p.id) honours.push(U.t("Cup winner", "بطل الكأس"));
            if (Store.db.superCup.participantA === p.id || Store.db.superCup.participantB === p.id) honours.push(U.t("Super finalist", "نهائي السوبر"));
            return (
              '<a class="player-card card-hover" href="#/tahady/profile?id=' + p.id + '">' +
              '<span class="rank-chip pos-badge ' + (i < 3 ? "pos-" + (i + 1) : "") + '">' + (i + 1) + "</span>" +
              U.avatar(I18n.pick(p.name), { size: "avatar-lg", hue: p.hue, ring: i === 0 }) +
              "<h3>" + U.esc(I18n.pick(p.name)) + "</h3>" +
              '<span class="handle">' + U.esc(p.handle) + "</span>" +
              (honours.length ? '<span class="badge badge-gold" style="margin-top:8px">' + U.icon("crown") + U.esc(honours[0]) + "</span>" : "") +
              '<div class="pstats">' +
              "<div><strong>" + r.points + "</strong>" + U.esc(U.t("Points", "نقاط")) + "</div>" +
              "<div><strong>" + r.won + "</strong>" + U.esc(U.t("Wins", "فوز")) + "</div>" +
              "<div><strong>" + r.gf + "</strong>" + U.esc(U.t("Goals", "أهداف")) + "</div>" +
              "</div>" +
              '<span class="btn btn-secondary btn-sm">' + U.esc(U.t("View profile", "عرض الملف")) + U.icon("arrow", "i-arrow") + "</span>" +
              "</a>"
            );
          })
          .join("")}
      </div>

      <div class="grid-2" style="margin-top:var(--s-5)">
        <div class="panel">
          ${Comp.panelHead(U.t("Top scorers", "الهدافون"), U.t("Goals scored in الدوري العام", "أهداف الدوري العام"))}
          <div class="panel-body">
            ${scorers
              .map(
                (s) =>
                  '<div class="dist-row"><span class="row gap-2">' + pavatar(s.id, "avatar-xs") + U.esc(pname(s.id)) + "</span>" +
                  '<span class="bar"><span style="width:' + Math.round((s.goals / maxGoals) * 100) + '%"></span></span>' +
                  '<span class="val">' + s.goals + "</span></div>"
              )
              .join("")}
          </div>
        </div>
        <div class="panel">
          ${Comp.panelHead(U.t("Season leaderboard", "ترتيب الموسم"), U.t("Full standings", "الترتيب الكامل"), '<a class="btn btn-ghost btn-sm" href="#/tahady/league">' + U.esc(U.t("Open", "فتح")) + "</a>")}
          <div class="panel-body" style="padding-top:4px;padding-bottom:4px">
            ${table
              .slice(0, 6)
              .map(
                (r, i) =>
                  '<a class="player-cell rank-row" href="#/tahady/profile?id=' + r.id + '">' +
                  '<span class="pos-badge ' + (i < 3 ? "pos-" + (i + 1) : "") + '">' + (i + 1) + "</span>" +
                  pavatar(r.id, "avatar-sm") +
                  '<span class="grow"><span class="name">' + U.esc(pname(r.id)) + "</span>" +
                  '<span class="sub">' + r.played + " " + U.esc(U.t("played", "مباراة")) + "</span></span>" +
                  '<span class="points">' + r.points + "</span></a>"
              )
              .join("")}
          </div>
        </div>
      </div>
    `;

    return { html: Shell.app({ platform: "tahady", active: "players", title: U.t("Top players", "أفضل اللاعبين"), crumb: U.t("Tahady El Lamma", "تحدي اللمة"), content: content }), title: U.t("Top players", "أفضل اللاعبين") };
  };

  /* ---------------------------------------------------------------------- */
  /* Player profile                                                         */
  /* ---------------------------------------------------------------------- */
  TahadyPages.profile = function (query) {
    const id = query && Store.player(query.id) ? query.id : Store.table()[0].id;
    const p = pl(id);
    const row = Store.playerRow(id, 1) || { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0, form: [] };
    const fullRow = Store.playerRow(id, null) || row;
    const rank = Store.table().findIndex((r) => r.id === id) + 1;
    const cup = Store.db.cup;
    const isCupChampion = cup.champion === id;
    const isRunnerUp = cup.runnerUp === id;
    const isSuper = Store.db.superCup.participantA === id || Store.db.superCup.participantB === id;

    const history = Store.db.league.matchdays
      .flatMap((md) => md.matches.map((m) => ({ ...m, matchday: md.matchday, round: md.round })))
      .filter((m) => m.played && (m.a === id || m.b === id))
      .sort((x, y) => new Date(y.date) - new Date(x.date))
      .slice(0, 6);

    const formPoints = fullRow.form.map((f) => (f === "w" ? 3 : f === "d" ? 1 : 0));
    const spark = formPoints.length ? Comp.sparkline(formPoints, { width: 220, height: 40, color: "#19C784" }) : "";

    const trophies = [];
    if (isCupChampion) trophies.push({ icon: "medal", title: U.t("كأس اللمة winner", "بطل كأس اللمة"), sub: "2026" });
    if (isRunnerUp) trophies.push({ icon: "flag", title: U.t("Cup runner-up", "وصيف الكأس"), sub: "2026" });
    if (rank === 1) trophies.push({ icon: "crown", title: U.t("League leader", "متصدر الدوري"), sub: U.t("Round 2", "الجولة 2") });
    if (isSuper) trophies.push({ icon: "sword", title: U.t("Super finalist", "نهائي السوبر"), sub: "2026" });
    if (rank <= 4) trophies.push({ icon: "check", title: U.t("Cup qualifier", "متأهل للكأس"), sub: U.t("Round 1 top 4", "أفضل 4 · الجولة 1") });

    const content = `
      <div class="breadcrumbs" style="margin-bottom:12px"><a href="#/tahady">${U.esc(U.t("Tahady", "تحدي اللمة"))}</a><span class="sep">/</span><a href="#/tahady/players">${U.esc(U.t("Players", "اللاعبون"))}</a><span class="sep">/</span><span>${U.esc(pname(id))}</span></div>

      <section class="profile-cover tahady">
        <div class="profile-id">
          ${U.avatar(I18n.pick(p.name), { size: "avatar-2xl", hue: p.hue })}
          <div class="p-meta">
            <h1>${U.esc(I18n.pick(p.name))}</h1>
            <div class="handle">${U.esc(p.handle)} · ${U.esc(U.t("Egypt", "مصر"))}</div>
            <div class="tags">
              <span class="badge badge-green">${U.icon("chart")}${U.esc(U.t("Rank", "الترتيب"))} #${rank}</span>
              <span class="badge badge-gold">${U.icon("trophy")}${fullRow.points} ${U.esc(U.t("pts", "نقطة"))}</span>
              ${isCupChampion ? '<span class="badge badge-gold">' + U.icon("crown") + U.esc(U.t("Cup champion", "بطل الكأس")) + "</span>" : ""}
              ${isSuper ? '<span class="badge badge-purple">' + U.icon("sword") + U.esc(U.t("Super finalist", "نهائي السوبر")) + "</span>" : ""}
            </div>
          </div>
          <div class="profile-actions">
            <a class="btn btn-primary" href="#/mo/play?mode=friend">${U.icon("sword")}${U.esc(U.t("Challenge", "تحدَّه"))}</a>
            <button class="btn btn-secondary" data-copy-profile>${U.icon("link")}${U.esc(U.t("Copy link", "نسخ الرابط"))}</button>
          </div>
        </div>
      </section>

      <div class="stat-row-4" style="margin-top:var(--s-4)">
        <div class="mini-stat"><strong>#${rank}</strong><span>${U.esc(U.t("League position", "المركز في الدوري"))}</span></div>
        <div class="mini-stat"><strong>${fullRow.points}</strong><span>${U.esc(U.t("Points", "النقاط"))}</span></div>
        <div class="mini-stat"><strong>${fullRow.won}</strong><span>${U.esc(U.t("Wins", "الانتصارات"))}</span></div>
        <div class="mini-stat"><strong>${fullRow.gf}</strong><span>${U.esc(U.t("Goals scored", "الأهداف"))}</span></div>
      </div>

      <div class="profile-grid">
        <div class="stack gap-4">
          <div class="panel">
            ${Comp.panelHead(
              U.t("Season form", "حالة الموسم"),
              U.t("Last five league results", "آخر خمس نتائج في الدوري"),
              '<span class="badge">' + U.esc(U.t("Round 1 + 2", "الجولة 1 + 2")) + "</span>"
            )}
            <div class="panel-body">
              <div class="form-summary">
                <div>
                  <div class="strong">${Comp.formDots(fullRow.form)}</div>
                  <p class="xs muted" style="margin-top:8px">${U.esc(
                    U.t(
                      fullRow.won + "W · " + fullRow.drawn + "D · " + fullRow.lost + "L this season",
                      fullRow.won + " ف · " + fullRow.drawn + " ت · " + fullRow.lost + " خ هذا الموسم"
                    )
                  )}</p>
                </div>
                <div class="spark-wrap">${spark}</div>
              </div>
              <div class="round-row" style="margin-top:14px"><span>${U.esc(U.t("Goals for / against", "له / عليه"))}</span><strong>${fullRow.gf} / ${fullRow.ga}</strong></div>
              <div class="round-row"><span>${U.esc(U.t("Goal difference", "فارق الأهداف"))}</span><strong>${fullRow.gd > 0 ? "+" + fullRow.gd : fullRow.gd}</strong></div>
              <div class="round-row"><span>${U.esc(U.t("Matches played", "المباريات"))}</span><strong>${fullRow.played}</strong></div>
            </div>
          </div>

          <div class="panel">
            ${Comp.panelHead(U.t("Match history", "سجل المباريات"), U.t("Most recent league matches", "أحدث مباريات الدوري"))}
            <div>
              ${history
                .map((m) => {
                  const isA = m.a === id;
                  const oppId = isA ? m.b : m.a;
                  const gf = isA ? m.scoreA : m.scoreB;
                  const ga = isA ? m.scoreB : m.scoreA;
                  const res = gf > ga ? "w" : gf === ga ? "d" : "l";
                  return (
                    '<div class="fixture hist-row">' +
                    '<div class="teams"><div class="team">' + pavatar(id, "avatar-xs") + "<strong>" + U.esc(pname(id)) + "</strong></div>" +
                    '<span class="fixture-score">' + gf + " – " + ga + "</span>" +
                    '<div class="team right"><strong>' + U.esc(pname(oppId)) + "</strong>" + pavatar(oppId, "avatar-xs") + "</div></div>" +
                    '<span class="result-tag ' + res + '">' + U.esc(res === "w" ? U.t("Win", "فوز") : res === "d" ? U.t("Draw", "تعادل") : U.t("Loss", "خسارة")) + "</span>" +
                    "<time>" + U.esc(U.dateShort(m.date)) + "</time>" +
                    "</div>"
                  );
                })
                .join("") || Comp.empty("ball", U.t("No matches yet", "لا مباريات بعد"), "")}
            </div>
          </div>

          <div class="panel">
            ${Comp.panelHead(U.t("Honours", "الألقاب"), U.t("Season 2026 achievements", "إنجازات موسم 2026"))}
            <div class="panel-body">
              <div class="trophy-shelf">
                ${trophies
                  .map(
                    (t) =>
                      '<div class="trophy-item">' + U.icon(t.icon) + "<div><strong>" + U.esc(t.title) + "</strong><span>" + U.esc(t.sub) + "</span></div></div>"
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </div>

        <div class="stack gap-4">
          <div class="panel">
            ${Comp.panelHead(U.t("Player details", "بيانات اللاعب"), "")}
            <div class="panel-body">
              <div class="round-row"><span>${U.esc(U.t("Country", "البلد"))}</span><strong>${U.esc(U.t("Egypt", "مصر"))}</strong></div>
              <div class="round-row"><span>${U.esc(U.t("Preferred mode", "الوضع المفضل"))}</span><strong>Football Quiz</strong></div>
              <div class="round-row"><span>${U.esc(U.t("Cup seed", "بذرة الكأس"))}</span><strong>${cup.seeds.indexOf(id) >= 0 ? "#" + (cup.seeds.indexOf(id) + 1) : "—"}</strong></div>
              <div class="round-row"><span>${U.esc(U.t("Super status", "حالة السوبر"))}</span><strong>${U.esc(isSuper ? U.t("Qualified", "متأهل") : U.t("—", "—"))}</strong></div>
              <div class="round-row"><span>${U.esc(U.t("Win rate", "نسبة الفوز"))}</span><strong>${U.pct(fullRow.won, fullRow.played)}%</strong></div>
              <div class="progress thin" style="margin-top:10px"><span style="width:${U.pct(fullRow.won, fullRow.played)}%"></span></div>
            </div>
          </div>

          <div class="panel">
            ${Comp.panelHead(U.t("League standing", "الترتيب في الدوري"), "")}
            <div class="panel-body" style="padding-top:4px;padding-bottom:6px">
              ${Store.table()
                .slice(0, 5)
                .map(
                  (r, i) =>
                    '<a class="player-cell rank-row ' + (r.id === id ? "is-me" : "") + '" href="#/tahady/profile?id=' + r.id + '">' +
                    '<span class="pos-badge ' + (i < 3 ? "pos-" + (i + 1) : "") + '">' + (i + 1) + "</span>" +
                    pavatar(r.id, "avatar-sm") +
                    '<span class="grow"><span class="name">' + U.esc(pname(r.id)) + "</span></span>" +
                    '<span class="points">' + r.points + "</span></a>"
                )
                .join("")}
              <a class="btn btn-ghost btn-sm btn-block" href="#/tahady/league" style="margin-top:8px">${U.esc(U.t("Full table", "الجدول الكامل"))}${U.icon("arrow", "i-arrow")}</a>
            </div>
          </div>

          <div class="panel">
            ${Comp.panelHead(U.t("Goals", "الأهداف"), U.t("Contribution this season", "المساهمة هذا الموسم"))}
            <div class="panel-body">
              <div class="dist-row"><span>${U.esc(U.t("Scored", "سجل"))}</span><span class="bar"><span style="width:${U.clamp(fullRow.gf * 8, 4, 100)}%"></span></span><span class="val">${fullRow.gf}</span></div>
              <div class="dist-row"><span>${U.esc(U.t("Conceded", "استقبل"))}</span><span class="bar"><span style="width:${U.clamp(fullRow.ga * 8, 4, 100)}%;background:var(--grad-gold)"></span></span><span class="val">${fullRow.ga}</span></div>
            </div>
          </div>
        </div>
      </div>
    `;

    return {
      html: Shell.app({ platform: "tahady", active: "tprofile", title: pname(id), crumb: U.t("Players", "اللاعبون"), content: content }),
      title: pname(id),
      mount: function (root) {
        const btn = root.querySelector("[data-copy-profile]");
        if (btn) {
          btn.addEventListener("click", function () {
            UI.copy(location.href, U.t("Profile link copied", "تم نسخ رابط الملف"));
          });
        }
      },
    };
  };

  global.TahadyPages = TahadyPages;
})(window);
