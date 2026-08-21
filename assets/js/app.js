/* =============================================================================
   CBRE Immobilier - comportements front
   Reproduit les interactions du site : scrollspy du menu d'ancres, reveal du
   telephone, favoris, onglets de selection, bandeau cookies, barre mobile.
   ============================================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------------
     Hauteur du header fixe -> --header-h
     Le header change de hauteur selon le viewport (la .navbar-top disparait en
     mobile) et selon le chargement des polices. Tout ce qui doit se caler
     dessous (padding du body, menu d'ancres, colonne carte) lit cette variable.
     --------------------------------------------------------------------------- */
  function initHeaderOffset() {
    var header = document.querySelector('header.fixed-top');
    if (!header) return;

    function sync() {
      document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
    }

    sync();
    window.addEventListener('resize', sync);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sync);
  }

  /* ---------------------------------------------------------------------------
     Menu d'ancres de la page annonce (.section-menu .sliding-line)
     Surligne l'onglet dont la section est visible + scroll doux compense.
     --------------------------------------------------------------------------- */
  function initSectionMenu() {
    var menu = document.querySelector('.section-menu');
    if (!menu) return;

    var links = Array.prototype.slice.call(menu.querySelectorAll('.sliding-line'));
    var targets = links
      .map(function (a) { return document.querySelector(a.getAttribute('href')); })
      .filter(Boolean);
    if (!targets.length) return;

    // Hauteur a compenser : header fixe + menu d'ancres sticky
    function offset() {
      var header = document.querySelector('header.fixed-top');
      return (header ? header.offsetHeight : 0) + menu.offsetHeight + 8;
    }

    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        var target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.pageYOffset - offset(),
          behavior: 'smooth'
        });
      });
    });

    function sync() {
      var line = offset() + 4;
      var active = targets[0];
      targets.forEach(function (t) {
        if (t.getBoundingClientRect().top <= line) active = t;
      });
      links.forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === '#' + active.id);
      });
    }

    // Le calcul est limite a une frame par scroll. Dans un onglet masque
    // requestAnimationFrame ne tire pas : on relache le verrou et on resynchronise
    // au retour sur la page, sinon le surlignage resterait fige.
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { sync(); ticking = false; });
    }, { passive: true });

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState !== 'visible') return;
      ticking = false;
      sync();
    });

    sync();
  }

  /* ---------------------------------------------------------------------------
     "Afficher le numero" - devoile le telephone du consultant
     --------------------------------------------------------------------------- */
  function initPhoneReveal() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-phone]');
      if (!btn) return;
      e.preventDefault();
      var number = btn.getAttribute('data-phone');
      var link = document.createElement('a');
      link.href = 'tel:' + number.replace(/\s/g, '');
      link.className = btn.className;
      link.textContent = number;
      btn.replaceWith(link);
    });
  }

  /* ---------------------------------------------------------------------------
     Favoris - persistance locale, comme le compteur du header
     --------------------------------------------------------------------------- */
  var FAV_KEY = 'cbre.favoris';

  function readFavorites() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; }
    catch (err) { return []; }
  }

  function initFavorites() {
    var favorites = readFavorites();

    function paint() {
      document.querySelectorAll('[data-fav-id]').forEach(function (btn) {
        var on = favorites.indexOf(btn.getAttribute('data-fav-id')) !== -1;
        btn.setAttribute('aria-pressed', String(on));
        btn.textContent = on ? '♥' : '♡';
      });
      var counter = document.querySelector('[data-fav-count]');
      if (counter) counter.textContent = favorites.length ? '(' + favorites.length + ')' : '';
    }

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-fav-id]');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();               // ne pas suivre le lien de la carte
      var id = btn.getAttribute('data-fav-id');
      var i = favorites.indexOf(id);
      if (i === -1) favorites.push(id); else favorites.splice(i, 1);
      try { localStorage.setItem(FAV_KEY, JSON.stringify(favorites)); } catch (err) { /* mode prive */ }
      paint();
    });

    paint();
  }

  /* ---------------------------------------------------------------------------
     Onglets "Selection de locaux professionnels" (accueil)
     --------------------------------------------------------------------------- */
  function initTabs() {
    document.querySelectorAll('.tab-selector').forEach(function (group) {
      group.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-tab]');
        if (!btn) return;
        var name = btn.getAttribute('data-tab');
        group.querySelectorAll('button[data-tab]').forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
        document.querySelectorAll('[data-tab-panel]').forEach(function (panel) {
          panel.hidden = panel.getAttribute('data-tab-panel') !== name;
        });
      });
    });
  }

  /* ---------------------------------------------------------------------------
     Bandeau cookies - choix memorise
     --------------------------------------------------------------------------- */
  function initCookieBar() {
    var bar = document.querySelector('.cookie-bar');
    if (!bar) return;
    var CONSENT_KEY = 'cbre.consent';

    var stored = null;
    try { stored = localStorage.getItem(CONSENT_KEY); } catch (err) { /* mode prive */ }
    if (stored) return;

    bar.hidden = false;
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-consent]');
      if (!btn) return;
      try { localStorage.setItem(CONSENT_KEY, btn.getAttribute('data-consent')); } catch (err) { /* mode prive */ }
      bar.hidden = true;
    });
  }

  /* ---------------------------------------------------------------------------
     Barre d'action mobile de l'annonce : apparait apres la galerie
     --------------------------------------------------------------------------- */
  function initMobileBar() {
    var bar = document.querySelector('.mobile-action-bar');
    var trigger = document.querySelector('.image-zone');
    if (!bar || !trigger) return;

    var observer = new IntersectionObserver(function (entries) {
      bar.classList.toggle('is-visible', !entries[0].isIntersecting);
    }, { rootMargin: '-120px 0px 0px 0px' });
    observer.observe(trigger);
  }

  /* ---------------------------------------------------------------------------
     Formulaire de contact - maquette, pas d'envoi reel
     --------------------------------------------------------------------------- */
  function initContactForm() {
    document.querySelectorAll('form[data-demo-form]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!form.reportValidity()) return;
        var note = form.querySelector('[data-form-feedback]');
        if (note) {
          note.hidden = false;
          note.textContent = 'Maquette : le formulaire n’envoie rien. Brancher ici l’API de contact.';
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeaderOffset();
    initSectionMenu();
    initPhoneReveal();
    initFavorites();
    initTabs();
    initCookieBar();
    initMobileBar();
    initContactForm();
  });
})();
