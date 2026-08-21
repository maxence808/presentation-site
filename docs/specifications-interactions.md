# Spécifications des interactions

Périmètre : page de résultats et fiche d'annonce, priorité entrepôts et locaux
d'activités. Les identifiants entre parenthèses renvoient au code de la maquette.

---

## 1. En-tête et défilement

| État | Déclencheur | Comportement |
|---|---|---|
| Déployé | position de défilement ≤ 40 px | Marque, navigation par type de bien, barre compacte |
| Compact | défilement > 40 px | La partie haute se replie (max-height → 0, 220 ms), seule la barre compacte subsiste |

La barre compacte contient en permanence : accès aux filtres, rappel des filtres
actifs, compteur de résultats, tri. Sur mobile, la bascule Liste/Carte s'y ajoute
sous forme de bouton fixe en bas d'écran.

La hauteur réelle de l'en-tête est mesurée au runtime et publiée dans
`--topbar-compact-h` (`common.js`, `initTopbar`). Tout élément collant s'y réfère.
Ne jamais coder une hauteur en dur : elle change entre mobile et bureau, et après
chargement des polices.

---

## 2. Synchronisation liste ↔ carte

### Sélection d'une annonce

| Origine | Effet sur la carte | Effet sur la liste |
|---|---|---|
| Survol souris d'une carte | Repère passe en rouge, 30 px | Bordure rouge sur la carte |
| Focus clavier d'une carte | idem | idem |
| Clic sur un repère | Repère rouge + prévisualisation ouverte | Défilement doux jusqu'à la carte (`block: nearest`) |

**Recentrage.** La carte ne bouge que si le repère sélectionné sort d'un cadre
réduit de 18 % par rapport au cadrage courant (`getBounds().pad(-0.18)`). Ce seuil
évite un recentrage à chaque survol tout en garantissant que le repère reste
visible. Les autres offres restent affichées autour : aucun filtrage visuel.

### Repères

| Type | Taille | Couleur | Usage |
|---|---|---|---|
| Standard | 16 px | vert CBRE `#003f2d` | Toute offre du jeu de résultats |
| Sélectionné | 30 px | rouge `#c8102e` + halo | Offre survolée, focalisée ou consultée |

Le rouge est **réservé** à la sélection. Il n'est utilisé nulle part ailleurs dans
l'interface pour un état non sélectionné.

### Cadrage initial

- Recherche sans localisation → **France entière** (centre 46.6 / 2.4, zoom 5.4).
- Recherche avec localisation → `fitBounds` sur les résultats, zoom plafonné à 13.
- Changement de **tri** → la carte ne bouge pas (`appliquer({ cadrer: false })`).
  Un tri n'est pas un changement de périmètre géographique.
- Changement de **filtre** → recadrage seulement si une localisation est active.

### Tri par pertinence

Trois critères, dans cet ordre, tous explicables au client :

1. **Nouveautés** — mandat mis à jour depuis 30 jours ou moins ;
2. **Complétude technique** — nombre de champs structurants renseignés ;
3. **Fraîcheur** — date de mise à jour décroissante.

Le classement reste distinct du tri « Date de mise à jour », purement
chronologique : sur le jeu de démonstration, les deux divergent dès le 8ᵉ rang.

---

## 3. Filtres

**Application immédiate.** Aucun bouton « Lancer la recherche ».

| Type de champ | Déclencheur | Délai |
|---|---|---|
| Case à cocher, liste déroulante | `change` | immédiat |
| Champ texte, champ nombre | `input` | 220 ms d'inactivité (anti-rebond) |

L'anti-rebond évite de recalculer à chaque frappe dans « surface minimale » sans
donner l'impression d'un champ figé.

**Panneau.** Largeur `min(980px, 96vw)`, glissement depuis la droite (240 ms),
critères répartis en colonnes auto-ajustées (`minmax(280px, 1fr)`) et groupés en
neuf catégories : Recherche, Surface et budget, Disponibilité et état,
Technique — logistique, Technique — configuration, Surfaces par poste,
Équipements et prestations, Certifications environnementales, ICPE et réglementaire.

**54 critères, en valeurs et non en présence.** Le panneau du site actuel propose
« Hauteur libre (1296) » : on apprend que 1296 annonces portent l'information,
jamais laquelle. Ici chaque critère reçoit le contrôle qui correspond à sa nature :

| Nature | Contrôle | Nombre | Exemples |
|---|---|---|---|
| Grandeur mesurable | champ chiffré, seuil min ou max | 23 | hauteur libre, charge au sol, quais, portes sectionnelles, profondeur d'aire de manœuvre, capacité de pont roulant, emplacements palettes, température atteinte, surfaces par poste, parking, bornes, sanitaires, photovoltaïque |
| Échelle ordonnée | liste, comparaison de niveau | 4 | BREEAM ≥ Very Good, DPE ≤ B |
| Nomenclature | cases multiples | 11 | classe logistique, chauffage, éclairage, structure, régime ICPE, SEVESO, rubriques |
| Présence | case unique | 15 | traversant, embranchement fer, messagerie, racké, RIE |

La table `REGLES` de `recherche.js` déclare pour chaque critère le champ visé et
le mode de comparaison (`min`, `max`, `bool`, `present`, `multi`, `inter`,
`ordreMin`, `ordreMax`). Ajouter un critère revient à ajouter une ligne.

Le pied de panneau affiche en continu le nombre d'offres correspondantes : le
conseiller voit l'effet d'un critère avant de refermer.

**Puces de rappel.** Chaque filtre actif produit une puce retirable dans la barre
compacte. Retirer une puce relance immédiatement la recherche.

**Clavier et focus.** `Échap` ferme le panneau. À l'ouverture, le focus va au
bouton de fermeture ; à la fermeture, il revient sur le déclencheur.
`role="dialog"`, `aria-modal="true"`, `aria-hidden` synchronisé.

---

## 3 bis. Anatomie d'une carte d'annonce

Trois zones, de gauche à droite.

| Zone | Contenu |
|---|---|
| Média (230 px) | Carrousel de 4 vues, flèches circulaires, points de progression, favori |
| Descriptif | Titre, ville + code postal + référence, loyer, disponibilité, puis conseillers et actions |
| Chiffres (172 px) | Séparés par un filet vertical : portes à quai, hauteur libre, divisibilité min., surface totale |

**Pourquoi une colonne dédiée.** Ces quatre valeurs sont celles sur lesquelles un
logisticien élimine ou retient une offre. Alignées verticalement à la même
position sur toutes les cartes, elles se comparent en balayant la colonne du
regard. Noyées dans le descriptif, elles imposaient une lecture ligne à ligne.
La surface et la divisibilité ont donc quitté le bloc de gauche : elles y
faisaient doublon.

**Carrousel.** Flèches visibles au survol et au focus clavier ; toujours visibles
sur pointeur tactile (`@media (hover:none)`). Défilement circulaire. Les touches
← et → pilotent le carrousel quand la carte a le focus. Un clic sur une flèche
n'ouvre pas la fiche et ne sélectionne pas l'annonce (`stopPropagation`).

**Badge « Nouveauté ».** Affiché en angle haut-gauche du média lorsque le mandat
a été mis à jour dans les 30 derniers jours. Il remplace l'ancien « Opportunité »,
dont le critère d'attribution n'était pas explicité — ce que le cahier des charges
demandait de supprimer faute de statut objectif. La règle est ici vérifiable :
elle repose sur la date de mise à jour, que la fiche affiche par ailleurs, et
l'infobulle du badge la rappelle.

La comparaison se fait **de jour à jour** (`Date.UTC` sur l'année, le mois et le
quantième) : sans cela, l'heure de consultation déciderait du sort d'un mandat
mis à jour il y a exactement 30 jours.

**Conseillers.** Une offre est souvent portée par un binôme. Les pastilles
affichent initiales et nom complet, à gauche du pied de carte ; les actions
occupent la droite, en taille réduite (`.btn--xs`).

**Sélection.** Trois gestes activent une annonce et illuminent son repère :
le survol, le focus clavier, et désormais **le clic sur le corps de la carte**.
Ce clic ne navigue pas : seuls le titre et « Voir la fiche » ouvrent l'annonce.
La bordure de la carte reprend le rouge du repère sélectionné, pour lier
visuellement les deux vues.

---

## 4. Chargement progressif

- Lot initial : 20 offres. Lots suivants : 20, déclenchés par un observateur
  d'intersection sur la sentinelle, avec une marge d'anticipation de 600 px.
- Aucune pagination visible, aucun sélecteur « nombre de résultats ».
- **Repli** : si `IntersectionObserver` est indisponible, le rendu bascule sur
  des lots de 50 (`CHUNK_FALLBACK`), conformément au minimum demandé.
- La sentinelle porte `role="status"` et `aria-live="polite"` : un lecteur d'écran
  annonce le chargement sans voler le focus.

---

## 5. Retour à la recherche

Depuis une fiche, « Revenir à ma recherche » restaure :
filtres, tri, centre de carte, zoom, position de défilement, annonce active.

**Mécanique.** À chaque ouverture de fiche et à `beforeunload`, la page de
résultats écrit un instantané en `sessionStorage` (`cbre.recherche`) :

```json
{ "filtres": {…}, "tri": "prix-asc", "actif": "148144",
  "scroll": 1840, "carte": { "lat": 49.04, "lon": 2.11, "zoom": 12 } }
```

La fiche reconstruit une URL complète depuis cet instantané (`C.searchUrl`).
Au retour, `restaurer()` réapplique les filtres, puis force le rendu de lots
successifs jusqu'à ce que la hauteur atteigne la position mémorisée avant de
rétablir `scrollTop` — sans cette boucle, la position viserait le vide.

Le garde-fou de 50 itérations empêche une boucle infinie si le contenu ne grandit
plus (jeu de résultats plus court qu'à l'aller, par exemple après changement de
filtre depuis un autre onglet).

---

## 6. Fiche d'annonce

### Divulgation progressive

| Bloc | État initial | Action |
|---|---|---|
| Description commerciale | replié | « Lire la description complète » |
| Détail des surfaces | replié | « Afficher le détail des surfaces » |
| Carte du secteur | non chargée | « Afficher la carte du secteur » |
| Temps de trajet | masqué | « Temps de trajet » dans l'en-tête |

Les cartes ne sont instanciées qu'à l'ouverture : trois cartes Leaflet au premier
rendu pèseraient inutilement sur une fiche déjà dense.

Chaque bouton porte `aria-expanded` et `aria-controls`, et son libellé change
d'état (« Afficher » ↔ « Masquer »).

### Sélection de lots

Cocher des lots dans le détail des surfaces met à jour en direct la barre de
teaser (nombre de lots, surface cumulée) et active le bouton de génération.
L'identifiant d'un lot est `bâtiment-cellule-rang`, le rang étant l'index de la
ligne dans le tableau de son bâtiment. Cet identifiant transite dans l'URL du
teaser (`?lots=B-B6-0|B-B6-2`).

### Galerie

La localisation est une vignette parmi les photos. Au clic, la carte remplace la
photo principale dans le même cadre ; « Revenir aux photos » rétablit l'image.

Le **filigrane** est un choix éditorial : case à cocher dans l'en-tête, désactivée
par défaut, appliquée à tous les visuels de la page (`[data-watermark]`).

### Temps de trajet

Formulaire : adresse de départ, mode (voiture / transports / vélo / marche),
durée maximale, plus la possibilité d'empiler plusieurs lieux de départ.

Le résultat s'affiche **sur la carte de la fiche**, sans quitter l'annonce.

> L'implémentation actuelle trace un rayon estimé à partir d'une vitesse moyenne
> par mode. Ce n'est pas une isochrone. Le point d'intégration d'un service de
> calcul d'itinéraires est `isoForm`, gestionnaire `submit`. Le libellé indique
> explicitement qu'il s'agit d'une estimation, conformément à la consigne de ne
> pas présenter une donnée non garantie comme une mesure exacte.

### Contact

- Le numéro du conseiller est **affiché d'emblée**. Aucun clic préalable.
- Le formulaire accepte un envoi avec **e-mail seul ou téléphone seul**. Le nom
  est facultatif.
- Attributs d'autocomplétion : `autocomplete="email"`, `"tel"`, `"name"`, doublés
  de `inputmode` pour le clavier mobile.
- Erreurs annoncées via `role="alert"` et `aria-invalid` sur le champ fautif.
- Actions explicites : « Demander des informations » (formulaire) et
  « Envoyer un e-mail » (ouvre le client de messagerie, objet et corps préremplis).

Objet type : `Demande d'informations – Offre CBRE 148144`
Corps type : `Bonjour, je souhaite obtenir plus d'informations concernant local
d'activités de 5 176 m² situé à Saint-Ouen-l'Aumône, référence CBRE 148144.`

La référence est présente dans **tous** les canaux : formulaire, e-mail, demande
de visite, WhatsApp.

---

## 7. Export

| Action | Sortie | Contenu |
|---|---|---|
| Imprimer la fiche | `window.print()` sur la fiche | Feuille d'impression dédiée : navigation, formulaires et carte retirés, description dépliée |
| Teaser (1 page) | `teaser.html?ref=…` | Visuel, chiffres clés, caractéristiques principales, accès, contact |
| Teaser sur lots choisis | `teaser.html?ref=…&lots=…` | Idem, restreint aux lots cochés, surface recalculée |
| Dossier détaillé | `dossier.html?ref=…` | Photos, présentation, tous les blocs techniques, tableaux de surfaces, localisation, réglementaire, conditions financières |

Les deux documents partagent `print.css` : format A4, référence CBRE en en-tête
**et** en pied de chaque page, mention « document non contractuel ».

> La génération PDF passe par l'impression du navigateur. Une production
> serveur (en-têtes répétés, pagination maîtrisée, polices embarquées) suppose un
> service de rendu dédié ; le gabarit HTML reste la source.

---

## 8. Mesure d'audience

Point d'entrée unique `CBRE.track(event, payload)`, poussé dans le `dataLayer`
GTM déjà en place.

| Événement | Charge utile |
|---|---|
| `filtre_applique` | filtres, tri, nombre de résultats |
| `bascule_vue` | liste / carte |
| `vue_annonce` | ref, type, ville |
| `detail_surfaces_ouvert` | ref |
| `carte_galerie_ouverte`, `carte_secteur_ouverte` | ref |
| `temps_trajet_ouvert`, `temps_trajet_calcule` | ref, mode, durée |
| `demande_information` | ref, canal (email / téléphone) |
| `appel_conseiller` | ref, source (liste / fiche) |
| `export_teaser`, `export_dossier`, `impression_fiche` | ref, format, nb de lots |
| `retour_recherche` | ref |

---

## 9. Accessibilité

- Anneau de focus visible sur tout élément interactif, non supprimé.
- Lien d'évitement en tête de page.
- La carte porte `role="application"` et un libellé ; chaque repère porte un
  texte alternatif (`alt`) reprenant titre et commune.
- Les tableaux de lots utilisent `<th scope="col">` et une `<caption>` nommant
  le bâtiment.
- `prefers-reduced-motion` neutralise les transitions et les défilements animés.
- Contrastes : rouge de sélection 4,6:1 sur blanc, vert CBRE 12,6:1.
