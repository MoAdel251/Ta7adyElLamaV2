/* ==========================================================================
   Store — persistence + derived selectors
   ========================================================================== */
(function (global) {
  "use strict";

  const KEY = "moarena.db.v3";

  const Store = {
    db: null,

    init: function () {
      let stored = null;
      try {
        stored = JSON.parse(localStorage.getItem(KEY) || "null");
      } catch (err) {
        stored = null;
      }
      if (!stored || stored.version !== 3) {
        this.db = global.Data.seed();
        this.save();
      } else {
        this.db = stored;
      }
      if (this.db.settings) {
        document.documentElement.classList.toggle("reduce-motion", !!this.db.settings.reduceMotion);
      }
      return this.db;
    },

    save: function () {
      try {
        localStorage.setItem(KEY, JSON.stringify(this.db));
      } catch (err) {
        // Storage full / disabled — the UI still works for this session.
        console.warn("Could not persist demo state", err);
      }
    },

    reset: function () {
      localStorage.removeItem(KEY);
      this.db = global.Data.seed();
      this.save();
    },

    /* ----- Players ----- */
    player: function (id) {
      if (id === "me") {
        const me = this.db.mo.me;
        return {
          id: "me", name: me.name, handle: me.handle, hue: me.hue,
          xp: this.db.mo.xp, wins: this.db.mo.stats.wins, losses: this.db.mo.stats.losses,
          online: "online", isMe: true,
        };
      }
      return this.db.players.find((p) => p.id === id) || null;
    },

    moPlayer: function (id) {
      if (id === "me") return this.player("me");
      return this.db.mo.rivals.find((p) => p.id === id) || null;
    },

    name: function (id) {
      const p = this.moPlayer(id) || this.player(id);
      return p ? global.I18n.pick(p.name) : "—";
    },

    /* ----- Mo Games ----- */
    levelInfo: function (xp) {
      const level = Math.floor(xp / 1000) + 1;
      const start = (level - 1) * 1000;
      return {
        level: level,
        into: xp - start,
        span: 1000,
        pct: Math.round(((xp - start) / 1000) * 100),
        next: level * 1000,
      };
    },

    meLevel: function () {
      return this.levelInfo(this.db.mo.xp);
    },

    winRate: function (wins, losses) {
      return U.pct(wins, wins + losses);
    },

    leaderboard: function (period) {
      const rows = [];
      const me = this.player("me");
      const meRow = {
        id: "me", name: me.name, handle: me.handle, hue: me.hue,
        xp: this.db.mo.xp, wins: this.db.mo.stats.wins, losses: this.db.mo.stats.losses,
        weeklyXp: this.db.mo.seasonPoints, isMe: true,
      };
      rows.push(meRow);
      this.db.mo.rivals.forEach((r) => rows.push({ ...r, isMe: false }));
      const key = period === "weekly" ? "weeklyXp" : "xp";
      rows.sort((a, b) => b[key] - a[key]);
      return rows.map((r, i) => ({ ...r, rank: i + 1, key: key }));
    },

    challenges: function () {
      return this.db.mo.challenges
        .filter((c) => c.status === "pending")
        .map((c) => ({ ...c, player: this.moPlayer(c.from) }))
        .filter((c) => c.player);
    },

    recordMatch: function (result) {
      const mo = this.db.mo;
      const won = result.scoreMe > result.scoreOpp;
      const entry = {
        id: U.uid("mm"),
        opponent: result.opponent || "r1",
        scoreMe: result.scoreMe,
        scoreOpp: result.scoreOpp,
        mode: result.mode || "quick",
        game: result.game || "quiz",
        date: new Date().toISOString(),
      };
      mo.matches.unshift(entry);
      mo.matches = mo.matches.slice(0, 40);
      mo.stats.matches += 1;
      if (won) {
        mo.stats.wins += 1;
        mo.stats.streak = (mo.stats.streak || 0) + 1;
        mo.stats.bestStreak = Math.max(mo.stats.bestStreak, mo.stats.streak);
      } else {
        mo.stats.losses += 1;
        mo.stats.streak = 0;
      }
      const gained = 60 + result.correct * 15 + (won ? 50 : 10);
      mo.xp += gained;
      mo.seasonPoints += Math.round(gained / 2);
      this.db.activity.unshift({
        id: U.uid("ac"),
        type: won ? "win" : "loss",
        text: {
          en: "Mo Adel " + (won ? "defeated " : "lost to ") + this.name(entry.opponent) +
            " " + entry.scoreMe + "–" + entry.scoreOpp + " in Football Quiz",
          ar: "محمد عادل " + (won ? "تغلب على " : "خسر أمام ") + this.name(entry.opponent) +
            " " + entry.scoreMe + "–" + entry.scoreOpp + " في تحدي كرة القدم",
        },
        time: new Date().toISOString(),
      });
      this.db.activity = this.db.activity.slice(0, 12);
      this.save();
      return { gained: gained, won: won, xp: mo.xp };
    },

    addChallenge: function (fromId, mode, game) {
      if (this.db.mo.challenges.some((c) => c.from === fromId && c.status === "pending")) return false;
      this.db.mo.challenges.unshift({
        id: U.uid("ch"),
        from: fromId,
        mode: mode || "friend",
        game: game || "quiz",
        status: "pending",
        expires: U.daysFromNow(1),
      });
      this.save();
      return true;
    },

    declineChallenge: function (id) {
      const c = this.db.mo.challenges.find((x) => x.id === id);
      if (c) c.status = "declined";
      this.save();
    },

    /* ----- Tahady ----- */
    table: function (round) {
      return global.Data.computeTable(this.db.league.matchdays, this.db.players, round);
    },

    playerRow: function (id, round) {
      return this.table(round).find((r) => r.id === id) || null;
    },

    leagueTopScorers: function () {
      const goals = {};
      this.db.league.matchdays.forEach((md) => {
        md.matches.forEach((m) => {
          if (!m.played) return;
          goals[m.a] = (goals[m.a] || 0) + m.scoreA;
          goals[m.b] = (goals[m.b] || 0) + m.scoreB;
        });
      });
      return Object.keys(goals)
        .map((id) => ({ id: id, goals: goals[id] }))
        .sort((a, b) => b.goals - a.goals)
        .slice(0, 5);
    },

    upcomingLeague: function (limit) {
      const out = [];
      this.db.league.matchdays.forEach((md) => {
        md.matches.forEach((m) => {
          if (!m.played) out.push({ ...m, round: md.round, matchday: md.matchday });
        });
      });
      out.sort((a, b) => new Date(a.date) - new Date(b.date));
      return out.slice(0, limit || 4);
    },

    recentLeague: function (limit) {
      const out = [];
      this.db.league.matchdays.forEach((md) => {
        md.matches.forEach((m) => {
          if (m.played) out.push({ ...m, round: md.round, matchday: md.matchday });
        });
      });
      out.sort((a, b) => new Date(b.date) - new Date(a.date));
      return out.slice(0, limit || 4);
    },

    updateMatchScore: function (matchId, scoreA, scoreB) {
      let target = null;
      this.db.league.matchdays.forEach((md) => {
        md.matches.forEach((m) => {
          if (m.id === matchId) target = m;
        });
      });
      if (!target) return false;
      target.scoreA = Number(scoreA);
      target.scoreB = Number(scoreB);
      target.played = true;
      this.refreshDerived();
      return true;
    },

    refreshDerived: function () {
      const table = this.table();
      const cup = this.db.cup;
      let challenger = cup.champion;
      if (table[0].id === cup.champion) challenger = cup.runnerUp;
      this.db.superCup = {
        leagueChampion: table[0].id,
        cupChampion: cup.champion,
        participantA: table[0].id,
        participantB: challenger,
        note: this.db.superCup.note,
        date: this.db.superCup.date,
        status: "upcoming",
      };
      this.save();
    },

    /* ----- Notifications & activity ----- */
    unreadCount: function () {
      return this.db.notifications.filter((n) => n.unread).length;
    },

    markAllRead: function () {
      this.db.notifications.forEach((n) => (n.unread = false));
      this.save();
    },

    addNotification: function (data) {
      this.db.notifications.unshift({
        id: U.uid("n"),
        icon: data.icon || "bell",
        title: { en: data.titleEn, ar: data.titleAr || data.titleEn },
        body: { en: data.bodyEn || "", ar: data.bodyAr || data.bodyEn || "" },
        time: new Date().toISOString(),
        unread: true,
      });
      this.save();
    },

    removeNotification: function (id) {
      this.db.notifications = this.db.notifications.filter((n) => n.id !== id);
      this.save();
    },

    /* ----- Questions ----- */
    upsertQuestion: function (q) {
      const list = this.db.questions;
      const idx = list.findIndex((x) => x.id === q.id);
      if (idx >= 0) list[idx] = q;
      else list.unshift(q);
      this.save();
    },

    deleteQuestion: function (id) {
      this.db.questions = this.db.questions.filter((q) => q.id !== id);
      if (this.db.questions.length === 0) this.db.questions = global.Data.questions.slice();
      this.save();
    },

    /* ----- Settings ----- */
    setSetting: function (key, value) {
      this.db.settings[key] = value;
      if (key === "reduceMotion") {
        document.documentElement.classList.toggle("reduce-motion", !!value);
      }
      this.save();
    },

    resetSettings: function () {
      this.db.settings = { sound: true, notifications: true, reduceMotion: false, showOnline: true, publicProfile: true, language: global.I18n.lang };
      document.documentElement.classList.remove("reduce-motion");
      this.save();
    },
  };

  global.Store = Store;
})(window);
