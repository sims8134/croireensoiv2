/* ============================================================
   CROIRE EN SOI by David Nakamura — script commun
   1. Animation d'ouverture (préloader) — jouée 1x par session
   2. Header & navigation mobile
   3. Reveals au scroll (IntersectionObserver)
   4. Formulaire de contact : validation + honeypot
   5. Dragon d'encre : cote alterne selon la section
   6. Reseaux, e-mail, WhatsApp : href poses depuis les constantes
   7. Barre de progression de lecture
   ============================================================ */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Préloader ---------- */
  var loader = document.getElementById("loader");
  if (loader) {
    var seen = sessionStorage.getItem("ces-intro");
    if (reduced || seen) {
      loader.remove();
      document.body.classList.remove("is-loading");
    } else {
      document.body.classList.add("is-loading");
      // Découpe le titre en lettres animées
      var titleEl = loader.querySelector(".loader-title");
      var text = titleEl.textContent.trim();
      titleEl.textContent = "";
      titleEl.setAttribute("aria-label", text);
      text.split("").forEach(function (ch, i) {
        var s = document.createElement("span");
        s.textContent = ch === " " ? "\u00A0" : ch;
        s.style.transitionDelay = 0.05 * i + "s";
        s.setAttribute("aria-hidden", "true");
        titleEl.appendChild(s);
      });
      requestAnimationFrame(function () {
        setTimeout(function () { loader.classList.add("step-1"); }, 150);   // kanji
        setTimeout(function () { loader.classList.add("step-2"); }, 900);   // titre
        setTimeout(function () { loader.classList.add("step-3"); }, 1900);  // signature + filet
        setTimeout(function () {
          loader.classList.add("is-done");
          document.body.classList.remove("is-loading");
          sessionStorage.setItem("ces-intro", "1");
          setTimeout(function () { loader.remove(); }, 1100);
        }, 3100);
      });
    }
  }

  /* ---------- 2. Header ---------- */
  var header = document.querySelector(".site-header");
  var onScroll = function () {
    header.classList.toggle("is-solid", window.scrollY > 40);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var toggle = document.querySelector(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll(".nav-mobile a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- 2 bis. Menu déroulant « Pratiques » (desktop) ----------
     Motif « disclosure » : bouton + panneau. Le panneau est en [hidden]
     quand il est ferme, donc hors tabulation. Ouverture au survol, au focus
     et sur Fleche bas ; fermeture par Echap, clic exterieur, ou sortie souris
     temporisee a 150 ms — jamais tant que le focus est reste dedans. */
  var drop = document.querySelector(".nav-drop");
  var dropBtn = drop && drop.querySelector(".nav-drop-btn");
  var dropPanel = drop && drop.querySelector(".nav-drop-panel");
  if (drop && dropBtn && dropPanel) {
    var dropLiens = dropPanel.querySelectorAll("a");
    var minuteur = null;

    var ouvrir = function (focusPremier) {
      window.clearTimeout(minuteur);
      dropPanel.hidden = false;
      drop.classList.add("is-open");
      dropBtn.setAttribute("aria-expanded", "true");
      if (focusPremier && dropLiens.length) dropLiens[0].focus();
    };
    var fermer = function (rendreFocus) {
      window.clearTimeout(minuteur);
      dropPanel.hidden = true;
      drop.classList.remove("is-open");
      dropBtn.setAttribute("aria-expanded", "false");
      if (rendreFocus) dropBtn.focus();
    };
    var fermerDiffere = function () {
      window.clearTimeout(minuteur);
      minuteur = window.setTimeout(function () {
        if (!drop.contains(document.activeElement)) fermer(false);
      }, 150);
    };

    drop.addEventListener("mouseenter", function () { ouvrir(false); });
    drop.addEventListener("mouseleave", fermerDiffere);
    drop.addEventListener("focusin", function () { ouvrir(false); });
    drop.addEventListener("focusout", function (e) {
      if (!drop.contains(e.relatedTarget)) fermer(false);
    });
    dropBtn.addEventListener("click", function () {
      if (dropBtn.getAttribute("aria-expanded") === "true") fermer(false);
      else ouvrir(false);
    });
    drop.addEventListener("keydown", function (e) {
      var i = Array.prototype.indexOf.call(dropLiens, document.activeElement);
      if (e.key === "Escape") { e.preventDefault(); fermer(true); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (i < 0) ouvrir(true);
        else dropLiens[(i + 1) % dropLiens.length].focus();
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (i < 0) { ouvrir(true); dropLiens[dropLiens.length - 1].focus(); }
        else if (i === 0) dropBtn.focus();
        else dropLiens[i - 1].focus();
        return;
      }
      if (i >= 0 && e.key === "Home") { e.preventDefault(); dropLiens[0].focus(); }
      if (i >= 0 && e.key === "End") { e.preventDefault(); dropLiens[dropLiens.length - 1].focus(); }
    });
    document.addEventListener("click", function (e) {
      if (!drop.contains(e.target)) fermer(false);
    });
  }

  /* ---------- 3. Reveals ---------- */
  var rvs = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    rvs.forEach(function (el) { io.observe(el); });
  } else {
    rvs.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- 4. Formulaire ---------- */
  var form = document.getElementById("contact-form");
  if (form) {
    var status = form.querySelector(".form-status");
    var setErr = function (name, on) {
      var f = form.querySelector('[name="' + name + '"]');
      if (f) f.closest(".field").classList.toggle("is-invalid", on);
    };
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      // Honeypot : si rempli, on ignore silencieusement (bot)
      if (form.querySelector('[name="website"]').value) return;

      var name = form.nom.value.trim();
      var mail = form.email.value.trim();
      var msg = form.message.value.trim();
      var okName = name.length >= 2;
      var okMail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail);
      var okMsg = msg.length >= 10;
      setErr("nom", !okName); setErr("email", !okMail); setErr("message", !okMsg);
      if (!(okName && okMail && okMsg)) return;

      /* MODIFIER — envoi du formulaire :
         Option A (recommandée) : service type Formspree / Web3Forms.
           1. Créer un formulaire pointant vers contact@croireensoi.fr
           2. Remplacer ENDPOINT ci-dessous par l'URL fournie, décommenter fetch().
         Option B (repli actuel) : ouverture du client mail de l'utilisateur. */
      var ENDPOINT = ""; // ex. "https://formspree.io/f/XXXXXXX"
      if (ENDPOINT) {
        fetch(ENDPOINT, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form)
        }).then(function (r) {
          status.textContent = r.ok
            ? "Merci, votre message est bien envoyé. Réponse sous 48 h."
            : "L'envoi a échoué. Écrivez-nous directement : contact@croireensoi.fr";
          if (r.ok) form.reset();
        }).catch(function () {
          status.textContent = "L'envoi a échoué. Écrivez-nous directement : contact@croireensoi.fr";
        });
      } else {
        var pratique = form.pratique ? form.pratique.value : "";
        var body = encodeURIComponent(msg + "\n\n— " + name + (pratique ? " · Pratique : " + pratique : ""));
        window.location.href = "mailto:contact@croireensoi.fr?subject=" +
          encodeURIComponent("Contact — Croire en Soi") + "&body=" + body;
        status.textContent = "Votre client mail va s'ouvrir. Sinon : contact@croireensoi.fr";
      }
    });
  }

  /* ---------- Héros : éventail des éléments ---------- */
  var zone = document.getElementById("respire-zone");
  var rbtn = document.getElementById("respire-btn");
  if (zone && rbtn) {
    var petales = zone.querySelectorAll(".petale");
    var setOpen = function (open) {
      zone.classList.toggle("is-open", open);
      rbtn.setAttribute("aria-expanded", open ? "true" : "false");
      petales.forEach(function (a) { a.tabIndex = open ? 0 : -1; });
    };
    rbtn.addEventListener("click", function () {
      setOpen(!zone.classList.contains("is-open"));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  /* ---------- Dragon d'encre : cote alterne selon la section ----------
     Plus de trace anime ni de coloration : une image par bord, dont une seule
     est visible a la fois. Le cote est fixe par le rang de la section claire
     (1re a droite, 2e a gauche, etc.), donc il ne saute pas quand on remonte.
     Rien ne s'affiche tant que le heros est a l'ecran, ni sur fond sombre. */
  var dragonD = document.querySelector(".dragon--droite");
  var dragonG = document.querySelector(".dragon--gauche");
  if (dragonD && dragonG) {
    var heros = document.querySelector(".hero");
    var sections = document.querySelectorAll("main .section");
    var hMenu = header ? header.offsetHeight : 0;

    // Cote pre-calcule par section : null pour les sections sombres.
    var cotes = [], rang = 0;
    Array.prototype.forEach.call(sections, function (sec, i) {
      if (sec.classList.contains("section--dark")) { cotes[i] = null; return; }
      cotes[i] = (rang % 2 === 0) ? dragonG : dragonD;   /* on commence a gauche */
      rang++;
    });

    var courante = -1;
    var herosVisible = function () {
      return heros ? heros.getBoundingClientRect().bottom > hMenu : false;
    };
    var rendre = function () {
      var cible = (courante > -1 && !herosVisible()) ? cotes[courante] : null;
      dragonD.classList.toggle("is-visible", cible === dragonD);
      dragonG.classList.toggle("is-visible", cible === dragonG);
    };

    if ("IntersectionObserver" in window && sections.length) {
      var parts = [];
      var io = new IntersectionObserver(function (entrees) {
        entrees.forEach(function (e) {
          var i = Array.prototype.indexOf.call(sections, e.target);
          if (i > -1) parts[i] = e.isIntersecting ? e.intersectionRatio : 0;
        });
        var meilleur = -1, max = 0;
        for (var i = 0; i < sections.length; i++) {
          if ((parts[i] || 0) > max) { max = parts[i]; meilleur = i; }
        }
        courante = meilleur;
        rendre();
      }, { rootMargin: "-" + hMenu + "px 0px 0px 0px", threshold: [0.25, 0.5, 0.75] });
      Array.prototype.forEach.call(sections, function (sec) { io.observe(sec); });
    }

    // Garde-fou : l'observateur ne se declenche pas a chaque pixel, or le
    // dragon doit disparaitre des que le heros revient a l'ecran.
    var enAttente = false;
    var surScroll = function () {
      if (enAttente) return;
      enAttente = true;
      requestAnimationFrame(function () { enAttente = false; rendre(); });
    };
    window.addEventListener("scroll", surScroll, { passive: true });
    window.addEventListener("resize", function () {
      hMenu = header ? header.offsetHeight : 0;
      rendre();
    });
    rendre();
  }

  /* ---------- Reseaux, e-mail et WhatsApp (CdC 6.8, 9.3) ----------
     Source unique des adresses : ne rien ecrire dans le HTML. Tant qu'une
     constante est vide, l'icone garde le repli inscrit dans le balisage —
     contact.html — donc jamais de lien « # », et ce repli vaut aussi quand
     JavaScript ne s'execute pas. */
  var SOCIAL_INSTAGRAM = "";                       /* MODIFIER */
  var SOCIAL_FACEBOOK  = "";                       /* MODIFIER */
  var WHATSAPP_NUMBER  = "";                       /* MODIFIER : format international sans +, ex. 33612345678 */
  var EMAIL            = "contact@croireensoi.fr"; /* MODIFIER */

  var poserLien = function (cle, url) {
    if (!url) return;
    document.querySelectorAll("[data-social=" + JSON.stringify(cle) + "]").forEach(function (a) {
      a.setAttribute("href", url);
      if (url.indexOf("mailto:") !== 0) {
        a.setAttribute("rel", "noopener");
        a.setAttribute("target", "_blank");
      }
    });
  };
  poserLien("instagram", SOCIAL_INSTAGRAM);
  poserLien("facebook", SOCIAL_FACEBOOK);
  poserLien("whatsapp", WHATSAPP_NUMBER ? "https://wa.me/" + WHATSAPP_NUMBER : "");
  poserLien("email", EMAIL ? "mailto:" + EMAIL : "");

  /* ---------- Barre de progression de lecture ---------- */
  var barre = document.querySelector(".barre-lecture");
  if (barre) {
    var barreEnAttente = false;
    var majBarre = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      barre.style.transform = "scaleX(" + p + ")";
    };
    window.addEventListener("scroll", function () {
      if (barreEnAttente) return;
      barreEnAttente = true;
      requestAnimationFrame(function () { barreEnAttente = false; majBarre(); });
    }, { passive: true });
    window.addEventListener("resize", majBarre);
    majBarre();
  }

  /* ---------- Année du footer ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
