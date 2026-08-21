/* =============================================================================
   Socle commun : formatage, règles de données manquantes, état d'URL,
   restitution de la recherche, événements de mesure.
   ============================================================================= */

window.CBRE = (function () {
  'use strict';

  /* ---------------------------------------------------------------------------
     Formatage
     --------------------------------------------------------------------------- */
  var nf = new Intl.NumberFormat('fr-FR');

  function m2(v)      { return v == null ? null : nf.format(v) + ' m²'; }
  function euro(v)    { return v == null ? null : nf.format(v) + ' €/m²/an HT HC'; }
  function metres(v)  { return v == null ? null : String(v).replace('.', ',') + ' m'; }
  function tonnes(v)  { return v == null ? null : String(v).replace('.', ',') + ' T/m²'; }
  function nombre(v)  { return v == null ? null : nf.format(v); }

  function dateFr(iso) {
    if (!iso) return null;
    var d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  /* ---------------------------------------------------------------------------
     Règle unique de rendu d'une valeur (cf. docs/regles-donnees-manquantes.md)

       null / undefined -> donnée absente du mandat
       0                -> valeur réelle, affichée telle quelle
       ''               -> traité comme absent

     `mode` décide de ce qu'on fait d'une donnée absente :
       'hide'  -> renvoie null, l'appelant n'affiche pas la ligne
       'label' -> renvoie « Non communiqué »
     --------------------------------------------------------------------------- */
  var ABSENT = 'Non communiqué';

  function isAbsent(v) { return v === null || v === undefined || v === ''; }

  function val(raw, formatter, mode) {
    if (isAbsent(raw)) return mode === 'label' ? ABSENT : null;
    var out = formatter ? formatter(raw) : String(raw);
    return isAbsent(out) ? (mode === 'label' ? ABSENT : null) : out;
  }

  /* ---------------------------------------------------------------------------
     Libellés métier
     --------------------------------------------------------------------------- */
  var LABELS = {
    typeBien: { activites: 'Local d’activités', entrepot: 'Entrepôt', bureaux: 'Bureaux', commerce: 'Commerce' },
    etat:     { neuf: 'Neuf', renove: 'Rénové / Restructuré', usage: 'État d’usage', construire: 'À construire' },
    icpe:     { declaration: 'Déclaration', enregistrement: 'Enregistrement', autorisation: 'Autorisation' },
    seveso:   { 'non-soumis': 'Non soumis', 'seuil-bas': 'Seuil bas', 'seuil-haut': 'Seuil haut' },
    breeam:   { good: 'Good', 'very-good': 'Very Good', excellent: 'Excellent', outstanding: 'Outstanding' },
    chauffage:{ 'gaz-aerotherme': 'Gaz / Aérotherme', electrique: 'Électrique', pac: 'Pompe à chaleur', aucun: 'Sans chauffage' },
    eclairage:{ led: 'LED', fluo: 'Fluorescent', naturel: 'Naturel / zénithal' },
    structure:{ beton: 'Béton', metal: 'Métal', mixte: 'Mixte' },
    classe:   { A: 'Classe A', B: 'Classe B', C: 'Classe C' }
  };

  function label(dict, v) { return LABELS[dict] && LABELS[dict][v] ? LABELS[dict][v] : v; }

  /* Titre lisible : type + transaction + ville + surface, jamais une phrase générique */
  function titreComplet(a) {
    return label('typeBien', a.typeBien) + ' à louer à ' + a.ville +
           ' — ' + m2(a.surfaceTotale) + (a.divisible ? ' divisibles' : '');
  }

  /* ---------------------------------------------------------------------------
     Unité affichée pour les quais / portes : « 1 par cellule », jamais « 1par cellule »
     --------------------------------------------------------------------------- */
  function avecUnite(valeur, unite) {
    if (isAbsent(valeur)) return null;
    return unite ? nombre(valeur) + ' ' + unite : nombre(valeur);
  }

  /* ---------------------------------------------------------------------------
     État de recherche dans l'URL — la recherche doit être partageable
     --------------------------------------------------------------------------- */
  function readState() {
    var p = new URLSearchParams(location.search);
    var s = {};
    p.forEach(function (v, k) {
      if (v === '') return;
      // Les clés multi-valeurs sont sérialisées en liste séparée par des virgules
      s[k] = /^(type|etat|dispo|icpe|certif|rubriques)$/.test(k) ? v.split(',') : v;
    });
    return s;
  }

  function writeState(state, replace) {
    var p = new URLSearchParams();
    Object.keys(state).forEach(function (k) {
      var v = state[k];
      if (v == null || v === '' || (Array.isArray(v) && !v.length)) return;
      p.set(k, Array.isArray(v) ? v.join(',') : v);
    });
    var url = location.pathname + (p.toString() ? '?' + p.toString() : '');
    history[replace ? 'replaceState' : 'pushState'](state, '', url);
  }

  /* ---------------------------------------------------------------------------
     Mémoire de la recherche : permet à la fiche de proposer un retour exact
     (filtres, tri, cadrage carte, zoom, position de défilement).
     --------------------------------------------------------------------------- */
  var SEARCH_KEY = 'cbre.recherche';

  function saveSearch(snapshot) {
    try { sessionStorage.setItem(SEARCH_KEY, JSON.stringify(snapshot)); } catch (e) { /* mode privé */ }
  }

  function loadSearch() {
    try { return JSON.parse(sessionStorage.getItem(SEARCH_KEY)); } catch (e) { return null; }
  }

  /* Reconstruit l'URL de la recherche mémorisée, cadrage et défilement compris. */
  function searchUrl(fallback) {
    var s = loadSearch();
    if (!s) return fallback || 'recherche.html';
    var p = new URLSearchParams();
    Object.keys(s.filtres || {}).forEach(function (k) {
      var v = s.filtres[k];
      if (v == null || v === '' || (Array.isArray(v) && !v.length)) return;
      p.set(k, Array.isArray(v) ? v.join(',') : v);
    });
    if (s.tri) p.set('tri', s.tri);
    if (s.carte) p.set('carte', s.carte.lat + ',' + s.carte.lon + ',' + s.carte.zoom);
    if (s.scroll) p.set('y', Math.round(s.scroll));
    if (s.actif) p.set('actif', s.actif);
    return 'recherche.html' + (p.toString() ? '?' + p.toString() : '');
  }

  /* ---------------------------------------------------------------------------
     En-tête qui se réduit au défilement : au-delà du seuil, seule la barre
     compacte subsiste, ce qui maximise la surface d'annonces.
     --------------------------------------------------------------------------- */
  function initTopbar(scroller) {
    var bar = document.querySelector('.topbar');
    if (!bar) return;
    var target = scroller || window;
    var SEUIL = 40;
    var dernierY = 0;
    var stormMotion = document.body.classList.contains('search-page');

    function measure() {
      var full = bar.querySelector('.topbar__full');
      var compact = bar.querySelector('.searchbar');
      var root = document.documentElement;
      if (compact) root.style.setProperty('--topbar-compact-h', compact.offsetHeight + 'px');
      if (full && compact) {
        root.style.setProperty('--topbar-h', (bar.offsetHeight) + 'px');
      }
    }

    function onScroll() {
      var y = target === window ? window.scrollY : target.scrollTop;
      if (stormMotion) {
        var delta = y - dernierY;
        var etaitMasque = bar.classList.contains('is-scroll-hidden');
        bar.classList.toggle('has-scrolled', y > 4);
        if (y <= SEUIL) bar.classList.remove('is-scroll-hidden');
        else if (delta > 4) bar.classList.add('is-scroll-hidden');
        else if (delta < -4) bar.classList.remove('is-scroll-hidden');
        if (etaitMasque !== bar.classList.contains('is-scroll-hidden')) {
          setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 510);
        }
        dernierY = y;
      } else {
        bar.classList.toggle('is-compact', y > SEUIL);
      }
    }

    measure();
    onScroll();
    target.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    // Les autres pages conservent leur ancien repli compact.
    if (!stormMotion) bar.addEventListener('transitionend', measure);
  }

  /* ---------------------------------------------------------------------------
     Mesure d'audience — un point d'entrée unique, poussé dans le dataLayer GTM
     déjà en place sur le site (filtres, contacts, appels, exports, visites).
     --------------------------------------------------------------------------- */
  function track(event, payload) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: event }, payload || {}));
  }

  /* ---------------------------------------------------------------------------
     Utilitaires
     --------------------------------------------------------------------------- */
  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms || 200);
    };
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Distance à vol d'oiseau, pour le tri « distance à la zone recherchée » */
  function distanceKm(lat1, lon1, lat2, lon2) {
    var R = 6371, rad = Math.PI / 180;
    var dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  return {
    m2: m2, euro: euro, metres: metres, tonnes: tonnes, nombre: nombre, dateFr: dateFr,
    val: val, isAbsent: isAbsent, ABSENT: ABSENT,
    label: label, titreComplet: titreComplet, avecUnite: avecUnite,
    readState: readState, writeState: writeState,
    saveSearch: saveSearch, loadSearch: loadSearch, searchUrl: searchUrl,
    initTopbar: initTopbar, track: track,
    debounce: debounce, esc: esc, distanceKm: distanceKm
  };
})();
