/* ==========================================================================
   Demo data layer
   NOTE: This is a front-end prototype with no backend attached. All records
   below are deterministic sample data seeded once into localStorage, so the
   UI is fully interactive. Swap Store adapter calls for real API endpoints
   when wiring the existing services.
   ========================================================================== */
(function (global) {
  "use strict";

  const P = (en, ar) => ({ en: en, ar: ar });

  const players = [
    { id: "p1", name: P("Omar Khaled", "عمر خالد"), handle: "@omarkhaled", strength: 0.82, hue: 210, country: "EG" },
    { id: "p2", name: P("Yousef Adel", "يوسف عادل"), handle: "@yousefadel", strength: 0.78, hue: 268, country: "EG" },
    { id: "p3", name: P("Karim Mostafa", "كريم مصطفى"), handle: "@karimm", strength: 0.74, hue: 150, country: "EG" },
    { id: "p4", name: P("Ahmed Samir", "أحمد سمير"), handle: "@ahmedsamir", strength: 0.69, hue: 26, country: "EG" },
    { id: "p5", name: P("Hassan Nabil", "حسن نبيل"), handle: "@hassannabil", strength: 0.63, hue: 330, country: "EG" },
    { id: "p6", name: P("Seif Hassan", "سيف حسن"), handle: "@seifh", strength: 0.71, hue: 190, country: "EG" },
    { id: "p7", name: P("Tarek Ibrahim", "طارق إبراهيم"), handle: "@tarekib", strength: 0.58, hue: 45, country: "EG" },
    { id: "p8", name: P("Mahmoud Fathy", "محمود فتحي"), handle: "@mahmoudf", strength: 0.55, hue: 12, country: "EG" },
  ];

  function circleRounds(ids) {
    const n = ids.length;
    let list = ids.slice();
    const rounds = [];
    for (let r = 0; r < n - 1; r++) {
      const pairs = [];
      for (let i = 0; i < n / 2; i++) {
        const a = list[i];
        const b = list[n - 1 - i];
        pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
      }
      rounds.push(pairs);
      list = [list[0], list[n - 1]].concat(list.slice(1, n - 1));
    }
    return rounds;
  }

  function goalFor(strength, rng) {
    const r = rng();
    const edge = (strength - 0.5) * 0.22;
    if (r < 0.2 - edge) return 0;
    if (r < 0.46) return 1;
    if (r < 0.7 - edge) return 2;
    if (r < 0.86) return 3;
    if (r < 0.95) return 4;
    return 5;
  }

  function makeLeague() {
    const rng = U.rng(20261111);
    const order = playerOrder(players);
    const rounds = circleRounds(order);
    const byId = {};
    players.forEach((p) => (byId[p.id] = p));

    const shape = [
      { round: 1, md: 1, daysAgo: 41 },
      { round: 1, md: 2, daysAgo: 33 },
      { round: 1, md: 3, daysAgo: 25 },
      { round: 2, md: 1, daysAgo: 13 },
      { round: 2, md: 2, daysAgo: 6 },
      { round: 2, md: 3, daysAgo: -4 },
    ];

    const matchdays = shape.map((meta, idx) => {
      const pairs = rounds[idx];
      const played = meta.daysAgo >= 0;
      const matches = pairs.map((pair, i) => {
        const a = byId[pair[0]];
        const b = byId[pair[1]];
        const sa = played ? goalFor(a.strength, rng) : null;
        const sb = played ? goalFor(b.strength, rng) : null;
        return {
          id: "lm-" + meta.round + "-" + meta.md + "-" + i,
          a: a.id,
          b: b.id,
          scoreA: sa,
          scoreB: sb,
          played: played,
          date: new Date(Date.now() - meta.daysAgo * 86400000 + (17 + i) * 3600000).toISOString(),
        };
      });
      return {
        id: "md-" + meta.round + "-" + meta.md,
        round: meta.round,
        matchday: meta.md,
        played: played,
        matches: matches,
      };
    });

    return { matchdays: matchdays };
  }

  function playerOrder(list) {
    return list.map((p) => p.id);
  }

  function computeTable(matchdays, players, filterRound) {
    const rows = {};
    players.forEach((p) => {
      rows[p.id] = { id: p.id, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0, form: [] };
    });

    matchdays.forEach((md) => {
      if (filterRound && md.round !== filterRound) return;
      md.matches.forEach((m) => {
        if (!m.played) return;
        const a = rows[m.a];
        const b = rows[m.b];
        if (!a || !b) return;
        a.played++; b.played++;
        a.gf += m.scoreA; a.ga += m.scoreB;
        b.gf += m.scoreB; b.ga += m.scoreA;
        if (m.scoreA > m.scoreB) {
          a.won++; b.lost++; a.points += 3;
          a.form.push("w"); b.form.push("l");
        } else if (m.scoreA < m.scoreB) {
          b.won++; a.lost++; b.points += 3;
          b.form.push("w"); a.form.push("l");
        } else {
          a.drawn++; b.drawn++; a.points++; b.points++;
          a.form.push("d"); b.form.push("d");
        }
      });
    });

    return Object.values(rows)
      .map((r) => ({ ...r, gd: r.gf - r.ga }))
      .sort((x, y) => y.points - x.points || y.gd - x.gd || y.gf - x.gf || y.won - x.won);
  }

  function makeCup(league) {
    const table = computeTable(league.matchdays, players, 1);
    const seeds = table.slice(0, 4).map((r) => r.id);
    const rng = U.rng(777001);

    function tie(aId, bId, date, label) {
      let sa = goalFor(byId(aId).strength, rng);
      let sb = goalFor(byId(bId).strength, rng);
      let pens = null;
      if (sa === sb) {
        // Penalty shoot-out decides knockout ties
        const pa = 3 + Math.floor(rng() * 3);
        const pb = 3 + Math.floor(rng() * 3);
        pens = [pa, pa === pb ? pb + 1 : pb];
      }
      return {
        id: label,
        a: aId,
        b: bId,
        scoreA: sa,
        scoreB: sb,
        pens: pens,
        played: true,
        date: date,
      };
    }

    const sf1 = tie(seeds[0], seeds[3], new Date(Date.now() - 19 * 86400000).toISOString(), "cup-sf1");
    const sf2 = tie(seeds[1], seeds[2], new Date(Date.now() - 18 * 86400000).toISOString(), "cup-sf2");
    const w1 = winnerOf(sf1);
    const w2 = winnerOf(sf2);
    const final = tie(w1, w2, new Date(Date.now() - 10 * 86400000).toISOString(), "cup-final");
    const champion = winnerOf(final);
    const runnerUp = champion === final.a ? final.b : final.a;

    return {
      seeds: seeds,
      semifinals: [sf1, sf2],
      final: final,
      champion: champion,
      runnerUp: runnerUp,
    };
  }

  function winnerOf(m) {
    if (m.pens) return m.pens[0] > m.pens[1] ? m.a : m.b;
    return m.scoreA >= m.scoreB ? m.a : m.b;
  }

  function byId(id) {
    return players.find((p) => p.id === id);
  }

  function makeSuper(league, cup) {
    const table = computeTable(league.matchdays, players);
    const leagueChampion = table[0].id;
    let challenger = cup.champion;
    let note = P(
      "Cup champion qualifies as the second participant.",
      "بطل كأس اللمة يتأهل كالمشارك الثاني."
    );
    if (leagueChampion === cup.champion) {
      challenger = cup.runnerUp;
      note = P(
        "Same player won the league and the cup — the cup runner-up takes the second spot.",
        "نفس اللاعب فاز بالدوري والكأس — يتأهل وصيف الكأس للمركز الثاني."
      );
    }
    return {
      leagueChampion: leagueChampion,
      cupChampion: cup.champion,
      participantA: leagueChampion,
      participantB: challenger,
      note: note,
      date: U.daysFromNow(2),
      status: "upcoming",
    };
  }

  function makeMoGames() {
    const rng = U.rng(424242);
    const me = { id: "me", name: P("Mo Adel", "محمد عادل"), handle: "@moadel", hue: 258 };

    const rivals = [
      { id: "r1", name: P("Ziad Hany", "زياد هاني"), handle: "@ziadhany", hue: 200, xp: 32260, wins: 214, losses: 96, weeklyXp: 1840, online: "ingame", game: "Football Quiz" },
      { id: "r2", name: P("Seif Hassan", "سيف حسن"), handle: "@seifh", hue: 190, xp: 29140, wins: 198, losses: 104, weeklyXp: 1620, online: "online", game: "Football Quiz" },
      { id: "r3", name: P("Nour El Din", "نور الدين"), handle: "@nour", hue: 320, xp: 27600, wins: 185, losses: 110, weeklyXp: 1495, online: "offline", game: "Guess the Player" },
      { id: "r4", name: P("Omar Khaled", "عمر خالد"), handle: "@omarkhaled", hue: 210, xp: 24820, wins: 176, losses: 118, weeklyXp: 1320, online: "online", game: "Football Quiz" },
      { id: "r5", name: P("Yousef Adel", "يوسف عادل"), handle: "@yousefadel", hue: 268, xp: 23150, wins: 162, losses: 120, weeklyXp: 1105, online: "ingame", game: "Logo Quiz" },
      { id: "r6", name: P("Karim Mostafa", "كريم مصطفى"), handle: "@karimm", hue: 150, xp: 21890, wins: 151, losses: 126, weeklyXp: 980, online: "online", game: "Football Quiz" },
      { id: "r7", name: P("Hassan Nabil", "حسن نبيل"), handle: "@hassannabil", hue: 330, xp: 19420, wins: 138, losses: 129, weeklyXp: 870, online: "offline", game: "Guess the Player" },
      { id: "r8", name: P("Ahmed Samir", "أحمد سمير"), handle: "@ahmedsamir", hue: 26, xp: 18110, wins: 127, losses: 131, weeklyXp: 760, online: "online", game: "Football Quiz" },
      { id: "r9", name: P("Tarek Ibrahim", "طارق إبراهيم"), handle: "@tarekib", hue: 45, xp: 16780, wins: 118, losses: 134, weeklyXp: 655, online: "offline", game: "Logo Quiz" },
      { id: "r10", name: P("Mahmoud Fathy", "محمود فتحي"), handle: "@mahmoudf", hue: 12, xp: 15240, wins: 109, losses: 139, weeklyXp: 540, online: "ingame", game: "Football Quiz" },
      { id: "r11", name: P("Amr Saleh", "عمرو صالح"), handle: "@amrsaleh", hue: 84, xp: 13980, wins: 101, losses: 142, weeklyXp: 460, online: "offline", game: "Football Quiz" },
      { id: "r12", name: P("Khaled Rashad", "خالد رشاد"), handle: "@khaledr", hue: 236, xp: 12410, wins: 94, losses: 145, weeklyXp: 390, online: "online", game: "Guess the Player" },
    ];

    const games = [
      { id: "quiz", name: P("Football Quiz", "تحدي كرة القدم"), icon: "ball" },
      { id: "guess", name: P("Guess the Player", "خمّن اللاعب"), icon: "user" },
      { id: "logo", name: P("Club Logo Quiz", "شعارات الأندية"), icon: "shield" },
      { id: "trivia", name: P("World Cup Trivia", "معلومات المونديال"), icon: "trophy" },
    ];

    const scores = [
      [9, 6], [7, 8], [10, 4], [8, 5], [6, 9], [9, 7], [10, 8], [5, 7], [8, 3], [9, 6],
    ];
    const modes = ["quick", "friend", "room", "quick", "custom", "quick", "friend", "quick", "room", "quick"];

    const matches = scores.map((pair, i) => {
      const rival = rivals[i % 10];
      return {
        id: "mm-" + (i + 1),
        opponent: rival.id,
        scoreMe: pair[0],
        scoreOpp: pair[1],
        mode: modes[i],
        game: games[i % 3].id,
        date: new Date(Date.now() - (i * 2 + 1) * 86400000 - (i + 2) * 3600000).toISOString(),
      };
    });

    return {
      me: me,
      rivals: rivals,
      games: games,
      matches: matches,
      stats: { matches: 294, wins: 186, losses: 108, streak: 4, bestStreak: 11 },
      xp: 24820,
      seasonPoints: 1320,
      rank: 4,
      challenges: [
        { id: "ch-1", from: "r1", mode: "quick", game: "quiz", status: "pending", expires: U.daysFromNow(0.2) },
        { id: "ch-2", from: "r6", mode: "friend", game: "guess", status: "pending", expires: U.daysFromNow(0.6) },
        { id: "ch-3", from: "r9", mode: "custom", game: "logo", status: "pending", expires: U.daysFromNow(1) },
      ],
    };
  }

  const questions = [
    {
      id: "q1", cat: "World Cup", diff: "easy",
      q: P("Which country won the 2022 FIFA World Cup?", "أي دولة فازت بكأس العالم 2022؟"),
      options: [P("Argentina", "الأرجنتين"), P("France", "فرنسا"), P("Brazil", "البرازيل"), P("Germany", "ألمانيا")],
      answer: 0,
    },
    {
      id: "q2", cat: "Clubs", diff: "medium",
      q: P("Which club has won the most UEFA Champions League titles?", "أي نادٍ فاز بأكبر عدد من ألقاب دوري أبطال أوروبا؟"),
      options: [P("AC Milan", "ميلان"), P("Real Madrid", "ريال مدريد"), P("Bayern Munich", "بايرن ميونخ"), P("Liverpool", "ليفربول")],
      answer: 1,
    },
    {
      id: "q3", cat: "Players", diff: "easy",
      q: P("Who is the all-time top scorer in the Premier League?", "من هو الهداف التاريخي للدوري الإنجليزي؟"),
      options: [P("Wayne Rooney", "واين روني"), P("Harry Kane", "هاري كين"), P("Alan Shearer", "ألان شيرر"), P("Sergio Aguero", "سيرجيو أجويرو")],
      answer: 2,
    },
    {
      id: "q4", cat: "Africa", diff: "medium",
      q: P("Which country has won the most Africa Cup of Nations titles?", "أي منتخب فاز بأكبر عدد من بطولات كأس أمم أفريقيا؟"),
      options: [P("Ghana", "غانا"), P("Cameroon", "الكاميرون"), P("Nigeria", "نيجيريا"), P("Egypt", "مصر")],
      answer: 3,
    },
    {
      id: "q5", cat: "World Cup", diff: "hard",
      q: P("Who scored the 'Hand of God' goal in 1986?", "من سجل هدف «يد الله» عام 1986؟"),
      options: [P("Diego Maradona", "دييجو مارادونا"), P("Pelé", "بيليه"), P("Zico", "زيكو"), P("Michel Platini", "ميشيل بلاتيني")],
      answer: 0,
    },
    {
      id: "q6", cat: "Clubs", diff: "medium",
      q: P("Which stadium is the home of Liverpool FC?", "ما هو ملعب نادي ليفربول؟"),
      options: [P("Old Trafford", "أولد ترافورد"), P("Anfield", "أنفيلد"), P("Emirates", "الإمارات"), P("Stamford Bridge", "ستامفورد بريدج")],
      answer: 1,
    },
    {
      id: "q7", cat: "Players", diff: "hard",
      q: P("Which player has won the most Ballon d'Or awards?", "من هو اللاعب الأكثر فوزًا بالكرة الذهبية؟"),
      options: [P("Cristiano Ronaldo", "كريستيانو رونالدو"), P("Michel Platini", "ميشيل بلاتيني"), P("Lionel Messi", "ليونيل ميسي"), P("Johan Cruyff", "يوهان كرويف")],
      answer: 2,
    },
    {
      id: "q8", cat: "Egypt", diff: "easy",
      q: P("Which Egyptian club is known as 'The Red Devils'?", "أي نادٍ مصري يُعرف بـ«الشياطين الحمر»؟"),
      options: [P("Zamalek", "الزمالك"), P("Al Ahly", "الأهلي"), P("Ismaily", "الإسماعيلي"), P("Pyramids", "بيراميدز")],
      answer: 1,
    },
    {
      id: "q9", cat: "World Cup", diff: "medium",
      q: P("How many teams will play at the 2026 World Cup?", "كم عدد المنتخبات في كأس العالم 2026؟"),
      options: [P("32", "32"), P("40", "40"), P("48", "48"), P("56", "56")],
      answer: 2,
    },
    {
      id: "q10", cat: "Clubs", diff: "easy",
      q: P("Which club plays at Camp Nou?", "أي نادٍ يلعب في كامب نو؟"),
      options: [P("Real Madrid", "ريال مدريد"), P("Barcelona", "برشلونة"), P("Atletico Madrid", "أتلتيكو مدريد"), P("Valencia", "فالنسيا")],
      answer: 1,
    },
    {
      id: "q11", cat: "Players", diff: "medium",
      q: P("Who won the Golden Boot at the 2022 World Cup?", "من فاز بالحذاء الذهبي في كأس العالم 2022؟"),
      options: [P("Kylian Mbappé", "كيليان مبابي"), P("Lionel Messi", "ليونيل ميسي"), P("Olivier Giroud", "أوليفيه جيرو"), P("Julian Alvarez", "خوليان ألفاريز")],
      answer: 0,
    },
    {
      id: "q12", cat: "Africa", diff: "hard",
      q: P("Which African player won the Ballon d'Or in 1995?", "من هو اللاعب الأفريقي الذي فاز بالكرة الذهبية عام 1995؟"),
      options: [P("Samuel Eto'o", "صامويل إيتو"), P("Didier Drogba", "ديدييه دروجبا"), P("George Weah", "جورج ويا"), P("Abedi Pelé", "عبيدي بيليه")],
      answer: 2,
    },
  ];

  const achievements = [
    { id: "a1", icon: "flame", tier: "gold", title: P("Hot Streak", "سلسلة نارية"), desc: P("Win 10 matches in a row", "افز بـ10 مباريات متتالية"), unlocked: true, progress: 10, goal: 10 },
    { id: "a2", icon: "sword", tier: "purple", title: P("First Blood", "أول انتصار"), desc: P("Win your first 1v1 match", "افز بأول مباراة 1 ضد 1"), unlocked: true, progress: 1, goal: 1 },
    { id: "a3", icon: "trophy", tier: "gold", title: P("Centurion", "المئوية"), desc: P("Reach 100 career wins", "حقق 100 انتصار"), unlocked: true, progress: 186, goal: 100 },
    { id: "a4", icon: "target", tier: "cyan", title: P("Sharpshooter", "القناص"), desc: P("Answer 25 questions correctly in a row", "أجب على 25 سؤالًا بشكل صحيح متتالي"), unlocked: true, progress: 25, goal: 25 },
    { id: "a5", icon: "bolt", tier: "purple", title: P("Speed Demon", "سريع البديهة"), desc: P("Answer 5 questions in under 3 seconds each", "أجب على 5 أسئلة في أقل من 3 ثوانٍ"), unlocked: false, progress: 3, goal: 5 },
    { id: "a6", icon: "crown", tier: "gold", title: P("Top 100", "أفضل 100"), desc: P("Finish a season inside the global top 100", "أنهِ الموسم ضمن أفضل 100 عالميًا"), unlocked: false, progress: 0, goal: 1 },
    { id: "a7", icon: "users", tier: "green", title: P("Squad Goals", "روح الفريق"), desc: P("Play 10 matches with friends", "العب 10 مباريات مع أصدقائك"), unlocked: true, progress: 10, goal: 10 },
    { id: "a8", icon: "medal", tier: "gold", title: P("Perfect Round", "الجولة المثالية"), desc: P("Score a flawless 10/10 round", "احصل على 10/10 في جولة كاملة"), unlocked: false, progress: 8, goal: 10 },
  ];

  const announcements = [
    {
      id: "an1", tag: "Season 04", date: U.daysFromNow(-1),
      title: P("Season 04 is live — new XP curve & weekly ladder", "الموسم الرابع انطلق — نظام XP جديد وسلّم أسبوعي"),
      body: P("Climb faster with rebalanced XP, weekly leaderboards and new streak rewards.", "اصعد أسرع مع XP متوازن، لوحات أسبوعية ومكافآت سلاسل جديدة."),
      accent: "purple",
    },
    {
      id: "an2", tag: "Tahady", date: U.daysFromNow(-2),
      title: P("Super El Nokhba — the final is set", "سوبر النخبة — تشكيل النهائي جاهز"),
      body: P("The league leader meets the cup champion for the season's ultimate title.", "متصدر الدوري يواجه بطل الكأس على لقب الموسم الأغلى."),
      accent: "green",
    },
    {
      id: "an3", tag: "Update", date: U.daysFromNow(-4),
      title: P("Faster matchmaking in Quick Match", "مطابقة أسرع في المباراة السريعة"),
      body: P("Matchmaking now pairs you within seconds based on level and region.", "المطابقة الآن تجد لك منافسًا في ثوانٍ حسب المستوى والمنطقة."),
      accent: "cyan",
    },
  ];

  const activity = [
    { id: "ac1", type: "win", text: P("Mo Adel defeated Ziad Hany 9–6 in Football Quiz", "محمد عادل تغلب على زياد هاني 9–6 في تحدي كرة القدم"), time: U.daysFromNow(-0.02) },
    { id: "ac2", type: "tournament", text: P("Seif Hassan advanced to the كأس اللمة final", "سيف حسن تأهل لنهائي كأس اللمة"), time: U.daysFromNow(-0.2) },
    { id: "ac3", type: "achievement", text: P("Omar Khaled unlocked the 'Hot Streak' badge", "عمر خالد حصل على شارة السلسلة النارية"), time: U.daysFromNow(-0.4) },
    { id: "ac4", type: "win", text: P("Nour El Din defeated Karim Mostafa 10–8", "نور الدين تغلب على كريم مصطفى 10–8"), time: U.daysFromNow(-0.7) },
    { id: "ac5", type: "tournament", text: P("Round 2 of الدوري العام resumes this week", "الجولة الثانية من الدوري العام تستأنف هذا الأسبوع"), time: U.daysFromNow(-1.1) },
  ];

  const notifications = [
    { id: "n1", icon: "sword", title: P("New challenge from Ziad Hany", "تحدٍ جديد من زياد هاني"), body: P("Football Quiz · 10 questions · starts now", "تحدي كرة القدم · 10 أسئلة · يبدأ الآن"), time: U.daysFromNow(-0.01), unread: true },
    { id: "n2", icon: "trophy", title: P("Weekly ladder reward", "مكافأة السلّم الأسبوعي"), body: P("You earned 250 XP for finishing top 10", "حصلت على 250 XP لوصولك لأفضل 10"), time: U.daysFromNow(-0.3), unread: true },
    { id: "n3", icon: "ball", title: P("Tahady El Lamma — matchday reminder", "تحدي اللمة — تذكير بالجولة"), body: P("Round 2, matchday 3 kicks off in 4 days", "الجولة الثانية، الجولة 3 تبدأ بعد 4 أيام"), time: U.daysFromNow(-0.8), unread: false },
    { id: "n4", icon: "sparkles", title: P("Achievement unlocked", "تم فتح إنجاز"), body: P("Sharpshooter — 25 correct answers in a row", "القناص — 25 إجابة صحيحة متتالية"), time: U.daysFromNow(-2), unread: false },
  ];

  const friends = [
    { id: "r2", online: "ingame", last: P("In a match", "في مباراة") },
    { id: "r4", online: "online", last: P("Online", "متصل") },
    { id: "r6", online: "online", last: P("Online", "متصل") },
    { id: "r8", online: "online", last: P("Online", "متصل") },
    { id: "r12", online: "online", last: P("Online", "متصل") },
    { id: "r1", online: "ingame", last: P("In a match", "في مباراة") },
    { id: "r3", online: "offline", last: P("2h ago", "منذ ساعتين") },
    { id: "r5", online: "ingame", last: P("In a match", "في مباراة") },
    { id: "r7", online: "offline", last: P("Yesterday", "أمس") },
    { id: "r9", online: "offline", last: P("2d ago", "منذ يومين") },
    { id: "r10", online: "ingame", last: P("In a match", "في مباراة") },
    { id: "r11", online: "offline", last: P("4d ago", "منذ 4 أيام") },
  ];

  const settings = {
    sound: true,
    notifications: true,
    reduceMotion: false,
    showOnline: true,
    publicProfile: true,
    language: "en",
  };

  global.Data = {
    seed: function () {
      const league = makeLeague();
      const cup = makeCup(league);
      const mo = makeMoGames();
      return {
        version: 3,
        createdAt: new Date().toISOString(),
        players: players,
        league: league,
        cup: cup,
        superCup: makeSuper(league, cup),
        mo: mo,
        questions: questions,
        achievements: achievements,
        announcements: announcements,
        activity: activity,
        notifications: notifications,
        friends: friends,
        settings: settings,
        session: { levelUp: false },
      };
    },
    computeTable: computeTable,
    P: P,
    questions: questions,
  };
})(window);
