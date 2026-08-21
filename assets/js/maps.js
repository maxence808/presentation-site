/* =============================================================================
   Cartes des pages de la reproduction (racine).
   Remplace les placeholders hachures par une vraie carte Leaflet avec reperes.

   Un conteneur declare ce qu'il attend via des attributs de donnees :
     data-map="resultats"  -> tous les biens du jeu, repere par offre
     data-map="bien"       -> un bien mis en avant + les offres voisines
     data-lat / data-lon   -> position du bien (mode "bien")
     data-zoom             -> niveau de zoom initial
   ============================================================================= */
(function () {
  'use strict';

  /* Jeu de reperes minimal : ces pages sont une reproduction, pas l'application.
     La refonte s'appuie sur refonte/assets/js/data.js, bien plus complet. */
  var BIENS = [
    { ref: '148144', titre: 'Local d’activités — Saint-Ouen-l’Aumône', ville: 'Saint-Ouen-l’Aumône', cp: '95310', surface: '5 176 m²', loyer: '100 €/m²/an', lat: 49.0439, lon: 2.1178 },
    { ref: '168083', titre: 'Logistique urbaine — Bobigny',            ville: 'Bobigny',              cp: '93000', surface: '2 486 m²', loyer: '160 €/m²/an', lat: 48.9106, lon: 2.4397 },
    { ref: '162204', titre: 'Local d’activités — Aulnay-sous-Bois',    ville: 'Aulnay-sous-Bois',     cp: '93600', surface: '3 762 m²', loyer: '110 €/m²/an', lat: 48.9386, lon: 2.4939 },
    { ref: '165530', titre: 'Entrepôt urbain — Saint-Denis',           ville: 'Saint-Denis',          cp: '93200', surface: '6 281 m²', loyer: '159 €/m²/an', lat: 48.9362, lon: 2.3574 },
    { ref: '167412', titre: 'Cellules neuves — Le Blanc-Mesnil',       ville: 'Le Blanc-Mesnil',      cp: '93150', surface: '4 303 m²', loyer: '150 €/m²/an', lat: 48.9375, lon: 2.4614 },
    { ref: '169118', titre: 'Base logistique — Le Bourget',            ville: 'Le Bourget',           cp: '93350', surface: '9 564 m²', loyer: '175 €/m²/an', lat: 48.9344, lon: 2.4256 },
    { ref: '142108', titre: 'Entrepôt frigorifique — Rungis',          ville: 'Rungis',               cp: '94150', surface: '5 400 m²', loyer: '185 €/m²/an', lat: 48.7486, lon: 2.3506 },
    { ref: '145377', titre: 'Local d’activités — Wissous',             ville: 'Wissous',              cp: '91320', surface: '2 980 m²', loyer: '135 €/m²/an', lat: 48.7333, lon: 2.3236 },
    { ref: '149877', titre: 'Entrepôt messagerie — Gonesse',           ville: 'Gonesse',              cp: '95500', surface: '1 679 m²', loyer: '110 €/m²/an', lat: 48.9873, lon: 2.4494 },
    { ref: '151902', titre: 'Local d’activités — Louvres',             ville: 'Louvres',              cp: '95380', surface: '6 974 m²', loyer: '140 €/m²/an', lat: 49.0447, lon: 2.5044 },

    /* Regions : sans elles, une vue France entiere ne montrerait qu'un amas
       au nord. Le reseau CBRE couvre 46 implantations. */
    { ref: '132880', titre: 'Plateforme logistique — Vénissieux',      ville: 'Vénissieux',           cp: '69200', surface: '22 400 m²', loyer: '62 €/m²/an',  lat: 45.6970, lon: 4.8859 },
    { ref: '134502', titre: 'Entrepôt portuaire — Vitrolles',          ville: 'Vitrolles',            cp: '13127', surface: '18 300 m²', loyer: '58 €/m²/an',  lat: 43.4600, lon: 5.2486 },
    { ref: '136771', titre: 'Local d’activités — Villeneuve-d’Ascq',   ville: 'Villeneuve-d’Ascq',    cp: '59650', surface: '3 120 m²',  loyer: '78 €/m²/an',  lat: 50.6292, lon: 3.1667 },
    { ref: '138944', titre: 'Entrepôt — Saint-Herblain',               ville: 'Saint-Herblain',       cp: '44800', surface: '7 450 m²',  loyer: '68 €/m²/an',  lat: 47.2172, lon: -1.6486 },
    { ref: '139610', titre: 'Cellules neuves — Mérignac',              ville: 'Mérignac',             cp: '33700', surface: '4 890 m²',  loyer: '88 €/m²/an',  lat: 44.8430, lon: -0.6456 },
    { ref: '140233', titre: 'Local d’activités — Blagnac',             ville: 'Blagnac',              cp: '31700', surface: '2 640 m²',  loyer: '95 €/m²/an',  lat: 43.6360, lon: 1.3944 },
    { ref: '141550', titre: 'Entrepôt — Strasbourg',                   ville: 'Strasbourg',           cp: '67000', surface: '9 200 m²',  loyer: '72 €/m²/an',  lat: 48.5734, lon: 7.7521 },
    { ref: '141980', titre: 'Local d’activités — Rennes',              ville: 'Rennes',               cp: '35000', surface: '3 480 m²',  loyer: '76 €/m²/an',  lat: 48.1173, lon: -1.6778 }
  ];

  /* Cadrage France entiere : c'est l'etat d'arrivee sur « toutes les annonces ».
     On ne resserre que si une zone a ete explicitement demandee. */
  var FRANCE = { centre: [46.6, 2.4], zoom: 5 };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function icone(actif) {
    return L.divIcon({
      className: '',
      html: '<span class="map-pin ' + (actif ? 'map-pin--active' : '') + '"></span>',
      iconSize: actif ? [28, 28] : [16, 16],
      iconAnchor: actif ? [14, 14] : [8, 8]
    });
  }

  function popup(b) {
    return '<div class="map-popup">' +
             '<strong>' + esc(b.titre) + '</strong><br>' +
             '<span>' + esc(b.ville) + ' (' + esc(b.cp) + ')</span><br>' +
             '<span>' + esc(b.surface) + ' — ' + esc(b.loyer) + '</span><br>' +
             '<span class="ref">Réf. CBRE ' + esc(b.ref) + '</span>' +
           '</div>';
  }

  function construire(node) {
    var mode = node.dataset.map;
    var lat = parseFloat(node.dataset.lat);
    var lon = parseFloat(node.dataset.lon);
    var zoom = parseInt(node.dataset.zoom, 10);

    var map = L.map(node, { scrollWheelZoom: false });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    if (mode === 'bien' && !isNaN(lat) && !isNaN(lon)) {
      // Le bien consulte, puis les offres voisines en plus petit
      L.marker([lat, lon], { icon: icone(true), alt: node.dataset.titre || 'Bien consulté' })
        .addTo(map)
        .bindPopup('<div class="map-popup"><strong>' +
                   esc(node.dataset.titre || 'Bien consulté') + '</strong></div>');

      BIENS.forEach(function (b) {
        if (Math.abs(b.lat - lat) < 0.001 && Math.abs(b.lon - lon) < 0.001) return;
        L.marker([b.lat, b.lon], { icon: icone(false), alt: b.titre })
          .addTo(map).bindPopup(popup(b));
      });

      map.setView([lat, lon], isNaN(zoom) ? 12 : zoom);
      return;
    }

    // Mode resultats : un repere par offre
    BIENS.forEach(function (b) {
      L.marker([b.lat, b.lon], { icon: icone(false), alt: b.titre })
        .addTo(map).bindPopup(popup(b));
    });

    /* A l'arrivee sur l'ensemble des annonces, on montre la France entiere.
       Un fitBounds sur les offres recentrerait sur l'Ile-de-France des que
       celles-ci y sont majoritaires : ce n'est pas le point de depart attendu
       d'une recherche nationale. Le cadrage ne se resserre que sur demande,
       via data-lat / data-lon / data-zoom. */
    if (!isNaN(lat) && !isNaN(lon)) {
      map.setView([lat, lon], isNaN(zoom) ? 11 : zoom);
    } else {
      map.setView(FRANCE.centre, isNaN(zoom) ? FRANCE.zoom : zoom);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof L === 'undefined') return;   // Leaflet absent : on laisse le placeholder
    document.querySelectorAll('[data-map]').forEach(construire);
  });
})();
