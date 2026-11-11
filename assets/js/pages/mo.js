/* ==========================================================================
   Mo Games — dashboard, play, live match engine, leaderboard, friends,
   profile and settings.
   ========================================================================== */
(function (global) {
  "use strict";

  const MoPages = {
    _timers: [],
    _settings: { mode: "quick", game: "quiz", difficulty: "mixed", count: 8 },

    _cleanup: function () {
      this._timers.forEach((t) => {
        clearTimeout(t);
        clearInterval(t);
      });
      this._timers = [];
    },

    _later: function (fn, ms) {
      const t = setTimeout(fn, ms);
      this._timers.push(t);
      return t;
    },

    _every: function (fn, ms) {
      const t = setInterval(fn, ms);
      this._timers.push(t);
      return t;
    },
  };

  window.addEventListener("hashchange", function () {
    MoPages._cleanup();
  });

  /* ====================================================================== */
  /* Shared bits                                                           */
  /* ====================================================================== */
  const MODES = () => [
    {
      id: "quick",
      icon: "bolt",
      tone: "",
      title: U.t("Quick Match", "مباراة سريعة"),
      desc: U.t("Find an available opponent automatically and jump straight into a ranked duel.", "اعثر على منافس متاح تلقائيًا وابدأ مبارزة مصنّفة فورًا."),
      meta: U.t("~20 sec wait", "انتظار ~20 ثانية"),
    },
    {
      id: "friend",
      icon: "users",
      tone: "cyan",
      title: U.t("Challenge a Friend", "تحدَّ صديقًا"),
      desc: U.t("Pick a friend, send a direct challenge and play when they accept.", "اختر صديقًا وأرسل له تحديًا مباشرًا والعب عند قبوله."),
      meta: U.t("Direct invite", "دعوة مباشرة"),
    },
    {
      id: "room",
      icon: "lock",
      tone: "green",
      title: U.t("Private Room", "غرفة خاصة"),
      desc: U.t("Create a private room with a code or invitation link for your group.", "أنشئ غرفة خاصة بكود أو رابط دعوة لمجموعتك."),
      meta: U.t("Code or link", "كود أو رابط"),
    },
    {
      id: "custom",
      icon: "settings",
      tone: "gold",
      title: U.t("Custom Game", "مباراة مخصصة"),
      desc: U.t("Choose category, difficulty and match length before you play.", "اختر الفئة والصعوبة وطول المباراة قبل اللعب."),
      meta: U.t("Your rules", "قواعدك"),
    },
  ];

  function modeCard(m, active, opts) {
    opts = opts || {};
    return `<button class="mode-card ${m.tone} ${active ? "is-active" : ""}" data-mode="${m.id}" ${opts.compact ? "" : 'type="button"'}>
      <span class="mode-icon">${U.icon(m.icon)}</span>
      <h3>${U.esc(m.title)}</h3>
      <p>${U.esc(m.desc)}</p>
      <span class="mode-foot"><span>${U.esc(m.meta)}</span>${U.icon("arrow")}</span>
    </button>`;
  }

  function meName() {
    return I18n.pick(Store.db.mo.me.name);
  }

  function gameName(id) {
    const g = Store.db.mo.games.find((x) => x.id === id);
    return g ? I18n.pick(g.name) : "Football Quiz";
  }

  /* ====================================================================== */
  /* Dashboard                                                             */
  /* ====================================================================== */
  MoPages.home = function () {
    const mo = Store.db.mo;
    const stats = mo.stats;
    const lvl = Store.meLevel();
    const winRate = Store.winRate(stats.wins, stats.losses);
    const challenges = Store.challenges();
    const online = mo.rivals.filter((r) => r.online !== "offline").slice(0, 6);
    const recent = mo.matches.slice(0, 5);
    const myRank = Store.leaderboard("xp").find((r) => r.isMe);
    const hour = new Date().getHours();
    const greeting =
      hour < 12 ? U.t("Good morning", "صباح الخير") : hour < 18 ? U.t("Good afternoon", "مساء الخير") : U.t("Good evening", "مساء الخير");

    const content = `
      <div class="page-head" style="margin-bottom:20px">
        <div>
          <div class="breadcrumbs"><a href="#/">${U.esc(U.t("Arena", "الأرينا"))}</a><span class="sep">/</span><span>Mo Games</span></div>
          <h1>${U.esc(greeting)}, ${U.esc(meName().split(" ")[0])}</h1>
          <p>${U.esc(U.t("Your next ranked match is waiting. Keep the streak alive.", "مباراتك المصنّفة القادمة تنتظرك. حافظ على سلسلة الانتصارات."))}</p>
        </div>
        <div class="row gap-2">
          <span class="badge badge-green">${U.icon("shield")}${U.esc(U.t("Season 04", "الموسم 04"))}</span>
          <span class="badge badge-purple">${U.icon("flame")}${U.esc(U.t("Ranked", "مصنّف"))}</span>
        </div>
      </div>

      <section class="dash-hero">
        <div>
          <span class="eyebrow">${U.icon("sparkles")}${U.esc(U.t("Welcome back to the arena", "مرحبًا بعودتك إلى الأرينا"))}</span>
          <h1 style="margin-top:8px">${U.esc(U.t("You're on a ", "أنت في سلسلة "))}<span class="gradient-text">${stats.streak}-${U.esc(U.t("win streak", "انتصارات"))}</span></h1>
          <p class="sub">${U.esc(U.t("Win one more ranked match to reach your season-best streak and unlock the next streak reward.", "افز بمباراة مصنّفة أخرى لتصل لأفضل سلسلة في الموسم وتفتح المكافأة التالية."))}</p>
          <div class="dash-hero-actions">
            <a class="btn btn-primary" href="#/mo/play?mode=quick">${U.icon("bolt")}${U.esc(U.t("Quick Match", "مباراة سريعة"))}</a>
            <button class="btn btn-secondary" data-action="create-room">${U.icon("lock")}${U.esc(U.t("Create Room", "غرفة خاصة"))}</button>
          </div>
        </div>
        <div class="dash-hero-side">
          <div class="level-card">
            <div class="ring" style="--p:${lvl.pct};--size:64px"><div style="text-align:center"><strong style="font-family:var(--font-display);font-size:0.98rem;display:block;line-height:1">${lvl.level}</strong><span class="xs muted">LV</span></div></div>
            <div class="level-meta">
              <div class="lv">${U.esc(U.t("Player level", "مستوى اللاعب"))} <strong>${lvl.level}</strong></div>
              <div class="xp mono">${U.n(lvl.into)} / ${U.n(lvl.span)} XP</div>
              <div class="progress thin grad" style="margin-top:8px"><span style="width:${lvl.pct}%"></span></div>
            </div>
          </div>
          <div class="season-chip"><span>${U.esc(U.t("Total XP", "إجمالي XP"))}</span><strong class="mono">${U.n(mo.xp)}</strong></div>
          <div class="season-chip"><span>${U.esc(U.t("Global rank", "الترتيب العالمي"))}</span><strong>#${myRank.rank}</strong></div>
        </div>
      </section>

      <div class="grid-4" style="margin-top:20px">
        ${Comp.stat({ icon: "sword", label: U.t("Total matches", "إجمالي المباريات"), value: U.n(stats.matches), foot: `<span class="trend-up">▲ ${U.esc(U.t("18 this week", "18 هذا الأسبوع"))}</span>` })}
        ${Comp.stat({ icon: "trophy", label: U.t("Victories", "الانتصارات"), value: U.n(stats.wins), foot: U.esc(U.t("All-time wins", "انتصارات كل الوقت")) })}
        ${Comp.stat({ icon: "target", label: U.t("Win rate", "نسبة الفوز"), value: winRate + "%", foot: `<span class="trend-up">▲ 2.4%</span> ${U.esc(U.t("vs last week", "عن الأسبوع الماضي"))}` })}
        ${Comp.stat({ icon: "flame", label: U.t("Current streak", "السلسلة الحالية"), value: stats.streak, suffix: U.t("wins", "فوز"), foot: U.esc(U.t("Best: ", "الأفضل: ")) + stats.bestStreak })}
      </div>

      <div class="dash-grid" style="margin-top:24px">
        <div>
          <div class="section-label"><h2>${U.esc(U.t("Play", "العب"))}</h2><a class="link-arrow" href="#/mo/play">${U.esc(U.t("All modes", "كل الأنماط"))}${U.icon("arrow")}</a></div>
          <div class="mode-grid">${MODES().map((m) => modeCard(m, false)).join("")}</div>

          <div class="card panel" style="margin-top:24px">
            ${Comp.panelHead(U.t("Recent matches", "أحدث المباريات"), U.t("Your last 5 ranked results", "آخر 5 نتائج مصنّفة"), `<a class="link-arrow" href="#/mo/profile">${U.esc(U.t("Full history", "السجل الكامل"))}${U.icon("arrow")}</a>`)}
            <div>${recent.map(Comp.moMatchRow).join("")}</div>
          </div>
        </div>

        <aside class="stack gap-4">
          <div class="card panel">
            ${Comp.panelHead(U.t("Active challenges", "التحديات النشطة"), `${challenges.length} ${U.t("waiting", "بانتظار ردك")}`)}
            <div class="panel-body" style="padding-top:4px;padding-bottom:6px">
              ${challenges.length ? challenges.map((c) => `
                <div class="challenge-item">
                  ${U.avatarWithStatus(I18n.pick(c.player.name), "online", { size: "avatar-sm", hue: c.player.hue })}
                  <div class="meta"><strong>${U.esc(I18n.pick(c.player.name))}</strong><span>${U.esc(gameName(c.game))} · ${U.esc(U.t("expires soon", "ينتهي قريبًا"))}</span></div>
                  <div class="actions">
                    <button class="icon-btn decline-btn" data-decline="${c.id}" aria-label="${U.esc(U.t("Decline", "رفض"))}" title="${U.esc(U.t("Decline", "رفض"))}">${U.icon("x")}</button>
                    <button class="icon-btn accept-btn" data-accept="${c.id}" aria-label="${U.esc(U.t("Accept", "قبول"))}" title="${U.esc(U.t("Accept", "قبول"))}">${U.icon("check")}</button>
                  </div>
                </div>`).join("") : Comp.empty("sword", U.t("No pending challenges", "لا تحديات معلقة"), U.t("Challenges you receive will appear here.", "التحديات التي تصلك ستظهر هنا."))}
            </div>
          </div>

          <div class="card panel">
            ${Comp.panelHead(U.t("Friends online", "الأصدقاء المتصلون"), `${online.length} ${U.t("available", "متاح")}`, `<a class="link-arrow" href="#/mo/friends">${U.esc(U.t("View all", "الكل"))}</a>`)}
            <div class="panel-body" style="padding-top:10px">
              <div class="friend-rail">
                ${online.map((f) => `<button class="friend-pill" data-challenge="${f.id}">${U.avatarWithStatus(I18n.pick(f.name), f.online, { size: "avatar-xs", hue: f.hue })}${U.esc(I18n.pick(f.name).split(" ")[0])}</button>`).join("")}
              </div>
              <div class="xs muted" style="margin-top:10px">${U.esc(U.t("Tap a friend to send a direct challenge.", "اضغط على صديق لإرسال تحدٍ مباشر."))}</div>
            </div>
          </div>

          <div class="rank-card">
            <div class="eyebrow" style="justify-content:center;margin-bottom:6px">${U.icon("crown")}${U.esc(U.t("Global ranking", "الترتيب العالمي"))}</div>
            <div class="rank-num">#${myRank.rank}</div>
            <div class="rank-label">${U.esc(U.t("of 128,400 players", "من 128,400 لاعب"))}</div>
            <div class="rank-move"><span class="badge badge-green">${U.icon("arrow")}${U.esc(U.t("Up 3 places", "تقدمت 3 مراكز"))}</span></div>
            <a class="btn btn-secondary btn-sm btn-block" href="#/mo/leaderboard" style="margin-top:14px">${U.esc(U.t("View leaderboard", "لوحة المتصدرين"))}</a>
          </div>
        </aside>
      </div>`;

    return {
      title: U.t("Dashboard", "لوحة التحكم"),
      html: Shell.app({ platform: "mo", active: "mo", title: U.t("Mo Games", "مو جيمز"), crumb: U.t("Dashboard", "لوحة التحكم"), content: content }),
      mount: function (root) {
        root.querySelectorAll("[data-mode]").forEach((el) => {
          el.addEventListener("click", () => Router.go("#/mo/play?mode=" + el.getAttribute("data-mode")));
        });
        root.querySelectorAll("[data-accept]").forEach((el) => {
          el.addEventListener("click", () => {
            const c = Store.db.mo.challenges.find((x) => x.id === el.getAttribute("data-accept"));
            if (c) {
              c.status = "accepted";
              Store.save();
              Router.go(`#/mo/match?mode=friend&opp=${c.from}&game=${c.game}`);
            }
          });
        });
        root.querySelectorAll("[data-decline]").forEach((el) => {
          el.addEventListener("click", () => {
            Store.declineChallenge(el.getAttribute("data-decline"));
            UI.toast({ title: U.t("Challenge declined", "تم رفض التحدي"), type: "info" });
            Router.render();
          });
        });
        root.querySelectorAll("[data-challenge]").forEach((el) => {
          el.addEventListener("click", () => {
            const id = el.getAttribute("data-challenge");
            Store.addChallenge(id, "friend", "quiz");
            UI.toast({ title: U.t("Challenge sent", "تم إرسال التحدي"), msg: U.t("Waiting for the player to accept.", "بانتظار قبول اللاعب."), type: "success" });
            Router.render();
          });
        });
        const create = root.querySelector('[data-action="create-room"]');
        if (create) create.addEventListener("click", () => openRoomModal());
      },
    };
  };

  /* ====================================================================== */
  /* Play                                                                  */
  /* ====================================================================== */
  MoPages.play = function (query) {
    const s = MoPages._settings;
    if (query.mode && ["quick", "friend", "room", "custom"].includes(query.mode)) s.mode = query.mode;
    const modes = MODES();
    const friends = Store.db.friends.map((f) => ({ ...f, player: Store.moPlayer(f.id) })).filter((f) => f.player);
    const online = friends.filter((f) => f.online !== "offline");
    const activeMode = modes.find((m) => m.id === s.mode) || modes[0];
    const labelMap = {
      quick: U.t("Find opponent", "ابحث عن منافس"),
      friend: U.t("Challenge a friend", "تحدَّ صديقًا"),
      room: U.t("Create room", "أنشئ غرفة"),
      custom: U.t("Start custom match", "ابدأ مباراة مخصصة"),
    };

    const content = `
      <div class="page-head">
        <div>
          <div class="breadcrumbs"><a href="#/mo">Mo Games</a><span class="sep">/</span><span>${U.esc(U.t("Play", "العب"))}</span></div>
          <h1>${U.esc(U.t("Play Now", "العب الآن"))}</h1>
          <p>${U.esc(U.t("Pick a mode, tune your match, and get into a live 1v1 duel in seconds.", "اختر النمط واضبط مباراتك وابدأ مبارزة 1 ضد 1 في ثوانٍ."))}</p>
        </div>
        <div class="row gap-2">
          <span class="badge badge-cyan">${U.icon("users")}${U.n(friends.filter((f) => f.online !== "offline").length)} ${U.esc(U.t("online now", "متصل الآن"))}</span>
          <span class="badge badge-green">${U.icon("shield")}${U.esc(U.t("Ranked", "مصنّف"))}</span>
        </div>
      </div>

      <div class="play-grid">
        <div>
          <div class="play-mode">${modes.map((m) => modeCard(m, m.id === s.mode)).join("")}</div>

          <div class="card panel" style="margin-top:20px">
            ${Comp.panelHead(U.t("Match settings", "إعدادات المباراة"), U.t("Applies to quick and custom games", "تُطبق على المباريات السريعة والمخصصة"))}
            <div class="panel-body stack gap-5">
              <div>
                <div class="field"><label>${U.esc(U.t("Game category", "فئة اللعبة"))}</label></div>
                <div class="option-row" style="margin-top:8px">
                  ${Store.db.mo.games.map((g) => `<button class="chip ${g.id === s.game ? "is-active" : ""}" data-game="${g.id}">${U.icon(g.icon)}${U.esc(I18n.pick(g.name))}</button>`).join("")}
                </div>
              </div>
              <div class="form-row">
                <div class="field">
                  <label for="difficulty">${U.esc(U.t("Difficulty", "الصعوبة"))}</label>
                  <select class="select" id="difficulty">
                    <option value="mixed" ${s.difficulty === "mixed" ? "selected" : ""}>${U.esc(U.t("Mixed (recommended)", "مختلط (موصى به)"))}</option>
                    <option value="easy" ${s.difficulty === "easy" ? "selected" : ""}>${U.esc(U.t("Easy", "سهل"))}</option>
                    <option value="medium" ${s.difficulty === "medium" ? "selected" : ""}>${U.esc(U.t("Medium", "متوسط"))}</option>
                    <option value="hard" ${s.difficulty === "hard" ? "selected" : ""}>${U.esc(U.t("Hard", "صعب"))}</option>
                  </select>
                </div>
                <div class="field">
                  <label>${U.esc(U.t("Questions", "عدد الأسئلة"))}</label>
                  <div class="segmented" id="count-seg" style="height:42px">
                    ${[5, 8, 10].map((n) => `<button type="button" data-count="${n}" class="${s.count === n ? "is-active" : ""}">${n}</button>`).join("")}
                  </div>
                </div>
              </div>
              <div class="surface" style="padding:12px 14px;display:flex;gap:10px;align-items:flex-start">
                ${U.icon("info")}
                <p class="xs muted">${U.esc(U.t("Answers are scored live. Faster correct answers earn bonus XP, and the highest score wins the duel.", "تُحسب الإجابات مباشرة. الإجابات الأسرع تمنح XP إضافي، وصاحب أعلى نتيجة يفوز بالمبارزة."))}</p>
              </div>
              <button class="btn btn-primary btn-lg btn-block" id="start-match">${U.icon(activeMode.icon)}<span id="start-label">${labelMap[s.mode]}</span></button>
            </div>
          </div>
        </div>

        <aside class="stack gap-4">
          <div class="card panel" id="room-panel" style="${s.mode === "room" ? "" : "display:none"}">
            ${Comp.panelHead(U.t("Room invitation", "دعوة الغرفة"))}
            <div class="panel-body stack gap-3">
              <p class="xs muted">${U.esc(U.t("Share this code with your group. Up to 8 spectators can watch, and one opponent can join.", "شارك هذا الكود مع مجموعتك. حتى 8 مشاهدين ولاعب واحد يمكنه الانضمام."))}</p>
              <div class="room-code"><code id="room-code">LM-7K4Q</code><button class="icon-btn" data-copy-room aria-label="${U.esc(U.t("Copy", "نسخ"))}">${U.icon("copy")}</button></div>
              <button class="btn btn-secondary btn-sm" data-copy-link>${U.icon("link")}${U.esc(U.t("Copy invitation link", "نسخ رابط الدعوة"))}</button>
            </div>
          </div>

          <div class="card panel">
            ${Comp.panelHead(U.t("Challenges", "التحديات"), U.t("Players waiting for you", "لاعبون بانتظارك"))}
            <div class="panel-body" style="padding-top:4px">
              ${Store.challenges().length ? Store.challenges().slice(0, 4).map((c) => `
                <div class="challenge-item">
                  ${U.avatarWithStatus(I18n.pick(c.player.name), "online", { size: "avatar-sm", hue: c.player.hue })}
                  <div class="meta"><strong>${U.esc(I18n.pick(c.player.name))}</strong><span>${U.esc(gameName(c.game))}</span></div>
                  <button class="btn btn-green btn-sm" data-challenge-accept="${c.id}">${U.esc(U.t("Play", "العب"))}</button>
                </div>`).join("") : Comp.empty("users", U.t("No challenges yet", "لا تحديات بعد"), U.t("Send one from the Friends page.", "أرسل تحديًا من صفحة الأصدقاء."))}
            </div>
          </div>

          <div class="card panel">
            ${Comp.panelHead(U.t("Friends online", "الأصدقاء المتصلون"), `${online.length} ${U.t("online", "متصل")}`)}
            <div class="panel-body" style="padding-top:4px">
              ${online.slice(0, 5).map((f) => `
                <div class="challenge-item">
                  ${U.avatarWithStatus(I18n.pick(f.player.name), f.online, { size: "avatar-sm", hue: f.player.hue })}
                  <div class="meta"><strong>${U.esc(I18n.pick(f.player.name))}</strong><span>${U.esc(I18n.pick(f.last))}</span></div>
                  <button class="btn btn-secondary btn-sm" data-invite="${f.id}">${U.esc(U.t("Invite", "دعوة"))}</button>
                </div>`).join("")}
            </div>
          </div>
        </aside>
      </div>`;

    return {
      title: U.t("Play Now", "العب الآن"),
      html: Shell.app({ platform: "mo", active: s.mode === "quick" ? "quick" : s.mode === "friend" ? "friend" : s.mode === "room" ? "room" : "play", title: U.t("Play Now", "العب الآن"), crumb: "Mo Games", content: content }),
      mount: function (root) {
        const startBtn = root.querySelector("#start-match");
        const startLabel = root.querySelector("#start-label");

        function refreshModeUI() {
          startLabel.textContent = labelMap[s.mode];
          const iconEl = startBtn.querySelector("use");
          const m = modes.find((x) => x.id === s.mode);
          if (iconEl) iconEl.setAttribute("href", "#i-" + m.icon);
          const room = root.querySelector("#room-panel");
          if (room) room.style.display = s.mode === "room" ? "" : "none";
        }

        root.querySelectorAll("[data-mode]").forEach((el) => {
          el.addEventListener("click", () => {
            s.mode = el.getAttribute("data-mode");
            root.querySelectorAll("[data-mode]").forEach((x) => x.classList.toggle("is-active", x === el));
            refreshModeUI();
          });
        });

        root.querySelectorAll("[data-game]").forEach((el) => {
          el.addEventListener("click", () => {
            s.game = el.getAttribute("data-game");
            root.querySelectorAll("[data-game]").forEach((x) => x.classList.toggle("is-active", x === el));
          });
        });

        root.querySelectorAll("[data-count]").forEach((el) => {
          el.addEventListener("click", () => {
            s.count = Number(el.getAttribute("data-count"));
            root.querySelectorAll("[data-count]").forEach((x) => x.classList.toggle("is-active", x === el));
          });
        });

        const diff = root.querySelector("#difficulty");
        if (diff) diff.addEventListener("change", () => (s.difficulty = diff.value));

        const copyRoom = root.querySelector("[data-copy-room]");
        if (copyRoom) copyRoom.addEventListener("click", () => UI.copy("LM-7K4Q"));

        const copyLink = root.querySelector("[data-copy-link]");
        if (copyLink) copyLink.addEventListener("click", () => UI.copy(location.origin + location.pathname + "#/mo/match?mode=room&room=LM-7K4Q"));

        startBtn.addEventListener("click", function () {
          if (s.mode === "quick") openMatchmaking(s);
          else if (s.mode === "friend") openFriendPicker(s);
          else if (s.mode === "room") openRoomModal(s);
          else Router.go(matchUrl(s));
        });

        root.querySelectorAll("[data-challenge-accept]").forEach((el) => {
          el.addEventListener("click", () => {
            const c = Store.db.mo.challenges.find((x) => x.id === el.getAttribute("data-challenge-accept"));
            if (c) {
              c.status = "accepted";
              Store.save();
              Router.go(`#/mo/match?mode=friend&opp=${c.from}&game=${c.game}&count=${s.count}`);
            }
          });
        });

        root.querySelectorAll("[data-invite]").forEach((el) => {
          el.addEventListener("click", () => {
            Store.addChallenge(el.getAttribute("data-invite"), "friend", s.game);
            UI.toast({ title: U.t("Invitation sent", "تم إرسال الدعوة"), msg: U.t("Your friend will get a notification.", "سيصل صديقك إشعار."), type: "success" });
          });
        });

        refreshModeUI();
      },
    };
  };

  function matchUrl(s) {
    return `#/mo/match?mode=${s.mode}&game=${s.game}&count=${s.count}&difficulty=${s.difficulty}`;
  }

  function openMatchmaking(s) {
    UI.openModal({
      title: U.t("Finding an opponent", "جاري البحث عن منافس"),
      subtitle: U.t("Matching by level and region…", "المطابقة حسب المستوى والمنطقة…"),
      size: "slim",
      body: `
        <div class="matchmaking">
          <div class="mm-avatars">
            ${U.avatar(meName(), { size: "avatar-lg", hue: Store.db.mo.me.hue, ring: true })}
            <span class="duel-vs">VS</span>
            <span class="pulse">${U.icon("search")}</span>
          </div>
          <p class="small strong">${U.esc(U.t("Scanning 1,248 players online", "نفحص 1,248 لاعبًا متصلًا"))}</p>
          <p class="xs muted" style="margin-top:4px">${U.esc(U.t("Usually takes under 20 seconds", "عادةً أقل من 20 ثانية"))}</p>
          <div class="mm-scan"></div>
        </div>`,
      footer: `<button class="btn btn-secondary" data-close>${U.esc(U.t("Cancel", "إلغاء"))}</button>`,
      onMount: function (root, close) {
        const t = setTimeout(() => {
          close();
          Router.go(`#/mo/match?mode=quick&game=${s.game}&count=${s.count}&difficulty=${s.difficulty}&opp=r2`);
        }, 2100);
        root.querySelector("[data-close]").addEventListener("click", () => clearTimeout(t));
      },
    });
  }

  function openFriendPicker(s) {
    const friends = Store.db.friends
      .map((f) => ({ ...f, player: Store.moPlayer(f.id) }))
      .filter((f) => f.player && f.online !== "offline");
    UI.openModal({
      title: U.t("Challenge a friend", "تحدَّ صديقًا"),
      subtitle: U.t("Choose who to challenge — they get 60 seconds to accept.", "اختر من تتحدى — لديه 60 ثانية للقبول."),
      body: friends.length
        ? `<div class="stack gap-1">${friends.map((f) => `
            <button class="challenge-item" style="width:100%;text-align:start;border-radius:10px;padding:10px" data-pick="${f.id}">
              ${U.avatarWithStatus(I18n.pick(f.player.name), f.online, { size: "avatar", hue: f.player.hue })}
              <span class="meta"><strong>${U.esc(I18n.pick(f.player.name))}</strong><span>${U.esc(I18n.pick(f.last))} · ${U.esc(U.t("Level", "مستوى"))} ${Store.levelInfo(f.player.xp).level}</span></span>
              <span class="badge badge-green">${U.esc(U.t("Challenge", "تحدٍ"))}</span>
            </button>`).join("")}</div>`
        : Comp.empty("users", U.t("No friends online", "لا أصدقاء متصلون"), U.t("Try again later or send a room code.", "حاول لاحقًا أو أرسل كود غرفة.")),
      onMount: function (root, close) {
        root.querySelectorAll("[data-pick]").forEach((el) => {
          el.addEventListener("click", () => {
            const id = el.getAttribute("data-pick");
            close();
            UI.toast({ title: U.t("Challenge sent", "تم إرسال التحدي"), msg: U.t("Starting the duel when they accept…", "ستبدأ المبارزة عند القبول…"), type: "success" });
            setTimeout(() => Router.go(`#/mo/match?mode=friend&game=${s.game}&count=${s.count}&opp=${id}`), 900);
          });
        });
      },
    });
  }

  function openRoomModal(s) {
    s = s || MoPages._settings;
    const code = "LM-7K4Q";
    UI.openModal({
      title: U.t("Private room", "غرفة خاصة"),
      subtitle: U.t("Share the code or link, then start when your opponent joins.", "شارك الكود أو الرابط ثم ابدأ عند انضمام منافسك."),
      body: `
        <div class="stack gap-4">
          <div class="room-code"><code>${code}</code><button class="icon-btn" data-copy-code aria-label="copy">${U.icon("copy")}</button></div>
          <div class="field"><label>${U.esc(U.t("Invitation link", "رابط الدعوة"))}</label>
            <div class="row gap-2"><input class="input" readonly value="${location.origin + location.pathname}#/mo/match?mode=room&room=${code}" id="invite-link"><button class="btn btn-secondary btn-sm" data-copy-invite>${U.icon("copy")}${U.esc(U.t("Copy", "نسخ"))}</button></div>
          </div>
          <div class="surface" style="padding:12px 14px;display:flex;gap:10px"><span class="dot-live" style="margin-top:7px"></span><p class="xs muted">${U.esc(U.t("Room is open. Waiting for one opponent to join. You can start a practice duel now.", "الغرفة مفتوحة. بانتظار انضمام منافس. يمكنك بدء مباراة تدريبية الآن."))}</p></div>
        </div>`,
      footer: `<button class="btn btn-secondary" data-close>${U.esc(U.t("Close", "إغلاق"))}</button><button class="btn btn-primary" data-start>${U.icon("play")}${U.esc(U.t("Start practice duel", "ابدأ مباراة تدريبية"))}</button>`,
      onMount: function (root, close) {
        const link = location.origin + location.pathname + "#/mo/match?mode=room&room=" + code;
        root.querySelector("[data-copy-code]").addEventListener("click", () => UI.copy(code));
        root.querySelector("[data-copy-invite]").addEventListener("click", () => UI.copy(link));
        root.querySelector("[data-start]").addEventListener("click", () => {
          close();
          Router.go(`#/mo/match?mode=room&room=${code}&game=${s.game}&count=${s.count}`);
        });
      },
    });
  }

  /* ====================================================================== */
  /* Match engine                                                          */
  /* ====================================================================== */
  MoPages.match = function (query) {
    const s = MoPages._settings;
    const count = Math.min(Math.max(Number(query.count) || s.count || 8, 3), 12);
    const game = query.game || s.game || "quiz";
    const mode = query.mode || "quick";
    const difficulty = query.difficulty || s.difficulty || "mixed";
    const rivals = Store.db.mo.rivals;
    const opp = Store.moPlayer(query.opp) || rivals[2];

    const content = `
      <div class="arena" id="arena">
        <div class="arena-head">
          <a class="btn btn-ghost btn-sm" href="#/mo/play">${U.icon("arrow", "i-arrow")}${U.esc(U.t("Leave match", "مغادرة المباراة"))}</a>
          <div class="arena-meta">${U.esc(gameName(game))} · ${U.esc(U.t("Ranked 1v1", "مصنّفة 1 ضد 1"))} · ${count} ${U.esc(U.t("questions", "أسئلة"))}</div>
          <span class="badge badge-live"><span class="dot-live"></span>${U.esc(U.t("Live", "مباشر"))}</span>
        </div>

        <div class="scoreboard">
          <div class="player-side">
            ${U.avatar(meName(), { size: "avatar", hue: Store.db.mo.me.hue, ring: true })}
            <div class="info"><strong>${U.esc(meName())}</strong><span>LV ${Store.meLevel().level} · ${U.esc(U.t("You", "أنت"))}</span></div>
          </div>
          <div class="score-center">
            <div class="score-line"><span class="me-score" id="score-me">0</span><span class="colon">:</span><span class="opp-score" id="score-opp">0</span></div>
            <div class="timer-pill" id="timer-pill">${U.icon("clock")}<span id="timer-text">12s</span></div>
          </div>
          <div class="player-side right">
            ${U.avatar(I18n.pick(opp.name), { size: "avatar", hue: opp.hue })}
            <div class="info"><strong>${U.esc(I18n.pick(opp.name))}</strong><span>LV ${Store.levelInfo(opp.xp).level} · ${U.esc(I18n.pick(opp.handle))}</span></div>
          </div>
        </div>

        <div class="arena-progress" id="arena-progress">${Array.from({ length: count }).map(() => "<span></span>").join("")}</div>

        <div class="question-card">
          <div class="q-meta">
            <div class="row gap-2">
              <span class="badge badge-purple" id="q-cat">${U.esc(U.t("Category", "الفئة"))}</span>
              <span class="badge" id="q-diff">${U.esc(U.t("Difficulty", "الصعوبة"))}</span>
            </div>
            <span class="small muted mono" id="q-count" dir="ltr">1 / ${count}</span>
          </div>
          <div class="progress thin" style="margin-bottom:18px"><span id="q-timer-bar" style="width:100%"></span></div>
          <h2 class="q-text" id="q-text">${U.esc(U.t("Get ready…", "استعد…"))}</h2>
          <div class="answers" id="answers"></div>
          <div class="answer-feedback" id="feedback"></div>
        </div>
      </div>
      <div id="arena-overlay"></div>`;

    return {
      title: U.t("Live Match", "مباراة مباشرة"),
      html: Shell.app({
        platform: "mo",
        active: "quick",
        title: U.t("1v1 Match", "مباراة 1 ضد 1"),
        crumb: U.t("Live arena", "الأرينا المباشرة"),
        pageClass: "is-immersive",
        content: content,
      }),
      mount: function (root) {
        MoPages._cleanup();
        const arena = root.querySelector("#arena");
        const overlay = root.querySelector("#arena-overlay");
        const answersEl = root.querySelector("#answers");
        const feedbackEl = root.querySelector("#feedback");
        const qText = root.querySelector("#q-text");
        const qCat = root.querySelector("#q-cat");
        const qDiff = root.querySelector("#q-diff");
        const qCount = root.querySelector("#q-count");
        const qTimerBar = root.querySelector("#q-timer-bar");
        const timerPill = root.querySelector("#timer-pill");
        const timerText = root.querySelector("#timer-text");
        const scoreMe = root.querySelector("#score-me");
        const scoreOpp = root.querySelector("#score-opp");
        const progressEl = root.querySelector("#arena-progress");
        const dots = Array.from(progressEl.children);

        const pool = Store.db.questions.filter((q) => difficulty === "mixed" || q.diff === difficulty);
        const bank = (pool.length >= count ? pool : Store.db.questions).slice(0);
        // Shuffle deterministically-ish for replay variety
        for (let i = bank.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [bank[i], bank[j]] = [bank[j], bank[i]];
        }
        const questions = bank.slice(0, count);

        let idx = 0;
        let myScore = 0;
        let oppScore = 0;
        let correctCount = 0;
        let answered = false;
        let timeLeft = 12;
        let ticker = null;
        let finished = false;

        function updateScore(el, value) {
          el.textContent = value;
          el.classList.remove("bump");
          void el.offsetWidth;
          el.classList.add("bump");
        }

        function showCountdown() {
          overlay.innerHTML = `
            <div class="arena-overlay" id="countdown-overlay">
              <div class="countdown">
                <p class="hint">${U.esc(U.t("Opponent found — ", "تم إيجاد منافس — "))}<strong>${U.esc(I18n.pick(opp.name))}</strong></p>
                <div class="num" id="count-num">3</div>
                <p class="hint" style="margin-top:16px">${U.esc(U.t("Answer fast. Answer first.", "أجب بسرعة. أجب أولًا."))}</p>
              </div>
            </div>`;
          const num = overlay.querySelector("#count-num");
          const seq = ["3", "2", "1", U.t("GO", "انطلق")];
          let step = 0;
          const tick = function () {
            if (!document.body.contains(num)) return;
            num.textContent = seq[step];
            num.style.animation = "none";
            void num.offsetWidth;
            num.style.animation = "count-pop 900ms var(--ease) both";
            step++;
            if (step < seq.length) {
              MoPages._later(tick, 850);
            } else {
              MoPages._later(() => {
                const el = document.getElementById("countdown-overlay");
                if (el) {
                  el.classList.add("is-leaving");
                  MoPages._later(() => el.remove(), 320);
                }
                startQuestion();
              }, 620);
            }
          };
          tick();
        }

        function startQuestion() {
          answered = false;
          timeLeft = 12;
          const q = questions[idx];
          if (!q) return finish();

          dots.forEach((d, i) => {
            d.classList.toggle("done", i < idx);
            d.classList.toggle("current", i === idx);
          });
          qCount.textContent = `${idx + 1} / ${questions.length}`;
          qCat.textContent = q.cat;
          qDiff.textContent = q.diff.charAt(0).toUpperCase() + q.diff.slice(1);
          qText.textContent = I18n.pick(q.q);
          feedbackEl.innerHTML = "";
          feedbackEl.className = "answer-feedback";
          timerText.textContent = timeLeft + "s";
          timerPill.className = "timer-pill";
          qTimerBar.style.transition = "none";
          qTimerBar.style.width = "100%";
          void qTimerBar.offsetWidth;
          qTimerBar.style.transition = "width 1s linear";
          qTimerBar.style.width = "0%";

          answersEl.innerHTML = q.options
            .map(
              (opt, i) =>
                `<button class="answer" data-answer="${i}" type="button"><span class="key">${["A", "B", "C", "D"][i]}</span><span>${U.esc(I18n.pick(opt))}</span></button>`
            )
            .join("");

          answersEl.querySelectorAll("[data-answer]").forEach((btn) => {
            btn.addEventListener("click", () => choose(Number(btn.getAttribute("data-answer"))));
          });

          clearInterval(ticker);
          ticker = MoPages._every(function () {
            if (!document.body.contains(arena)) return;
            timeLeft -= 1;
            timerText.textContent = timeLeft + "s";
            timerPill.classList.toggle("warn", timeLeft <= 5 && timeLeft > 2);
            timerPill.classList.toggle("crit", timeLeft <= 2);
            if (timeLeft <= 0) {
              clearInterval(ticker);
              timeUp();
            }
          }, 1000);
        }

        function lockAnswers() {
          answersEl.querySelectorAll(".answer").forEach((b) => (b.disabled = true));
        }

        function reveal(q, picked) {
          const buttons = answersEl.querySelectorAll(".answer");
          buttons.forEach((b, i) => {
            b.classList.remove("is-selected");
            b.disabled = true;
            if (i === q.answer) b.classList.add("is-correct");
            else if (i === picked) b.classList.add("is-wrong");
            else b.classList.add("is-dim");
          });
        }

        function simulateOpponent() {
          const chance = 0.35 + (opp.strength || 0.6) * 0.45;
          if (Math.random() < chance) {
            oppScore += 1;
            updateScore(scoreOpp, oppScore);
            return true;
          }
          return false;
        }

        function choose(picked) {
          if (answered || finished) return;
          answered = true;
          clearInterval(ticker);
          const q = questions[idx];
          const isCorrect = picked === q.answer;
          reveal(q, picked);

          if (isCorrect) {
            myScore += 1;
            correctCount += 1;
            updateScore(scoreMe, myScore);
            feedbackEl.className = "answer-feedback ok";
            feedbackEl.innerHTML = `${U.icon("check")}${U.esc(U.t("Correct! +1 point", "إجابة صحيحة! +1 نقطة"))}`;
          } else {
            feedbackEl.className = "answer-feedback no";
            feedbackEl.innerHTML = `${U.icon("x")}${U.esc(U.t("Not quite — the answer was ", "ليست صحيحة — الإجابة كانت "))}<strong>${U.esc(I18n.pick(q.options[q.answer]))}</strong>`;
          }

          MoPages._later(function () {
            const oppScored = simulateOpponent();
            if (oppScored && isCorrect) {
              feedbackEl.innerHTML = feedbackEl.innerHTML + `<span class="xs muted" style="margin-inline-start:8px">· ${U.esc(I18n.pick(opp.name))} ${U.esc(U.t("also scored", "أجاب أيضًا"))}</span>`;
            }
          }, 500);

          MoPages._later(next, 1500);
        }

        function timeUp() {
          if (answered || finished) return;
          answered = true;
          const q = questions[idx];
          reveal(q, -1);
          feedbackEl.className = "answer-feedback no";
          feedbackEl.innerHTML = `${U.icon("clock")}${U.esc(U.t("Time's up — correct answer: ", "انتهى الوقت — الإجابة الصحيحة: "))}<strong>${U.esc(I18n.pick(q.options[q.answer]))}</strong>`;
          MoPages._later(function () {
            simulateOpponent();
          }, 500);
          MoPages._later(next, 1500);
        }

        function next() {
          if (!document.body.contains(arena) || finished) return;
          idx += 1;
          if (idx >= questions.length) finish();
          else startQuestion();
        }

        function finish() {
          if (finished) return;
          finished = true;
          clearInterval(ticker);
          const won = myScore > oppScore;
          const draw = myScore === oppScore;
          const result = Store.recordMatch({
            opponent: opp.id,
            scoreMe: myScore,
            scoreOpp: oppScore,
            game: game,
            mode: mode,
            correct: correctCount,
          });
          dots.forEach((d) => {
            d.classList.remove("current");
            d.classList.add("done");
          });
          timerText.textContent = "0s";
          timerPill.className = "timer-pill";
          answersEl.innerHTML = "";
          qText.textContent = U.t("Match complete", "انتهت المباراة");

          const gained = result.gained;
          overlay.innerHTML = `
            <div class="arena-overlay">
              <div class="result-card ${won ? "" : "lost"}">
                <div class="result-emblem">${U.icon(draw ? "medal" : won ? "trophy" : "shield")}</div>
                <span class="badge ${won ? "badge-gold" : "badge-red"}">${U.esc(draw ? U.t("Draw", "تعادل") : won ? U.t("Victory", "فوز") : U.t("Defeat", "خسارة"))}</span>
                <h2 style="margin-top:12px">${U.esc(won ? U.t("You won the duel!", "فزت بالمبارزة!") : draw ? U.t("A perfect draw", "تعادل مثير") : U.t("So close — run it back", "قريب جدًا — جرب مجددًا"))}</h2>
                <p class="small muted">${U.esc(I18n.pick(opp.name))} · ${U.esc(gameName(game))}</p>
                <div class="result-score"><span class="${won ? "win" : draw ? "" : "loss"}">${myScore}</span> <span class="muted">:</span> <span>${oppScore}</span></div>
                <div class="row gap-2" style="justify-content:center;flex-wrap:wrap">
                  <span class="result-xp">${U.icon("sparkles")}+${gained} XP</span>
                  <span class="badge badge-cyan">${correctCount}/${questions.length} ${U.esc(U.t("correct", "صحيحة"))}</span>
                  <span class="badge badge-purple">${U.esc(U.t("Streak", "السلسلة"))} ${Store.db.mo.stats.streak}</span>
                </div>
                <div class="result-actions">
                  <a class="btn btn-primary" href="${matchUrl(s)}">${U.icon("refresh")}${U.esc(U.t("Play again", "العب مرة أخرى"))}</a>
                  <a class="btn btn-secondary" href="#/mo">${U.esc(U.t("Dashboard", "لوحة التحكم"))}</a>
                </div>
              </div>
            </div>`;
          if (won) confetti(root);
          UI.toast({ title: won ? U.t("Victory!", "فوز!") : U.t("Match complete", "انتهت المباراة"), msg: `+${gained} XP · ${U.t("Rank updated", "تم تحديث التصنيف")}`, type: won ? "gold" : "info" });
        }

        showCountdown();
      },
    };
  };

  function confetti(root) {
    const colors = ["#8B6BFF", "#08B9C9", "#19C784", "#E8B75A", "#F4F5FA"];
    const layer = document.createElement("div");
    layer.className = "confetti";
    let html = "";
    for (let i = 0; i < 70; i++) {
      const left = Math.random() * 100;
      const dur = 2.4 + Math.random() * 2.2;
      const delay = Math.random() * 0.5;
      const dx = (Math.random() - 0.5) * 40;
      html += `<i style="left:${left}%;background:${colors[i % colors.length]};animation-duration:${dur}s;animation-delay:${delay}s;--dx:${dx}vw"></i>`;
    }
    layer.innerHTML = html;
    document.body.appendChild(layer);
    MoPages._later(() => layer.remove(), 5200);
  }

  /* ====================================================================== */
  /* Live matches                                                          */
  /* ====================================================================== */
  MoPages.live = function () {
    const rivals = Store.db.mo.rivals;
    const pairs = [
      [rivals[0], rivals[3], 7, 5, "Q7"],
      [rivals[1], rivals[5], 4, 6, "Q4"],
      [rivals[2], rivals[7], 9, 9, "Q8"],
    ];
    const content = `
      <div class="page-head">
        <div>
          <div class="breadcrumbs"><a href="#/mo">Mo Games</a><span class="sep">/</span><span>${U.esc(U.t("Live", "مباشر"))}</span></div>
          <h1>${U.esc(U.t("Live matches", "المباريات المباشرة"))}</h1>
          <p>${U.esc(U.t("Watch ongoing 1v1 duels in real time. Scores update as questions are answered.", "شاهد مبارزات 1 ضد 1 الجارية لحظيًا. تتحدث النتائج مع كل إجابة."))}</p>
        </div>
        <span class="badge badge-live"><span class="dot-live"></span>${U.esc(U.t("3 live now", "3 مباشرة الآن"))}</span>
      </div>

      <div class="grid-2" style="align-items:start">
        ${pairs.map((p, i) => `
          <div class="card panel">
            ${Comp.panelHead(U.t("Live duel", "مبارزة مباشرة"), I18n.pick(p[0].name) + " vs " + I18n.pick(p[1].name), `<span class="badge badge-live"><span class="dot-live"></span>${p[4]}</span>`)}
            <div class="panel-body">
              <div class="duel-sides" style="margin-bottom:12px">
                <div class="duel-player">${U.avatar(I18n.pick(p[0].name), { size: "avatar-lg", hue: p[0].hue })}<strong>${U.esc(I18n.pick(p[0].name))}</strong><span>LV ${Store.levelInfo(p[0].xp).level}</span></div>
                <div class="duel-vs">VS</div>
                <div class="duel-player">${U.avatar(I18n.pick(p[1].name), { size: "avatar-lg", hue: p[1].hue })}<strong>${U.esc(I18n.pick(p[1].name))}</strong><span>LV ${Store.levelInfo(p[1].xp).level}</span></div>
              </div>
              <div class="score-line" style="justify-content:center;font-size:2.2rem"><span>${p[2]}</span><span class="colon">:</span><span class="opp-score">${p[3]}</span></div>
              <div class="arena-progress" style="margin-top:16px">${Array.from({ length: 8 }).map((_, d) => `<span class="${d < 6 ? "done" : d === 6 ? "current" : ""}"></span>`).join("")}</div>
              <div class="row between" style="margin-top:16px">
                <span class="xs muted">${U.esc(U.t("Question", "السؤال"))} ${p[4].replace("Q", "")} / 8 · ${U.esc(U.t("Football Quiz", "تحدي كرة القدم"))}</span>
                <button class="btn btn-secondary btn-sm" data-watch="${i}">${U.icon("eye")}${U.esc(U.t("Watch", "شاهد"))}</button>
              </div>
            </div>
          </div>`).join("")}
      </div>

      <div class="card panel" style="margin-top:20px">
        ${Comp.panelHead(U.t("Upcoming featured duels", "مبارزات قادمة مميزة"), U.t("Scheduled high-rank matchups", "مواجهات مجدولة بين لاعبين رفيعي المستوى"))}
        <div class="table-wrap"><table class="table" style="min-width:640px">
          <thead><tr><th>${U.esc(U.t("Match", "المباراة"))}</th><th>${U.esc(U.t("Mode", "النمط"))}</th><th>${U.esc(U.t("Starts", "تبدأ"))}</th><th></th></tr></thead>
          <tbody>
            ${[0, 2, 4].map((i) => {
              const a = rivals[i], b = rivals[(i + 4) % rivals.length];
              return `<tr><td><div class="row gap-2">${U.avatar(I18n.pick(a.name), { size: "avatar-xs", hue: a.hue })}<span class="player-cell"><span class="name">${U.esc(I18n.pick(a.name))}</span></span><span class="muted xs">vs</span>${U.avatar(I18n.pick(b.name), { size: "avatar-xs", hue: b.hue })}<span class="player-cell"><span class="name">${U.esc(I18n.pick(b.name))}</span></span></div></td>
                <td><span class="badge">${U.esc(U.t("Ranked", "مصنّف"))}</span></td>
                <td class="xs muted">${U.esc(U.t("Today", "اليوم"))} · ${U.timeShort(U.daysFromNow(0.1 + i * 0.05))}</td>
                <td class="num"><button class="btn btn-ghost btn-sm" data-watch="${i}">${U.esc(U.t("Remind me", "ذكّرني"))}</button></td></tr>`;
            }).join("")}
          </tbody>
        </table></div>
      </div>`;

    return {
      title: U.t("Live matches", "المباريات المباشرة"),
      html: Shell.app({ platform: "mo", active: "live", title: U.t("Live matches", "المباريات المباشرة"), crumb: "Mo Games", content: content }),
      mount: function (root) {
        root.querySelectorAll("[data-watch]").forEach((el) => {
          el.addEventListener("click", () => {
            const i = Number(el.getAttribute("data-watch"));
            const p = pairs[i];
            if (!p) {
              UI.toast({ title: U.t("Reminder set", "تم ضبط التذكير"), msg: U.t("We'll notify you when the duel starts.", "سننبهك عند بدء المبارزة."), type: "success" });
              return;
            }
            UI.openModal({
              title: I18n.pick(p[0].name) + " vs " + I18n.pick(p[1].name),
              subtitle: U.t("Spectator view · live", "عرض المشاهد · مباشر"),
              body: `<div class="matchmaking"><div class="duel-sides">
                <div class="duel-player">${U.avatar(I18n.pick(p[0].name), { size: "avatar-xl", hue: p[0].hue })}<strong>${U.esc(I18n.pick(p[0].name))}</strong></div>
                <div class="duel-score" style="font-size:2.4rem;margin:0"><span>${p[2]}</span><span class="muted">:</span><span>${p[3]}</span></div>
                <div class="duel-player">${U.avatar(I18n.pick(p[1].name), { size: "avatar-xl", hue: p[1].hue })}<strong>${U.esc(I18n.pick(p[1].name))}</strong></div>
              </div><p class="small muted" style="margin-top:16px">${U.esc(U.t("Live spectator mode is a preview — full streaming is available in the native app.", "وضع المشاهدة المباشرة تجريبي — البث الكامل متاح في التطبيق."))}</p></div>`,
              footer: `<button class="btn btn-secondary" data-close>${U.esc(U.t("Close", "إغلاق"))}</button>`,
            });
          });
        });
      },
    };
  };

  /* ====================================================================== */
  /* Leaderboard                                                           */
  /* ====================================================================== */
  MoPages.leaderboard = function (query) {
    const period = query.period || "all";
    const rows = Store.leaderboard(period === "weekly" ? "weekly" : "xp").map((r, i) => {
      let value = r.xp;
      if (period === "weekly") value = r.weeklyXp;
      if (period === "monthly") value = Math.round(r.weeklyXp * 4.1 + r.wins * 2);
      return { ...r, value, rank: 0 };
    });
    rows.sort((a, b) => b.value - a.value);
    rows.forEach((r, i) => (r.rank = i + 1));
    const top3 = rows.slice(0, 3);
    const tabs = [
      { id: "all", label: U.t("All time", "كل الوقت") },
      { id: "weekly", label: U.t("This week", "هذا الأسبوع") },
      { id: "monthly", label: U.t("This month", "هذا الشهر") },
    ];

    const podium = top3
      .map((p, i) => {
        const cls = i === 0 ? "first" : i === 1 ? "second" : "third";
        return `<a class="podium-card ${cls}" href="#/mo/profile?id=${p.id}">
          ${i === 0 ? `<span class="crown-float">${U.icon("crown")}</span>` : ""}
          <span class="podium-rank">${p.rank}</span>
          ${U.avatar(I18n.pick(p.name), { size: i === 0 ? "avatar-xl" : "avatar-lg", hue: p.hue, gold: i === 0 })}
          <div class="p-name">${U.esc(I18n.pick(p.name))} ${p.isMe ? `<span class="badge badge-purple" style="margin-inline-start:4px">${U.esc(U.t("You", "أنت"))}</span>` : ""}</div>
          <div class="p-meta">${U.esc(p.handle)} · ${Store.winRate(p.wins, p.losses)}% ${U.esc(U.t("win rate", "نسبة فوز"))}</div>
          <div class="p-xp">${U.n(p.value)} <small>${period === "weekly" ? "XP " + U.t("this week", "هذا الأسبوع") : "XP"}</small></div>
        </a>`;
      })
      .join("");

    const content = `
      <div class="page-head">
        <div>
          <div class="breadcrumbs"><a href="#/mo">Mo Games</a><span class="sep">/</span><span>${U.esc(U.t("Leaderboard", "المتصدرون"))}</span></div>
          <h1>${U.esc(U.t("Leaderboard", "لوحة المتصدرين"))}</h1>
          <p>${U.esc(U.t("The best football quiz players in the arena, ranked by XP and victories.", "أفضل لاعبي تحدي كرة القدم في الأرينا، مرتبون حسب XP والانتصارات."))}</p>
        </div>
        <div class="segmented" role="tablist" aria-label="${U.esc(U.t("Ranking period", "فترة الترتيب"))}">
          ${tabs.map((t) => `<a href="#/mo/leaderboard?period=${t.id}" role="tab" aria-selected="${period === t.id}" class="${period === t.id ? "is-active" : ""}" style="display:grid;place-items:center">${U.esc(t.label)}</a>`).join("")}
        </div>
      </div>

      <div class="podium" style="margin-bottom:24px">${podium}</div>

      <div class="card panel lb-layout">
        ${Comp.panelHead(U.t("Global rankings", "الترتيب العالمي"), U.t("Updated live · Season 04", "تحديث مباشر · الموسم 04"), `<span class="badge badge-cyan">${U.icon("users")}128,400 ${U.esc(U.t("players", "لاعب"))}</span>`)}
        <div class="table-wrap">
          <table class="table lb-table">
            <thead><tr>
              <th class="col-pos">#</th>
              <th class="col-player">${U.esc(U.t("Player", "اللاعب"))}</th>
              <th class="num">${U.esc(U.t("Wins", "انتصارات"))}</th>
              <th class="num">${U.esc(U.t("Losses", "خسائر"))}</th>
              <th class="num">${U.esc(U.t("Win rate", "نسبة الفوز"))}</th>
              <th class="num">${U.esc(U.t("Level", "المستوى"))}</th>
              <th class="num">${U.esc(U.t("XP", "XP"))}</th>
              <th class="num"></th>
            </tr></thead>
            <tbody>
              ${rows.map((r) => `<tr class="${r.isMe ? "me-row" : ""}">
                <td class="col-pos"><span class="pos-badge ${r.rank <= 3 ? "pos-" + r.rank : ""}">${r.rank}</span></td>
                <td class="col-player"><a class="player-cell" href="#/mo/profile?id=${r.id}">
                  ${U.avatar(I18n.pick(r.name), { size: "avatar-sm", hue: r.hue })}
                  <span><span class="name">${U.esc(I18n.pick(r.name))} ${r.isMe ? `<span class="badge badge-purple">${U.esc(U.t("You", "أنت"))}</span>` : ""}</span><span class="sub">${U.esc(r.handle)}</span></span>
                </a></td>
                <td class="num">${r.wins}</td>
                <td class="num">${r.losses}</td>
                <td class="num">${Store.winRate(r.wins, r.losses)}%</td>
                <td class="num">${Store.levelInfo(r.xp).level}</td>
                <td class="num points">${U.n(r.value)}</td>
                <td class="num"><button class="btn btn-ghost btn-sm" data-challenge="${r.id}" ${r.isMe ? "disabled" : ""}>${U.icon("sword")}${U.esc(U.t("Challenge", "تحدٍ"))}</button></td>
              </tr>`).join("")}
            </tbody>
          </table>
        </div>
        <div class="table-footnote"><span>${U.esc(U.t("Ranking resets weekly. XP earned in ranked matches only.", "يتجدد الترتيب أسبوعيًا. يُحسب XP من المباريات المصنّفة فقط."))}</span></div>
      </div>`;

    return {
      title: U.t("Leaderboard", "لوحة المتصدرين"),
      html: Shell.app({ platform: "mo", active: "leaderboard", title: U.t("Leaderboard", "لوحة المتصدرين"), crumb: "Mo Games", content: content }),
      mount: function (root) {
        root.querySelectorAll("[data-challenge]").forEach((el) => {
          el.addEventListener("click", () => {
            const id = el.getAttribute("data-challenge");
            if (!id || id === "me") return;
            Store.addChallenge(id, "friend", "quiz");
            UI.toast({ title: U.t("Challenge sent", "تم إرسال التحدي"), msg: U.t("Good luck — the duel is ready.", "بالتوفيق — المبارزة جاهزة."), type: "success" });
          });
        });
      },
    };
  };

  /* ====================================================================== */
  /* Friends                                                               */
  /* ====================================================================== */
  MoPages.friends = function () {
    const list = Store.db.friends
      .map((f) => ({ ...f, player: Store.moPlayer(f.id) }))
      .filter((f) => f.player);
    const online = list.filter((f) => f.online === "online");
    const ingame = list.filter((f) => f.online === "ingame");
    const offline = list.filter((f) => f.online === "offline");

    function card(f) {
      return `<div class="friend-card" data-name="${U.esc(I18n.pick(f.player.name).toLowerCase())}">
        <div class="top">
          ${U.avatarWithStatus(I18n.pick(f.player.name), f.online, { size: "avatar", hue: f.player.hue })}
          <div class="meta"><strong>${U.esc(I18n.pick(f.player.name))}</strong><span>${U.esc(I18n.pick(f.last))} · LV ${Store.levelInfo(f.player.xp).level}</span></div>
        </div>
        <div class="row between xs muted"><span>${f.player.wins} ${U.esc(U.t("wins", "فوز"))}</span><span>${Store.winRate(f.player.wins, f.player.losses)}% ${U.esc(U.t("win rate", "نسبة فوز"))}</span></div>
        <div class="actions">
          <button class="btn btn-secondary btn-sm" data-invite="${f.id}">${U.icon("sword")}${U.esc(f.online === "ingame" ? U.t("Invite", "دعوة") : U.t("Challenge", "تحدٍ"))}</button>
          <a class="btn btn-ghost btn-sm" href="#/mo/profile?id=${f.id}">${U.esc(U.t("Profile", "الملف"))}</a>
        </div>
      </div>`;
    }

    const content = `
      <div class="page-head">
        <div>
          <div class="breadcrumbs"><a href="#/mo">Mo Games</a><span class="sep">/</span><span>${U.esc(U.t("Friends", "الأصدقاء"))}</span></div>
          <h1>${U.esc(U.t("Friends", "الأصدقاء"))}</h1>
          <p>${U.esc(U.t("See who's online, send direct challenges, and track your friends' progress.", "شاهد من متصل، أرسل تحديات مباشرة، وتابع تقدم أصدقائك."))}</p>
        </div>
        <div class="row gap-2">
          <span class="badge badge-green">${U.icon("users")}${online.length + ingame.length} ${U.esc(U.t("online", "متصل"))}</span>
          <button class="btn btn-secondary btn-sm" data-action="search">${U.icon("search")}${U.esc(U.t("Find players", "ابحث عن لاعبين"))}</button>
        </div>
      </div>

      <div class="lb-toolbar">
        <div class="tabs" role="tablist">
          <button class="tab is-active" data-filter="all">${U.esc(U.t("All", "الكل"))} · ${list.length}</button>
          <button class="tab" data-filter="online">${U.esc(U.t("Online", "متصل"))} · ${online.length}</button>
          <button class="tab" data-filter="ingame">${U.esc(U.t("In match", "في مباراة"))} · ${ingame.length}</button>
          <button class="tab" data-filter="offline">${U.esc(U.t("Offline", "غير متصل"))} · ${offline.length}</button>
        </div>
        <div class="searchbox" style="width:min(280px,100%)">${U.icon("search")}<input id="friend-filter" type="search" placeholder="${U.esc(U.t("Filter friends…", "تصفية الأصدقاء…"))}" aria-label="${U.esc(U.t("Filter friends", "تصفية الأصدقاء"))}"></div>
      </div>

      ${online.length ? `<div class="section-label"><h2>${U.esc(U.t("Online now", "متصل الآن"))}</h2><span class="xs muted">${online.length}</span></div><div class="grid-4">${online.map(card).join("")}</div>` : ""}
      ${ingame.length ? `<div class="section-label"><h2>${U.esc(U.t("In a match", "في مباراة"))}</h2><span class="xs muted">${ingame.length}</span></div><div class="grid-4">${ingame.map(card).join("")}</div>` : ""}
      ${offline.length ? `<div class="section-label"><h2>${U.esc(U.t("Offline", "غير متصل"))}</h2><span class="xs muted">${offline.length}</span></div><div class="grid-4">${offline.map(card).join("")}</div>` : ""}
      <div id="friend-empty" class="hide">${Comp.empty("users", U.t("No friends match", "لا يوجد أصدقاء مطابقون"), U.t("Try a different name or filter.", "جرب اسمًا أو تصفية أخرى."))}</div>`;

    return {
      title: U.t("Friends", "الأصدقاء"),
      html: Shell.app({ platform: "mo", active: "friends", title: U.t("Friends", "الأصدقاء"), crumb: "Mo Games", content: content }),
      mount: function (root) {
        root.querySelectorAll("[data-invite]").forEach((el) => {
          el.addEventListener("click", () => {
            const id = el.getAttribute("data-invite");
            Store.addChallenge(id, "friend", "quiz");
            UI.toast({ title: U.t("Challenge sent", "تم إرسال التحدي"), msg: Store.name(id) + " " + U.t("has 60 seconds to accept.", "لديه 60 ثانية للقبول."), type: "success" });
          });
        });

        const input = root.querySelector("#friend-filter");
        const empty = root.querySelector("#friend-empty");
        let filter = "all";
        const apply = function () {
          const q = (input.value || "").trim().toLowerCase();
          let visible = 0;
          root.querySelectorAll(".friend-card").forEach((cardEl) => {
            const name = cardEl.getAttribute("data-name") || "";
            const status = cardEl.querySelector(".avatar-status");
            const isOnline = status.classList.contains("is-online");
            const isGame = status.classList.contains("is-ingame");
            let passStatus = filter === "all" || (filter === "online" && isOnline) || (filter === "ingame" && isGame) || (filter === "offline" && !isOnline && !isGame);
            const passQuery = !q || name.includes(q);
            const show = passStatus && passQuery;
            cardEl.style.display = show ? "" : "none";
            if (show) visible++;
          });
          empty.classList.toggle("hide", visible > 0);
          root.querySelectorAll("[data-filter]").forEach((b) => b.classList.toggle("is-active", b.getAttribute("data-filter") === filter));
        };
        root.querySelectorAll("[data-filter]").forEach((b) => {
          b.addEventListener("click", () => {
            filter = b.getAttribute("data-filter");
            apply();
          });
        });
        input.addEventListener("input", U.debounce(apply, 150));
      },
    };
  };

  /* ====================================================================== */
  /* Profile                                                               */
  /* ====================================================================== */
  MoPages.profile = function (query) {
    const isMe = !query.id || query.id === "me";
    const p = isMe ? Store.player("me") : Store.moPlayer(query.id);
    const subject = p || Store.player("me");
    const lb = Store.leaderboard("xp");
    const rankRow = lb.find((r) => r.id === subject.id) || lb[0];
    const lvl = Store.levelInfo(subject.xp);
    const wins = subject.wins;
    const losses = subject.losses;
    const matches = isMe ? Store.db.mo.matches : [];
    const achievements = Store.db.achievements;

    const content = `
      <section class="profile-cover">
        <div class="profile-id">
          ${U.avatar(I18n.pick(subject.name), { size: "avatar", hue: subject.hue })}
          <div class="p-meta">
            <h1>${U.esc(I18n.pick(subject.name))}</h1>
            <div class="handle">${U.esc(subject.handle || "")} ${isMe ? `· <span class="badge badge-purple">${U.esc(U.t("You", "أنت"))}</span>` : ""}</div>
            <div class="tags">
              <span class="badge badge-gold">${U.icon("crown")}#${rankRow.rank} ${U.esc(U.t("Global", "عالميًا"))}</span>
              <span class="badge badge-purple">LV ${lvl.level}</span>
              <span class="badge">${U.icon("flame")}${U.esc(U.t("Season 04", "الموسم 04"))}</span>
            </div>
          </div>
          <div class="profile-actions">
            ${isMe
              ? `<a class="btn btn-primary" href="#/mo/play?mode=quick">${U.icon("bolt")}${U.esc(U.t("Play", "العب"))}</a><a class="btn btn-secondary" href="#/mo/settings">${U.icon("settings")}${U.esc(U.t("Settings", "الإعدادات"))}</a>`
              : `<button class="btn btn-primary" data-challenge-me>${U.icon("sword")}${U.esc(U.t("Challenge", "تحدٍ"))}</button><a class="btn btn-secondary" href="#/mo/friends">${U.esc(U.t("Friends", "الأصدقاء"))}</a>`}
          </div>
        </div>
      </section>

      <div class="profile-grid">
        <div class="stack gap-4">
          <div class="card panel">
            ${Comp.panelHead(U.t("Performance", "الأداء"), U.t("Career statistics", "إحصائيات المسيرة"))}
            <div class="panel-body">
              <div class="xp-panel">
                <div class="ring" style="--p:${lvl.pct};--size:92px"><div class="ring-txt"><strong>${lvl.level}</strong><span>${U.esc(U.t("LEVEL", "المستوى"))}</span></div></div>
                <div class="grow">
                  <div class="xp-row"><span>${U.esc(U.t("XP progress", "تقدم XP"))}</span><span class="mono">${U.n(lvl.into)} / ${U.n(lvl.span)}</span></div>
                  <div class="progress grad"><span style="width:${lvl.pct}%"></span></div>
                  <div class="row between" style="margin-top:10px"><span class="xs muted">${U.esc(U.t("Next level", "المستوى التالي"))} ${lvl.level + 1}</span><span class="xs mono">${U.n(subject.xp)} XP</span></div>
                </div>
              </div>
              <div class="stat-row-4" style="margin-top:20px">
                <div class="mini-stat"><strong>${U.n(wins + losses)}</strong><span>${U.esc(U.t("Matches", "مباريات"))}</span></div>
                <div class="mini-stat"><strong>${U.n(wins)}</strong><span>${U.esc(U.t("Wins", "انتصارات"))}</span></div>
                <div class="mini-stat"><strong>${Store.winRate(wins, losses)}%</strong><span>${U.esc(U.t("Win rate", "نسبة فوز"))}</span></div>
                <div class="mini-stat"><strong>${isMe ? Store.db.mo.stats.streak : 2}</strong><span>${U.esc(U.t("Streak", "السلسلة"))}</span></div>
              </div>
            </div>
          </div>

          <div class="card panel">
            ${Comp.panelHead(U.t("Match history", "سجل المباريات"), U.t("Recent ranked results", "أحدث النتائج المصنّفة"))}
            ${isMe && matches.length ? `<div>${matches.slice(0, 8).map(Comp.moMatchRow).join("")}</div>` : Comp.empty("lock", U.t("Match history is private", "سجل المباريات خاص"), U.t("Only you can see your full match history.", "أنت فقط من يمكنه رؤية سجل مبارياتك الكامل."))}
          </div>
        </div>

        <aside class="stack gap-4">
          <div class="rank-card">
            <div class="eyebrow" style="justify-content:center;margin-bottom:6px">${U.icon("chart")}${U.esc(U.t("Season rank", "ترتيب الموسم"))}</div>
            <div class="rank-num">#${rankRow.rank}</div>
            <div class="rank-label">${U.esc(U.t("Global leaderboard", "لوحة المتصدرين العالمية"))}</div>
            <div class="progress thin grad" style="margin-top:14px"><span style="width:${Math.max(8, 100 - rankRow.rank * 6)}%"></span></div>
            <p class="xs muted" style="margin-top:8px">${U.esc(U.t("Top", "أفضل"))} ${Math.max(1, Math.round((rankRow.rank / lb.length) * 100))}% ${U.esc(U.t("of players", "من اللاعبين"))}</p>
          </div>

          <div class="card panel">
            ${Comp.panelHead(U.t("Achievements", "الإنجازات"), `${achievements.filter((a) => a.unlocked).length} / ${achievements.length}`)}
            <div class="panel-body" style="padding-top:8px">
              <div class="ach-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">
                ${achievements.slice(0, 6).map((a) => `
                  <div class="ach-card ${a.tier} ${a.unlocked || !isMe ? "" : "is-locked"}" title="${U.esc(I18n.pick(a.desc))}">
                    <span class="ach-icon">${U.icon(a.icon)}</span>
                    <strong>${U.esc(I18n.pick(a.title))}</strong>
                  </div>`).join("")}
              </div>
            </div>
          </div>

          <div class="card panel">
            ${Comp.panelHead(U.t("Badges", "الشارات"))}
            <div class="panel-body" style="padding-top:8px">
              <div class="badge-grid">
                ${["sword", "flame", "trophy", "target", "bolt", "crown"].map((i) => `<span class="badge-tile" title="${U.esc(U.t("Unlocked achievement", "إنجاز مفتوح"))}">${U.icon(i)}</span>`).join("")}
              </div>
            </div>
          </div>
        </aside>
      </div>`;

    return {
      title: U.t("Player profile", "ملف اللاعب"),
      html: Shell.app({ platform: "mo", active: "profile", title: I18n.pick(subject.name), crumb: U.t("Profile", "الملف"), content: content }),
      mount: function (root) {
        const btn = root.querySelector("[data-challenge-me]");
        if (btn) {
          btn.addEventListener("click", () => {
            Store.addChallenge(subject.id, "friend", "quiz");
            UI.toast({ title: U.t("Challenge sent", "تم إرسال التحدي"), type: "success" });
          });
        }
      },
    };
  };

  /* ====================================================================== */
  /* Settings                                                              */
  /* ====================================================================== */
  MoPages.settings = function () {
    const s = Store.db.settings;
    const content = `
      <div class="page-head">
        <div>
          <div class="breadcrumbs"><a href="#/mo">Mo Games</a><span class="sep">/</span><span>${U.esc(U.t("Settings", "الإعدادات"))}</span></div>
          <h1>${U.esc(U.t("Settings", "الإعدادات"))}</h1>
          <p>${U.esc(U.t("Manage your preferences, privacy and accessibility options.", "أدر تفضيلاتك والخصوصية وخيارات سهولة الوصول."))}</p>
        </div>
      </div>

      <div class="settings-grid">
        <div class="stack gap-4">
          <div class="card panel">
            ${Comp.panelHead(U.t("Preferences", "التفضيلات"), U.t("Applies to this browser", "تُطبق على هذا المتصفح"))}
            <div class="panel-body">
              <div class="setting-row">
                <div class="meta"><strong>${U.esc(U.t("Sound effects", "المؤثرات الصوتية"))}</strong><p>${U.esc(U.t("Answer tones, countdown and victory sounds.", "أصوات الإجابة والعد التنازلي والفوز."))}</p></div>
                <button class="switch" role="switch" aria-checked="${s.sound}" aria-label="${U.esc(U.t("Sound effects", "المؤثرات الصوتية"))}" data-setting="sound"></button>
              </div>
              <div class="setting-row">
                <div class="meta"><strong>${U.esc(U.t("Notifications", "الإشعارات"))}</strong><p>${U.esc(U.t("Challenges, rewards and match reminders.", "التحديات والمكافآت وتذكير المباريات."))}</p></div>
                <button class="switch" role="switch" aria-checked="${s.notifications}" aria-label="${U.esc(U.t("Notifications", "الإشعارات"))}" data-setting="notifications"></button>
              </div>
              <div class="setting-row">
                <div class="meta"><strong>${U.esc(U.t("Reduce motion", "تقليل الحركة"))}</strong><p>${U.esc(U.t("Disable card floats, confetti and page animations.", "تعطيل حركة البطاقات والقصاصات وانتقالات الصفحات."))}</p></div>
                <button class="switch" role="switch" aria-checked="${s.reduceMotion}" aria-label="${U.esc(U.t("Reduce motion", "تقليل الحركة"))}" data-setting="reduceMotion"></button>
              </div>
              <div class="setting-row">
                <div class="meta"><strong>${U.esc(U.t("Language", "اللغة"))}</strong><p>${U.esc(U.t("Full interface language and text direction.", "لغة الواجهة الكاملة واتجاه النص."))}</p></div>
                <div class="lang-choice">
                  <button class="chip ${I18n.lang === "en" ? "is-active" : ""}" data-lang="en">English</button>
                  <button class="chip ${I18n.lang === "ar" ? "is-active" : ""}" data-lang="ar">العربية</button>
                </div>
              </div>
            </div>
          </div>

          <div class="card panel">
            ${Comp.panelHead(U.t("Privacy", "الخصوصية"), U.t("Control who can see your activity", "تحكم بمن يرى نشاطك"))}
            <div class="panel-body">
              <div class="setting-row">
                <div class="meta"><strong>${U.esc(U.t("Show online status", "إظهار حالة الاتصال"))}</strong><p>${U.esc(U.t("Friends can see when you are online.", "يمكن للأصدقاء رؤية حالتك عند الاتصال."))}</p></div>
                <button class="switch" role="switch" aria-checked="${s.showOnline}" aria-label="${U.esc(U.t("Show online status", "إظهار حالة الاتصال"))}" data-setting="showOnline"></button>
              </div>
              <div class="setting-row">
                <div class="meta"><strong>${U.esc(U.t("Public profile", "ملف عام"))}</strong><p>${U.esc(U.t("Anyone can view your stats and badges.", "يمكن لأي شخص رؤية إحصائياتك وشاراتك."))}</p></div>
                <button class="switch" role="switch" aria-checked="${s.publicProfile}" aria-label="${U.esc(U.t("Public profile", "ملف عام"))}" data-setting="publicProfile"></button>
              </div>
            </div>
          </div>
        </div>

        <aside class="stack gap-4">
          <div class="card panel">
            ${Comp.panelHead(U.t("Account", "الحساب"))}
            <div class="panel-body stack gap-3">
              <div class="row gap-3">${U.avatar(I18n.pick(Store.db.mo.me.name), { size: "avatar-lg", hue: Store.db.mo.me.hue })}<div><strong>${U.esc(I18n.pick(Store.db.mo.me.name))}</strong><div class="xs muted">${U.esc(Store.db.mo.me.handle)}</div></div></div>
              <div class="surface" style="padding:12px 14px"><div class="row between"><span class="xs muted">${U.esc(U.t("Level", "المستوى"))}</span><strong>${Store.meLevel().level}</strong></div>
              <div class="row between" style="margin-top:6px"><span class="xs muted">${U.esc(U.t("XP", "XP"))}</span><strong class="mono">${U.n(Store.db.mo.xp)}</strong></div></div>
              <a class="btn btn-secondary btn-block" href="#/mo/profile">${U.icon("user")}${U.esc(U.t("View profile", "عرض الملف"))}</a>
            </div>
          </div>

          <div class="card panel">
            ${Comp.panelHead(U.t("Demo workspace", "مساحة تجريبية"))}
            <div class="panel-body">
              <p class="xs muted">${U.esc(U.t("This build stores your progress locally. Resetting restores the sample season, matches and questions.", "هذا الإصدار يحفظ تقدمك محليًا. إعادة التعيين تستعيد الموسم والمباريات والأسئلة التجريبية."))}</p>
              <button class="btn btn-danger btn-block" style="margin-top:14px" data-reset>${U.icon("refresh")}${U.esc(U.t("Reset all demo data", "إعادة تعيين كل البيانات"))}</button>
            </div>
          </div>
        </aside>
      </div>`;

    return {
      title: U.t("Settings", "الإعدادات"),
      html: Shell.app({ platform: "mo", active: "profile", title: U.t("Settings", "الإعدادات"), crumb: "Mo Games", content: content }),
      mount: function (root) {
        root.querySelectorAll("[data-setting]").forEach((el) => {
          el.addEventListener("click", () => {
            const key = el.getAttribute("data-setting");
            const next = !Store.db.settings[key];
            Store.setSetting(key, next);
            el.setAttribute("aria-checked", String(next));
            UI.toast({ title: next ? U.t("Enabled", "تم التفعيل") : U.t("Disabled", "تم التعطيل"), type: next ? "success" : "info" });
          });
        });
        root.querySelectorAll("[data-lang]").forEach((el) => {
          el.addEventListener("click", () => {
            I18n.set(el.getAttribute("data-lang"));
          });
        });
        const reset = root.querySelector("[data-reset]");
        if (reset) {
          reset.addEventListener("click", () => {
            UI.confirm({
              title: U.t("Reset all demo data?", "إعادة تعيين كل البيانات؟"),
              message: U.t("Your XP, matches, challenges and questions will return to their original demo state.", "سيعود XP ومبارياتك وتحدياتك والأسئلة إلى الحالة التجريبية الأصلية."),
              confirm: U.t("Reset", "إعادة تعيين"),
              danger: true,
            }).then((ok) => {
              if (ok) {
                Store.reset();
                Router.render();
                UI.toast({ title: U.t("Demo data restored", "تم استعادة البيانات"), type: "success" });
              }
            });
          });
        }
      },
    };
  };

  global.MoPages = MoPages;
})(window);
