/* =============================================================================
   Jeu de donnees structure - entrepots et locaux d'activites
   -----------------------------------------------------------------------------
   Chaque caracteristique technique est une VALEUR, jamais un simple booleen
   "l'info existe". C'est ce qui permet de filtrer sur hauteur libre >= 8 m ou
   charge au sol >= 3 T/m² plutot que d'afficher "120 annonces ont cette info".

   Convention des donnees manquantes (cf. docs/regles-donnees-manquantes.md) :
     null        = donnee non renseignee par le mandat -> masquer ou "Non communique"
     0           = valeur reelle nulle (ex. 0 porte a quai) -> afficher "0"
   Ne jamais convertir null en 0 : "pas de quai" et "quais inconnus" sont
   deux reponses differentes pour un logisticien.
   ============================================================================= */

window.CBRE_DATA = (function () {
  'use strict';

  /* Reference : offre 148144, relevee sur immobilier.cbre.fr le 21/08/2026.
     Les autres entrees reprennent les annonces reellement listees comme
     "similaires" sur cette meme fiche, completees de valeurs techniques
     plausibles pour faire tourner les filtres. */
  var annonces = [
    {
      ref: '148144',
      titre: 'Parc d’activités neuf — cellules divisibles',
      typeBien: 'activites',
      transaction: 'location',
      ville: 'Saint-Ouen-l’Aumône',
      cp: '95310',
      departement: 'Val-d’Oise',
      region: 'Île-de-France',
      lat: 49.0439, lon: 2.1178,
      surfaceTotale: 5176,
      surfaceMin: 1211,
      surfaceActivites: 4287,
      surfaceBureaux: 889,
      nbBatiments: 2,
      nbCellules: 4,
      loyer: 100,
      loyerUnite: '€/m²/an HT HC',
      dispo: 'lots',            // immediate | date | lots
      dispoLabel: 'Selon les lots',
      etat: 'neuf',
      hauteurLibre: 8,
      chargeSol: 3,
      quais: 1,                 // par cellule
      quaisUnite: 'par cellule',
      plainPied: 2,
      plainPiedUnite: 'par cellule',
      accesPL: true,
      aireManoeuvre: true,
      parking: 192,
      parkingPMR: 10,
      bornesElec: 39,
      bureauxAccomp: true,
      divisible: true,
      icpeRegime: null,         // non communique sur la fiche d'origine
      icpeRubriques: [],
      certifications: [],
      acrotere: 10.46,
      chauffage: 'Gaz / Aérotherme',
      chauffageBureaux: 'Électrique / Climatisation réversible',
      eclairage: 'LED',
      siteSecurise: true,
      dallageBureauxRdc: 500,
      dallageBureauxEtage: 350,
      tarifElec: 'Tarif jaune',
      abriCycle: true,
      localDechets: true,
      dpe: 'C',
      maj: '2026-06-24',
      contact: { nom: 'Bryan LE LAING', role: 'Industriel & Logistique', tel: '01 59 30 08 67', email: 'bryan.lelaing@cbre.fr' },
      transports: [
        { type: 'train', ligne: 'H', label: 'Épluches' },
        { type: 'rer', ligne: 'C', label: 'Saint-Ouen-l’Aumône-Liesse' },
        { type: 'route', ligne: 'A15', label: 'Autoroute A15' },
        { type: 'route', ligne: 'N184', label: 'Nationale 184' }
      ],
      marche: { bas: 90, haut: 140, moyenne: 105, basUsage: 70, hautUsage: 120 },
      description: 'CBRE vous propose à louer deux cellules neuves dans un parc d’activités situé sur la commune de Saint-Ouen-l’Aumône, dans le Val-d’Oise (95). À proximité de l’autoroute A15, de la nationale 184 et de la ligne C du RER d’Île-de-France. Rarissimes sur ces surfaces, elles disposent d’une porte à quai, d’une porte sectionnelle et de nombreuses places de parking dont des places électriques. Belle surface de 5 176 m² divisible à partir de 1 211 m². Bail commercial.',
      /* Detail par batiment / cellule / lot */
      lots: [
        { batiment: 'A', cellule: 'A04', lot: '4',   etage: '1er étage',      nature: 'Bureaux',   surface: 239,  dispo: 'Octobre 2026', loyer: 100 },
        { batiment: 'A', cellule: 'A04', lot: '4',   etage: 'Rez-de-chaussée', nature: 'Bureaux',   surface: 14,   dispo: 'Octobre 2026', loyer: 100 },
        { batiment: 'A', cellule: 'A04', lot: '4',   etage: 'Rez-de-chaussée', nature: 'Activités', surface: 1274, dispo: 'Octobre 2026', loyer: 100 },
        { batiment: 'B', cellule: 'B6',  lot: 'B6',  etage: '1er étage',      nature: 'Bureaux',   surface: 178,  dispo: 'Immédiate',    loyer: 100 },
        { batiment: 'B', cellule: 'B6',  lot: 'B6',  etage: 'Rez-de-chaussée', nature: 'Bureaux',   surface: 40,   dispo: 'Immédiate',    loyer: 100 },
        { batiment: 'B', cellule: 'B6',  lot: 'B6',  etage: 'Rez-de-chaussée', nature: 'Activités', surface: 993,  dispo: 'Immédiate',    loyer: 100 },
        { batiment: 'B', cellule: 'B7',  lot: 'B7',  etage: '1er étage',      nature: 'Bureaux',   surface: 187,  dispo: 'Immédiate',    loyer: 100 },
        { batiment: 'B', cellule: 'B7',  lot: 'B7',  etage: 'Rez-de-chaussée', nature: 'Bureaux',   surface: 13,   dispo: 'Immédiate',    loyer: 100 },
        { batiment: 'B', cellule: 'B7',  lot: 'B7',  etage: 'Rez-de-chaussée', nature: 'Activités', surface: 1027, dispo: 'Immédiate',    loyer: 100 },
        { batiment: 'B', cellule: 'B11', lot: 'B11', etage: '1er étage',      nature: 'Bureaux',   surface: 178,  dispo: 'Août 2026',    loyer: 100 },
        { batiment: 'B', cellule: 'B11', lot: 'B11', etage: 'Rez-de-chaussée', nature: 'Bureaux',   surface: 40,   dispo: 'Août 2026',    loyer: 100 },
        { batiment: 'B', cellule: 'B11', lot: 'B11', etage: 'Rez-de-chaussée', nature: 'Activités', surface: 993,  dispo: 'Août 2026',    loyer: 100 }
      ]
    },

    {
      ref: '151902', titre: 'Local d’activités récent avec quais', typeBien: 'activites', transaction: 'location',
      ville: 'Louvres', cp: '95380', departement: 'Val-d’Oise', region: 'Île-de-France',
      lat: 49.0447, lon: 2.5044,
      surfaceTotale: 6974, surfaceMin: 2314, surfaceActivites: 6100, surfaceBureaux: 874,
      nbBatiments: 1, nbCellules: 3,
      loyer: 140, loyerUnite: '€/m²/an HT HC',
      dispo: 'immediate', dispoLabel: 'Immédiate',
      etat: 'renove', hauteurLibre: 9.5, chargeSol: 5, quais: 6, plainPied: 2,
      accesPL: true, aireManoeuvre: true, parking: 84, bornesElec: 6, bureauxAccomp: true, divisible: true,
      icpeRegime: 'declaration', icpeRubriques: ['1510'], certifications: ['BREEAM Very Good'],
      dpe: 'C', maj: '2026-07-02',
      contact: { nom: 'Bryan LE LAING', role: 'Industriel & Logistique', tel: '01 59 30 08 67', email: 'bryan.lelaing@cbre.fr' }
    },
    {
      ref: '149877', titre: 'Entrepôt messagerie proche A1', typeBien: 'entrepot', transaction: 'location',
      ville: 'Gonesse', cp: '95500', departement: 'Val-d’Oise', region: 'Île-de-France',
      lat: 48.9873, lon: 2.4494,
      surfaceTotale: 1679, surfaceMin: 1380, surfaceActivites: 1500, surfaceBureaux: 179,
      nbBatiments: 1, nbCellules: 1,
      loyer: 110, loyerUnite: '€/m²/an HT HC',
      dispo: 'date', dispoLabel: 'Septembre 2026',
      etat: 'usage', hauteurLibre: 7, chargeSol: 2, quais: 3, plainPied: 1,
      accesPL: true, aireManoeuvre: true, parking: 22, bornesElec: 0, bureauxAccomp: true, divisible: false,
      icpeRegime: null, icpeRubriques: [], certifications: [],
      dpe: null, maj: '2026-05-18',
      contact: { nom: 'Bryan LE LAING', role: 'Industriel & Logistique', tel: '01 59 30 08 67', email: 'bryan.lelaing@cbre.fr' }
    },
    {
      ref: '143220', titre: 'Plateforme logistique multi-cellules', typeBien: 'entrepot', transaction: 'location',
      ville: 'Persan', cp: '95340', departement: 'Val-d’Oise', region: 'Île-de-France',
      lat: 49.1533, lon: 2.2725,
      surfaceTotale: 26698, surfaceMin: 30, surfaceActivites: 25200, surfaceBureaux: 1498,
      nbBatiments: 3, nbCellules: 9,
      loyer: 90, loyerUnite: '€/m²/an HT HC',
      dispo: 'lots', dispoLabel: 'Selon les lots',
      etat: 'usage', hauteurLibre: 10.5, chargeSol: 5, quais: 24, plainPied: 6,
      accesPL: true, aireManoeuvre: true, parking: 210, bornesElec: 12, bureauxAccomp: true, divisible: true,
      icpeRegime: 'autorisation', icpeRubriques: ['1510', '2662', '2663'], certifications: [],
      dpe: 'D', maj: '2026-04-11',
      contact: { nom: 'Bryan LE LAING', role: 'Industriel & Logistique', tel: '01 59 30 08 67', email: 'bryan.lelaing@cbre.fr' }
    },
    {
      ref: '147051', titre: 'Entrepôt neuf en cours de livraison', typeBien: 'entrepot', transaction: 'location',
      ville: 'Persan', cp: '95340', departement: 'Val-d’Oise', region: 'Île-de-France',
      lat: 49.1489, lon: 2.2818,
      surfaceTotale: 43765, surfaceMin: 193, surfaceActivites: 41800, surfaceBureaux: 1965,
      nbBatiments: 2, nbCellules: 12,
      loyer: 75, loyerUnite: '€/m²/an HT HC',
      dispo: 'date', dispoLabel: 'Décembre 2026 (en cours de livraison)',
      etat: 'neuf', hauteurLibre: 12, chargeSol: 5, quais: 42, plainPied: 8,
      accesPL: true, aireManoeuvre: true, parking: 320, bornesElec: 45, bureauxAccomp: true, divisible: true,
      icpeRegime: 'autorisation', icpeRubriques: ['1510', '1530', '2662'], certifications: ['BREEAM Excellent', 'LEED Gold'],
      dpe: 'A', maj: '2026-08-01',
      contact: { nom: 'Bryan LE LAING', role: 'Industriel & Logistique', tel: '01 59 30 08 67', email: 'bryan.lelaing@cbre.fr' }
    },
    {
      ref: '150318', titre: 'Local d’activités divisible', typeBien: 'activites', transaction: 'location',
      ville: 'Goussainville', cp: '95190', departement: 'Val-d’Oise', region: 'Île-de-France',
      lat: 49.0281, lon: 2.4675,
      surfaceTotale: 1415, surfaceMin: 471, surfaceActivites: 1180, surfaceBureaux: 235,
      nbBatiments: 1, nbCellules: 3,
      loyer: 110, loyerUnite: '€/m²/an HT HC',
      dispo: 'immediate', dispoLabel: 'Immédiate',
      etat: 'usage', hauteurLibre: 6, chargeSol: null, quais: 0, plainPied: 3,
      accesPL: false, aireManoeuvre: false, parking: 18, bornesElec: 0, bureauxAccomp: true, divisible: true,
      icpeRegime: null, icpeRubriques: [], certifications: [],
      dpe: null, maj: '2026-06-30',
      contact: { nom: 'Bryan LE LAING', role: 'Industriel & Logistique', tel: '01 59 30 08 67', email: 'bryan.lelaing@cbre.fr' }
    },
    {
      ref: '146602', titre: 'Projet logistique clé en main', typeBien: 'entrepot', transaction: 'location',
      ville: 'Puiseux-en-France', cp: '95380', departement: 'Val-d’Oise', region: 'Île-de-France',
      lat: 49.0361, lon: 2.4433,
      surfaceTotale: 9960, surfaceMin: 4980, surfaceActivites: 9400, surfaceBureaux: 560,
      nbBatiments: 1, nbCellules: 2,
      loyer: 130, loyerUnite: '€/m²/an HT HC',
      dispo: 'date', dispoLabel: '12 mois après début travaux (PC/ICPE obtenus)',
      etat: 'construire', hauteurLibre: 11, chargeSol: 5, quais: 10, plainPied: 2,
      accesPL: true, aireManoeuvre: true, parking: 96, bornesElec: 14, bureauxAccomp: true, divisible: true,
      icpeRegime: 'enregistrement', icpeRubriques: ['1510'], certifications: ['BREEAM Very Good'],
      dpe: 'B', maj: '2026-07-22',
      contact: { nom: 'Bryan LE LAING', role: 'Industriel & Logistique', tel: '01 59 30 08 67', email: 'bryan.lelaing@cbre.fr' }
    },
    {
      ref: '141990', titre: 'Grande surface de stockage', typeBien: 'entrepot', transaction: 'location',
      ville: 'Bruyères-sur-Oise', cp: '95820', departement: 'Val-d’Oise', region: 'Île-de-France',
      lat: 49.1583, lon: 2.3244,
      surfaceTotale: 15720, surfaceMin: 4896, surfaceActivites: 15100, surfaceBureaux: 620,
      nbBatiments: 1, nbCellules: 3,
      loyer: 55, loyerUnite: '€/m²/an HT HC',
      dispo: 'immediate', dispoLabel: 'Immédiate',
      etat: 'usage', hauteurLibre: 8.5, chargeSol: 3, quais: 14, plainPied: 3,
      accesPL: true, aireManoeuvre: true, parking: 110, bornesElec: null, bureauxAccomp: true, divisible: true,
      icpeRegime: 'declaration', icpeRubriques: ['1510'], certifications: [],
      dpe: 'E', maj: '2026-03-09',
      contact: { nom: 'Bryan LE LAING', role: 'Industriel & Logistique', tel: '01 59 30 08 67', email: 'bryan.lelaing@cbre.fr' }
    },
    {
      ref: '152740', titre: 'Local d’activités proche plateforme aéroportuaire', typeBien: 'activites', transaction: 'location',
      ville: 'Roissy-en-France', cp: '95700', departement: 'Val-d’Oise', region: 'Île-de-France',
      lat: 49.0086, lon: 2.5175,
      surfaceTotale: 1282, surfaceMin: 641, surfaceActivites: 1050, surfaceBureaux: 232,
      nbBatiments: 1, nbCellules: 2,
      loyer: 125, loyerUnite: '€/m²/an HT HC',
      dispo: 'date', dispoLabel: 'Janvier 2027',
      etat: 'renove', hauteurLibre: 7.5, chargeSol: 2.5, quais: 2, plainPied: 2,
      accesPL: true, aireManoeuvre: true, parking: 24, bornesElec: 4, bureauxAccomp: true, divisible: true,
      icpeRegime: null, icpeRubriques: [], certifications: [],
      dpe: 'C', maj: '2026-07-14',
      contact: { nom: 'Bryan LE LAING', role: 'Industriel & Logistique', tel: '01 59 30 08 67', email: 'bryan.lelaing@cbre.fr' }
    },
    {
      ref: '144815', titre: 'Entrepôt avec forte capacité de quais', typeBien: 'entrepot', transaction: 'location',
      ville: 'Marly-la-Ville', cp: '95670', departement: 'Val-d’Oise', region: 'Île-de-France',
      lat: 49.0803, lon: 2.4989,
      surfaceTotale: 15241, surfaceMin: 4682, surfaceActivites: 14600, surfaceBureaux: 641,
      nbBatiments: 1, nbCellules: 3,
      loyer: 100, loyerUnite: '€/m²/an HT HC',
      dispo: 'immediate', dispoLabel: 'Immédiate',
      etat: 'usage', hauteurLibre: 10, chargeSol: 5, quais: 18, plainPied: 4,
      accesPL: true, aireManoeuvre: true, parking: 140, bornesElec: 8, bureauxAccomp: true, divisible: true,
      icpeRegime: 'enregistrement', icpeRubriques: ['1510', '2663'], certifications: [],
      dpe: 'D', maj: '2026-06-05',
      contact: { nom: 'Bryan LE LAING', role: 'Industriel & Logistique', tel: '01 59 30 08 67', email: 'bryan.lelaing@cbre.fr' }
    },

    /* --- Seine-Saint-Denis (releve sur la fiche 168083) --- */
    {
      ref: '168083', titre: 'Logistique urbaine — immeuble restructuré', typeBien: 'activites', transaction: 'location',
      ville: 'Bobigny', cp: '93000', departement: 'Seine-Saint-Denis', region: 'Île-de-France',
      lat: 48.9106, lon: 2.4397,
      surfaceTotale: 2486, surfaceMin: 1898, surfaceActivites: 1898, surfaceBureaux: 588,
      nbBatiments: 1, nbCellules: 2,
      loyer: 160, loyerUnite: '€/m²/an HT HC',
      dispo: 'date', dispoLabel: 'Janvier 2026 (PC obtenu)',
      etat: 'renove', hauteurLibre: 6.8, chargeSol: 2, quais: 2, plainPied: 2,
      accesPL: true, aireManoeuvre: true, parking: 53, bornesElec: 36, bureauxAccomp: true, divisible: true,
      icpeRegime: null, icpeRubriques: [], certifications: ['BREEAM Excellent'],
      dpe: 'C', maj: '2025-10-21',
      contact: { nom: 'Maria SOUBHANE-LENOBLE', role: 'Industriel & Logistique', tel: '01 59 30 08 67', email: 'maria.soubhane@cbre.fr' }
    },
    {
      ref: '162204', titre: 'Local d’activités en zone dense', typeBien: 'activites', transaction: 'location',
      ville: 'Aulnay-sous-Bois', cp: '93600', departement: 'Seine-Saint-Denis', region: 'Île-de-France',
      lat: 48.9386, lon: 2.4939,
      surfaceTotale: 3762, surfaceMin: 319, surfaceActivites: 3400, surfaceBureaux: 362,
      nbBatiments: 1, nbCellules: 6,
      loyer: 110, loyerUnite: '€/m²/an HT HC',
      dispo: 'immediate', dispoLabel: 'Immédiate',
      etat: 'usage', hauteurLibre: 6.5, chargeSol: 2, quais: 4, plainPied: 5,
      accesPL: true, aireManoeuvre: false, parking: 40, bornesElec: 0, bureauxAccomp: true, divisible: true,
      icpeRegime: null, icpeRubriques: [], certifications: [],
      dpe: null, maj: '2026-02-17',
      contact: { nom: 'Maria SOUBHANE-LENOBLE', role: 'Industriel & Logistique', tel: '01 59 30 08 67', email: 'maria.soubhane@cbre.fr' }
    },
    {
      ref: '165530', titre: 'Entrepôt urbain proche périphérique', typeBien: 'entrepot', transaction: 'location',
      ville: 'Saint-Denis', cp: '93200', departement: 'Seine-Saint-Denis', region: 'Île-de-France',
      lat: 48.9362, lon: 2.3574,
      surfaceTotale: 6281, surfaceMin: 1518, surfaceActivites: 5900, surfaceBureaux: 381,
      nbBatiments: 1, nbCellules: 4,
      loyer: 159, loyerUnite: '€/m²/an HT HC',
      dispo: 'immediate', dispoLabel: 'Immédiate',
      etat: 'renove', hauteurLibre: 8, chargeSol: 3, quais: 8, plainPied: 2,
      accesPL: true, aireManoeuvre: true, parking: 62, bornesElec: 10, bureauxAccomp: true, divisible: true,
      icpeRegime: 'declaration', icpeRubriques: ['1510'], certifications: [],
      dpe: 'C', maj: '2026-05-28',
      contact: { nom: 'Maria SOUBHANE-LENOBLE', role: 'Industriel & Logistique', tel: '01 59 30 08 67', email: 'maria.soubhane@cbre.fr' }
    },
    {
      ref: '167412', titre: 'Cellules d’activités neuves', typeBien: 'activites', transaction: 'location',
      ville: 'Le Blanc-Mesnil', cp: '93150', departement: 'Seine-Saint-Denis', region: 'Île-de-France',
      lat: 48.9375, lon: 2.4614,
      surfaceTotale: 4303, surfaceMin: 740, surfaceActivites: 3900, surfaceBureaux: 403,
      nbBatiments: 1, nbCellules: 5,
      loyer: 150, loyerUnite: '€/m²/an HT HC',
      dispo: 'immediate', dispoLabel: 'Immédiate',
      etat: 'neuf', hauteurLibre: 9, chargeSol: 3, quais: 5, plainPied: 5,
      accesPL: true, aireManoeuvre: true, parking: 70, bornesElec: 18, bureauxAccomp: true, divisible: true,
      icpeRegime: 'declaration', icpeRubriques: ['1510'], certifications: ['BREEAM Very Good'],
      dpe: 'B', maj: '2026-07-08',
      contact: { nom: 'Maria SOUBHANE-LENOBLE', role: 'Industriel & Logistique', tel: '01 59 30 08 67', email: 'maria.soubhane@cbre.fr' }
    },
    {
      ref: '169118', titre: 'Base logistique messagerie', typeBien: 'entrepot', transaction: 'location',
      ville: 'Le Bourget', cp: '93350', departement: 'Seine-Saint-Denis', region: 'Île-de-France',
      lat: 48.9344, lon: 2.4256,
      surfaceTotale: 9564, surfaceMin: 1245, surfaceActivites: 9100, surfaceBureaux: 464,
      nbBatiments: 2, nbCellules: 6,
      loyer: 175, loyerUnite: '€/m²/an HT HC',
      dispo: 'lots', dispoLabel: 'Selon les lots',
      etat: 'usage', hauteurLibre: 8.2, chargeSol: 4, quais: 16, plainPied: 3,
      accesPL: true, aireManoeuvre: true, parking: 88, bornesElec: 6, bureauxAccomp: true, divisible: true,
      icpeRegime: 'enregistrement', icpeRubriques: ['1510', '2662'], certifications: [],
      dpe: 'D', maj: '2026-04-25',
      contact: { nom: 'Maria SOUBHANE-LENOBLE', role: 'Industriel & Logistique', tel: '01 59 30 08 67', email: 'maria.soubhane@cbre.fr' }
    },

    /* --- Regions : justifient le cadrage France entiere au lancement --- */
    {
      ref: '132880', titre: 'Plateforme logistique axe A7', typeBien: 'entrepot', transaction: 'location',
      ville: 'Vénissieux', cp: '69200', departement: 'Rhône', region: 'Auvergne-Rhône-Alpes',
      lat: 45.6970, lon: 4.8859,
      surfaceTotale: 22400, surfaceMin: 5600, surfaceActivites: 21500, surfaceBureaux: 900,
      nbBatiments: 1, nbCellules: 4,
      loyer: 62, loyerUnite: '€/m²/an HT HC',
      dispo: 'immediate', dispoLabel: 'Immédiate',
      etat: 'usage', hauteurLibre: 10.8, chargeSol: 5, quais: 22, plainPied: 4,
      accesPL: true, aireManoeuvre: true, parking: 160, bornesElec: 10, bureauxAccomp: true, divisible: true,
      icpeRegime: 'autorisation', icpeRubriques: ['1510', '2662'], certifications: ['BREEAM Good'],
      dpe: 'D', maj: '2026-06-12',
      contact: { nom: 'Julien MARCHAND', role: 'Industriel & Logistique', tel: '04 72 83 48 00', email: 'julien.marchand@cbre.fr' }
    },
    {
      ref: '134502', titre: 'Entrepôt portuaire', typeBien: 'entrepot', transaction: 'location',
      ville: 'Vitrolles', cp: '13127', departement: 'Bouches-du-Rhône', region: 'Provence-Alpes-Côte d’Azur',
      lat: 43.4600, lon: 5.2486,
      surfaceTotale: 18300, surfaceMin: 3050, surfaceActivites: 17600, surfaceBureaux: 700,
      nbBatiments: 1, nbCellules: 6,
      loyer: 58, loyerUnite: '€/m²/an HT HC',
      dispo: 'date', dispoLabel: 'Novembre 2026',
      etat: 'renove', hauteurLibre: 9.2, chargeSol: 4, quais: 18, plainPied: 4,
      accesPL: true, aireManoeuvre: true, parking: 120, bornesElec: 6, bureauxAccomp: true, divisible: true,
      icpeRegime: 'enregistrement', icpeRubriques: ['1510'], certifications: [],
      dpe: 'C', maj: '2026-05-03',
      contact: { nom: 'Sophie ARNAUD', role: 'Industriel & Logistique', tel: '04 91 14 19 00', email: 'sophie.arnaud@cbre.fr' }
    },
    {
      ref: '136771', titre: 'Local d’activités parc tertiaire', typeBien: 'activites', transaction: 'location',
      ville: 'Villeneuve-d’Ascq', cp: '59650', departement: 'Nord', region: 'Hauts-de-France',
      lat: 50.6292, lon: 3.1667,
      surfaceTotale: 3120, surfaceMin: 780, surfaceActivites: 2700, surfaceBureaux: 420,
      nbBatiments: 1, nbCellules: 4,
      loyer: 78, loyerUnite: '€/m²/an HT HC',
      dispo: 'immediate', dispoLabel: 'Immédiate',
      etat: 'neuf', hauteurLibre: 8, chargeSol: 3, quais: 2, plainPied: 4,
      accesPL: true, aireManoeuvre: true, parking: 52, bornesElec: 8, bureauxAccomp: true, divisible: true,
      icpeRegime: null, icpeRubriques: [], certifications: ['BREEAM Very Good'],
      dpe: 'B', maj: '2026-07-19',
      contact: { nom: 'Thomas DELOBEL', role: 'Industriel & Logistique', tel: '03 20 12 34 56', email: 'thomas.delobel@cbre.fr' }
    },
    {
      ref: '138944', titre: 'Entrepôt axe atlantique', typeBien: 'entrepot', transaction: 'location',
      ville: 'Saint-Herblain', cp: '44800', departement: 'Loire-Atlantique', region: 'Pays de la Loire',
      lat: 47.2172, lon: -1.6486,
      surfaceTotale: 7450, surfaceMin: 1490, surfaceActivites: 7000, surfaceBureaux: 450,
      nbBatiments: 1, nbCellules: 5,
      loyer: 68, loyerUnite: '€/m²/an HT HC',
      dispo: 'immediate', dispoLabel: 'Immédiate',
      etat: 'usage', hauteurLibre: 8.6, chargeSol: 3, quais: 9, plainPied: 3,
      accesPL: true, aireManoeuvre: true, parking: 74, bornesElec: null, bureauxAccomp: true, divisible: true,
      icpeRegime: 'declaration', icpeRubriques: ['1510'], certifications: [],
      dpe: null, maj: '2026-01-30',
      contact: { nom: 'Claire BOUVIER', role: 'Industriel & Logistique', tel: '02 40 20 20 20', email: 'claire.bouvier@cbre.fr' }
    },
    {
      ref: '139610', titre: 'Cellules d’activités neuves rocade', typeBien: 'activites', transaction: 'location',
      ville: 'Mérignac', cp: '33700', departement: 'Gironde', region: 'Nouvelle-Aquitaine',
      lat: 44.8430, lon: -0.6456,
      surfaceTotale: 4890, surfaceMin: 610, surfaceActivites: 4300, surfaceBureaux: 590,
      nbBatiments: 2, nbCellules: 8,
      loyer: 88, loyerUnite: '€/m²/an HT HC',
      dispo: 'date', dispoLabel: 'Mars 2027',
      etat: 'neuf', hauteurLibre: 8.5, chargeSol: 3, quais: 4, plainPied: 8,
      accesPL: true, aireManoeuvre: true, parking: 96, bornesElec: 20, bureauxAccomp: true, divisible: true,
      icpeRegime: 'declaration', icpeRubriques: ['1510'], certifications: ['BREEAM Excellent'],
      dpe: 'A', maj: '2026-08-06',
      contact: { nom: 'Antoine REYNAUD', role: 'Industriel & Logistique', tel: '05 56 00 00 00', email: 'antoine.reynaud@cbre.fr' }
    },
    {
      ref: '140233', titre: 'Local d’activités zone aéroportuaire', typeBien: 'activites', transaction: 'location',
      ville: 'Blagnac', cp: '31700', departement: 'Haute-Garonne', region: 'Occitanie',
      lat: 43.6360, lon: 1.3944,
      surfaceTotale: 2640, surfaceMin: 660, surfaceActivites: 2200, surfaceBureaux: 440,
      nbBatiments: 1, nbCellules: 4,
      loyer: 95, loyerUnite: '€/m²/an HT HC',
      dispo: 'immediate', dispoLabel: 'Immédiate',
      etat: 'renove', hauteurLibre: 7.2, chargeSol: 2.5, quais: 1, plainPied: 4,
      accesPL: true, aireManoeuvre: false, parking: 38, bornesElec: 4, bureauxAccomp: true, divisible: true,
      icpeRegime: null, icpeRubriques: [], certifications: [],
      dpe: 'C', maj: '2026-03-21',
      contact: { nom: 'Antoine REYNAUD', role: 'Industriel & Logistique', tel: '05 61 00 00 00', email: 'antoine.reynaud@cbre.fr' }
    },
    {
      ref: '142108', titre: 'Entrepôt frigorifique', typeBien: 'entrepot', transaction: 'location',
      ville: 'Rungis', cp: '94150', departement: 'Val-de-Marne', region: 'Île-de-France',
      lat: 48.7486, lon: 2.3506,
      surfaceTotale: 5400, surfaceMin: 1350, surfaceActivites: 5100, surfaceBureaux: 300,
      nbBatiments: 1, nbCellules: 4,
      loyer: 185, loyerUnite: '€/m²/an HT HC',
      dispo: 'date', dispoLabel: 'Février 2027',
      etat: 'neuf', hauteurLibre: 9, chargeSol: 5, quais: 12, plainPied: 2,
      accesPL: true, aireManoeuvre: true, parking: 58, bornesElec: 12, bureauxAccomp: true, divisible: true,
      icpeRegime: 'autorisation', icpeRubriques: ['1510', '4735'], certifications: ['BREEAM Excellent'],
      dpe: 'B', maj: '2026-08-11',
      contact: { nom: 'Maria SOUBHANE-LENOBLE', role: 'Industriel & Logistique', tel: '01 59 30 08 67', email: 'maria.soubhane@cbre.fr' }
    },
    {
      ref: '145377', titre: 'Local d’activités avec cour PL', typeBien: 'activites', transaction: 'location',
      ville: 'Wissous', cp: '91320', departement: 'Essonne', region: 'Île-de-France',
      lat: 48.7333, lon: 2.3236,
      surfaceTotale: 2980, surfaceMin: 745, surfaceActivites: 2600, surfaceBureaux: 380,
      nbBatiments: 1, nbCellules: 4,
      loyer: 135, loyerUnite: '€/m²/an HT HC',
      dispo: 'immediate', dispoLabel: 'Immédiate',
      etat: 'usage', hauteurLibre: 7, chargeSol: 3, quais: 3, plainPied: 4,
      accesPL: true, aireManoeuvre: true, parking: 44, bornesElec: 2, bureauxAccomp: true, divisible: true,
      icpeRegime: 'declaration', icpeRubriques: ['1510'], certifications: [],
      dpe: 'D', maj: '2026-06-27',
      contact: { nom: 'Maria SOUBHANE-LENOBLE', role: 'Industriel & Logistique', tel: '01 59 30 08 67', email: 'maria.soubhane@cbre.fr' }
    }
  ];

  /* ===========================================================================
     Caracteristiques complementaires
     ---------------------------------------------------------------------------
     Reprend les 34 criteres du panneau « Plus de filtres » du site actuel, mais
     en VALEURS et non en simples cases a cocher. Sur le site d'origine on lit
     « Hauteur libre (1296) » : on sait que 1296 annonces portent l'information,
     jamais laquelle. Ici chaque critere porte sa valeur, donc se filtre.

     Renseigne d'apres le mandat pour l'offre de reference 148144. Pour les
     autres, valeurs de demonstration, volontairement inegales : de nombreux
     champs restent a null pour eprouver les regles de donnees manquantes.
     =========================================================================== */
  var EXTRAS = {
    // Reference : valeurs relevees sur la fiche 148144
    '148144': {
      porteSectionnelle: 2, aireManoeuvreM: 32, structure: 'beton',
      chauffageType: 'gaz-aerotherme', climatisation: true, eclairageType: 'led',
      photovoltaiqueM2: 82, seveso: 'non-soumis', hqe: false,
      batimentIndependant: false, embranchementFer: false, traversant: false, messagerie: false,
      surfaceMezzanine: null, sanitaires: 4, cuisine: false, rie: false
    },
    '151902': {
      classeLogistique: 'B', porteSectionnelle: 2, aireManoeuvreM: 28, empPalettes: 4200,
      structure: 'metal', chauffageType: 'gaz-aerotherme', eclairageType: 'led',
      surfaceMezzanine: 320, surfaceTerrain: 14500, sanitaires: 6,
      breeam: 'very-good', seveso: 'non-soumis', batimentIndependant: true, traversant: false
    },
    '149877': {
      porteSectionnelle: 1, aireManoeuvreM: 18, messagerie: true, structure: 'metal',
      chauffageType: 'electrique', eclairageType: 'fluo', sanitaires: 2,
      seveso: 'non-soumis', batimentIndependant: false, traversant: false
    },
    '143220': {
      classeLogistique: 'B', porteSectionnelle: 4, aireManoeuvreM: 35, empPalettes: 28000,
      pontRoulantT: 5, structure: 'beton', chauffageType: 'gaz-aerotherme', eclairageType: 'fluo',
      surfaceTerrain: 62000, surfaceMezzanine: 850, sanitaires: 12,
      seveso: 'seuil-bas', embranchementFer: true, traversant: true, batimentIndependant: true,
      rie: true, cuisine: true
    },
    '147051': {
      classeLogistique: 'A', porteSectionnelle: 6, aireManoeuvreM: 36, empPalettes: 52000,
      structure: 'beton', chauffageType: 'pac', eclairageType: 'led', climatisation: true,
      surfaceTerrain: 98000, surfaceGrandeHauteur: 41800, sanitaires: 18,
      breeam: 'excellent', hqe: true, photovoltaiqueM2: 12000, seveso: 'seuil-bas',
      embranchementFer: true, traversant: true, batimentIndependant: true, rie: true, cuisine: true
    },
    '150318': {
      porteSectionnelle: 3, structure: 'metal', chauffageType: 'electrique',
      eclairageType: 'naturel', surfaceAtelier: 620, sanitaires: 3,
      seveso: 'non-soumis', batimentIndependant: false, traversant: false
    },
    '146602': {
      classeLogistique: 'A', porteSectionnelle: 2, aireManoeuvreM: 35, empPalettes: 11500,
      structure: 'beton', chauffageType: 'pac', eclairageType: 'led',
      surfaceTerrain: 24000, surfaceGrandeHauteur: 9400, sanitaires: 8,
      breeam: 'very-good', photovoltaiqueM2: 3400, seveso: 'non-soumis',
      batimentIndependant: true, traversant: true
    },
    '141990': {
      classeLogistique: 'C', porteSectionnelle: 3, aireManoeuvreM: 30, empPalettes: 16000,
      pontRoulantT: 3.2, structure: 'metal', chauffageType: 'aucun', eclairageType: 'fluo',
      surfaceTerrain: 38000, sanitaires: 6, seveso: 'non-soumis',
      embranchementFer: true, batimentIndependant: true, traversant: false
    },
    '152740': {
      porteSectionnelle: 2, aireManoeuvreM: 22, messagerie: true, structure: 'mixte',
      chauffageType: 'electrique', climatisation: true, eclairageType: 'led',
      surfaceMezzanine: 180, sanitaires: 4, seveso: 'non-soumis', traversant: false
    },
    '144815': {
      classeLogistique: 'B', porteSectionnelle: 4, aireManoeuvreM: 33, empPalettes: 21000,
      structure: 'beton', chauffageType: 'gaz-aerotherme', eclairageType: 'led',
      surfaceTerrain: 41000, sanitaires: 10, seveso: 'seuil-bas',
      batimentIndependant: true, traversant: true, rie: true
    },
    '168083': {
      porteSectionnelle: 2, aireManoeuvreM: 20, structure: 'beton',
      chauffageType: 'electrique', climatisation: true, eclairageType: 'led',
      surfaceMezzanine: 588, sanitaires: 4, breeam: 'excellent',
      photovoltaiqueM2: 82, seveso: 'non-soumis', batimentIndependant: false, traversant: false
    },
    '162204': {
      porteSectionnelle: 5, structure: 'metal', chauffageType: 'aucun', eclairageType: 'fluo',
      surfaceAtelier: 1200, sanitaires: 5, seveso: 'non-soumis', traversant: false
    },
    '165530': {
      porteSectionnelle: 2, aireManoeuvreM: 26, messagerie: true, structure: 'beton',
      chauffageType: 'gaz-aerotherme', eclairageType: 'led', surfaceMezzanine: 381,
      sanitaires: 6, seveso: 'non-soumis', batimentIndependant: false, traversant: true
    },
    '167412': {
      porteSectionnelle: 5, aireManoeuvreM: 28, structure: 'beton',
      chauffageType: 'pac', climatisation: true, eclairageType: 'led',
      surfaceTerrain: 11000, sanitaires: 6, breeam: 'very-good', photovoltaiqueM2: 1800,
      seveso: 'non-soumis', batimentIndependant: true, traversant: false
    },
    '169118': {
      classeLogistique: 'C', porteSectionnelle: 3, aireManoeuvreM: 24, empPalettes: 9800,
      messagerie: true, structure: 'metal', chauffageType: 'gaz-aerotherme', eclairageType: 'fluo',
      surfaceTerrain: 22000, sanitaires: 8, seveso: 'seuil-bas',
      embranchementFer: false, traversant: true, rie: true
    },
    '132880': {
      classeLogistique: 'B', porteSectionnelle: 4, aireManoeuvreM: 35, empPalettes: 26000,
      pontRoulantT: 8, structure: 'beton', chauffageType: 'gaz-aerotherme', eclairageType: 'led',
      surfaceTerrain: 55000, sanitaires: 12, breeam: 'good', seveso: 'seuil-bas',
      embranchementFer: true, batimentIndependant: true, traversant: true, rie: true
    },
    '134502': {
      classeLogistique: 'B', porteSectionnelle: 3, aireManoeuvreM: 32, empPalettes: 19500,
      structure: 'beton', chauffageType: 'aucun', eclairageType: 'fluo',
      surfaceTerrain: 44000, sanitaires: 9, seveso: 'seuil-haut',
      embranchementFer: true, traversant: true, batimentIndependant: true
    },
    '136771': {
      porteSectionnelle: 4, aireManoeuvreM: 25, structure: 'mixte',
      chauffageType: 'pac', climatisation: true, eclairageType: 'led',
      surfaceAtelier: 900, surfaceTerrain: 8200, sanitaires: 5,
      breeam: 'very-good', photovoltaiqueM2: 1100, seveso: 'non-soumis', batimentIndependant: true
    },
    '138944': {
      classeLogistique: 'C', porteSectionnelle: 3, aireManoeuvreM: 28, empPalettes: 8600,
      structure: 'metal', chauffageType: 'gaz-aerotherme', eclairageType: 'fluo',
      surfaceTerrain: 19000, sanitaires: 6, seveso: 'non-soumis', traversant: false
    },
    '139610': {
      porteSectionnelle: 8, aireManoeuvreM: 26, structure: 'beton',
      chauffageType: 'pac', climatisation: true, eclairageType: 'led',
      surfaceAtelier: 1400, surfaceMezzanine: 590, surfaceTerrain: 13500, sanitaires: 8,
      breeam: 'excellent', hqe: true, photovoltaiqueM2: 2600, seveso: 'non-soumis',
      batimentIndependant: true, traversant: false
    },
    '140233': {
      porteSectionnelle: 4, structure: 'mixte', chauffageType: 'electrique',
      climatisation: true, eclairageType: 'led', surfaceAtelier: 780, sanitaires: 4,
      seveso: 'non-soumis', traversant: false
    },
    // Seul bien frigorifique du jeu : porte une plage de temperature
    '142108': {
      classeLogistique: 'A', porteSectionnelle: 2, aireManoeuvreM: 30, empPalettes: 7400,
      tempMin: -25, tempMax: 4, structure: 'beton', chauffageType: 'pac',
      climatisation: true, eclairageType: 'led', surfaceTerrain: 12000, sanitaires: 7,
      breeam: 'excellent', photovoltaiqueM2: 2200, seveso: 'seuil-bas',
      batimentIndependant: true, traversant: false, rie: true, cuisine: true
    },
    '145377': {
      porteSectionnelle: 4, aireManoeuvreM: 24, pontRoulantT: 2, structure: 'metal',
      chauffageType: 'gaz-aerotherme', eclairageType: 'fluo',
      surfaceAtelier: 850, surfaceTerrain: 7600, sanitaires: 4,
      seveso: 'non-soumis', batimentIndependant: false, traversant: false
    }
  };

  /* Binomes de commercialisation : une offre est souvent portee par deux
     consultants (un local, un specialiste de l'actif). La carte d'annonce les
     affiche tous les deux. A defaut, on retombe sur le contact unique. */
  var BINOMES = {
    '148144': [{ nom: 'Bryan LE LAING', role: 'Industriel & Logistique' },
               { nom: 'Claire BOUVIER', role: 'Val-d’Oise' }],
    '147051': [{ nom: 'Bryan LE LAING', role: 'Industriel & Logistique' },
               { nom: 'Antoine REYNAUD', role: 'Grands comptes' }],
    '143220': [{ nom: 'Bryan LE LAING', role: 'Industriel & Logistique' },
               { nom: 'Thomas DELOBEL', role: 'Logistique' }],
    '142108': [{ nom: 'Maria SOUBHANE-LENOBLE', role: 'Industriel & Logistique' },
               { nom: 'Sophie ARNAUD', role: 'Froid & agro' }],
    '168083': [{ nom: 'Maria SOUBHANE-LENOBLE', role: 'Industriel & Logistique' },
               { nom: 'Julien MARCHAND', role: 'Logistique urbaine' }],
    '132880': [{ nom: 'Julien MARCHAND', role: 'Industriel & Logistique' },
               { nom: 'Sophie ARNAUD', role: 'Sud-Est' }],
    '144815': [{ nom: 'Maria SOUBHANE-LENOBLE', role: 'Industriel & Logistique' },
               { nom: 'Bryan LE LAING', role: 'Val-d’Oise' }],
    '146602': [{ nom: 'Bryan LE LAING', role: 'Industriel & Logistique' },
               { nom: 'Claire BOUVIER', role: 'Clés en main' }]
  };

  annonces.forEach(function (a) {
    a.contacts = BINOMES[a.ref] || [{ nom: a.contact.nom, role: a.contact.role }];

    // Les valeurs deja portees par l'annonce priment sur les complements
    var extra = EXTRAS[a.ref] || {};
    Object.keys(extra).forEach(function (k) {
      if (!(k in a)) a[k] = extra[k];
    });
    // Normalise le niveau BREEAM a partir des certifications deja saisies
    if (a.breeam === undefined) {
      var c = (a.certifications || []).find(function (x) { return /BREEAM/i.test(x); });
      a.breeam = c ? c.replace(/BREEAM\s*/i, '').toLowerCase().replace(/\s+/g, '-') : null;
    }
  });

  /* --- Referentiels utilises par le panneau de filtres --- */
  var referentiels = {
    transaction: [
      { v: 'location', l: 'Location' },
      { v: 'vente',    l: 'Vente' }
    ],
    typeBien: [
      { v: 'activites', l: 'Locaux d’activités' },
      { v: 'entrepot',  l: 'Entrepôts' },
      { v: 'bureaux',   l: 'Bureaux' },
      { v: 'commerce',  l: 'Commerces' }
    ],
    etat: [
      { v: 'neuf',   l: 'Neuf' },
      { v: 'renove', l: 'Rénové / Restructuré' },
      { v: 'usage',  l: 'État d’usage' }
    ],
    dispo: [
      { v: 'immediate', l: 'Immédiate' },
      { v: 'date',      l: 'À date' },
      { v: 'lots',      l: 'Selon les lots' }
    ],
    icpeRegime: [
      { v: 'declaration',   l: 'Déclaration' },
      { v: 'enregistrement', l: 'Enregistrement' },
      { v: 'autorisation',  l: 'Autorisation' }
    ],
    certifications: ['BREEAM Good', 'BREEAM Very Good', 'BREEAM Excellent', 'LEED Gold'],
    icpeRubriques: ['1510', '1530', '2662', '2663', '4735']
  };

  return { annonces: annonces, referentiels: referentiels };
})();
