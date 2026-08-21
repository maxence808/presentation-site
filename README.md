# preco-site-cbre

Deux volets :

1. **La reproduction de l'existant** (racine) — accueil, résultats et fiche annonce
   de immobilier.cbre.fr, à l'identique. Sert de point de comparaison « avant ».
2. **La refonte** (`refonte/`) — nouvelle expérience de recherche et de fiche
   annonce, priorité entrepôts et locaux d'activités. Cas de référence : offre **148144**.

| | Avant | Après |
|---|---|---|
| Résultats | [recherche.html](recherche.html) | [refonte/recherche.html](refonte/recherche.html) |
| Fiche | [annonce.html](annonce.html) | [refonte/annonce.html](refonte/annonce.html) |

## Lancer

```bash
python -m http.server 4173
```

Puis ouvrir <http://localhost:4173>. Aucune étape de build : HTML/CSS/JS servis tels quels,
comme le site d'origine.

## Ce que fait le site d'origine

Relevé effectué le 21/08/2026 sur immobilier.cbre.fr.

| | |
|---|---|
| Serveur | ASP.NET WebForms — URLs en `.aspx`, ressources via `WebResource.axd` |
| CSS | Bootstrap 5 + surcouche maison, livrée en 2 bundles (`template.css`, `home.css`) |
| JS | Bootstrap bundle + `template.js` / `home.js`, carrousels **Flickity** |
| Police | **Calibre** (propriétaire CBRE), repli `FallbackForCalibreRegular` |
| Tiers | Google Tag Manager, Google Analytics, cookieconsent 2.8.9, WAF Imperva/Incapsula |

Motif d'URL des annonces :
`/offre/{a-louer|a-vendre}/{type}/{code-postal}/{ville}/{id}.aspx`

### Jetons de charte

Repris tels quels dans `assets/css/cbre.css` :

| Variable | Valeur | Usage |
|---|---|---|
| `--green-600` | `#003f2d` | vert CBRE, boutons primaires, titres de chiffres |
| `--light-green` | `#17e88f` | accent, badges « Opportunité », soulignés de nav |
| `--dark-green-600` | `#012a2d` | barre haute, pied de page, titres |
| `--primary` | `#3d5e61` | liens |
| `--light-grey` | `#f5f7f8` | fonds de section alternés |
| `--border-radius` | `10px` | cartes, encadrés |

## Pages

| Fichier | Correspondance | État |
|---|---|---|
| `index.html` | `/` | complet |
| `recherche.html` | `/location-bureaux/...aspx` | complet |
| `annonce.html` | `/offre/.../168083.aspx` | complet |
| `space-program.html`, `contact.html`, `blog.html`, `favoris.html`, `compte.html` | pages secondaires | gabarits — en-tête, pied de page et charte en place, contenu à écrire |

### Structure de la page annonce

Grille `col-lg-8` / `col-lg-4`, reprise du site d'origine :

- **Colonne gauche** — fil d'Ariane, H1 + localisation, badge de disponibilité,
  galerie (1 grande photo + 2 vignettes), menu d'ancres collant, maillage interne,
  puis les 6 sections : Description, Aménagements, Surfaces (tableau des lots),
  Localisation (transports + carte), Énergies (DPE), Infos Marché.
- **Colonne droite** — encadré collant : surface, divisibilité, référence, loyer,
  consultant, révélation du numéro, formulaire de contact.
- **Mobile** — l'encadré repasse en flux normal et une barre d'action fixe
  apparaît une fois la galerie dépassée.

## Interactions (`assets/js/app.js`)

- `initHeaderOffset` — mesure la hauteur réelle du header fixe et l'écrit dans
  `--header-h`. Tout ce qui se cale dessous (padding du body, menu d'ancres, colonne
  carte) lit cette variable, y compris quand la barre haute disparaît en mobile.
- `initSectionMenu` — scrollspy du menu d'ancres + défilement compensé.
- `initPhoneReveal` — bouton « Afficher le numéro » → lien `tel:`.
- `initFavorites` — favoris persistés dans `localStorage` (`cbre.favoris`), compteur d'en-tête.
- `initTabs`, `initCookieBar`, `initMobileBar`, `initContactForm`.

## Éléments à remplacer

Ces éléments sont des **placeholders** : ce sont des actifs CBRE sous licence,
à récupérer depuis le brand kit.

1. **Logo** — `assets/img/logo.svg` est un pavé texte. Déposer le logo officiel.
2. **Police Calibre** — placer les `.woff2` dans `assets/fonts/` puis décommenter
   le bloc `@font-face` en haut de `cbre.css`. Le repli système est actif d'ici là.
3. **Photos** — les blocs `.placeholder-img` attendent les visuels des biens.

Les cartes, elles, sont réelles : [assets/js/maps.js](assets/js/maps.js) pose une
carte Leaflet avec un repère par offre sur la page de résultats, et le bien
consulté en rouge entouré des offres voisines sur la fiche. Un conteneur se
déclare par attribut :

```html
<div class="map-live" data-map="resultats"></div>
<div class="map-live" data-map="bien" data-lat="48.9106" data-lon="2.4397" data-zoom="12"></div>
```

---

# La refonte (`refonte/`)

## Livrables

| # | Livrable | Où |
|---|---|---|
| 1 | Page de résultats liste + carte | [refonte/recherche.html](refonte/recherche.html) |
| 2 | Fiche de l'offre 148144 | [refonte/annonce.html](refonte/annonce.html) |
| 3 | Versions ordinateur et mobile | responsive, bascule Liste/Carte sous 761 px |
| 4 | Panneau de filtres ouvert / fermé | bouton « Tous les filtres » |
| 5 | Détail des surfaces déplié | « Afficher le détail des surfaces » |
| 6 | Parcours de contact simplifié | colonne droite de la fiche |
| 7 | Teaser et dossier | [teaser.html](refonte/teaser.html) · [dossier.html](refonte/dossier.html) |
| 8 | Spécifications des interactions | [docs/specifications-interactions.md](docs/specifications-interactions.md) |
| 9 | Règles de données manquantes | [docs/regles-donnees-manquantes.md](docs/regles-donnees-manquantes.md) |
| 10 | Critères de validation | [docs/criteres-validation.md](docs/criteres-validation.md) |

Volet référencement : [robots.txt](robots.txt), [sitemap.xml](sitemap.xml)
(37 URL, régénérable), [llms.txt](llms.txt), JSON-LD `Product`/`Offer` et
Open Graph sur la fiche.

## Architecture

```
refonte/
  recherche.html      résultats : liste + carte, filtres, tri, chargement progressif
  annonce.html        fiche : en-tête compact, blocs techniques, surfaces, contact
  teaser.html         export 1 page (accepte ?lots=… pour restreindre aux lots choisis)
  dossier.html        export détaillé
  assets/js/
    data.js           jeu de données structuré — la source de tout le reste
    common.js         formatage, règles de données manquantes, état d'URL, mesure
    recherche.js      filtrage, tri, rendu, carte, synchronisation
    annonce.js        rendu de la fiche, cartes, temps de trajet, contact
    export.js         génération des deux documents
```

Le point central est [data.js](refonte/assets/js/data.js) : chaque caractéristique
technique y est une **valeur** (hauteur libre, charge au sol, quais…), jamais un
simple indicateur de présence. C'est ce qui permet de filtrer sur
« hauteur ≥ 8 m » et de comparer deux entrepôts en un coup d'œil.

Certains champs sont volontairement laissés à `null` pour éprouver les règles de
données manquantes — `null` (non communiqué) et `0` (réellement nul) ne sont
jamais confondus.

## Dépendances

Leaflet 1.9.4 et fonds OpenStreetMap, chargés depuis un CDN. La vue satellite
utilise l'imagerie Esri : **droits à confirmer avant mise en production**.

## Réserves

Quatre points ne sont pas couverts par la maquette et sont documentés comme tels
dans les critères de validation :

- **Isochrone réelle** — le rayon affiché est une estimation vitesse × durée, pas
  un contour de temps de parcours. Un service d'itinéraires est nécessaire.
- **PDF serveur** — l'export passe par l'impression du navigateur.
- **Tenue en charge** — 23 offres de démonstration ; la virtualisation de la liste
  et le regroupement des repères restent à mesurer sur le volume réel.
- **Images** — aucune photographie réelle, donc pas de chargement différé à valider.

Deux comportements n'ont pas pu être exercés en automatisation (le panneau de
prévisualisation ne composite pas de trame, donc `IntersectionObserver`,
`requestAnimationFrame` et `scrollTo` restent inertes) : le déclenchement du
chargement progressif au défilement, et la restitution de la position de
défilement au retour depuis une fiche. **À rejouer manuellement.**

## Limites connues

- Les données des annonces sont figées dans le HTML : il n'y a pas de back-office
  ni d'API derrière. Le formulaire de contact n'envoie rien (`data-demo-form`).
- Les carrousels d'images des cartes utilisent Flickity sur le site d'origine ;
  ils sont remplacés ici par un rail CSS à défilement horizontal (`.card-rail`),
  sans dépendance.
- Bootstrap est chargé depuis un CDN. Pour un usage hors ligne, le vendorer
  dans `assets/`.
