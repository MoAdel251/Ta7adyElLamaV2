/* ==========================================================================
   Router — hash based SPA routing
   ========================================================================== */
(function (global) {
  "use strict";

  const Router = {
    routes: {},
    current: null,
    _renderToken: 0,

    init: function (routes) {
      this.routes = routes;
      window.addEventListener("hashchange", () => this.render());
      // Delegated internal links for accessibility & scroll reset
      this.render();
    },

    parse: function () {
      const raw = (location.hash || "#/").replace(/^#/, "");
      const qIndex = raw.indexOf("?");
      const path = (qIndex >= 0 ? raw.slice(0, qIndex) : raw) || "/";
      const query = {};
      if (qIndex >= 0) {
        raw
          .slice(qIndex + 1)
          .split("&")
          .forEach((pair) => {
            if (!pair) return;
            const [k, v] = pair.split("=");
            query[decodeURIComponent(k)] = decodeURIComponent(v || "");
          });
      }
      return { path: path.replace(/\/+$/, "") || "/", query: query, hash: raw };
    },

    go: function (path) {
      const next = path.charAt(0) === "#" ? path : "#" + (path.charAt(0) === "/" ? path : "/" + path);
      if (location.hash === next) this.render();
      else location.hash = next;
    },

    render: function () {
      const token = ++this._renderToken;
      const parsed = this.parse();
      const handler = this.routes[parsed.path] || this.routes["*"];
      if (!handler) return;
      this.current = parsed;

      let result;
      try {
        result = handler(parsed.query, parsed) || {};
      } catch (err) {
        console.error("Route render failed", err);
        result = {
          html:
            '<div class="site"><main class="container section"><div class="empty"><div class="empty-icon">' +
            U.icon("x") +
            "</div><h2>" + U.esc(U.t("Something went wrong", "حدث خطأ ما")) +
            "</h2><p>" + U.esc(U.t("Please try again or return home.", "يرجى المحاولة مرة أخرى أو العودة للرئيسية.")) +
            '</p><a class="btn btn-primary" href="#/">' + U.esc(U.t("Back home", "الرئيسية")) + "</a></div></main></div>",
          title: "Error",
        };
      }

      const app = document.getElementById("app");
      app.innerHTML = result.html || "";
      document.title = (result.title ? result.title + " · " : "") + "Mo Arena";
      if (result.mount) {
        try {
          result.mount(app, parsed);
        } catch (err) {
          console.error("Mount failed", err);
        }
      }
      if (global.Shell) Shell.bind(app);
      if (token !== this._renderToken) return;

      // Page transition
      const main = app.querySelector("#main");
      if (main) {
        main.classList.add("page-enter");
        main.setAttribute("tabindex", "-1");
      }
      window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
      if (global.Shell) Shell.syncChrome(parsed.path);
    },
  };

  global.Router = Router;
})(window);
