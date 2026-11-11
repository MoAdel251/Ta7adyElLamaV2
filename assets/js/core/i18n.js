/* ==========================================================================
   i18n — Arabic / English with full RTL support
   ========================================================================== */
(function (global) {
  "use strict";

  const I18n = {
    lang: "en",
    dir: "ltr",

    init: function () {
      const stored = localStorage.getItem("moarena.lang");
      const browser = (navigator.language || "en").toLowerCase();
      this.lang = stored || (browser.indexOf("ar") === 0 ? "ar" : "en");
      this.apply();
    },

    apply: function () {
      this.dir = this.lang === "ar" ? "rtl" : "ltr";
      const html = document.documentElement;
      html.lang = this.lang;
      html.dir = this.dir;
      const desc = document.querySelector('meta[name="description"]');
      if (desc) {
        desc.content =
          this.lang === "ar"
            ? "منصة الألعاب والتحديات الاحترافية — مو جيمز وتحدي اللمة. تحدَّ أصدقاءك، العب مباريات 1 ضد 1، وتابع البطولات والدوري."
            : "The unified competitive gaming ecosystem — Mo Games and Tahady El Lamma. Play real-time 1v1 football games and follow leagues, cups and championships.";
      }
    },

    set: function (lang) {
      this.lang = lang === "ar" ? "ar" : "en";
      localStorage.setItem("moarena.lang", this.lang);
      this.apply();
      document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: this.lang } }));
    },

    toggle: function () {
      this.set(this.lang === "ar" ? "en" : "ar");
    },

    // Pick a bilingual content field
    pick: function (obj) {
      if (obj == null) return "";
      if (typeof obj === "string") return obj;
      return this.lang === "ar" ? obj.ar || obj.en : obj.en;
    },

    // Bilingual inline string helper
    t: function (en, ar) {
      return this.lang === "ar" ? ar : en;
    },
  };

  global.I18n = I18n;
})(window);
