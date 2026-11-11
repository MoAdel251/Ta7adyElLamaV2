/* ==========================================================================
   App bootstrap
   ========================================================================== */
(function (global) {
  "use strict";

  I18n.init();
  Store.init();

  const routes = {
    "/": LandingPage.render,
    "/mo": MoPages.home,
    "/mo/play": MoPages.play,
    "/mo/match": MoPages.match,
    "/mo/live": MoPages.live,
    "/mo/leaderboard": MoPages.leaderboard,
    "/mo/friends": MoPages.friends,
    "/mo/profile": MoPages.profile,
    "/mo/settings": MoPages.settings,
    "/tahady": TahadyPages.home,
    "/tahady/tournaments": TahadyPages.tournaments,
    "/tahady/league": TahadyPages.league,
    "/tahady/cup": TahadyPages.cup,
    "/tahady/super": TahadyPages.super,
    "/tahady/players": TahadyPages.players,
    "/tahady/profile": TahadyPages.profile,
    "/admin": AdminPages.overview,
    "/admin/players": AdminPages.players,
    "/admin/questions": AdminPages.questions,
    "/admin/matches": AdminPages.matches,
    "/admin/tournaments": AdminPages.tournaments,
    "/admin/notifications": AdminPages.notifications,
    "/admin/settings": AdminPages.settings,
    "*": LandingPage.notFound,
  };

  document.addEventListener("langchange", function () {
    // Re-render entire view so every string switches language and direction
    Router.render();
  });

  // Global keyboard shortcuts
  global.addEventListener("keydown", function (e) {
    const target = e.target;
    const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable);
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      UI.openSearch();
    } else if (e.key === "/" && !typing) {
      e.preventDefault();
      UI.openSearch();
    }
  });

  if (!location.hash) {
    history.replaceState(null, "", "#/");
  }

  UI.initDropdowns();
  Router.init(routes);

  // Handle deep links to in-page anchors after SPA mount
  window.addEventListener("load", function () {
    if (!location.hash || location.hash === "#/") {
      const main = document.getElementById("main");
      if (main) main.setAttribute("tabindex", "-1");
    }
  });
})(window);
