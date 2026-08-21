/* =============================================================================
   Génération des documents commerciaux à partir des mêmes données structurées
   que la fiche : teaser synthétique (1 page) et dossier détaillé.
   ============================================================================= */
(function () {
  'use strict';

  var C = window.CBRE;
  var TOUTES = window.CBRE_DATA.annonces;

  var params = new URLSearchParams(location.search);
  var MODE = document.body.dataset.mode;              // 'teaser' | 'dossier'
  var A = TOUTES.find(function (a) { return a.ref === (params.get('ref') || '148144'); }) || TOUTES[0];

  /* Lots retenus depuis la fiche : « B-B6-3|B-B7-5 ». Vide = offre entière. */
  var lotsChoisis = (params.get('lots') || '').split('|').filter(Boolean);

  function lotsRetenus() {
    if (!A.lots) return [];
    if (!lotsChoisis.length) return A.lots;
    return A.lots.filter(function (l, i) {
      return lotsChoisis.indexOf(l.batiment + '-' + l.cellule + '-' + indexDansBatiment(l, i)) !== -1;
    });
  }

  /* Reproduit l'identifiant construit par la fiche : batiment-cellule-rang,
     le rang étant l'index de la ligne dans le tableau de son bâtiment. */
  function indexDansBatiment(lot, absolu) {
    var rang = -1;
    A.lots.forEach(function (l, i) {
      if (l.batiment === lot.batiment && i <= absolu) rang++;
    });
    return rang;
  }

  function kpi(label, valeur) {
    return '<div class="doc-kpi"><b>' + C.esc(valeur == null ? '—' : valeur) + '</b>' +
           '<span>' + C.esc(label) + '</span></div>';
  }

  function row(k, v, cle) {
    if (v == null && !cle) return '';
    var vide = v == null;
    return '<div class="row"><dt>' + C.esc(k) + '</dt>' +
           '<dd class="' + (vide ? 'empty' : '') + '">' + C.esc(vide ? C.ABSENT : v) + '</dd></div>';
  }

  /* ---------------------------------------------------------------------------
     En-tête, pied de page
     --------------------------------------------------------------------------- */
  function head() {
    return '<div class="doc-head">' +
      '<div><img src="../assets/img/logo.svg" alt="CBRE">' +
        '<div style="font-size:8pt;color:#435254;margin-top:.2rem">' +
          (MODE === 'teaser' ? 'Teaser commercial' : 'Dossier de présentation') + '</div>' +
      '</div>' +
      '<div class="doc-ref"><small>Réf. CBRE</small>' + C.esc(A.ref) + '</div>' +
    '</div>';
  }

  function foot() {
    return '<div class="doc-foot">' +
      '<span>CBRE — Réf. ' + C.esc(A.ref) + ' — ' + C.esc(A.ville) + ' (' + C.esc(A.cp) + ')</span>' +
      '<span>Document non contractuel — ' + new Date().toLocaleDateString('fr-FR') + '</span>' +
    '</div>';
  }

  function titre() {
    return '<h1>' + C.esc(C.titreComplet(A)) + '</h1>' +
           '<div class="doc-loc">' + C.esc(A.ville) + ' (' + C.esc(A.cp) + ') · ' +
           C.esc(A.departement) + '</div>';
  }

  function kpis() {
    var lots = lotsRetenus();
    var partiel = lotsChoisis.length > 0;
    var surface = partiel
      ? lots.reduce(function (n, l) { return n + l.surface; }, 0)
      : A.surfaceTotale;

    /* Sur un teaser restreint à certains lots, « divisible dès » n'a plus de sens
       et contredirait la surface retenue : on annonce le périmètre à la place. */
    var second = partiel
      ? kpi('Périmètre', lots.length + ' lot' + (lots.length > 1 ? 's' : '') + ' retenu' + (lots.length > 1 ? 's' : ''))
      : kpi('Divisible dès', C.val(A.surfaceMin, C.m2));

    return '<div class="doc-kpis">' +
      kpi(partiel ? 'Surface retenue' : 'Surface', C.m2(surface)) +
      second +
      kpi('Loyer', A.loyer != null ? A.loyer + ' €/m²/an' : null) +
      kpi('Disponibilité', A.dispoLabel) +
    '</div>';
  }

  function specsEssentielles() {
    return '<h2>Caractéristiques principales</h2><dl class="doc-specs">' +
      row('Hauteur libre', C.val(A.hauteurLibre, C.metres), true) +
      row('Charge au sol', C.val(A.chargeSol, C.tonnes), true) +
      row('Portes à quai', C.avecUnite(A.quais, A.quaisUnite), true) +
      row('Portes de plain-pied', C.avecUnite(A.plainPied, A.plainPiedUnite), true) +
      row('État', C.label('etat', A.etat)) +
      row('Parking', C.val(A.parking, C.nombre)) +
      row('Bornes électriques', C.val(A.bornesElec, C.nombre)) +
      row('Régime ICPE', A.icpeRegime ? C.label('icpe', A.icpeRegime) : null, true) +
    '</dl>';
  }

  function contact() {
    return '<div class="doc-contact">' +
      '<div><b>' + C.esc(A.contact.nom) + '</b><br>' +
        '<span style="font-size:9pt;color:#435254">' + C.esc(A.contact.role) + ' · ' +
        C.esc(A.contact.email) + '</span></div>' +
      '<div class="tel">' + C.esc(A.contact.tel) + '</div>' +
    '</div>';
  }

  function tableauLots(lots, avecBatiment) {
    if (!lots.length) return '';
    var parBat = {};
    lots.forEach(function (l) { (parBat[l.batiment] = parBat[l.batiment] || []).push(l); });

    return Object.keys(parBat).map(function (b) {
      var lignes = parBat[b];
      var total = lignes.reduce(function (n, l) { return n + l.surface; }, 0);
      return '<table>' +
        (avecBatiment ? '<caption>Bâtiment ' + C.esc(b) + '</caption>' : '') +
        '<thead><tr><th>Cellule</th><th>Lot</th><th>Étage</th><th>Nature</th>' +
          '<th class="num">Surface</th><th>Disponibilité</th><th class="num">Loyer</th></tr></thead>' +
        '<tbody>' + lignes.map(function (l) {
          return '<tr><td>' + C.esc(l.cellule) + '</td><td>' + C.esc(l.lot) + '</td>' +
            '<td>' + C.esc(l.etage) + '</td><td>' + C.esc(l.nature) + '</td>' +
            '<td class="num">' + C.esc(C.m2(l.surface)) + '</td>' +
            '<td>' + C.esc(l.dispo) + '</td>' +
            '<td class="num">' + C.esc(l.loyer) + ' €/m²/an</td></tr>';
        }).join('') + '</tbody>' +
        '<tfoot><tr><td colspan="4">Total</td><td class="num">' + C.esc(C.m2(total)) +
          '</td><td colspan="2"></td></tr></tfoot>' +
      '</table>';
    }).join('');
  }

  /* ---------------------------------------------------------------------------
     Teaser : une page, l'essentiel pour qualifier l'offre
     --------------------------------------------------------------------------- */
  function rendreTeaser() {
    var lots = lotsRetenus();
    var partiel = lotsChoisis.length > 0;

    return head() + titre() +
      '<div class="doc-photo">Photo principale du bien</div>' +
      kpis() +
      '<p class="doc-lede">' + C.esc(introTeaser()) + '</p>' +
      specsEssentielles() +
      (partiel
        ? '<h2>Lots retenus</h2>' + tableauLots(lots, false)
        : '') +
      '<h2>Accès</h2><dl class="doc-specs">' +
        (A.transports || []).map(function (t) {
          return row(t.type === 'route' ? 'Axe routier' : 'Transport', t.label);
        }).join('') +
      '</dl>' +
      contact() +
      '<p class="doc-note">Document non contractuel. Les surfaces et conditions financières sont ' +
        'indicatives et susceptibles d’évolution. Référence CBRE ' + C.esc(A.ref) + '.</p>' +
      foot();
  }

  function introTeaser() {
    var p = [];
    p.push(C.label('typeBien', A.typeBien) + ' de ' + C.m2(A.surfaceTotale));
    if (A.surfaceMin != null) p.push('divisible à partir de ' + C.m2(A.surfaceMin));
    p.push('à ' + A.ville + ' (' + A.cp + ').');
    if (A.etat === 'neuf') p.push('Bâtiment neuf.');
    if (A.hauteurLibre != null) p.push('Hauteur libre ' + C.metres(A.hauteurLibre) + '.');
    if (A.dispoLabel) p.push('Disponibilité : ' + A.dispoLabel.toLowerCase() + '.');
    return p.join(' ');
  }

  /* ---------------------------------------------------------------------------
     Dossier détaillé : photos, caractéristiques, surfaces, localisation,
     conditions financières et contact.
     --------------------------------------------------------------------------- */
  function rendreDossier() {
    return head() + titre() +
      '<div class="doc-photo">Photo principale du bien</div>' +
      '<div class="doc-photos">' +
        '<div>Vue extérieure</div><div>Quai de chargement</div><div>Intérieur cellule</div>' +
      '</div>' +
      kpis() +
      '<h2>Présentation</h2>' +
      '<p class="doc-lede">' + C.esc(A.description || introTeaser()) + '</p>' +

      '<h2>Bâtiment et construction</h2><dl class="doc-specs">' +
        row('État', C.label('etat', A.etat), true) +
        row('Hauteur libre sous poutre', C.val(A.hauteurLibre, C.metres), true) +
        row('Hauteur à l’acrotère', C.val(A.acrotere, C.metres)) +
        row('Charge au sol', C.val(A.chargeSol, C.tonnes), true) +
        row('Nombre de bâtiments', C.val(A.nbBatiments, C.nombre)) +
        row('Nombre de cellules', C.val(A.nbCellules, C.nombre)) +
        row('Certifications', (A.certifications || []).length ? A.certifications.join(', ') : null) +
      '</dl>' +

      '<h2>Quais, accès et stationnement</h2><dl class="doc-specs">' +
        row('Portes à quai', C.avecUnite(A.quais, A.quaisUnite), true) +
        row('Portes de plain-pied', C.avecUnite(A.plainPied, A.plainPiedUnite), true) +
        row('Accès poids lourds', A.accesPL === true ? 'Oui' : A.accesPL === false ? 'Non' : null) +
        row('Aire de manœuvre', A.aireManoeuvre === true ? 'Oui' : A.aireManoeuvre === false ? 'Non' : null) +
        row('Places de parking', C.val(A.parking, C.nombre)) +
        row('Dont places PMR', C.val(A.parkingPMR, C.nombre)) +
        row('Bornes de recharge', C.val(A.bornesElec, C.nombre)) +
      '</dl>' +

      '<h2>Énergie et équipements</h2><dl class="doc-specs">' +
        row('Nature du chauffage', A.chauffage || null) +
        row('Chauffage bureaux', A.chauffageBureaux || null) +
        row('Éclairage', A.eclairage || null) +
        row('Tarif électrique', A.tarifElec || null) +
        row('DPE', A.dpe, true) +
      '</dl>' +

      '<h2>Surfaces et lots</h2>' + tableauLots(A.lots || [], true) +
      (A.lots && A.lots.length
        ? '<p class="doc-note">Total général : ' +
          C.esc(C.m2(A.lots.reduce(function (n, l) { return n + l.surface; }, 0))) + '</p>'
        : '<p class="doc-note">Le détail par lot n’est pas communiqué pour cette offre.</p>') +

      '<h2>Localisation et accès</h2><dl class="doc-specs">' +
        row('Adresse', A.ville + ' (' + A.cp + ')', true) +
        (A.transports || []).map(function (t) {
          return row(t.type === 'route' ? 'Axe routier' : 'Transport', t.label);
        }).join('') +
      '</dl>' +

      '<h2>Réglementaire</h2><dl class="doc-specs">' +
        row('Régime ICPE', A.icpeRegime ? C.label('icpe', A.icpeRegime) : null, true) +
        row('Rubriques ICPE', (A.icpeRubriques || []).length ? A.icpeRubriques.join(', ') : null, true) +
      '</dl>' +

      '<h2>Conditions financières</h2><dl class="doc-specs">' +
        row('Loyer', C.val(A.loyer, C.euro), true) +
        row('Fourchette de marché', A.marche ? A.marche.bas + ' à ' + A.marche.haut + ' €/m²/an' : null) +
        row('Moyenne constatée', A.marche ? A.marche.moyenne + ' €/m²/an' : null) +
      '</dl>' +

      contact() +
      '<p class="doc-note">Document non contractuel. Les surfaces, disponibilités et conditions ' +
        'financières sont indicatives et susceptibles d’évolution. Les informations de marché ne ' +
        'sauraient remplacer l’avis d’un expert pour un bien spécifique. Référence CBRE ' +
        C.esc(A.ref) + '.</p>' +
      foot();
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.title = (MODE === 'teaser' ? 'Teaser' : 'Dossier') + ' — ' +
                     C.titreComplet(A) + ' — Réf. ' + A.ref;
    document.querySelector('.sheet').innerHTML =
      MODE === 'teaser' ? rendreTeaser() : rendreDossier();

    var imprimer = document.getElementById('doPrint');
    if (imprimer) imprimer.addEventListener('click', function () { window.print(); });
  });
})();
