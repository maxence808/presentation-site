/* =============================================================================
   Fiche annonce — en-tête compact, blocs techniques, surfaces à la demande,
   carte intégrée, temps de trajet, contact sans friction, export.
   ============================================================================= */
(function () {
  'use strict';

  var C = window.CBRE;
  var TOUTES = window.CBRE_DATA.annonces;

  var A = null;             // annonce affichée
  var ficheMap = null, isoMap = null, isoCercle = null, isoDepart = null;
  var lotsChoisis = [];

  /* ===========================================================================
     Sélection de l'annonce
     =========================================================================== */
  function charger() {
    var ref = new URLSearchParams(location.search).get('ref') || '148144';
    A = TOUTES.find(function (a) { return a.ref === ref; }) || TOUTES[0];
  }

  /* ===========================================================================
     En-tête compact : tout ce qui décide d'une visite, sans défiler
     =========================================================================== */
  function rendreEntete() {
    document.title = C.titreComplet(A) + ' | Réf. ' + A.ref + ' | CBRE';

    var q = function (id) { return document.getElementById(id); };

    q('titre').textContent = C.titreComplet(A);
    q('loc').textContent = A.ville + ' (' + A.cp + ') · ' + A.departement;
    q('refValue').textContent = A.ref;

    q('kpis').innerHTML = [
      kpi('Surface totale', C.m2(A.surfaceTotale)),
      kpi('Divisible dès', C.val(A.surfaceMin, C.m2, 'label')),
      kpi('Loyer', C.val(A.loyer, C.euro, 'label'), 'kpi--price'),
      kpi('Disponibilité', A.dispoLabel),
      kpi('Hauteur libre', C.val(A.hauteurLibre, C.metres, 'label')),
      kpi('Portes à quai', C.avecUnite(A.quais, A.quaisUnite) || C.ABSENT),
      kpi('Charge au sol', C.val(A.chargeSol, C.tonnes, 'label')),
      kpi('État', C.label('etat', A.etat))
    ].join('');

    // Introduction courte, générée à partir des données structurées
    q('lede').textContent = introCourte(A);
    q('descriptionLongue').textContent = A.description || '';
    if (!A.description) q('descriptionBloc').hidden = true;

    q('maj').textContent = C.val(A.maj, C.dateFr, 'label');
  }

  function kpi(k, v, cls) {
    return '<div class="kpi ' + (cls || '') + '">' +
             '<div class="kpi__k">' + C.esc(k) + '</div>' +
             '<div class="kpi__v">' + C.esc(v == null ? C.ABSENT : v) + '</div>' +
           '</div>';
  }

  /* Accord en genre et en nombre : « une porte à quai », « 2 portes de plain-pied ».
     Le décompte brut sert à la phrase ; l'unité « par cellule » est portée par le
     sujet de la phrase, pas collée derrière le nombre. */
  function portes(n, singulier, pluriel) {
    if (n == null) return null;
    if (n === 0) return 'aucune ' + singulier;
    if (n === 1) return 'une ' + singulier;
    return C.nombre(n) + ' ' + pluriel;
  }

  /* Article contracté devant un axe routier : l'A15, la N184, la D14. */
  function axeAvecArticle(ligne) {
    return /^A/i.test(ligne) ? 'l’' + ligne : 'la ' + ligne;
  }

  function introCourte(a) {
    var p = ['CBRE propose à la location'];
    if (a.nbCellules) {
      p.push(a.nbCellules > 1 ? C.nombre(a.nbCellules) + ' cellules' : 'une cellule');
      if (a.etat === 'neuf') p.push(a.nbCellules > 1 ? 'neuves' : 'neuve');
    }
    p.push('totalisant ' + C.m2(a.surfaceTotale));
    if (a.surfaceMin != null) p.push('divisibles à partir de ' + C.m2(a.surfaceMin));
    p.push('à ' + a.ville + '.');

    var axes = (a.transports || []).filter(function (t) { return t.type === 'route'; })
                                   .map(function (t) { return axeAvecArticle(t.ligne); });
    if (axes.length) p.push('À proximité de ' + axes.join(' et de ') + '.');

    var tech = [
      portes(a.quais, 'porte à quai', 'portes à quai'),
      portes(a.plainPied, 'porte de plain-pied', 'portes de plain-pied')
    ].filter(Boolean);
    if (a.bureauxAccomp) tech.push('de bureaux d’accompagnement');

    if (tech.length) {
      // Le sujet suit l'unité déclarée : « chaque cellule » si les valeurs sont
      // exprimées par cellule, sinon le bâtiment dans son ensemble.
      var sujet = a.quaisUnite === 'par cellule' ? 'Chaque cellule dispose'
                                                 : 'Le bâtiment dispose';
      // Élision devant voyelle ou h muet : « d’une porte », mais « de 2 portes »
      var liste = tech.map(function (t) {
        if (/^de /.test(t)) return t;
        return (/^[aeiouyàâéèêëîïôöùûüh]/i.test(t) ? 'd’' : 'de ') + t;
      });
      var dernier = liste.pop();
      p.push(sujet + ' ' + (liste.length ? liste.join(', ') + ' et ' + dernier : dernier) + '.');
    }

    p.push('Référence CBRE : ' + a.ref + '.');
    return p.join(' ');
  }

  /* ===========================================================================
     Blocs techniques — libellé / valeur, groupés par catégorie
     Une catégorie sans aucune valeur renseignée n'est pas affichée.
     =========================================================================== */
  function ligne(k, v) {
    if (v == null) return '';
    return '<div class="row"><dt>' + C.esc(k) + '</dt><dd>' + C.esc(v) + '</dd></div>';
  }
  /* Variante pour les champs structurants : on affiche « Non communiqué »
     plutôt que de masquer, car leur absence est en soi une information. */
  function ligneCle(k, v) {
    var vide = v == null;
    return '<div class="row"><dt>' + C.esc(k) + '</dt>' +
           '<dd class="' + (vide ? 'is-empty' : '') + '">' +
           C.esc(vide ? C.ABSENT : v) + '</dd></div>';
  }

  function bloc(titre, lignes) {
    var corps = lignes.filter(Boolean).join('');
    if (!corps) return '';
    return '<section class="tech-block"><h3 class="tech-block__h">' + C.esc(titre) + '</h3>' +
           '<dl>' + corps + '</dl></section>';
  }

  /* Un champ peut être décrit en toutes lettres par le mandat (a.chauffage) ou
     seulement typé (a.chauffageType) : le texte libre prime, le type sert de repli. */
  function libelleOuType(texte, type, dict) {
    if (texte) return texte;
    return type ? C.label(dict, type) : null;
  }

  function rendreTechnique() {
    var a = A;
    var blocs = [
      bloc('Bâtiment et construction', [
        ligneCle('État', C.label('etat', a.etat)),
        ligneCle('Hauteur libre sous poutre', C.val(a.hauteurLibre, C.metres)),
        ligne('Hauteur à l’acrotère', C.val(a.acrotere, C.metres)),
        ligne('Classe logistique', a.classeLogistique ? C.label('classe', a.classeLogistique) : null),
        ligne('Structure / Couverture', a.structure ? C.label('structure', a.structure) : null),
        ligne('Bâtiment indépendant', oui(a.batimentIndependant)),
        ligne('Nombre de bâtiments', C.val(a.nbBatiments, C.nombre)),
        ligne('Nombre de cellules', C.val(a.nbCellules, C.nombre))
      ]),
      bloc('Stockage et activité', [
        ligneCle('Charge au sol', C.val(a.chargeSol, C.tonnes)),
        ligne('Surface d’activités', C.val(a.surfaceActivites, C.m2)),
        ligne('Emplacements palettes', C.val(a.empPalettes, C.nombre)),
        ligne('Surface en grande hauteur', C.val(a.surfaceGrandeHauteur, C.m2)),
        ligne('Surface d’atelier', C.val(a.surfaceAtelier, C.m2)),
        ligne('Surface de mezzanine', C.val(a.surfaceMezzanine, C.m2)),
        ligne('Température atteinte', a.tempMin != null
          ? a.tempMin + ' °C à ' + (a.tempMax != null ? a.tempMax + ' °C' : '—') : null),
        ligne('Pont roulant', a.pontRoulantT != null ? a.pontRoulantT + ' t' : null),
        ligne('Dallage bureaux — RDC', a.dallageBureauxRdc != null ? a.dallageBureauxRdc + ' kg/m²' : null),
        ligne('Dallage bureaux — étage', a.dallageBureauxEtage != null ? a.dallageBureauxEtage + ' kg/m²' : null)
      ]),
      bloc('Quais et accès', [
        ligneCle('Portes à quai', C.avecUnite(a.quais, a.quaisUnite)),
        ligneCle('Portes de plain-pied', C.avecUnite(a.plainPied, a.plainPiedUnite)),
        ligne('Portes sectionnelles', C.avecUnite(a.porteSectionnelle, a.quaisUnite)),
        ligne('Accès poids lourds', oui(a.accesPL)),
        ligne('Aire de manœuvre', a.aireManoeuvreM != null
          ? a.aireManoeuvreM + ' m de profondeur' : oui(a.aireManoeuvre)),
        ligne('Entrepôt traversant', oui(a.traversant)),
        ligne('Embranchement fer', oui(a.embranchementFer)),
        ligne('Messagerie', oui(a.messagerie))
      ]),
      bloc('Bureaux', [
        ligne('Surface de bureaux', C.val(a.surfaceBureaux, C.m2)),
        ligne('Bureaux d’accompagnement', oui(a.bureauxAccomp)),
        ligne('Chauffage / climatisation', a.chauffageBureaux || null)
      ]),
      bloc('Sécurité', [
        ligne('Site clos et sécurisé', oui(a.siteSecurise)),
        ligne('Local déchets', oui(a.localDechets))
      ]),
      bloc('Énergie et chauffage', [
        ligne('Nature du chauffage', libelleOuType(a.chauffage, a.chauffageType, 'chauffage')),
        ligne('Climatisation', oui(a.climatisation)),
        ligne('Éclairage', libelleOuType(a.eclairage, a.eclairageType, 'eclairage')),
        ligne('Tarif électrique', a.tarifElec || null),
        ligne('Photovoltaïque', C.val(a.photovoltaiqueM2, C.m2)),
        ligneCle('DPE', a.dpe)
      ]),
      bloc('Prestations et services', [
        ligne('Sanitaires', C.val(a.sanitaires, C.nombre)),
        ligne('Cuisine', oui(a.cuisine)),
        ligne('RIE / Cafétéria', oui(a.rie)),
        ligne('Surface de terrain', C.val(a.surfaceTerrain, C.m2))
      ]),
      bloc('Certifications environnementales', [
        ligne('BREEAM', a.breeam ? C.label('breeam', a.breeam) : null),
        ligne('HQE', oui(a.hqe)),
        ligne('Autres', (a.certifications || []).filter(function (c) { return !/BREEAM/i.test(c); })
                          .join(', ') || null)
      ]),
      bloc('Stationnement', [
        ligneCle('Places véhicules légers', C.val(a.parking, C.nombre)),
        ligne('Dont places PMR', C.val(a.parkingPMR, C.nombre)),
        ligne('Bornes de recharge électrique', C.val(a.bornesElec, C.nombre)),
        ligne('Abri à vélos', oui(a.abriCycle))
      ]),
      bloc('Disponibilité', [
        ligneCle('Disponibilité', a.dispoLabel),
        ligne('Annonce mise à jour le', C.val(a.maj, C.dateFr))
      ]),
      bloc('Conditions financières', [
        ligneCle('Loyer', C.val(a.loyer, C.euro)),
        ligne('Fourchette de marché', a.marche ? a.marche.bas + ' à ' + a.marche.haut + ' €/m²/an' : null),
        ligne('Moyenne constatée', a.marche ? a.marche.moyenne + ' €/m²/an' : null)
      ]),
      bloc('Accessibilité et transports',
        (a.transports || []).map(function (t) { return ligne(libelleTransport(t), t.label); })
      ),
      bloc('ICPE et contraintes réglementaires', [
        ligneCle('Régime ICPE', a.icpeRegime ? C.label('icpe', a.icpeRegime) : null),
        ligneCle('Classement SEVESO', a.seveso ? C.label('seveso', a.seveso) : null),
        ligne('Rubriques', (a.icpeRubriques || []).length ? a.icpeRubriques.join(', ') : null)
      ])
    ];
    document.getElementById('techGrid').innerHTML = blocs.filter(Boolean).join('');
  }

  function oui(v) { return v === true ? 'Oui' : v === false ? 'Non' : null; }

  function libelleTransport(t) {
    return t.type === 'route' ? 'Axe routier'
         : t.type === 'rer'   ? 'RER ' + t.ligne
         : t.type === 'train' ? 'Ligne ' + t.ligne
         : 'Transport';
  }

  /* ===========================================================================
     Surfaces : synthèse d'abord, détail à la demande
     =========================================================================== */
  function rendreSurfaces() {
    document.getElementById('surfSummary').innerHTML = [
      kpi('Surface totale', C.m2(A.surfaceTotale)),
      kpi('Dont activités', C.val(A.surfaceActivites, C.m2, 'label')),
      kpi('Dont bureaux', C.val(A.surfaceBureaux, C.m2, 'label')),
      kpi('Bâtiments', C.val(A.nbBatiments, C.nombre, 'label')),
      kpi('Cellules disponibles', C.val(A.nbCellules, C.nombre, 'label')),
      kpi('Divisible dès', C.val(A.surfaceMin, C.m2, 'label'))
    ].join('');

    var detail = document.getElementById('surfDetail');
    var cellules = construireCellules(A);
    var totaux = cellules.reduce(function (t, c) {
      t.activites += c.activites; t.bureaux += c.bureaux;
      t.technique += c.technique; t.mezzanine += c.mezzanine; t.total += c.total;
      return t;
    }, { activites: 0, bureaux: 0, technique: 0, mezzanine: 0, total: 0 });

    detail.innerHTML = '<p class="surface-demo-note">Répartition indicative pour la démonstration.</p>' +
      '<table class="lots-table lots-table--matrix">' +
        '<caption>Tableau des surfaces par cellule</caption>' +
        '<thead><tr>' +
          '<th scope="col"><span class="visually-hidden">Sélection</span></th>' +
          '<th scope="col">Cellule</th><th scope="col" class="num">Activités / entrepôt</th>' +
          '<th scope="col" class="num">Bureaux</th><th scope="col" class="num">Locaux techniques</th>' +
          '<th scope="col" class="num">Mezzanine</th><th scope="col" class="num">Surface totale</th>' +
          '<th scope="col">Disponibilité</th>' +
        '</tr></thead><tbody>' + cellules.map(function (c) {
          return '<tr data-lot="' + C.esc(c.id) + '" data-surface="' + c.total + '">' +
            '<td><input type="checkbox" data-lot-pick="' + C.esc(c.id) + '" aria-label="Sélectionner ' + C.esc(c.nom) + '"></td>' +
            '<th scope="row">' + C.esc(c.nom) + '</th>' +
            '<td class="num">' + C.esc(C.m2(c.activites)) + '</td>' +
            '<td class="num">' + C.esc(C.m2(c.bureaux)) + '</td>' +
            '<td class="num">' + C.esc(C.m2(c.technique)) + '</td>' +
            '<td class="num">' + C.esc(C.m2(c.mezzanine)) + '</td>' +
            '<td class="num total-cell">' + C.esc(C.m2(c.total)) + '</td>' +
            '<td>' + C.esc(c.dispo) + '</td></tr>';
        }).join('') + '</tbody>' +
        '<tfoot><tr><th colspan="2" scope="row">Total</th>' +
          '<td class="num">' + C.esc(C.m2(totaux.activites)) + '</td>' +
          '<td class="num">' + C.esc(C.m2(totaux.bureaux)) + '</td>' +
          '<td class="num">' + C.esc(C.m2(totaux.technique)) + '</td>' +
          '<td class="num">' + C.esc(C.m2(totaux.mezzanine)) + '</td>' +
          '<td class="num">' + C.esc(C.m2(totaux.total)) + '</td><td></td></tr></tfoot>' +
      '</table>';

    // Sélection de lots -> teaser personnalisé
    detail.addEventListener('change', function (e) {
      var cb = e.target.closest('[data-lot-pick]');
      if (!cb) return;
      var id = cb.dataset.lotPick;
      var tr = detail.querySelector('[data-lot="' + id + '"]');
      if (tr) tr.classList.toggle('is-picked', cb.checked);
      lotsChoisis = Array.prototype.map.call(
        detail.querySelectorAll('[data-lot-pick]:checked'), function (x) { return x.dataset.lotPick; });
      majBarreTeaser();
    });
  }

  /* Produit un tableau complet pour toutes les annonces. Les lots réels sont
     regroupés par cellule ; sinon une répartition cohérente est générée pour
     que la maquette reste démontrable sur chaque fiche. */
  function construireCellules(a) {
    if (a.lots && a.lots.length) {
      var groupes = {};
      a.lots.forEach(function (l) {
        var id = (l.batiment || 'A') + '-' + (l.cellule || l.lot || '1');
        var c = groupes[id] || (groupes[id] = {
          id: id, nom: 'Cellule ' + (l.cellule || l.lot || '1'), activites: 0,
          bureaux: 0, technique: 0, mezzanine: 0, total: 0, dispo: l.dispo || a.dispoLabel
        });
        var nature = (l.nature || '').toLowerCase();
        if (nature.indexOf('bureau') !== -1) c.bureaux += l.surface;
        else if (nature.indexOf('technique') !== -1) c.technique += l.surface;
        else if (nature.indexOf('mezzanine') !== -1) c.mezzanine += l.surface;
        else c.activites += l.surface;
        c.total += l.surface;
      });
      return Object.keys(groupes).map(function (k) { return groupes[k]; });
    }

    var nombre = Math.max(1, Math.min(a.nbCellules || 1, 8));
    var reste = a.surfaceTotale;
    return Array.from({ length: nombre }, function (_, i) {
      var total = i === nombre - 1 ? reste : Math.round(a.surfaceTotale / nombre);
      reste -= total;
      var bureaux = Math.round(total * ((a.surfaceBureaux || 0) / a.surfaceTotale || .1));
      var technique = Math.max(12, Math.round(total * .02));
      var mezzanine = a.surfaceMezzanine ? Math.round(a.surfaceMezzanine / nombre) : 0;
      var activites = Math.max(0, total - bureaux - technique - mezzanine);
      return { id: 'cellule-' + (i + 1), nom: 'Cellule ' + (i + 1), activites: activites,
        bureaux: bureaux, technique: technique, mezzanine: mezzanine, total: total,
        dispo: a.dispoLabel || 'Nous consulter' };
    });
  }

  function majBarreTeaser() {
    var barre = document.getElementById('teaserBar');
    var txt = document.getElementById('teaserTxt');
    if (!lotsChoisis.length) {
      txt.textContent = 'Sélectionnez un ou plusieurs lots pour générer un teaser personnalisé.';
      barre.querySelector('.btn').disabled = true;
      return;
    }
    var surface = 0;
    lotsChoisis.forEach(function (id) {
      var tr = document.querySelector('[data-lot="' + id + '"]');
      if (tr) surface += Number(tr.dataset.surface) || 0;
    });
    txt.textContent = lotsChoisis.length + ' lot' + (lotsChoisis.length > 1 ? 's' : '') +
                      ' sélectionné' + (lotsChoisis.length > 1 ? 's' : '') + ' — ' + C.m2(surface);
    barre.querySelector('.btn').disabled = false;
  }

  function initSurfaces() {
    var btn = document.getElementById('toggleSurf');
    var body = document.getElementById('surfDetail');
    btn.addEventListener('click', function () {
      var ouvert = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!ouvert));
      body.hidden = ouvert;
      btn.querySelector('span').textContent = ouvert ? 'Afficher le détail des surfaces'
                                                     : 'Masquer le détail des surfaces';
      if (!ouvert) C.track('detail_surfaces_ouvert', { ref: A.ref });
    });

    document.getElementById('teaserLots').addEventListener('click', function () {
      C.track('export_teaser', { ref: A.ref, lots: lotsChoisis.length, format: 'lots' });
      window.open('teaser.html?ref=' + A.ref + '&lots=' + encodeURIComponent(lotsChoisis.join('|')), '_blank');
    });
  }

  /* ===========================================================================
     Galerie : vignette Carte parmi les photos, filigrane optionnel
     =========================================================================== */
  function initGalerie() {
    var galerie = document.getElementById('gallery');
    var indexPhoto = 0;
    var photos = [
      'Vue extérieure', 'Façade principale', 'Accès poids lourds', 'Quai de chargement',
      'Intérieur de la cellule', 'Hauteur libre', 'Bureaux', 'Salle de réunion',
      'Locaux techniques', 'Parking', 'Aire de manœuvre', 'Plan de masse'
    ];
    var label = document.getElementById('galleryMainLabel');
    var compteur = document.getElementById('galleryCounter');
    var thumbs = document.getElementById('galleryThumbs');
    var lightbox = document.getElementById('lightbox');
    var lightboxStage = document.getElementById('lightboxStage');
    var lightboxCounter = document.getElementById('lightboxCounter');
    var lightboxThumbs = document.getElementById('lightboxThumbs');

    function boutonsMiniatures() {
      return photos.map(function (p, i) {
        return '<button class="gallery-strip__thumb' + (i === indexPhoto ? ' is-active' : '') +
          '" type="button" data-photo-index="' + i + '" aria-label="Afficher ' + C.esc(p) + '">' +
          C.esc(p) + '</button>';
      }).join('');
    }

    function afficher(i) {
      indexPhoto = (i + photos.length) % photos.length;
      galerie.classList.remove('is-map');
      label.textContent = photos[indexPhoto];
      compteur.textContent = (indexPhoto + 1) + ' / ' + photos.length + ' · ' + A.ville;
      thumbs.innerHTML = boutonsMiniatures();
      lightboxThumbs.innerHTML = boutonsMiniatures();
      lightboxStage.innerHTML = '<span>' + C.esc(photos[indexPhoto]) + '</span><small>' +
        C.esc(A.titre + ' — ' + A.ville) + '</small>';
      lightboxCounter.textContent = (indexPhoto + 1) + ' / ' + photos.length;
      [thumbs, lightboxThumbs].forEach(function (rail) {
        var actif = rail.querySelector('[data-photo-index="' + indexPhoto + '"]');
        if (actif) actif.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
    }

    function naviguer(pas) { afficher(indexPhoto + pas); }
    function ouvrirPleinEcran() {
      lightbox.hidden = false;
      document.body.classList.add('has-lightbox');
      afficher(indexPhoto);
      document.getElementById('lightboxClose').focus();
    }
    function fermerPleinEcran() {
      lightbox.hidden = true;
      document.body.classList.remove('has-lightbox');
      document.getElementById('openLightbox').focus();
    }

    document.getElementById('galleryPrev').addEventListener('click', function () { naviguer(-1); });
    document.getElementById('galleryNext').addEventListener('click', function () { naviguer(1); });
    document.getElementById('openLightbox').addEventListener('click', ouvrirPleinEcran);
    document.getElementById('lightboxClose').addEventListener('click', fermerPleinEcran);
    document.getElementById('lightboxPrev').addEventListener('click', function () { naviguer(-1); });
    document.getElementById('lightboxNext').addEventListener('click', function () { naviguer(1); });

    [thumbs, lightboxThumbs].forEach(function (rail) {
      rail.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-photo-index]');
        if (btn) afficher(+btn.dataset.photoIndex);
      });
    });
    [['thumbPrev', thumbs, -1], ['thumbNext', thumbs, 1],
     ['lightboxThumbPrev', lightboxThumbs, -1], ['lightboxThumbNext', lightboxThumbs, 1]
    ].forEach(function (x) {
      document.getElementById(x[0]).addEventListener('click', function () {
        x[1].scrollBy({ left: x[2] * 560, behavior: 'smooth' });
      });
    });

    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) fermerPleinEcran(); });
    document.addEventListener('keydown', function (e) {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') fermerPleinEcran();
      if (e.key === 'ArrowLeft') naviguer(-1);
      if (e.key === 'ArrowRight') naviguer(1);
    });

    document.getElementById('openMapTile').addEventListener('click', function () {
      galerie.classList.add('is-map');
      if (!ficheMap) ficheMap = construireCarteFiche('ficheMap');
      setTimeout(function () { ficheMap.invalidateSize(); }, 60);
      C.track('carte_galerie_ouverte', { ref: A.ref });
    });

    document.getElementById('backToPhotos').addEventListener('click', function () {
      galerie.classList.remove('is-map');
    });

    // Filigrane : choix éditorial, jamais imposé
    var wm = document.getElementById('watermark');
    wm.addEventListener('change', function () {
      var v = wm.checked ? 'on' : 'off';
      document.querySelectorAll('[data-watermark]').forEach(function (n) { n.dataset.watermark = v; });
    });

    afficher(0);
  }

  /* ===========================================================================
     Carte : bien consulté en rouge, offres CBRE voisines plus petites
     =========================================================================== */
  function construireCarteFiche(cible) {
    var m = L.map(cible, { scrollWheelZoom: false }).setView([A.lat, A.lon], 13);

    var plan = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap'
    }).addTo(m);

    /* Vue satellite : utile pour comprendre l'implantation et le volume bâti.
       Imagerie Esri — les droits doivent être confirmés avant mise en production.
       Elle ne constitue pas un relevé : aucune mesure ne doit en être tirée. */
    var satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19, attribution: 'Imagerie Esri — vue indicative, non contractuelle'
      });

    L.control.layers({ 'Plan': plan, 'Vue satellite': satellite }, null, { position: 'topright' }).addTo(m);

    // Le bien consulté
    L.marker([A.lat, A.lon], {
      icon: L.divIcon({ className: '', html: '<div class="pin pin--selected">●</div>',
                        iconSize: [30, 30], iconAnchor: [15, 15] }),
      alt: 'Bien consulté : ' + A.titre
    }).addTo(m).bindPopup('<div class="popup__title">' + C.esc(A.titre) + '</div>' +
                          '<div class="popup__loc">Réf. ' + C.esc(A.ref) + '</div>');

    // Les offres CBRE à proximité, repères plus petits et d'une autre couleur
    TOUTES.filter(function (o) {
      return o.ref !== A.ref && C.distanceKm(A.lat, A.lon, o.lat, o.lon) < 40;
    }).forEach(function (o) {
      L.marker([o.lat, o.lon], {
        icon: L.divIcon({ className: '', html: '<div class="pin pin--default"></div>',
                          iconSize: [16, 16], iconAnchor: [8, 8] }),
        alt: o.titre + ' — ' + o.ville
      }).addTo(m).bindPopup(
        '<div class="popup__title">' + C.esc(o.titre) + '</div>' +
        '<div class="popup__loc">' + C.esc(o.ville) + ' (' + C.esc(o.cp) + ') · Réf. ' + C.esc(o.ref) + '</div>' +
        '<div class="popup__specs">' +
          '<span class="spec"><span class="spec__k">Surface</span><span class="spec__v">' + C.esc(C.m2(o.surfaceTotale)) + '</span></span>' +
          (o.hauteurLibre != null ? '<span class="spec"><span class="spec__k">Hauteur</span><span class="spec__v">' + C.esc(C.metres(o.hauteurLibre)) + '</span></span>' : '') +
        '</div>' +
        '<a class="btn btn--sm btn--primary" href="annonce.html?ref=' + C.esc(o.ref) + '">Voir la fiche</a>'
      );
    });

    return m;
  }

  /* ===========================================================================
     Temps de trajet — intégré à la fiche, jamais une page générique
     =========================================================================== */
  function initIsochrone() {
    var panneau = document.getElementById('isoPanel');

    document.getElementById('openIso').addEventListener('click', function () {
      panneau.hidden = false;
      if (!isoMap) isoMap = construireCarteFiche('isoMap');
      setTimeout(function () { isoMap.invalidateSize(); }, 60);
      panneau.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      C.track('temps_trajet_ouvert', { ref: A.ref });
    });

    document.getElementById('isoForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var duree = +document.getElementById('isoDuree').value;
      var mode = document.getElementById('isoMode').value;
      var depart = document.getElementById('isoDepart').value.trim();

      /* Estimation : rayon = vitesse moyenne × durée. Une isochrone réelle
         demande un service de calcul d'itinéraires ; le point d'intégration
         est ici. Le résultat est présenté comme indicatif, jamais comme exact. */
      var vitesse = { voiture: 45, transport: 25, velo: 15, marche: 5 }[mode] || 45;
      var rayonKm = vitesse * (duree / 60);

      if (isoCercle) isoMap.removeLayer(isoCercle);
      isoCercle = L.circle([A.lat, A.lon], {
        radius: rayonKm * 1000,
        color: '#c8102e', weight: 2, fillColor: '#c8102e', fillOpacity: 0.12
      }).addTo(isoMap);
      isoMap.fitBounds(isoCercle.getBounds(), { padding: [20, 20] });

      document.getElementById('isoResult').textContent =
        'Zone atteignable en ' + duree + ' min en ' + modeLabel(mode) +
        ' — environ ' + rayonKm.toFixed(1).replace('.', ',') + ' km à vol d’oiseau.' +
        (depart ? ' Départ renseigné : ' + depart + '.' : '');

      C.track('temps_trajet_calcule', { ref: A.ref, mode: mode, duree: duree });
    });

    // Plusieurs lieux de résidence ou sites d'entreprise
    document.getElementById('isoAddOrigin').addEventListener('click', function () {
      var v = document.getElementById('isoDepart').value.trim();
      if (!v) return;
      var liste = document.getElementById('isoOrigins');
      liste.insertAdjacentHTML('beforeend',
        '<span class="chip">' + C.esc(v) +
        '<button class="chip__x" type="button" aria-label="Retirer ' + C.esc(v) + '">×</button></span>');
      document.getElementById('isoDepart').value = '';
    });

    document.getElementById('isoOrigins').addEventListener('click', function (e) {
      var x = e.target.closest('.chip__x');
      if (x) x.parentNode.remove();
    });
  }

  /* ===========================================================================
     Carte du secteur — chargée à la demande, pour ne pas peser au premier rendu
     =========================================================================== */
  function initCarteSecteur() {
    var btn = document.getElementById('openMapSection');
    var wrap = document.getElementById('secteurWrap');
    btn.addEventListener('click', function () {
      wrap.classList.add('is-open');
      btn.hidden = true;
      var m = construireCarteFiche('secteurMap');
      setTimeout(function () { m.invalidateSize(); }, 60);
      C.track('carte_secteur_ouverte', { ref: A.ref });
    });
  }

  function modeLabel(m) {
    return { voiture: 'voiture', transport: 'transports en commun', velo: 'vélo', marche: 'marche' }[m] || m;
  }

  /* ===========================================================================
     Contact — numéro visible, formulaire minimal, actions explicites
     =========================================================================== */
  function objetMail() { return 'Demande d’informations – Offre CBRE ' + A.ref; }

  function corpsMail() {
    return 'Bonjour, je souhaite obtenir plus d’informations concernant ' +
           C.label('typeBien', A.typeBien).toLowerCase() + ' de ' + C.m2(A.surfaceTotale) +
           ' situé à ' + A.ville + ', référence CBRE ' + A.ref + '.';
  }

  function rendreContact() {
    var c = A.contact;
    document.getElementById('contactAvatar').textContent =
      c.nom.split(' ').map(function (m) { return m[0]; }).slice(0, 2).join('');
    document.getElementById('contactName').textContent = c.nom;
    document.getElementById('contactRole').textContent = c.role;

    // Numéro affiché d'emblée : plus de clic « Afficher le numéro ».
    // On n'écrit que dans le span, pour ne pas effacer le picto qui le précède.
    var tel = document.getElementById('contactTel');
    tel.querySelector('span').textContent = c.tel;
    tel.href = 'tel:' + c.tel.replace(/\s/g, '');

    document.getElementById('mailtoBtn').href =
      'mailto:' + c.email + '?subject=' + encodeURIComponent(objetMail()) +
      '&body=' + encodeURIComponent(corpsMail());

    document.getElementById('waBtn').href =
      'https://wa.me/?text=' + encodeURIComponent(corpsMail());

    document.getElementById('visiteBtn').href =
      'mailto:' + c.email + '?subject=' + encodeURIComponent('Demande de visite – Offre CBRE ' + A.ref) +
      '&body=' + encodeURIComponent('Bonjour, je souhaite organiser une visite du bien référence CBRE ' +
                                    A.ref + ' à ' + A.ville + '.');
  }

  function initFormulaire() {
    var form = document.getElementById('contactForm');
    var email = document.getElementById('cEmail');
    var tel = document.getElementById('cTel');
    var err = document.getElementById('contactError');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.textContent = '';
      email.removeAttribute('aria-invalid');
      tel.removeAttribute('aria-invalid');

      // Un seul canal suffit : e-mail OU téléphone
      var aEmail = email.value.trim() !== '';
      var aTel = tel.value.trim() !== '';

      if (!aEmail && !aTel) {
        err.textContent = 'Indiquez au moins une adresse e-mail ou un numéro de téléphone.';
        email.setAttribute('aria-invalid', 'true');
        tel.setAttribute('aria-invalid', 'true');
        email.focus();
        return;
      }
      if (aEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        err.textContent = 'Cette adresse e-mail semble incomplète.';
        email.setAttribute('aria-invalid', 'true');
        email.focus();
        return;
      }

      form.hidden = true;
      var ok = document.getElementById('contactOk');
      ok.hidden = false;
      ok.textContent = 'Demande enregistrée pour l’offre ' + A.ref + '. ' + A.contact.nom +
                       ' vous répond sous 24 h ouvrées. (Maquette : aucun envoi réel.)';
      ok.focus();
      C.track('demande_information', { ref: A.ref, canal: aEmail ? 'email' : 'telephone' });
    });
  }

  /* ===========================================================================
     Export et impression
     =========================================================================== */
  function initExport() {
    document.getElementById('printBtn').addEventListener('click', function () {
      C.track('impression_fiche', { ref: A.ref });
      window.print();
    });
    document.getElementById('teaserBtn').addEventListener('click', function () {
      C.track('export_teaser', { ref: A.ref, format: 'synthetique' });
      window.open('teaser.html?ref=' + A.ref, '_blank');
    });
    document.getElementById('dossierBtn').addEventListener('click', function () {
      C.track('export_dossier', { ref: A.ref, format: 'detaille' });
      window.open('dossier.html?ref=' + A.ref, '_blank');
    });

    // Copie de la référence, pour la dicter ou la coller dans un e-mail
    document.getElementById('copyRef').addEventListener('click', function (e) {
      var btn = e.currentTarget;
      navigator.clipboard.writeText(A.ref).then(function () {
        btn.textContent = 'Copié';
        setTimeout(function () { btn.textContent = 'Copier'; }, 1600);
      }).catch(function () { btn.textContent = A.ref; });
    });
  }

  /* ===========================================================================
     Retour à la recherche, à l'identique
     =========================================================================== */
  function initRetour() {
    var lien = document.getElementById('backToSearch');
    lien.href = C.searchUrl('recherche.html');
    lien.addEventListener('click', function () { C.track('retour_recherche', { ref: A.ref }); });
  }

  /* ===========================================================================
     Description repliée
     =========================================================================== */
  function initDescription() {
    var btn = document.getElementById('toggleDesc');
    var body = document.getElementById('descriptionLongue');
    btn.addEventListener('click', function () {
      var ouvert = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!ouvert));
      body.hidden = ouvert;
      btn.querySelector('span').textContent = ouvert ? 'Lire la description complète'
                                                     : 'Réduire la description';
    });
  }

  /* ===========================================================================
     Démarrage
     =========================================================================== */
  document.addEventListener('DOMContentLoaded', function () {
    charger();
    rendreEntete();
    rendreTechnique();
    rendreSurfaces();
    rendreContact();
    initGalerie();
    initSurfaces();
    initDescription();
    initIsochrone();
    initCarteSecteur();
    initFormulaire();
    initExport();
    initRetour();
    majBarreTeaser();
    C.initTopbar();
    C.track('vue_annonce', { ref: A.ref, type: A.typeBien, ville: A.ville });
  });
})();
