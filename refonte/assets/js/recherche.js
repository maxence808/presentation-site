/* =============================================================================
   Page de résultats : liste + carte synchronisées en permanence.
   Aucun rechargement complet — filtres, tri et cadrage se mettent à jour en place.
   ============================================================================= */
(function () {
  'use strict';

  var C = window.CBRE;
  var DATA = window.CBRE_DATA;
  var TOUTES = DATA.annonces;

  /* Cadrage France entière au lancement d'une recherche nationale.
     On ne recentre sur une zone que si l'utilisateur en a désigné une. */
  var FRANCE = { center: [46.6, 2.4], zoom: 5.4 };
  var CHUNK = 20;           // annonces ajoutées à chaque palier de défilement
  var CHUNK_FALLBACK = 50;  // sans IntersectionObserver : 50 minimum d'un bloc

  /* Une offre est « Nouveauté » si son mandat a été mis à jour dans les 30
     derniers jours. Contrairement à l'ancien bandeau « Opportunité », le critère
     est objectif et vérifiable : il repose sur la date de mise à jour, que la
     fiche affiche par ailleurs. Rien à arbitrer, rien à justifier au client.

     Le jeu de démonstration étant figé, le nombre de nouveautés diminue avec le
     temps — c'est le comportement attendu en production. */
  var NOUVEAUTE_JOURS = 30;

  function estNouveaute(a) {
    if (!a.maj) return false;
    // Comparaison de jour à jour : l'heure courante ne doit pas décider du
    // basculement d'un mandat mis à jour il y a exactement 30 jours.
    var maintenant = new Date();
    var aujourdhui = Date.UTC(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
    var p = a.maj.split('-');
    var jourMaj = Date.UTC(+p[0], +p[1] - 1, +p[2]);
    var ecart = (aujourdhui - jourMaj) / 86400000;
    return ecart >= 0 && ecart <= NOUVEAUTE_JOURS;
  }

  var state = {
    filtres: {},
    tri: 'pertinence',
    actif: null,
    rendues: 0
  };

  var resultats = [];       // filtrées + triées
  var map = null, couche = null, reperes = {}, centreRecherche = null;

  var el = {
    liste:    document.getElementById('liste'),
    sentinel: document.getElementById('sentinel'),
    count:    document.getElementById('count'),
    tri:      document.getElementById('tri'),
    chips:    document.getElementById('chips'),
    panel:    document.getElementById('filters'),
    backdrop: document.getElementById('backdrop'),
    panelCount: document.getElementById('panelCount'),
    mapStatus:  document.getElementById('mapStatus')
  };

  /* ===========================================================================
     1. Filtrage
     ---------------------------------------------------------------------------
     Table déclarative : chaque critère du panneau dit sur quel champ il porte et
     comment il compare. Le site actuel n'offre qu'une case « Hauteur libre
     (1296) » ; ici le champ porte 8, et « hauteur ≥ 9 » l'écarte.

     Types de comparaison :
       min      valeur du bien >= seuil saisi
       max      valeur du bien <= seuil saisi
       bool     la case cochée exige que le champ soit vrai
       present  la case cochée exige que le champ soit renseigné
       multi    la valeur du bien doit figurer dans la sélection
       inter    au moins une valeur commune entre le bien et la sélection
       ordreMin niveau du bien >= niveau saisi (échelle ordonnée)
       ordreMax niveau du bien <= niveau saisi (échelle ordonnée)

     Dans tous les cas une donnée non renseignée EXCLUT l'annonce : on ne peut
     pas affirmer qu'un bien de hauteur inconnue fait plus de 8 m.
     =========================================================================== */
  var ECHELLES = {
    breeam: ['good', 'very-good', 'excellent', 'outstanding'],
    dpe:    ['A', 'B', 'C', 'D', 'E', 'F', 'G']
  };

  var REGLES = [
    // --- Technique ---
    { cle: 'hMin',          type: 'min',   champ: 'hauteurLibre' },
    { cle: 'chargeMin',     type: 'min',   champ: 'chargeSol' },
    { cle: 'quaisMin',      type: 'min',   champ: 'quais' },
    { cle: 'ppMin',         type: 'min',   champ: 'plainPied' },
    { cle: 'sectMin',       type: 'min',   champ: 'porteSectionnelle' },
    { cle: 'aireMin',       type: 'min',   champ: 'aireManoeuvreM' },
    { cle: 'pontMin',       type: 'min',   champ: 'pontRoulantT' },
    { cle: 'palettesMin',   type: 'min',   champ: 'empPalettes' },
    { cle: 'tempMaxi',      type: 'max',   champ: 'tempMin' },   // « descend jusqu'à X °C »
    { cle: 'frigo',         type: 'present', champ: 'tempMin' },
    { cle: 'classe',        type: 'multi', champ: 'classeLogistique' },
    { cle: 'accesPL',       type: 'bool',  champ: 'accesPL' },
    { cle: 'aire',          type: 'bool',  champ: 'aireManoeuvre' },
    { cle: 'batIndep',      type: 'bool',  champ: 'batimentIndependant' },
    { cle: 'fer',           type: 'bool',  champ: 'embranchementFer' },
    { cle: 'traversant',    type: 'bool',  champ: 'traversant' },
    { cle: 'messagerie',    type: 'bool',  champ: 'messagerie' },
    { cle: 'secu',          type: 'bool',  champ: 'siteSecurise' },
    { cle: 'racke',         type: 'present', champ: 'empPalettes' },

    // --- Surfaces (chaque poste a sa propre valeur en m²) ---
    { cle: 'surfActMin',    type: 'min',   champ: 'surfaceActivites' },
    { cle: 'surfBurMin',    type: 'min',   champ: 'surfaceBureaux' },
    { cle: 'surfAtelierMin',type: 'min',   champ: 'surfaceAtelier' },
    { cle: 'surfMezzMin',   type: 'min',   champ: 'surfaceMezzanine' },
    { cle: 'surfGHMin',     type: 'min',   champ: 'surfaceGrandeHauteur' },
    { cle: 'surfTerrainMin',type: 'min',   champ: 'surfaceTerrain' },

    // --- Équipements et prestations ---
    { cle: 'parkMin',       type: 'min',   champ: 'parking' },
    { cle: 'bornesMin',     type: 'min',   champ: 'bornesElec' },
    { cle: 'sanitairesMin', type: 'min',   champ: 'sanitaires' },
    { cle: 'chauffage',     type: 'multi', champ: 'chauffageType' },
    { cle: 'eclairage',     type: 'multi', champ: 'eclairageType' },
    { cle: 'structure',     type: 'multi', champ: 'structure' },
    { cle: 'clim',          type: 'bool',  champ: 'climatisation' },
    { cle: 'cuisine',       type: 'bool',  champ: 'cuisine' },
    { cle: 'rie',           type: 'bool',  champ: 'rie' },
    { cle: 'bureaux',       type: 'bool',  champ: 'bureauxAccomp' },

    // --- Environnement et réglementaire ---
    { cle: 'breeamMin',     type: 'ordreMin', champ: 'breeam', echelle: 'breeam' },
    { cle: 'hqe',           type: 'bool',  champ: 'hqe' },
    { cle: 'pvMin',         type: 'min',   champ: 'photovoltaiqueM2' },
    { cle: 'icpe',          type: 'multi', champ: 'icpeRegime' },
    { cle: 'seveso',        type: 'multi', champ: 'seveso' },
    { cle: 'rubriques',     type: 'inter', champ: 'icpeRubriques' },
    { cle: 'certif',        type: 'inter', champ: 'certifications' },
    { cle: 'dpeMax',        type: 'ordreMax', champ: 'dpe', echelle: 'dpe' },

    // --- État et disponibilité ---
    { cle: 'etat',          type: 'multi', champ: 'etat' },
    { cle: 'dispo',         type: 'multi', champ: 'dispo' },
    { cle: 'divisible',     type: 'bool',  champ: 'divisible' }
  ];

  function respecte(a, r, saisi) {
    var v = a[r.champ];
    var absent = v === null || v === undefined || v === '';

    switch (r.type) {
      case 'min':  return !absent && v >= +saisi;
      case 'max':  return !absent && v <= +saisi;
      case 'bool': return saisi !== '1' || v === true;
      case 'present': return saisi !== '1' || !absent;
      case 'multi': return !absent && saisi.indexOf(v) !== -1;
      case 'inter': {
        var liste = v || [];
        return saisi.some(function (x) { return liste.indexOf(x) !== -1; });
      }
      case 'ordreMin': {
        if (absent) return false;
        var e = ECHELLES[r.echelle];
        return e.indexOf(v) >= e.indexOf(saisi);
      }
      case 'ordreMax': {
        if (absent) return false;
        var e2 = ECHELLES[r.echelle];
        return e2.indexOf(v) <= e2.indexOf(saisi);
      }
      default: return true;
    }
  }

  function passe(a, f) {
    if (f.transaction && a.transaction !== f.transaction) return false;
    if (f.type && f.type.length && f.type.indexOf(a.typeBien) === -1) return false;

    if (f.lieu) {
      var q = f.lieu.toLowerCase().trim();
      var hay = (a.ville + ' ' + a.cp + ' ' + a.departement + ' ' + a.region).toLowerCase();
      // Le rayon prend le relais dès qu'un centre de recherche est identifié
      if (centreRecherche && f.rayon) {
        var d = C.distanceKm(centreRecherche.lat, centreRecherche.lon, a.lat, a.lon);
        if (d > Number(f.rayon)) return false;
      } else if (hay.indexOf(q) === -1) {
        return false;
      }
    }

    if (f.surfMin && a.surfaceTotale < +f.surfMin) return false;
    // La surface max se compare à la plus petite maille proposée : un ensemble de
    // 26 000 m² divisible dès 30 m² reste pertinent pour une recherche de 500 m².
    if (f.surfMax && (a.surfaceMin != null ? a.surfaceMin : a.surfaceTotale) > +f.surfMax) return false;

    if (f.prixMin && a.loyer < +f.prixMin) return false;
    if (f.prixMax && a.loyer > +f.prixMax) return false;

    // Tous les autres critères passent par la table déclarative
    return REGLES.every(function (r) {
      var saisi = f[r.cle];
      if (saisi == null || saisi === '' || (Array.isArray(saisi) && !saisi.length)) return true;
      return respecte(a, r, saisi);
    });
  }

  /* ===========================================================================
     2. Tri — chaque option est réellement discriminante
     =========================================================================== */
  var ORDRE_DISPO = { immediate: 0, lots: 1, date: 2 };

  function trier(items, tri) {
    var t = items.slice();
    // Une donnée absente part toujours en fin de liste, quel que soit le sens
    function cmpNum(a, b, key, desc) {
      var va = a[key], vb = b[key];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return desc ? vb - va : va - vb;
    }
    switch (tri) {
      case 'maj':          t.sort(function (a, b) { return b.maj.localeCompare(a.maj); }); break;
      case 'surface-asc':  t.sort(function (a, b) { return cmpNum(a, b, 'surfaceTotale', false); }); break;
      case 'surface-desc': t.sort(function (a, b) { return cmpNum(a, b, 'surfaceTotale', true); }); break;
      case 'prix-asc':     t.sort(function (a, b) { return cmpNum(a, b, 'loyer', false); }); break;
      case 'prix-desc':    t.sort(function (a, b) { return cmpNum(a, b, 'loyer', true); }); break;
      case 'hauteur':      t.sort(function (a, b) { return cmpNum(a, b, 'hauteurLibre', true); }); break;
      case 'quais':        t.sort(function (a, b) { return cmpNum(a, b, 'quais', true); }); break;
      case 'dispo':
        // Rang par défaut pour une disponibilité inconnue : en fin de liste.
        // Écrit sans opérateur récent : une syntaxe non reconnue ferait échouer
        // le parsing du fichier entier, et plus aucun filtre ne répondrait.
        t.sort(function (a, b) {
          var ra = ORDRE_DISPO.hasOwnProperty(a.dispo) ? ORDRE_DISPO[a.dispo] : 9;
          var rb = ORDRE_DISPO.hasOwnProperty(b.dispo) ? ORDRE_DISPO[b.dispo] : 9;
          return ra - rb;
        });
        break;
      case 'distance':
        if (centreRecherche) {
          t.sort(function (a, b) {
            return C.distanceKm(centreRecherche.lat, centreRecherche.lon, a.lat, a.lon) -
                   C.distanceKm(centreRecherche.lat, centreRecherche.lon, b.lat, b.lon);
          });
        }
        break;
      default:
        /* Pertinence : les nouveautés en tête, puis les fiches les mieux
           renseignées, puis les plus fraîches. Chacun des trois critères est
           explicable au client — ce que « Opportunité » n'était pas. */
        t.sort(function (a, b) {
          var na = estNouveaute(a) ? 1 : 0, nb = estNouveaute(b) ? 1 : 0;
          if (na !== nb) return nb - na;
          var sa = completude(a), sb = completude(b);
          if (sa !== sb) return sb - sa;
          return b.maj.localeCompare(a.maj);
        });
    }
    return t;
  }

  var CHAMPS_CLES = ['hauteurLibre', 'chargeSol', 'quais', 'plainPied', 'parking', 'surfaceMin'];
  function completude(a) {
    return CHAMPS_CLES.reduce(function (n, k) { return n + (a[k] != null ? 1 : 0); }, 0);
  }

  /* ===========================================================================
     3. Rendu d'une carte d'annonce
     =========================================================================== */
  function specHtml(k, v) {
    if (v == null) return '';   // donnée absente : la puce n'est pas affichée
    return '<span class="spec"><span class="spec__k">' + C.esc(k) +
           '</span><span class="spec__v">' + C.esc(v) + '</span></span>';
  }

  function specsTechniques(a) {
    // Puces adaptées au type de bien : un entrepôt se compare sur quais et hauteur
    if (a.typeBien === 'entrepot' || a.typeBien === 'activites') {
      return [
        specHtml('Hauteur libre', C.val(a.hauteurLibre, C.metres)),
        specHtml('Quais', C.avecUnite(a.quais, a.quaisUnite)),
        specHtml('Plain-pied', C.avecUnite(a.plainPied, a.plainPiedUnite)),
        specHtml('Charge au sol', C.val(a.chargeSol, C.tonnes)),
        specHtml('ICPE', C.val(a.icpeRegime, function (v) { return C.label('icpe', v); }))
      ].join('');
    }
    return [
      specHtml('État', C.label('etat', a.etat)),
      specHtml('Parking', C.val(a.parking, C.nombre))
    ].join('');
  }

  /* Pictogrammes : tracés inline, pour ne dépendre d'aucune fonte d'icônes */
  var ICONES = {
    porte: '<path d="M4 21h16M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17"/><path d="M14.5 12.5v.01"/>',
    hauteur: '<path d="M12 3v18"/><path d="M8 6l4-3 4 3"/><path d="M8 18l4 3 4-3"/>',
    divis: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M12 4v16"/>',
    surface: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M9 3v18"/>'
  };

  function picto(nom) {
    return '<svg class="stat__i" viewBox="0 0 24 24" aria-hidden="true" fill="none" ' +
           'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
           ICONES[nom] + '</svg>';
  }

  function stat(nom, valeur, legende) {
    var vide = valeur == null;
    return '<div class="stat' + (vide ? ' stat--empty' : '') + '">' +
             picto(nom) +
             '<div><b>' + C.esc(vide ? '—' : valeur) + '</b>' +
             '<span>' + C.esc(legende) + '</span></div>' +
           '</div>';
  }

  /* Colonne de droite : les 4 chiffres sur lesquels un logisticien compare,
     séparés du descriptif par un filet vertical. */
  function statsHtml(a) {
    var portes = a.quais != null ? a.quais : null;
    return '' +
      stat('porte', portes, portes === null ? 'portes à quai'
            : (a.quaisUnite ? 'à quai ' + a.quaisUnite : portes > 1 ? 'portes à quai' : 'porte à quai')) +
      stat('hauteur', C.val(a.hauteurLibre, C.metres), 'hauteur libre') +
      stat('divis', C.val(a.surfaceMin, C.m2), 'divisible dès') +
      stat('surface', C.m2(a.surfaceTotale), 'surface totale');
  }

  /* Vignettes du carrousel : sans photothèque, on rend des plans distincts
     pour que les flèches produisent un effet visible. */
  var VUES = ['Vue extérieure', 'Quai de chargement', 'Intérieur cellule', 'Plan de masse'];

  function slidesHtml(a) {
    return VUES.map(function (v, i) {
      return '<div class="pcard__slide" data-i="' + i + '"' + (i ? ' hidden' : '') + '>' +
               '<div class="pcard__ph pcard__ph--' + i + '">' + C.esc(v) + '<small>' + C.esc(a.ville) + '</small></div>' +
             '</div>';
    }).join('');
  }

  function pointsHtml() {
    return VUES.map(function (_, i) {
      return '<span class="pcard__dot' + (i ? '' : ' is-on') + '"></span>';
    }).join('');
  }

  function brokersHtml(a) {
    return (a.contacts || []).slice(0, 2).map(function (c) {
      var initiales = c.nom.split(/[\s-]+/).map(function (m) { return m[0]; }).slice(0, 2).join('');
      return '<span class="broker" title="' + C.esc(c.nom + ' — ' + c.role) + '">' +
               '<span class="broker__av">' + C.esc(initiales) + '</span>' +
               '<span class="broker__n">' + C.esc(c.nom) + '</span>' +
             '</span>';
    }).join('');
  }

  function carteHtml(a) {
    var dispoNow = a.dispo === 'immediate';
    return '' +
      '<article class="pcard" data-ref="' + a.ref + '" tabindex="0"' +
        ' aria-label="' + C.esc(a.titre + ', ' + a.ville) + '">' +

        '<div class="pcard__media" data-watermark="off">' +
          '<div class="pcard__slides">' + slidesHtml(a) + '</div>' +
          (estNouveaute(a)
            ? '<span class="pcard__badge" title="Mandat mis à jour le ' +
              C.esc(C.dateFr(a.maj)) + '">Nouveauté</span>'
            : '') +
          '<button class="pcard__nav pcard__nav--prev" type="button" data-slide="-1"' +
            ' aria-label="Photo précédente"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none"' +
            ' stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M15 5l-7 7 7 7"/></svg></button>' +
          '<button class="pcard__nav pcard__nav--next" type="button" data-slide="1"' +
            ' aria-label="Photo suivante"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none"' +
            ' stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M9 5l7 7-7 7"/></svg></button>' +
          '<div class="pcard__dots" aria-hidden="true">' + pointsHtml() + '</div>' +
          '<button class="pcard__fav" type="button" aria-pressed="false"' +
            ' data-fav="' + a.ref + '" aria-label="Ajouter l’offre ' + a.ref + ' aux favoris">♡</button>' +
        '</div>' +

        '<div class="pcard__body">' +
          '<div class="pcard__main">' +
            '<h3 class="pcard__title"><a href="' + lienFiche(a) + '">' + C.esc(a.titre) + '</a></h3>' +
            '<div class="pcard__loc">' + C.esc(a.ville) + ' (' + C.esc(a.cp) + ')' +
              ' · <span class="pcard__ref">Réf. ' + C.esc(a.ref) + '</span></div>' +
            '<div class="pcard__keyfacts">' +
              '<span class="pcard__price">' + C.esc(C.val(a.loyer, C.euro, 'label')) + '</span>' +
              '<span class="pcard__dispo' + (dispoNow ? ' pcard__dispo--now' : '') + '">' +
                C.esc(a.dispoLabel) + '</span>' +
            '</div>' +
            '<div class="pcard__foot">' +
              '<div class="pcard__brokers">' + brokersHtml(a) + '</div>' +
              '<div class="pcard__actions">' +
                '<a class="btn btn--xs btn--ghost" href="tel:' + a.contact.tel.replace(/\s/g, '') + '"' +
                  ' data-track="appel" data-ref="' + a.ref + '">Appeler</a>' +
                '<a class="btn btn--xs btn--primary" href="' + lienFiche(a) + '">Voir la fiche</a>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="pcard__stats">' + statsHtml(a) + '</div>' +
        '</div>' +
      '</article>';
  }

  function lienFiche(a) {
    return a.ref === '148144' ? 'annonce.html' : 'annonce.html?ref=' + a.ref;
  }

  /* ===========================================================================
     4. Chargement progressif
     =========================================================================== */
  function rendre(reset) {
    if (reset) {
      el.liste.innerHTML = '';
      state.rendues = 0;
    }
    var pas = ('IntersectionObserver' in window) ? CHUNK : CHUNK_FALLBACK;
    var lot = resultats.slice(state.rendues, state.rendues + pas);
    if (!lot.length && !state.rendues) {
      el.liste.innerHTML =
        '<div class="empty-state"><h2>Aucune offre ne correspond</h2>' +
        '<p>Élargissez la surface, le loyer ou le rayon de recherche.</p>' +
        '<button class="btn btn--ghost" type="button" id="resetVide">Réinitialiser les filtres</button></div>';
      var rv = document.getElementById('resetVide');
      if (rv) rv.addEventListener('click', reinitialiser);
      majSentinel();
      return;
    }
    el.liste.insertAdjacentHTML('beforeend', lot.map(carteHtml).join(''));
    state.rendues += lot.length;
    majSentinel();
  }

  function majSentinel() {
    var reste = resultats.length - state.rendues;
    el.sentinel.hidden = reste <= 0;
    el.sentinel.textContent = reste > 0
      ? 'Chargement de ' + Math.min(reste, CHUNK) + ' offres supplémentaires'
      : '';
  }

  function initScrollInfini() {
    if (!('IntersectionObserver' in window)) return;   // repli : 50 d'un bloc
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && state.rendues < resultats.length) rendre(false);
    }, { root: el.liste.closest('.split__list'), rootMargin: '600px' });
    io.observe(el.sentinel);
  }

  /* ===========================================================================
     5. Carte
     =========================================================================== */
  function initCarte() {
    map = L.map('map', { zoomControl: true, scrollWheelZoom: true })
           .setView(FRANCE.center, FRANCE.zoom);

    // Forme sans sous-domaine, recommandée par la politique d'usage OSM.
    // En production, prévoir un fournisseur de tuiles sous contrat.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    couche = L.layerGroup().addTo(map);

    // Le nombre d'offres visibles suit le cadrage
    map.on('moveend', majStatutCarte);
  }

  function icone(a, actif) {
    return L.divIcon({
      className: '',
      html: '<div class="pin ' + (actif ? 'pin--selected' : 'pin--default') + '">' +
            (actif ? '●' : '') + '</div>',
      iconSize: actif ? [30, 30] : [16, 16],
      iconAnchor: actif ? [15, 15] : [8, 8]
    });
  }

  function popupHtml(a) {
    return '' +
      '<div class="popup">' +
        '<div class="popup__title">' + C.esc(a.titre) + '</div>' +
        '<div class="popup__loc">' + C.esc(a.ville) + ' (' + C.esc(a.cp) + ') · Réf. ' + C.esc(a.ref) + '</div>' +
        '<div class="popup__specs">' +
          specHtml('Surface', C.m2(a.surfaceTotale)) +
          specHtml('Loyer', C.val(a.loyer, C.euro)) +
          specHtml('Hauteur', C.val(a.hauteurLibre, C.metres)) +
          specHtml('Quais', C.avecUnite(a.quais, a.quaisUnite)) +
        '</div>' +
        '<a class="btn btn--sm btn--primary" href="' + lienFiche(a) + '">Voir la fiche</a>' +
      '</div>';
  }

  function dessinerReperes() {
    couche.clearLayers();
    reperes = {};
    resultats.forEach(function (a) {
      var m = L.marker([a.lat, a.lon], {
        icon: icone(a, a.ref === state.actif),
        keyboard: true,
        alt: a.titre + ' — ' + a.ville
      });
      m.bindPopup(popupHtml(a), { minWidth: 240 });
      m.on('click', function () { activer(a.ref, 'carte'); });
      m.addTo(couche);
      reperes[a.ref] = m;
    });
    majStatutCarte();
  }

  function majStatutCarte() {
    if (!map || !el.mapStatus) return;
    var b = map.getBounds();
    var n = resultats.filter(function (a) { return b.contains([a.lat, a.lon]); }).length;
    el.mapStatus.textContent = n + ' offre' + (n > 1 ? 's' : '') + ' dans ce cadrage';
  }

  /* Adapte le cadrage à la zone recherchée ; sans zone, on garde la France. */
  function cadrer() {
    if (!map) return;
    if (!resultats.length) { map.setView(FRANCE.center, FRANCE.zoom); return; }
    if (!state.filtres.lieu) { map.setView(FRANCE.center, FRANCE.zoom); return; }
    var pts = resultats.map(function (a) { return [a.lat, a.lon]; });
    map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 13 });
  }

  /* ===========================================================================
     6. Synchronisation liste <-> carte
     =========================================================================== */
  function activer(ref, origine) {
    if (state.actif === ref && origine !== 'carte') return;
    var ancien = state.actif;
    state.actif = ref;

    // Icônes : l'ancien repère reprend sa taille, le nouveau passe en rouge
    [ancien, ref].forEach(function (r) {
      if (!r || !reperes[r]) return;
      var a = resultats.find(function (x) { return x.ref === r; });
      if (a) reperes[r].setIcon(icone(a, r === state.actif));
    });

    document.querySelectorAll('.pcard').forEach(function (c) {
      c.classList.toggle('is-active', c.dataset.ref === ref);
    });

    var a = resultats.find(function (x) { return x.ref === ref; });
    if (!a || !map) return;

    // Recentrage discret : on ne bouge que si le repère sort du cadre,
    // pour garder les offres voisines sous les yeux.
    if (!map.getBounds().pad(-0.18).contains([a.lat, a.lon])) {
      map.panTo([a.lat, a.lon], { animate: true, duration: 0.4 });
    }

    if (origine === 'carte') {
      var carte = el.liste.querySelector('.pcard[data-ref="' + ref + '"]');
      if (carte) carte.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function initSync() {
    // Survol et focus clavier mettent en évidence le repère
    ['mouseenter', 'focusin'].forEach(function (evt) {
      el.liste.addEventListener(evt, function (e) {
        var carte = e.target.closest ? e.target.closest('.pcard') : null;
        if (carte) activer(carte.dataset.ref, 'liste');
      }, true);
    });

    el.liste.addEventListener('click', function (e) {
      // --- Carrousel de photos ---
      var fleche = e.target.closest('.pcard__nav');
      if (fleche) {
        e.preventDefault();
        e.stopPropagation();
        defiler(fleche.closest('.pcard__media'), +fleche.dataset.slide);
        return;
      }

      // --- Favoris ---
      var fav = e.target.closest('.pcard__fav');
      if (fav) {
        e.preventDefault();
        e.stopPropagation();
        var on = fav.getAttribute('aria-pressed') !== 'true';
        fav.setAttribute('aria-pressed', String(on));
        fav.textContent = on ? '♥' : '♡';
        C.track(on ? 'favori_ajoute' : 'favori_retire', { ref: fav.dataset.fav });
        return;
      }

      var appel = e.target.closest('[data-track="appel"]');
      if (appel) C.track('appel_conseiller', { ref: appel.dataset.ref, source: 'liste' });

      // Mémorise la recherche avant d'ouvrir une fiche
      var lien = e.target.closest('a[href^="annonce.html"]');
      if (lien) { memoriser(); return; }

      // --- Clic ailleurs sur la carte : on illumine le repère, sans naviguer ---
      var carte = e.target.closest('.pcard');
      if (carte) activer(carte.dataset.ref, 'liste');
    });

    // Le clavier doit pouvoir faire défiler les photos et sélectionner
    el.liste.addEventListener('keydown', function (e) {
      var carte = e.target.closest('.pcard');
      if (!carte || e.target !== carte) return;
      if (e.key === 'ArrowRight') { defiler(carte.querySelector('.pcard__media'), 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft')  { defiler(carte.querySelector('.pcard__media'), -1); e.preventDefault(); }
      if (e.key === 'Enter' || e.key === ' ') { activer(carte.dataset.ref, 'liste'); e.preventDefault(); }
    });
  }

  /* Fait tourner les vues d'une carte, en boucle. */
  function defiler(media, pas) {
    if (!media) return;
    var vues = media.querySelectorAll('.pcard__slide');
    var points = media.querySelectorAll('.pcard__dot');
    var courant = 0;
    vues.forEach(function (v, i) { if (!v.hidden) courant = i; });

    var suivant = (courant + pas + vues.length) % vues.length;
    vues[courant].hidden = true;
    vues[suivant].hidden = false;
    if (points.length) {
      points.forEach(function (p, i) { p.classList.toggle('is-on', i === suivant); });
    }
  }

  function memoriser() {
    var scroller = el.liste.closest('.split__list');
    C.saveSearch({
      filtres: state.filtres,
      tri: state.tri,
      actif: state.actif,
      scroll: scroller ? scroller.scrollTop : 0,
      carte: map ? { lat: +map.getCenter().lat.toFixed(5), lon: +map.getCenter().lng.toFixed(5), zoom: map.getZoom() } : null
    });
  }

  /* ===========================================================================
     7. Filtres — application immédiate, sans clic supplémentaire
     =========================================================================== */
  function lireFormulaire() {
    var f = {};
    el.panel.querySelectorAll('[data-f]').forEach(function (input) {
      var cle = input.dataset.f;
      if (input.type === 'checkbox') {
        if (!input.checked) return;
        if (input.dataset.multi) { (f[cle] = f[cle] || []).push(input.value); }
        else { f[cle] = '1'; }
      } else if (input.value !== '') {
        f[cle] = input.value;
      }
    });
    return f;
  }

  function ecrireFormulaire(f) {
    el.panel.querySelectorAll('[data-f]').forEach(function (input) {
      var cle = input.dataset.f, v = f[cle];
      if (input.type === 'checkbox') {
        input.checked = input.dataset.multi
          ? Array.isArray(v) && v.indexOf(input.value) !== -1
          : v === '1';
      } else {
        input.value = v == null ? '' : v;
      }
    });
  }

  function resoudreCentre() {
    var lieu = (state.filtres.lieu || '').toLowerCase().trim();
    if (!lieu) { centreRecherche = null; return; }
    var hit = TOUTES.find(function (a) {
      return (a.ville + ' ' + a.cp + ' ' + a.departement + ' ' + a.region).toLowerCase().indexOf(lieu) !== -1;
    });
    centreRecherche = hit ? { lat: hit.lat, lon: hit.lon } : null;
  }

  function appliquer(opts) {
    opts = opts || {};
    resoudreCentre();
    resultats = trier(TOUTES.filter(function (a) { return passe(a, state.filtres); }), state.tri);

    el.count.innerHTML = '<strong>' + resultats.length + '</strong> <span>offre' +
      (resultats.length > 1 ? 's' : '') + '</span>';
    if (el.panelCount) el.panelCount.textContent = resultats.length + ' offre' + (resultats.length > 1 ? 's' : '');

    rendre(true);
    dessinerReperes();
    if (opts.cadrer !== false) cadrer();
    dessinerChips();

    if (!opts.silencieux) {
      C.writeState(Object.assign({}, state.filtres, { tri: state.tri }), true);
      C.track('filtre_applique', { filtres: state.filtres, tri: state.tri, resultats: resultats.length });
    }
  }

  var appliquerDiffere = C.debounce(function () { appliquer(); }, 220);

  function initFiltres() {
    // Champs texte et nombres : application différée le temps de la frappe.
    // Cases et listes : application immédiate.
    el.panel.addEventListener('input', function (e) {
      if (!e.target.dataset.f) return;
      state.filtres = lireFormulaire();
      if (e.target.type === 'text' || e.target.type === 'number') appliquerDiffere();
      else appliquer();
    });
    el.panel.addEventListener('change', function (e) {
      if (!e.target.dataset.f) return;
      state.filtres = lireFormulaire();
      appliquer();
    });

    document.getElementById('openFilters').addEventListener('click', function () { ouvrirPanneau(true); });
    document.querySelectorAll('[data-filter-focus]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        ouvrirPanneau(true);
        var cible = el.panel.querySelector(btn.dataset.filterFocus);
        if (cible) {
          cible.focus();
          cible.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      });
    });
    document.getElementById('closeFilters').addEventListener('click', function () { ouvrirPanneau(false); });
    document.getElementById('applyFilters').addEventListener('click', function () { ouvrirPanneau(false); });
    document.getElementById('resetFilters').addEventListener('click', reinitialiser);
    el.backdrop.addEventListener('click', function () { ouvrirPanneau(false); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && el.panel.classList.contains('is-open')) ouvrirPanneau(false);
    });

    el.tri.addEventListener('change', function () {
      state.tri = el.tri.value;
      appliquer({ cadrer: false });   // le tri ne doit pas déplacer la carte
    });
  }

  var dernierDeclencheur = null;

  function ouvrirPanneau(ouvert) {
    el.panel.classList.toggle('is-open', ouvert);
    el.backdrop.classList.toggle('is-open', ouvert);
    el.panel.setAttribute('aria-hidden', String(!ouvert));
    document.getElementById('openFilters').setAttribute('aria-expanded', String(ouvert));
    if (ouvert) {
      dernierDeclencheur = document.activeElement;
      el.panel.querySelector('#closeFilters').focus();
    } else if (dernierDeclencheur) {
      dernierDeclencheur.focus();
    }
  }

  function reinitialiser() {
    state.filtres = {};
    state.tri = 'pertinence';
    el.tri.value = 'pertinence';
    ecrireFormulaire({});
    appliquer();
  }

  /* Puces de rappel des filtres actifs, retirables une à une */
  var NOMS = {
    transaction: 'Transaction', type: 'Type', lieu: 'Lieu', rayon: 'Rayon',
    surfMin: 'Surface min', surfMax: 'Surface max', prixMin: 'Loyer min', prixMax: 'Loyer max',
    dispo: 'Disponibilité', etat: 'État', divisible: 'Divisible',
    // Technique
    hMin: 'Hauteur ≥', chargeMin: 'Charge au sol ≥', quaisMin: 'Quais ≥',
    ppMin: 'Plain-pied ≥', sectMin: 'Portes sectionnelles ≥', aireMin: 'Aire de manœuvre ≥',
    pontMin: 'Pont roulant ≥', palettesMin: 'Emplacements palettes ≥', tempMaxi: 'Température ≤',
    frigo: 'Frigorifique', classe: 'Classe', accesPL: 'Accès PL', aire: 'Aire de manœuvre',
    batIndep: 'Bâtiment indépendant', fer: 'Embranchement fer', traversant: 'Entrepôt traversant',
    messagerie: 'Messagerie', secu: 'Site sécurisé', racke: 'Entrepôt racké',
    // Surfaces
    surfActMin: 'Surface activités ≥', surfBurMin: 'Surface bureaux ≥',
    surfAtelierMin: 'Atelier ≥', surfMezzMin: 'Mezzanine ≥',
    surfGHMin: 'Grande hauteur ≥', surfTerrainMin: 'Terrain ≥',
    // Équipements
    parkMin: 'Parking ≥', bornesMin: 'Bornes de recharge ≥', sanitairesMin: 'Sanitaires ≥',
    chauffage: 'Chauffage', eclairage: 'Éclairage', structure: 'Structure',
    clim: 'Climatisation', cuisine: 'Cuisine', rie: 'RIE / Cafétéria', bureaux: 'Bureaux',
    // Environnement et réglementaire
    breeamMin: 'BREEAM ≥', hqe: 'HQE', pvMin: 'Photovoltaïque ≥',
    icpe: 'ICPE', seveso: 'SEVESO', rubriques: 'Rubriques', certif: 'Certifications',
    dpeMax: 'DPE ≤'
  };

  var UNITES = {
    surfMin: ' m²', surfMax: ' m²', surfActMin: ' m²', surfBurMin: ' m²',
    surfAtelierMin: ' m²', surfMezzMin: ' m²', surfGHMin: ' m²', surfTerrainMin: ' m²',
    pvMin: ' m²', prixMin: ' €', prixMax: ' €', hMin: ' m', aireMin: ' m',
    chargeMin: ' T/m²', pontMin: ' t', tempMaxi: ' °C', rayon: ' km'
  };

  function dessinerChips() {
    var html = Object.keys(state.filtres).map(function (k) {
      var v = state.filtres[k];
      if (v == null || v === '' || (Array.isArray(v) && !v.length)) return '';
      // Les nombres sont formatés à la française : « 20 000 m² », pas « 20000 m² »
      var texte;
      if (Array.isArray(v)) {
        texte = v.length + ' sélection' + (v.length > 1 ? 's' : '');
      } else if (v === '1') {
        texte = 'oui';
      } else if (v !== '' && !isNaN(v)) {
        texte = C.nombre(Number(v)) + (UNITES[k] || '');
      } else {
        texte = v + (UNITES[k] || '');
      }
      return '<span class="chip chip--active">' + C.esc(NOMS[k] || k) + ' : ' + C.esc(texte) +
             '<button class="chip__x" type="button" data-clear="' + k +
             '" aria-label="Retirer le filtre ' + C.esc(NOMS[k] || k) + '">×</button></span>';
    }).join('');
    el.chips.innerHTML = html;
  }

  document.addEventListener('click', function (e) {
    var x = e.target.closest('[data-clear]');
    if (!x) return;
    delete state.filtres[x.dataset.clear];
    ecrireFormulaire(state.filtres);
    appliquer();
  });

  /* ===========================================================================
     8. Bascule Liste / Carte (mobile)
     =========================================================================== */
  function initBascule() {
    var boutons = document.querySelectorAll('.viewtoggle button');
    boutons.forEach(function (b) {
      b.addEventListener('click', function () {
        var vue = b.dataset.view;
        document.body.classList.toggle('view-map', vue === 'carte');
        boutons.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
        if (vue === 'carte' && map) setTimeout(function () { map.invalidateSize(); }, 60);
        C.track('bascule_vue', { vue: vue });
      });
    });
  }

  /* ===========================================================================
     9. Restitution d'une recherche (retour depuis une fiche)
     =========================================================================== */
  function restaurer() {
    var q = C.readState();
    var tri = q.tri; delete q.tri;
    var carte = q.carte; delete q.carte;
    var y = q.y; delete q.y;
    var actif = q.actif; delete q.actif;

    state.filtres = q;
    state.tri = tri || 'pertinence';
    el.tri.value = state.tri;
    ecrireFormulaire(state.filtres);

    appliquer({ silencieux: true, cadrer: !carte });

    if (carte) {
      var p = carte.split(',');
      map.setView([+p[0], +p[1]], +p[2]);
    }
    if (actif) activer(actif, 'restauration');

    // La position de défilement se restitue après le rendu du premier lot
    if (y) {
      var scroller = el.liste.closest('.split__list');
      requestAnimationFrame(function () {
        // Charge assez d'annonces pour que la position visée existe
        var garde = 0;
        while (scroller.scrollHeight < +y + scroller.clientHeight &&
               state.rendues < resultats.length && garde++ < 50) {
          rendre(false);
        }
        scroller.scrollTop = +y;
      });
    }
  }

  /* ===========================================================================
     Démarrage
     =========================================================================== */
  document.addEventListener('DOMContentLoaded', function () {
    initCarte();
    initFiltres();
    initSync();
    initScrollInfini();
    initBascule();
    restaurer();
    C.initTopbar(window.innerWidth <= 760 ? window : el.liste.closest('.split__list'));
    window.addEventListener('beforeunload', memoriser);
  });
})();
