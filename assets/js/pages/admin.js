/* ==========================================================================
   Admin console — season overview, players, question bank, match results,
   tournaments, notifications and platform settings.
   ========================================================================== */
(function (global) {
  "use strict";

  const AdminPages = {};

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

  function adminPage(active, title, crumb, content) {
    return {
      html: Shell.app({ platform: "admin", active: active, title: title, crumb: crumb || U.t("Admin console", "لوحة الإدارة"), content: content }),
      title: title,
    };
  }

  function field(label, input) {
    return '<div class="field"><label>' + U.esc(label) + "</label>" + input + "</div>";
  }

  function diffBadge(diff) {
    const map = { easy: ["badge-green", U.t("Easy", "سهل")], medium: ["badge-purple", U.t("Medium", "متوسط")], hard: ["badge-gold", U.t("Hard", "صعب")] };
    const d = map[diff] || map.medium;
    return '<span class="badge ' + d[0] + '">' + U.esc(d[1]) + "</span>";
  }

  /* ====================================================================== */
  /* Overview                                                              */
  /* ====================================================================== */
  AdminPages.overview = function () {
    const table = Store.table();
    const ls = Store.db.league.matchdays;
    const played = ls.reduce((n, md) => n + md.matches.filter((m) => m.played).length, 0);
    const total = ls.reduce((n, md) => n + md.matches.length, 0);
    const recent = Store.recentLeague(5);

    const content = `
      <div class="page-head" style="margin-bottom:20px">
        <div>
          <div class="breadcrumbs"><a href="#/">${U.esc(U.t("Arena", "الأرينا"))}</a><span class="sep">/</span><span>${U.esc(U.t("Admin console", "لوحة الإدارة"))}</span></div>
          <h1>${U.esc(U.t("Overview", "نظرة عامة"))}</h1>
          <p>${U.esc(U.t("Manage players, questions, fixtures and the season's three competitions.", "إدارة اللاعبين والأسئلة والمباريات والبطولات الثلاث."))}</p>
        </div>
        <span class="badge badge-purple">${U.icon("shield")}${U.esc(U.t("Local demo data", "بيانات تجريبية محلية"))}</span>
      </div>

      <div class="admin-stats">
        ${Comp.stat({ icon: "users", label: U.t("Players", "اللاعبون"), value: Store.db.players.length + Store.db.mo.rivals.length, suffix: U.t("total", "إجمالي") })}
        ${Comp.stat({ icon: "info", label: U.t("Questions", "الأسئلة"), value: Store.db.questions.length, foot: U.esc(U.t("Question bank ready", "بنك الأسئلة جاهز")) })}
        ${Comp.stat({ icon: "ball", label: U.t("League matches", "مباريات الدوري"), value: '<span dir="ltr">' + played + " / " + total + "</span>", foot: U.esc(U.t("Results recorded", "نتائج مسجلة")) })}
        ${Comp.stat({ icon: "bell", label: U.t("Unread alerts", "تنبيهات غير مقروءة"), value: Store.unreadCount(), foot: U.esc(U.t("Across the platform", "على مستوى المنصة")) })}
      </div>

      <div class="admin-grid">
        <div class="stack gap-4">
          <div class="panel">
            ${Comp.panelHead(
              U.t("Latest results", "أحدث النتائج"),
              U.t("Verify scorelines and update standings", "تحقق من النتائج وحدّث الترتيب"),
              '<a class="btn btn-secondary btn-sm" href="#/admin/matches">' + U.icon("edit") + U.esc(U.t("Manage", "إدارة")) + "</a>"
            )}
            <div class="table-wrap">
              <table class="table admin-table admin-table--results">
                <thead><tr>
                  <th>${U.esc(U.t("Match", "المباراة"))}</th>
                  <th class="num">${U.esc(U.t("Score", "النتيجة"))}</th>
                  <th class="num">${U.esc(U.t("MD", "الجولة"))}</th>
                  <th class="num">${U.esc(U.t("Date", "التاريخ"))}</th>
                </tr></thead>
                <tbody>
                  ${recent
                    .map(
                      (m) =>
                        "<tr><td>" + U.esc(pname(m.a)) + " <span class='muted'>vs</span> " + U.esc(pname(m.b)) + "</td>" +
                        "<td class='num points'>" + m.scoreA + " – " + m.scoreB + "</td>" +
                        "<td class='num'>" + m.matchday + "</td>" +
                        "<td class='num muted'>" + U.esc(U.dateShort(m.date)) + "</td></tr>"
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>

          <div class="panel">
            ${Comp.panelHead(U.t("Recent activity", "النشاط الأخير"), U.t("Platform-wide events", "أحداث المنصة"))}
            <div class="panel-body" style="padding-top:4px;padding-bottom:4px">
              ${Store.db.activity
                .slice(0, 6)
                .map(
                  (a) =>
                    '<div class="activity-item"><span class="activity-ic ' + (a.type === "win" ? "win" : a.type === "achievement" ? "achievement" : "tournament") + '">' +
                    U.icon(a.type === "win" ? "ball" : a.type === "achievement" ? "star" : "trophy") + "</span>" +
                    "<div><p>" + U.esc(I18n.pick(a.text)) + "</p><time>" + U.relTime(a.time) + "</time></div></div>"
                )
                .join("")}
            </div>
          </div>
        </div>

        <div class="stack gap-4">
          <div class="panel">
            ${Comp.panelHead(U.t("Quick actions", "إجراءات سريعة"), "")}
            <div class="panel-body grid-2" style="gap:8px">
              <a class="btn btn-secondary btn-block" href="#/admin/questions">${U.icon("plus")}${U.esc(U.t("Add question", "إضافة سؤال"))}</a>
              <a class="btn btn-secondary btn-block" href="#/admin/matches">${U.icon("ball")}${U.esc(U.t("Enter result", "إدخال نتيجة"))}</a>
              <a class="btn btn-secondary btn-block" href="#/admin/notifications">${U.icon("bell")}${U.esc(U.t("Announce", "إعلان"))}</a>
              <a class="btn btn-secondary btn-block" href="#/admin/tournaments">${U.icon("trophy")}${U.esc(U.t("Brackets", "البطولات"))}</a>
            </div>
          </div>

          <div class="panel">
            ${Comp.panelHead(U.t("Season status", "حالة الموسم"), "")}
            <div class="panel-body">
              <div class="round-row"><span>${U.esc(U.t("League leader", "متصدر الدوري"))}</span><strong>${U.esc(pname(table[0].id))}</strong></div>
              <div class="round-row"><span>${U.esc(U.t("Cup champion", "بطل الكأس"))}</span><strong>${U.esc(pname(Store.db.cup.champion))}</strong></div>
              <div class="round-row"><span>${U.esc(U.t("Super final", "نهائي السوبر"))}</span><strong>${U.esc(U.dateShort(Store.db.superCup.date))}</strong></div>
              <div class="round-row"><span>${U.esc(U.t("Next matchday", "الجولة القادمة"))}</span><strong>${played < total ? U.t("Scheduled", "مجدولة") : U.t("Complete", "مكتملة")}</strong></div>
            </div>
          </div>

          <div class="panel">
            ${Comp.panelHead(U.t("System", "النظام"), "")}
            <div class="panel-body">
              <div class="round-row"><span>${U.esc(U.t("Storage", "التخزين"))}</span><strong>${U.esc(U.t("Local (demo)", "محلي (تجريبي)"))}</strong></div>
              <div class="round-row"><span>${U.esc(U.t("Questions version", "إصدار الأسئلة"))}</span><strong>v3</strong></div>
              <div class="round-row"><span>${U.esc(U.t("Language", "اللغة"))}</span><strong>${I18n.lang === "ar" ? "العربية" : "English"}</strong></div>
              <p class="xs muted" style="margin-top:10px">${U.esc(U.t("All edits are saved to this browser. Connect the API adapter in Store to publish changes.", "كل التعديلات تُحفظ في هذا المتصفح. اربط محول الـAPI في Store لنشر التغييرات."))}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    return adminPage("admin", U.t("Overview", "نظرة عامة"), U.t("Admin console", "لوحة الإدارة"), content);
  };

  /* ====================================================================== */
  /* Players                                                               */
  /* ====================================================================== */
  AdminPages.players = function () {
    const table = Store.table();
    const rivals = Store.db.mo.rivals;
    const me = Store.db.mo.me;

    const content = `
      <div class="page-head" style="margin-bottom:20px">
        <div>
          <div class="breadcrumbs"><a href="#/admin">${U.esc(U.t("Admin", "الإدارة"))}</a><span class="sep">/</span><span>${U.esc(U.t("Players", "اللاعبون"))}</span></div>
          <h1>${U.esc(U.t("Players", "اللاعبون"))}</h1>
          <p>${U.esc(U.t("Rosters for both platforms: Tahady El Lamma and Mo Games.", "قوائم المنصتين: تحدي اللمة ومو جيمز."))}</p>
        </div>
        <span class="badge badge-green">${U.icon("users")}${table.length + rivals.length + 1} ${U.esc(U.t("players", "لاعبين"))}</span>
      </div>

      <div class="panel">
        ${Comp.panelHead(U.t("Tahady El Lamma roster", "قائمة تحدي اللمة"), U.t("League standings and qualification status", "ترتيب الدوري وحالة التأهل"))}
        <div class="table-wrap">
          <table class="table admin-table admin-table--roster">
            <thead><tr>
              <th class="col-pos">#</th>
              <th>${U.esc(U.t("Player", "اللاعب"))}</th>
              <th class="num">${U.esc(U.t("P", "ل"))}</th>
              <th class="num">${U.esc(U.t("W", "ف"))}</th>
              <th class="num">${U.esc(U.t("D", "ت"))}</th>
              <th class="num">${U.esc(U.t("L", "خ"))}</th>
              <th class="num">${U.esc(U.t("Pts", "نقاط"))}</th>
              <th class="num">${U.esc(U.t("Seed", "بذرة"))}</th>
              <th class="actions">${U.esc(U.t("Actions", "إجراءات"))}</th>
            </tr></thead>
            <tbody>
              ${table
                .map((r, i) => {
                  const seed = Store.db.cup.seeds.indexOf(r.id);
                  return (
                    '<tr><td class="num"><span class="pos-badge ' + (i < 3 ? "pos-" + (i + 1) : "") + '">' + (i + 1) + "</span></td>" +
                    '<td><a class="player-cell" href="#/tahady/profile?id=' + r.id + '">' + pavatar(r.id, "avatar-xs") +
                    '<span><span class="name">' + U.esc(pname(r.id)) + "</span><span class='sub'>" + U.esc(pl(r.id).handle) + "</span></span></a></td>" +
                    '<td class="num">' + r.played + "</td>" +
                    '<td class="num">' + r.won + "</td>" +
                    '<td class="num">' + r.drawn + "</td>" +
                    '<td class="num">' + r.lost + "</td>" +
                    '<td class="num points">' + r.points + "</td>" +
                    '<td class="num">' + (seed >= 0 ? "#" + (seed + 1) : "—") + "</td>" +
                    '<td><div class="actions"><a class="icon-btn" href="#/tahady/profile?id=' + r.id + '" aria-label="' + U.esc(U.t("View profile", "عرض الملف")) + '">' + U.icon("eye") + "</a></div></td></tr>"
                  );
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel" style="margin-top:var(--s-5)">
        ${Comp.panelHead(U.t("Mo Games roster", "قائمة مو جيمز"), U.t("XP, record and online state", "الخبرة والسجل وحالة الاتصال"))}
        <div class="table-wrap">
          <table class="table admin-table">
            <thead><tr>
              <th>${U.esc(U.t("Player", "اللاعب"))}</th>
              <th class="num">${U.esc(U.t("Level", "المستوى"))}</th>
              <th class="num">${U.esc(U.t("XP", "XP"))}</th>
              <th class="num">${U.esc(U.t("Wins", "فوز"))}</th>
              <th class="num">${U.esc(U.t("Losses", "خسارة"))}</th>
              <th class="num">${U.esc(U.t("Win rate", "نسبة الفوز"))}</th>
              <th class="num">${U.esc(U.t("Status", "الحالة"))}</th>
            </tr></thead>
            <tbody>
              <tr>
                <td><span class="player-cell">${U.avatar(I18n.pick(me.name), { size: "avatar-xs", hue: me.hue })}<span><span class="name">${U.esc(I18n.pick(me.name))}</span><span class="sub">${U.esc(me.handle)}</span></span></span></td>
                <td class="num">${Store.meLevel().level}</td>
                <td class="num">${U.n(Store.db.mo.xp)}</td>
                <td class="num">${Store.db.mo.stats.wins}</td>
                <td class="num">${Store.db.mo.stats.losses}</td>
                <td class="num">${Store.winRate(Store.db.mo.stats.wins, Store.db.mo.stats.losses)}%</td>
                <td class="num"><span class="badge badge-green">${U.esc(U.t("Online", "متصل"))}</span></td>
              </tr>
              ${rivals
                .map(
                  (r) =>
                    "<tr><td><span class='player-cell'>" + U.avatar(I18n.pick(r.name), { size: "avatar-xs", hue: r.hue }) +
                    "<span><span class='name'>" + U.esc(I18n.pick(r.name)) + "</span><span class='sub'>" + U.esc(r.handle) + "</span></span></span></td>" +
                    "<td class='num'>" + Store.levelInfo(r.xp).level + "</td>" +
                    "<td class='num'>" + U.n(r.xp) + "</td>" +
                    "<td class='num'>" + r.wins + "</td>" +
                    "<td class='num'>" + r.losses + "</td>" +
                    "<td class='num'>" + Store.winRate(r.wins, r.losses) + "%</td>" +
                    "<td class='num'><span class='badge " + (r.online === "offline" ? "" : "badge-green") + "'>" + U.esc(r.online === "ingame" ? U.t("In game", "في مباراة") : r.online === "online" ? U.t("Online", "متصل") : U.t("Offline", "غير متصل")) + "</span></td></tr>"
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    return adminPage("aplayers", U.t("Players", "اللاعبون"), U.t("Admin console", "لوحة الإدارة"), content);
  };

  /* ====================================================================== */
  /* Questions                                                             */
  /* ====================================================================== */
  function questionModal(existing, close) {
    const q = existing || null;
    const cats = ["World Cup", "Clubs", "Players", "Africa", "History", "Transfers"];
    const cat = q ? q.cat : "World Cup";
    const diff = q ? q.diff : "medium";
    const answer = q ? q.answer : 0;
    const opts = q ? q.options : [{ en: "", ar: "" }, { en: "", ar: "" }, { en: "", ar: "" }, { en: "", ar: "" }];

    const body = `
      <form id="question-form" class="stack gap-4">
        <div class="grid-2">
          ${field(
            U.t("Category", "الفئة"),
            '<select class="select" name="cat">' +
              cats.map((c) => '<option value="' + U.esc(c) + '"' + (c === cat ? " selected" : "") + ">" + U.esc(c) + "</option>").join("") +
              "</select>"
          )}
          ${field(
            U.t("Difficulty", "الصعوبة"),
            '<select class="select" name="diff">' +
              ["easy", "medium", "hard"].map((d) => '<option value="' + d + '"' + (d === diff ? " selected" : "") + ">" + U.esc(U.t(d.charAt(0).toUpperCase() + d.slice(1), d === "easy" ? "سهل" : d === "medium" ? "متوسط" : "صعب")) + "</option>").join("") +
              "</select>"
          )}
        </div>
        ${field(U.t("Question (English)", "السؤال (إنجليزي)"), '<textarea class="textarea" name="qen" rows="2" placeholder="' + U.esc(U.t("Type the question…", "اكتب السؤال…")) + '">' + U.esc(q ? q.q.en : "") + "</textarea>")}
        ${field(U.t("Question (Arabic)", "السؤال (عربي)"), '<textarea class="textarea" name="qar" rows="2" dir="rtl" placeholder="اكتب السؤال…">' + U.esc(q ? q.q.ar : "") + "</textarea>")}
        <div>
          <div class="strong small" style="margin-bottom:8px">${U.esc(U.t("Answer options", "خيارات الإجابة"))}</div>
          <div class="stack gap-2">
            ${opts
              .map(
                (o, i) =>
                  '<div class="option-edit"><span class="pos-badge">' + "ABCD"[i] + "</span>" +
                  '<input class="input" name="en' + i + '" value="' + U.esc(o.en) + '" placeholder="' + U.esc(U.t("English option", "الخيار بالإنجليزية")) + '" aria-label="' + U.esc(U.t("Option ", "الخيار ") + "ABCD"[i] + U.t(" English", " إنجليزي")) + '">' +
                  '<input class="input" name="ar' + i + '" value="' + U.esc(o.ar) + '" dir="rtl" placeholder="الخيار بالعربية" aria-label="' + U.esc(U.t("Option ", "الخيار ") + "ABCD"[i] + U.t(" Arabic", " عربي")) + '"></div>'
              )
              .join("")}
          </div>
        </div>
        ${field(
          U.t("Correct answer", "الإجابة الصحيحة"),
          '<select class="select" name="answer">' +
            [0, 1, 2, 3].map((i) => '<option value="' + i + '"' + (i === answer ? " selected" : "") + ">" + U.esc(U.t("Option ", "الخيار ") + "ABCD"[i]) + "</option>").join("") +
            "</select>"
        )}
      </form>
    `;
    const footer =
      '<button class="btn btn-secondary" data-cancel>' + U.esc(U.t("Cancel", "إلغاء")) + "</button>" +
      '<button class="btn btn-primary" data-save>' + U.icon("check") + U.esc(U.t("Save question", "حفظ السؤال")) + "</button>";

    return UI.openModal({
      title: existing ? U.t("Edit question", "تعديل السؤال") : U.t("New question", "سؤال جديد"),
      subtitle: U.esc(U.t("Questions feed the Mo Games 1v1 match engine.", "الأسئلة تُستخدم في محرك مباريات 1 ضد 1.")),
      size: "wide",
      body: body,
      footer: footer,
      onMount: function (root, closeModal) {
        function cancel() {
          closeModal();
        }
        root.querySelector("[data-cancel]").addEventListener("click", cancel);
        root.querySelector("[data-save]").addEventListener("click", function () {
          const form = root.querySelector("#question-form");
          const data = new FormData(form);
          const qen = String(data.get("qen") || "").trim();
          const qar = String(data.get("qar") || "").trim();
          const options = [0, 1, 2, 3].map((i) => ({
            en: String(data.get("en" + i) || "").trim(),
            ar: String(data.get("ar" + i) || "").trim() || String(data.get("en" + i) || "").trim(),
          }));
          const filled = options.filter((o) => o.en);
          if (!qen || filled.length < 2) {
            UI.toast({ title: U.t("Add a question and at least two options", "أضف السؤال وخيارين على الأقل"), type: "error" });
            return;
          }
          const correct = Number(data.get("answer"));
          if (!options[correct] || !options[correct].en) {
            UI.toast({ title: U.t("The correct answer needs a value", "الإجابة الصحيحة تحتاج قيمة"), type: "error" });
            return;
          }
          Store.upsertQuestion({
            id: existing ? existing.id : U.uid("q"),
            cat: String(data.get("cat")),
            diff: String(data.get("diff")),
            q: { en: qen, ar: qar || qen },
            options: options,
            answer: correct,
          });
          closeModal();
          UI.toast({ title: existing ? U.t("Question updated", "تم تحديث السؤال") : U.t("Question added", "تمت إضافة السؤال"), type: "success" });
          Router.render();
        });
      },
    });
  }

  AdminPages.questions = function () {
    const questions = Store.db.questions;
    const cats = {};
    questions.forEach((q) => (cats[q.cat] = (cats[q.cat] || 0) + 1));
    const counts = { easy: 0, medium: 0, hard: 0 };
    questions.forEach((q) => (counts[q.diff] = (counts[q.diff] || 0) + 1));

    const content = `
      <div class="page-head" style="margin-bottom:20px">
        <div>
          <div class="breadcrumbs"><a href="#/admin">${U.esc(U.t("Admin", "الإدارة"))}</a><span class="sep">/</span><span>${U.esc(U.t("Questions", "الأسئلة"))}</span></div>
          <h1>${U.esc(U.t("Question bank", "بنك الأسئلة"))}</h1>
          <p>${U.esc(U.t("Bilingual questions used by the 1v1 match engine, across all categories.", "أسئلة ثنائية اللغة يستخدمها محرك مباريات 1 ضد 1 في كل الفئات."))}</p>
        </div>
        <button class="btn btn-primary" data-add-question>${U.icon("plus")}${U.esc(U.t("Add question", "إضافة سؤال"))}</button>
      </div>

      <div class="admin-stats">
        ${Comp.stat({ icon: "info", label: U.t("Total questions", "إجمالي الأسئلة"), value: questions.length })}
        ${Comp.stat({ icon: "target", label: U.t("Categories", "الفئات"), value: Object.keys(cats).length })}
        ${Comp.stat({ icon: "bolt", label: U.t("Easy / Medium", "سهل / متوسط"), value: counts.easy + " / " + counts.medium })}
        ${Comp.stat({ icon: "flame", label: U.t("Hard", "صعب"), value: counts.hard })}
      </div>

      <div class="panel" style="margin-top:var(--s-5)">
        ${Comp.panelHead(U.t("All questions", "كل الأسئلة"), U.t("Edit wording, options or the correct answer", "عدّل الصياغة والخيارات أو الإجابة الصحيحة"))}
        <div class="table-wrap">
          <table class="table admin-table admin-table--questions">
            <thead><tr>
              <th>${U.esc(U.t("Question", "السؤال"))}</th>
              <th>${U.esc(U.t("Category", "الفئة"))}</th>
              <th class="num">${U.esc(U.t("Difficulty", "الصعوبة"))}</th>
              <th>${U.esc(U.t("Answer", "الإجابة"))}</th>
              <th class="actions">${U.esc(U.t("Actions", "إجراءات"))}</th>
            </tr></thead>
            <tbody>
              ${questions
                .map(
                  (q) =>
                    '<tr><td><span class="name" style="font-weight:600">' + U.esc(I18n.pick(q.q)) + "</span></td>" +
                    "<td><span class='badge'>" + U.esc(q.cat) + "</span></td>" +
                    '<td class="num">' + diffBadge(q.diff) + "</td>" +
                    "<td>" + U.esc(I18n.pick(q.options[q.answer])) + "</td>" +
                    '<td><div class="actions">' +
                    '<button class="icon-btn" data-edit="' + q.id + '" aria-label="' + U.esc(U.t("Edit", "تعديل")) + '">' + U.icon("edit") + "</button>" +
                    '<button class="icon-btn" data-delete="' + q.id + '" aria-label="' + U.esc(U.t("Delete", "حذف")) + '">' + U.icon("trash") + "</button>" +
                    "</div></td></tr>"
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const page = adminPage("aquestions", U.t("Questions", "الأسئلة"), U.t("Admin console", "لوحة الإدارة"), content);
    page.mount = function (root) {
      root.querySelector("[data-add-question]").addEventListener("click", function () {
        questionModal(null);
      });
      root.querySelectorAll("[data-edit]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const q = Store.db.questions.find((x) => x.id === btn.getAttribute("data-edit"));
          if (q) questionModal(JSON.parse(JSON.stringify(q)));
        });
      });
      root.querySelectorAll("[data-delete]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const id = btn.getAttribute("data-delete");
          UI.confirm({
            title: U.t("Delete this question?", "حذف هذا السؤال؟"),
            message: U.t("The question will be removed from the match engine pool.", "سيُحذف السؤال من مجموعة محرك المباريات."),
            confirm: U.t("Delete", "حذف"),
            danger: true,
          }).then(function (ok) {
            if (!ok) return;
            Store.deleteQuestion(id);
            UI.toast({ title: U.t("Question deleted", "تم حذف السؤال"), type: "success" });
            Router.render();
          });
        });
      });
    };
    return page;
  };

  /* ====================================================================== */
  /* Matches                                                               */
  /* ====================================================================== */
  AdminPages.matches = function (query) {
    const round = query && String(query.round) === "1" ? 1 : query && String(query.round) === "2" ? 2 : 0;
    const rows = [];
    Store.db.league.matchdays.forEach((md) => {
      if (round && md.round !== round) return;
      md.matches.forEach((m) => rows.push({ ...m, matchday: md.matchday, round: md.round }));
    });
    rows.sort((a, b) => new Date(a.date) - new Date(b.date));

    const content = `
      <div class="page-head" style="margin-bottom:20px">
        <div>
          <div class="breadcrumbs"><a href="#/admin">${U.esc(U.t("Admin", "الإدارة"))}</a><span class="sep">/</span><span>${U.esc(U.t("Matches", "المباريات"))}</span></div>
          <h1>${U.esc(U.t("Matches & results", "المباريات والنتائج"))}</h1>
          <p>${U.esc(U.t("Enter or correct scorelines. Standings, cup seeds and the Super matchup update instantly.", "أدخل أو صحح النتائج. يُحدّث الترتيب وبذور الكأس ومباراة السوبر فورًا."))}</p>
        </div>
        <span class="badge badge-cyan">${U.icon("refresh")}${U.esc(U.t("Live standings", "ترتيب مباشر"))}</span>
      </div>

      <div class="panel">
        <div class="league-toolbar">
          <div class="tabs" role="tablist" aria-label="${U.esc(U.t("Filter by round", "تصفية حسب الجولة"))}">
            <a class="tab ${round === 0 ? "is-active" : ""}" href="#/admin/matches" role="tab" aria-selected="${round === 0}">${U.esc(U.t("All rounds", "كل الجولات"))}</a>
            <a class="tab ${round === 1 ? "is-active" : ""}" href="#/admin/matches?round=1" role="tab" aria-selected="${round === 1}">${U.esc(U.t("Round 1", "الجولة الأولى"))}</a>
            <a class="tab ${round === 2 ? "is-active" : ""}" href="#/admin/matches?round=2" role="tab" aria-selected="${round === 2}">${U.esc(U.t("Round 2", "الجولة الثانية"))}</a>
          </div>
          <span class="badge">${rows.length} ${U.esc(U.t("matches", "مباراة"))}</span>
        </div>
        <div class="table-wrap">
          <table class="table admin-table admin-table--fixtures">
            <thead><tr>
              <th class="num">${U.esc(U.t("MD", "ج"))}</th>
              <th>${U.esc(U.t("Home", "المستضيف"))}</th>
              <th class="num">${U.esc(U.t("Score", "النتيجة"))}</th>
              <th>${U.esc(U.t("Away", "الضيف"))}</th>
              <th class="num">${U.esc(U.t("Date", "التاريخ"))}</th>
              <th class="num">${U.esc(U.t("Status", "الحالة"))}</th>
              <th class="actions">${U.esc(U.t("Save", "حفظ"))}</th>
            </tr></thead>
            <tbody>
              ${rows
                .map(
                  (m) =>
                    '<tr data-match-row="' + m.id + '">' +
                    '<td class="num">' + m.matchday + "</td>" +
                    "<td>" + U.esc(pname(m.a)) + "</td>" +
                    '<td class="num"><div class="score-edit"><input class="input" type="number" min="0" max="99" inputmode="numeric" value="' + (m.scoreA == null ? "" : m.scoreA) + '" data-score-a aria-label="' + U.esc(U.t("Home score", "نتيجة المستضيف")) + '"><span>–</span><input class="input" type="number" min="0" max="99" inputmode="numeric" value="' + (m.scoreB == null ? "" : m.scoreB) + '" data-score-b aria-label="' + U.esc(U.t("Away score", "نتيجة الضيف")) + '"></div></td>' +
                    "<td>" + U.esc(pname(m.b)) + "</td>" +
                    '<td class="num muted">' + U.esc(U.dateShort(m.date)) + "</td>" +
                    '<td class="num">' + Comp.statusBadge(m.played ? "completed" : "scheduled") + "</td>" +
                    '<td><div class="actions"><button class="btn btn-secondary btn-sm" data-save-match="' + m.id + '">' + U.icon("check") + U.esc(U.t("Save", "حفظ")) + "</button></div></td>" +
                    "</tr>"
                )
                .join("")}
            </tbody>
          </table>
        </div>
        <div class="table-footnote">
          <span>${U.esc(U.t("Saving a result marks the match as played and recalculates the league table, cup seeds and Super participants.", "حفظ النتيجة يعلّم المباراة كمكتملة ويعيد حساب جدول الدوري وبذور الكأس ومشاركي السوبر."))}</span>
        </div>
      </div>
    `;

    const page = adminPage("amatches", U.t("Matches & results", "المباريات والنتائج"), U.t("Admin console", "لوحة الإدارة"), content);
    page.mount = function (root) {
      root.querySelectorAll("[data-save-match]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const row = btn.closest("[data-match-row]");
          const a = row.querySelector("[data-score-a]").value;
          const b = row.querySelector("[data-score-b]").value;
          if (a === "" || b === "" || Number(a) < 0 || Number(b) < 0) {
            UI.toast({ title: U.t("Enter both scores", "أدخل النتيجتين"), type: "error" });
            return;
          }
          Store.updateMatchScore(btn.getAttribute("data-save-match"), a, b);
          UI.toast({ title: U.t("Result saved", "تم حفظ النتيجة"), msg: U.t("Standings and qualification paths recalculated.", "تم إعادة حساب الترتيب ومسارات التأهل."), type: "success" });
          Router.render();
        });
      });
    };
    return page;
  };

  /* ====================================================================== */
  /* Tournaments                                                           */
  /* ====================================================================== */
  AdminPages.tournaments = function () {
    const cup = Store.db.cup;
    const sup = Store.db.superCup;
    const table = Store.table();
    const champion = pl(cup.champion);
    const runnerUp = pl(cup.runnerUp);
    const a = pl(sup.participantA);
    const b = pl(sup.participantB);

    const content = `
      <div class="page-head" style="margin-bottom:20px">
        <div>
          <div class="breadcrumbs"><a href="#/admin">${U.esc(U.t("Admin", "الإدارة"))}</a><span class="sep">/</span><span>${U.esc(U.t("Tournaments", "البطولات"))}</span></div>
          <h1>${U.esc(U.t("Tournaments", "البطولات"))}</h1>
          <p>${U.esc(U.t("Brackets, seeds and the qualification chain for the season.", "الشجرة والبذور وسلسلة التأهل للموسم."))}</p>
        </div>
        <button class="btn btn-secondary" data-recompute>${U.icon("refresh")}${U.esc(U.t("Recompute", "إعادة الحساب"))}</button>
      </div>

      <div class="admin-stats">
        ${Comp.stat({ icon: "chart", label: U.t("League leader", "متصدر الدوري"), value: U.esc(pname(table[0].id).split(" ")[0]), foot: table[0].points + " " + U.t("pts", "نقطة") })}
        ${Comp.stat({ icon: "medal", label: U.t("Cup champion", "بطل الكأس"), value: U.esc(pname(cup.champion).split(" ")[0]), foot: U.esc(U.t("Runner-up", "الوصيف")) + ": " + U.esc(pname(cup.runnerUp)) })}
        ${Comp.stat({ icon: "crown", label: U.t("Super final", "نهائي السوبر"), value: U.esc(U.dateShort(sup.date)), foot: U.esc(U.t("Scheduled", "مجدول")) })}
        ${Comp.stat({ icon: "flag", label: U.t("Cup seeds", "بذور الكأس"), value: cup.seeds.length, foot: U.esc(U.t("From Round 1", "من الجولة الأولى")) })}
      </div>

      <div class="grid-2" style="margin-top:var(--s-5)">
        <div class="panel">
          ${Comp.panelHead(U.t("كأس اللمة bracket", "شجرة كأس اللمة"), U.t("Semi-finals and final results", "نتائج نصف النهائي والنهائي"))}
          <div class="panel-body">
            ${cup.semifinals
              .map(
                (m, i) =>
                  '<div class="round-row" style="padding-block:8px"><span>' + U.esc(U.t("Semi-final " + (i + 1), "نصف النهائي " + (i + 1))) + "</span>" +
                  "<strong>" + U.esc(pname(m.a)) + " " + m.scoreA + " – " + m.scoreB + " " + U.esc(pname(m.b)) + "</strong></div>"
              )
              .join("")}
            <div class="round-row" style="padding-block:8px"><span>${U.esc(U.t("Final", "النهائي"))}</span>
              <strong>${U.esc(pname(cup.final.a))} ${cup.final.scoreA} – ${cup.final.scoreB} ${U.esc(pname(cup.final.b))}${cup.final.pens ? " (" + cup.final.pens.join("–") + ")" : ""}</strong></div>
            <div class="champion-banner" style="margin-top:12px">${U.icon("crown")}<div><strong>${U.esc(I18n.pick(champion.name))}</strong><span>${U.esc(U.t("Cup champion", "بطل الكأس"))}</span></div></div>
            <div class="round-row" style="padding-block:8px"><span>${U.esc(U.t("Runner-up", "الوصيف"))}</span><strong>${U.esc(I18n.pick(runnerUp.name))}</strong></div>
          </div>
        </div>

        <div class="panel">
          ${Comp.panelHead(U.t("سوبر النخبة", "سوبر النخبة"), U.t("League champion vs cup champion", "بطل الدوري ضد بطل الكأس"))}
          <div class="panel-body">
            <div class="round-row"><span>${U.esc(U.t("Participant A", "المشارك الأول"))}</span><strong class="row gap-2">${pavatar(a.id, "avatar-xs")}${U.esc(I18n.pick(a.name))}</strong></div>
            <div class="round-row"><span>${U.esc(U.t("Participant B", "المشارك الثاني"))}</span><strong class="row gap-2">${pavatar(b.id, "avatar-xs")}${U.esc(I18n.pick(b.name))}</strong></div>
            <div class="round-row"><span>${U.esc(U.t("Kick-off", "الانطلاق"))}</span><strong>${U.esc(U.dateShort(sup.date))}</strong></div>
            <div class="rule" style="margin-top:12px"><span class="n">i</span><span>${U.esc(I18n.pick(sup.note))}</span></div>
            <p class="xs muted" style="margin-top:10px">${U.esc(U.t("If the same player wins both titles, the cup runner-up takes the second spot automatically.", "إذا فاز نفس اللاعب باللقبين، يتأهل وصيف الكأس تلقائيًا للمركز الثاني."))}</p>
          </div>
        </div>
      </div>

      <div class="panel" style="margin-top:var(--s-5)">
        ${Comp.panelHead(U.t("Qualification chain", "سلسلة التأهل"), U.t("How the three competitions connect", "كيف ترتبط البطولات الثلاث"))}
        <div class="panel-body">
          <div class="rules-list">
            <div class="rule"><span class="n">1</span><span>${U.esc(U.t("Top four from Round 1 of الدوري العام enter كأس اللمة.", "أفضل أربعة من الجولة الأولى للدوري العام يدخلون كأس اللمة."))}</span></div>
            <div class="rule"><span class="n">2</span><span>${U.esc(U.t("The league champion qualifies for سوبر النخبة as participant A.", "بطل الدوري يتأهل لسوبر النخبة كالمشارك الأول."))}</span></div>
            <div class="rule"><span class="n">3</span><span>${U.esc(U.t("The كأس اللمة champion qualifies as participant B; the cup runner-up replaces them if they also won the league.", "بطل كأس اللمة يتأهل كالمشارك الثاني، ويحل الوصيف محله إذا فاز بالدوري أيضًا."))}</span></div>
          </div>
        </div>
      </div>
    `;

    const page = adminPage("atournaments", U.t("Tournaments", "البطولات"), U.t("Admin console", "لوحة الإدارة"), content);
    page.mount = function (root) {
      const btn = root.querySelector("[data-recompute]");
      if (btn) {
        btn.addEventListener("click", function () {
          Store.refreshDerived();
          UI.toast({ title: U.t("Brackets recalculated", "تم إعادة حساب البطولات"), msg: U.t("Cup seeds and the Super matchup are up to date.", "بذور الكأس ومباراة السوبر محدّثة."), type: "success" });
          Router.render();
        });
      }
    };
    return page;
  };

  /* ====================================================================== */
  /* Notifications                                                         */
  /* ====================================================================== */
  function notificationModal() {
    const icons = ["bell", "trophy", "ball", "sword", "sparkles", "calendar", "flame"];
    const body = `
      <form id="notif-form" class="stack gap-4">
        <div class="grid-2">
          ${field(U.t("Title (English)", "العنوان (إنجليزي)"), '<input class="input" name="titleEn" placeholder="' + U.esc(U.t("Matchday reminder", "تذكير بالجولة")) + '">')}
          ${field(U.t("Title (Arabic)", "العنوان (عربي)"), '<input class="input" name="titleAr" dir="rtl" placeholder="تذكير بالجولة">')}
        </div>
        ${field(U.t("Body (English)", "النص (إنجليزي)"), '<textarea class="textarea" name="bodyEn" rows="2" placeholder="' + U.esc(U.t("Round 2 starts this week…", "تبدأ الجولة الثانية هذا الأسبوع…")) + '"></textarea>')}
        ${field(U.t("Body (Arabic)", "النص (عربي)"), '<textarea class="textarea" name="bodyAr" rows="2" dir="rtl" placeholder="تبدأ الجولة الثانية هذا الأسبوع…"></textarea>')}
        ${field(
          U.t("Icon", "الأيقونة"),
          '<select class="select" name="icon">' + icons.map((i) => '<option value="' + i + '">' + i + "</option>").join("") + "</select>"
        )}
      </form>
    `;
    return UI.openModal({
      title: U.t("New notification", "إشعار جديد"),
      subtitle: U.esc(U.t("Broadcast to every player's notification tray.", "أرسل إلى صندوق إشعارات كل لاعب.")),
      body: body,
      footer:
        '<button class="btn btn-secondary" data-cancel>' + U.esc(U.t("Cancel", "إلغاء")) + "</button>" +
        '<button class="btn btn-primary" data-send>' + U.icon("bell") + U.esc(U.t("Send", "إرسال")) + "</button>",
      onMount: function (root, close) {
        root.querySelector("[data-cancel]").addEventListener("click", close);
        root.querySelector("[data-send]").addEventListener("click", function () {
          const data = new FormData(root.querySelector("#notif-form"));
          const titleEn = String(data.get("titleEn") || "").trim();
          if (!titleEn) {
            UI.toast({ title: U.t("A title is required", "العنوان مطلوب"), type: "error" });
            return;
          }
          Store.addNotification({
            titleEn: titleEn,
            titleAr: String(data.get("titleAr") || "").trim() || titleEn,
            bodyEn: String(data.get("bodyEn") || "").trim(),
            bodyAr: String(data.get("bodyAr") || "").trim() || String(data.get("bodyEn") || "").trim(),
            icon: String(data.get("icon")),
          });
          close();
          UI.toast({ title: U.t("Notification sent", "تم إرسال الإشعار"), type: "success" });
          Router.render();
        });
      },
    });
  }

  AdminPages.notifications = function () {
    const list = Store.db.notifications;

    const content = `
      <div class="page-head" style="margin-bottom:20px">
        <div>
          <div class="breadcrumbs"><a href="#/admin">${U.esc(U.t("Admin", "الإدارة"))}</a><span class="sep">/</span><span>${U.esc(U.t("Notifications", "الإشعارات"))}</span></div>
          <h1>${U.esc(U.t("Notifications", "الإشعارات"))}</h1>
          <p>${U.esc(U.t("Announce new competitions, matchdays and platform updates.", "أعلن عن بطولات وجولات وتحديثات جديدة."))}</p>
        </div>
        <div class="row gap-2">
          <button class="btn btn-secondary" data-mark-read>${U.icon("check")}${U.esc(U.t("Mark all read", "تحديد الكل كمقروء"))}</button>
          <button class="btn btn-primary" data-new-notif>${U.icon("plus")}${U.esc(U.t("New notification", "إشعار جديد"))}</button>
        </div>
      </div>

      <div class="panel">
        ${Comp.panelHead(U.t("Sent notifications", "الإشعارات المرسلة"), U.t("Visible in the topbar tray for every player", "تظهر في شريط الإشعارات لكل لاعب"))}
        <div class="panel-body" style="padding-top:6px;padding-bottom:6px">
          ${list
            .map(
              (n) =>
                '<div class="notif is-unread" style="border-radius:12px;border:1px solid var(--line);margin-bottom:8px">' +
                '<span class="notif-icon">' + U.icon(n.icon) + "</span>" +
                '<div class="grow"><p class="strong">' + U.esc(I18n.pick(n.title)) + "</p>" +
                '<p class="muted">' + U.esc(I18n.pick(n.body)) + "</p>" +
                "<time>" + U.relTime(n.time) + " · " + (n.unread ? U.esc(U.t("Unread", "غير مقروء")) : U.esc(U.t("Read", "مقروء"))) + "</time></div>" +
                '<button class="icon-btn" data-del-notif="' + n.id + '" aria-label="' + U.esc(U.t("Delete notification", "حذف الإشعار")) + '">' + U.icon("trash") + "</button>" +
                "</div>"
            )
            .join("") || Comp.empty("bell", U.t("No notifications", "لا إشعارات"), U.t("Create one to reach every player.", "أنشئ إشعارًا للوصول إلى كل اللاعبين."))}
        </div>
      </div>

      <div class="panel" style="margin-top:var(--s-5)">
        ${Comp.panelHead(U.t("Delivery tips", "نصائح الإرسال"), "")}
        <div class="panel-body">
          <div class="rules-list">
            <div class="rule"><span class="n">1</span><span>${U.esc(U.t("Keep titles under 60 characters so they fit the notification tray.", "أبقِ العناوين أقل من 60 حرفًا لتناسب شريط الإشعارات."))}</span></div>
            <div class="rule"><span class="n">2</span><span>${U.esc(U.t("Include the matchday or date in the body when announcing fixtures.", "أضف الجولة أو التاريخ في النص عند الإعلان عن المباريات."))}</span></div>
            <div class="rule"><span class="n">3</span><span>${U.esc(U.t("Arabic and English are both required for a bilingual feed.", "العربية والإنجليزية مطلوبتان لخلاصة ثنائية اللغة."))}</span></div>
          </div>
        </div>
      </div>
    `;

    const page = adminPage("anotifications", U.t("Notifications", "الإشعارات"), U.t("Admin console", "لوحة الإدارة"), content);
    page.mount = function (root) {
      root.querySelector("[data-new-notif]").addEventListener("click", notificationModal);
      root.querySelector("[data-mark-read]").addEventListener("click", function () {
        Store.markAllRead();
        UI.toast({ title: U.t("All notifications marked read", "تم تحديد كل الإشعارات كمقروءة"), type: "success" });
        Router.render();
      });
      root.querySelectorAll("[data-del-notif]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const id = btn.getAttribute("data-del-notif");
          UI.confirm({
            title: U.t("Delete notification?", "حذف الإشعار؟"),
            message: U.t("It will disappear from every player's tray.", "سيختفي من شريط كل لاعب."),
            confirm: U.t("Delete", "حذف"),
            danger: true,
          }).then(function (ok) {
            if (!ok) return;
            Store.removeNotification(id);
            UI.toast({ title: U.t("Notification deleted", "تم حذف الإشعار"), type: "success" });
            Router.render();
          });
        });
      });
    };
    return page;
  };

  /* ====================================================================== */
  /* Settings                                                              */
  /* ====================================================================== */
  AdminPages.settings = function () {
    const s = Store.db.settings;
    const rows = [
      { key: "sound", icon: "volume", title: U.t("Sound effects", "المؤثرات الصوتية"), desc: U.t("Match sounds and answer feedback", "أصوات المباراة وتغذية الإجابات") },
      { key: "notifications", icon: "bell", title: U.t("Push notifications", "الإشعارات الفورية"), desc: U.t("Challenges, results and matchday reminders", "التحديات والنتائج وتذكيرات الجولات") },
      { key: "reduceMotion", icon: "bolt", title: U.t("Reduce motion", "تقليل الحركة"), desc: U.t("Disable confetti and large transitions", "إيقاف القصاصات والانتقالات الكبيرة") },
      { key: "showOnline", icon: "users-round", title: U.t("Show online status", "إظهار حالة الاتصال"), desc: U.t("Let friends see when players are online", "السماح للأصدقاء برؤية حالة الاتصال") },
      { key: "publicProfile", icon: "user", title: U.t("Public profiles", "ملفات عامة"), desc: U.t("Profiles are visible on leaderboards", "الملفات ظاهرة في لوحات المتصدرين") },
    ];

    const content = `
      <div class="page-head" style="margin-bottom:20px">
        <div>
          <div class="breadcrumbs"><a href="#/admin">${U.esc(U.t("Admin", "الإدارة"))}</a><span class="sep">/</span><span>${U.esc(U.t("Settings", "الإعدادات"))}</span></div>
          <h1>${U.esc(U.t("Platform settings", "إعدادات المنصة"))}</h1>
          <p>${U.esc(U.t("Defaults stored in the demo workspace. Connect the API to persist globally.", "القيم الافتراضية محفوظة في المساحة التجريبية. اربط الـAPI لحفظها عالميًا."))}</p>
        </div>
        <span class="badge badge-purple">${U.icon("shield")}${U.esc(U.t("Admin only", "للمشرفين فقط"))}</span>
      </div>

      <div class="settings-grid">
        <div class="stack gap-4">
          <div class="panel">
            ${Comp.panelHead(U.t("Experience defaults", "افتراضيات التجربة"), U.t("Applied to this browser workspace", "تُطبق على مساحة هذا المتصفح"))}
            <div class="panel-body">
              ${rows
                .map(
                  (r) =>
                    '<div class="setting-row"><span class="setting-ic">' + U.icon(r.icon) + "</span>" +
                    '<div class="grow"><strong>' + U.esc(r.title) + '</strong><p class="xs muted">' + U.esc(r.desc) + "</p></div>" +
                    '<button class="switch" role="switch" aria-checked="' + !!s[r.key] + '" aria-label="' + U.esc(r.title) + '" data-setting="' + r.key + '"></button></div>'
                )
                .join("")}
            </div>
          </div>

          <div class="panel">
            ${Comp.panelHead(U.t("Default language", "اللغة الافتراضية"), U.t("Used when a visitor has no saved preference", "تُستخدم عند عدم وجود تفضيل محفوظ"))}
            <div class="panel-body">
              <div class="segmented" role="tablist" aria-label="${U.esc(U.t("Default language", "اللغة الافتراضية"))}">
                <button class="${I18n.lang === "en" ? "is-active" : ""}" data-lang="en" role="tab" aria-selected="${I18n.lang === "en"}">English</button>
                <button class="${I18n.lang === "ar" ? "is-active" : ""}" data-lang="ar" role="tab" aria-selected="${I18n.lang === "ar"}">العربية</button>
              </div>
              <p class="xs muted" style="margin-top:12px">${U.esc(U.t("Both languages ship with full RTL support. Switching here updates the whole console.", "اللغتان تدعمان RTL بالكامل. التبديل هنا يحدّث اللوحة بالكامل."))}</p>
            </div>
          </div>

          <div class="panel">
            ${Comp.panelHead(U.t("Danger zone", "منطقة الخطر"), U.t("Irreversible demo actions", "إجراءات تجريبية لا يمكن التراجع عنها"))}
            <div class="panel-body stack gap-3">
              <div class="row between wrap gap-3"><div><strong class="small">${U.esc(U.t("Reset demo data", "إعادة تعيين البيانات"))}</strong><p class="xs muted">${U.esc(U.t("Restores the original season, questions and matches.", "يعيد الموسم والأسئلة والمباريات الأصلية."))}</p></div>
                <button class="btn btn-danger btn-sm" data-reset-data>${U.icon("refresh")}${U.esc(U.t("Reset", "إعادة تعيين"))}</button></div>
              <div class="row between wrap gap-3"><div><strong class="small">${U.esc(U.t("Reset settings", "إعادة ضبط الإعدادات"))}</strong><p class="xs muted">${U.esc(U.t("Returns switches to their defaults.", "يعيد المفاتيح إلى قيمها الافتراضية."))}</p></div>
                <button class="btn btn-secondary btn-sm" data-reset-settings>${U.icon("settings")}${U.esc(U.t("Reset", "إعادة ضبط"))}</button></div>
            </div>
          </div>
        </div>

        <div class="stack gap-4">
          <div class="panel">
            ${Comp.panelHead(U.t("Integration status", "حالة الربط"), "")}
            <div class="panel-body">
              <div class="round-row"><span>${U.esc(U.t("REST API", "REST API"))}</span><span class="badge">${U.esc(U.t("Not connected", "غير متصل"))}</span></div>
              <div class="round-row"><span>${U.esc(U.t("Realtime match server", "خادم المباريات"))}</span><span class="badge">${U.esc(U.t("Not connected", "غير متصل"))}</span></div>
              <div class="round-row"><span>${U.esc(U.t("Media CDN", "CDN الوسائط"))}</span><span class="badge">${U.esc(U.t("Not connected", "غير متصل"))}</span></div>
              <p class="xs muted" style="margin-top:10px">${U.esc(U.t("The UI reads and writes through the Store adapter. Swap its methods for real endpoints without touching the pages.", "تقرأ الواجهة وتكتب عبر محول Store. استبدل طرقه بنقاط نهاية حقيقية دون تعديل الصفحات."))}</p>
            </div>
          </div>

          <div class="panel">
            ${Comp.panelHead(U.t("Workspace", "المساحة"), "")}
            <div class="panel-body">
              <div class="round-row"><span>${U.esc(U.t("Players", "اللاعبون"))}</span><strong>${Store.db.players.length + Store.db.mo.rivals.length + 1}</strong></div>
              <div class="round-row"><span>${U.esc(U.t("Questions", "الأسئلة"))}</span><strong>${Store.db.questions.length}</strong></div>
              <div class="round-row"><span>${U.esc(U.t("League matches", "مباريات الدوري"))}</span><strong>${Store.db.league.matchdays.reduce((n, md) => n + md.matches.length, 0)}</strong></div>
              <div class="round-row"><span>${U.esc(U.t("Mo matches played", "مباريات مو"))}</span><strong>${Store.db.mo.stats.matches}</strong></div>
              <div class="round-row"><span>${U.esc(U.t("Storage key", "مفتاح التخزين"))}</span><strong class="xs">moarena.db.v3</strong></div>
            </div>
          </div>

          <div class="panel">
            ${Comp.panelHead(U.t("Help", "مساعدة"), "")}
            <div class="panel-body">
              <div class="rules-list">
                <div class="rule"><span class="n">?</span><span>${U.esc(U.t("Editing results recalculates every standings view instantly.", "تعديل النتائج يعيد حساب كل جداول الترتيب فورًا."))}</span></div>
                <div class="rule"><span class="n">?</span><span>${U.esc(U.t("Deleting all questions restores the default pool to avoid an empty match.", "حذف كل الأسئلة يعيد المجموعة الافتراضية لتجنب مباراة فارغة."))}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const page = adminPage("asettings", U.t("Platform settings", "إعدادات المنصة"), U.t("Admin console", "لوحة الإدارة"), content);
    page.mount = function (root) {
      root.querySelectorAll("[data-setting]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const key = btn.getAttribute("data-setting");
          const next = btn.getAttribute("aria-checked") !== "true";
          Store.setSetting(key, next);
          btn.setAttribute("aria-checked", String(next));
          UI.toast({ title: next ? U.t("Enabled", "تم التفعيل") : U.t("Disabled", "تم الإيقاف"), type: "success" });
        });
      });
      root.querySelectorAll("[data-lang]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          I18n.set(btn.getAttribute("data-lang"));
        });
      });
      const resetData = root.querySelector("[data-reset-data]");
      if (resetData) {
        resetData.addEventListener("click", function () {
          UI.confirm({
            title: U.t("Reset demo data?", "إعادة تعيين البيانات؟"),
            message: U.t("This restores the original season, questions and matches. It cannot be undone.", "سيعيد الموسم والأسئلة والمباريات الأصلية. لا يمكن التراجع."),
            confirm: U.t("Reset", "إعادة تعيين"),
            danger: true,
          }).then(function (ok) {
            if (!ok) return;
            Store.reset();
            Router.render();
            UI.toast({ title: U.t("Demo data restored", "تم استعادة البيانات"), type: "success" });
          });
        });
      }
      const resetSettings = root.querySelector("[data-reset-settings]");
      if (resetSettings) {
        resetSettings.addEventListener("click", function () {
          Store.resetSettings();
          Router.render();
          UI.toast({ title: U.t("Settings reset", "تم ضبط الإعدادات"), type: "success" });
        });
      }
    };
    return page;
  };

  global.AdminPages = AdminPages;
})(window);
