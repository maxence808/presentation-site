# Critères de validation fonctionnelle

Chaque critère est vérifiable sans instrumentation particulière. Le cas de
référence est l'offre **148144** (Saint-Ouen-l'Aumône, 95310).

Légende : ✅ vérifié sur la maquette · ⚠️ partiellement couvert, voir réserve ·
⬜ à valider en intégration réelle.

---

## 1. Page de résultats — organisation

| # | Critère | Attendu | État |
|---|---|---|---|
| 1.1 | Vue partagée | Liste et carte visibles simultanément sur écran ≥ 761 px | ✅ |
| 1.2 | Bascule mobile | Sous 761 px, un bouton fixe permute Liste / Carte | ✅ |
| 1.3 | Cadrage national | Recherche sans localisation → France entière, pas Paris | ✅ |
| 1.4 | Cadrage ciblé | Recherche avec localisation → cadrage sur les résultats, zoom ≤ 13 | ✅ |
| 1.5 | Survol | Survoler une annonce met son repère en rouge et en 30 px | ✅ |
| 1.6 | Contexte préservé | Les autres repères restent visibles lors d'une sélection | ✅ |
| 1.7 | Recentrage mesuré | La carte ne bouge que si le repère sort du cadre réduit de 18 % | ✅ |
| 1.8 | Prévisualisation | Cliquer un repère ouvre un aperçu avec surface, loyer, hauteur, quais | ✅ |
| 1.9 | Compteur de cadrage | Le nombre d'offres dans le cadrage suit les déplacements de carte | ✅ |

## 2. Chargement et navigation

| # | Critère | Attendu | État |
|---|---|---|---|
| 2.1 | Pas de sélecteur | Aucun contrôle « nombre de résultats à afficher » | ✅ |
| 2.2 | Chargement progressif | Le défilement charge 20 offres de plus, sans pagination visible | ⚠️ |
| 2.3 | Repli | Sans `IntersectionObserver`, 50 offres minimum d'un bloc | ✅ |
| 2.4 | En-tête escamotable | Au-delà de 40 px de défilement, seule la barre compacte subsiste | ✅ |
| 2.5 | Barre compacte complète | Filtres, tri, compteur et accès carte toujours atteignables | ✅ |
| 2.6 | Retour à la recherche | Restaure filtres, tri, centre, zoom, défilement et annonce active | ⚠️ |

> **Réserve 2.2 / 2.6.** Le déclenchement par observateur d'intersection et la
> restitution du défilement n'ont pas pu être exercés en automatisation : le
> panneau de prévisualisation ne composite pas de trame, donc
> `requestAnimationFrame` et `IntersectionObserver` ne se déclenchent pas et
> `scrollTo` reste sans effet. Le rendu par lots, la sentinelle et la boucle de
> restitution sont vérifiés par ailleurs. **À rejouer manuellement dans un
> navigateur visible.**

## 3. Filtres

| # | Critère | Attendu | État |
|---|---|---|---|
| 3.1 | Application immédiate | Aucun clic sur « Lancer la recherche » | ✅ |
| 3.2 | Anti-rebond | Champs texte et nombre : 220 ms d'inactivité | ✅ |
| 3.3 | Panneau large | Multi-colonnes, six catégories | ✅ |
| 3.4 | Couverture des critères | 54 critères répartis en 9 groupes, dont les 34 du panneau actuel | ✅ |
| 3.4b | Valeur et non présence | 23 champs chiffrés, 4 échelles ordonnées, 11 listes de types, 15 booléens | ✅ |
| 3.4c | Température | « ≤ -18 °C » ne retient que le bien frigorifique (142108) | ✅ |
| 3.4d | Palettes | « ≥ 20 000 emplacements » retient 4 offres, toutes vérifiées | ✅ |
| 3.4e | Niveau BREEAM | « ≥ Excellent » retient 4 offres, échelle ordonnée respectée | ✅ |
| 3.4f | Terrain | « ≥ 40 000 m² » retient 5 offres | ✅ |
| 3.4g | DPE | « ≤ B » retient 6 offres notées A ou B | ✅ |
| 3.5 | Surface toutes catégories | Surface min/max opérante sur bureaux, entrepôts, activités, commerces | ✅ |
| 3.6 | Valeurs structurées | Hauteur ≥ 9 m → 9 offres, toutes de hauteur ≥ 9 m | ✅ |
| 3.7 | Cumul | Hauteur ≥ 9 m + quais ≥ 12 → 6 offres | ✅ |
| 3.8 | Carte synchrone | Le nombre de repères suit le filtrage (6 offres → 6 repères) | ✅ |
| 3.9 | Puces retirables | Retirer une puce relance la recherche | ✅ |
| 3.10 | Réinitialisation | « Tout effacer » revient à 23 offres, 0 puce | ✅ |
| 3.11 | État dans l'URL | `?hMin=9&quaisMin=12&tri=pertinence` | ✅ |
| 3.12 | Clavier | `Échap` ferme, focus rendu au déclencheur | ✅ |

## 4. Cartes d'annonces

| # | Critère | Attendu | État |
|---|---|---|---|
| 4.1 | Titre réel | Titre de bien, pas « Location local d'activités ST OUEN L'AUMONE » | ✅ |
| 4.2 | Localisation dédiée | Ville et code postal sur leur propre ligne | ✅ |
| 4.3 | Référence visible | Réf. CBRE lisible sur la carte | ✅ |
| 4.4 | Chiffres clés | Loyer, surface totale, divisibilité, disponibilité | ✅ |
| 4.5 | Puces techniques | Hauteur, quais, plain-pied, charge au sol, ICPE | ✅ |
| 4.6 | Absence gérée | Une puce sans valeur n'est pas affichée | ✅ |
| 4.7 | Badge objectif | « Nouveauté » remplace « Opportunité » : adossé à la date de mise à jour, fenêtre de 30 jours | ✅ |
| 4.7b | Cas limite | Un mandat mis à jour il y a exactement 30 jours est inclus (comparaison jour à jour) | ✅ |
| 4.8 | Carrousel | 4 vues, flèches circulaires, points de progression, défilement circulaire | ✅ |
| 4.9 | Flèches neutres | Un clic sur une flèche ne navigue ni ne sélectionne | ✅ |
| 4.10 | Colonne de chiffres | Filet vertical + portes à quai, hauteur, divisibilité, surface | ✅ |
| 4.11 | Pas de doublon | Surface et divisibilité retirées du bloc de gauche | ✅ |
| 4.12 | Conseillers | Pastilles initiales + nom, binôme le cas échéant, à gauche du pied | ✅ |
| 4.13 | Actions réduites | `.btn--xs`, alignées à droite du pied de carte | ✅ |
| 4.14 | Clic = sélection | Cliquer le corps illumine le repère sans quitter la liste | ✅ |
| 4.15 | Filet responsive | Sous 1080 px le filet passe vertical → horizontal | ✅ |

## 5. Fiche d'annonce — structure

| # | Critère | Attendu | État |
|---|---|---|---|
| 5.1 | En-tête réduit | Plus de répétition des catégories de biens | ✅ |
| 5.2 | Décision sans défilement | Titre, localisation, surface, divisibilité, loyer, disponibilité, référence et 3 données techniques visibles d'emblée | ✅ |
| 5.3 | Référence dictable | Encadré contrasté, bouton de copie | ✅ |
| 5.4 | Titre corrigé | « Local d'activités à louer à Saint-Ouen-l'Aumône — 5 176 m² divisibles » | ✅ |
| 5.5 | Introduction courte | Générée depuis les données, grammaticalement correcte | ✅ |
| 5.6 | Description repliée | « Lire la description complète » | ✅ |

Vérification 5.5, sortie effective :

> CBRE propose à la location 4 cellules neuves totalisant 5 176 m² divisibles à
> partir de 1 211 m² à Saint-Ouen-l'Aumône. À proximité de l'A15 et de la N184.
> Chaque cellule dispose d'une porte à quai, de 2 portes de plain-pied et de
> bureaux d'accompagnement. Référence CBRE : 148144.

## 6. Informations techniques

| # | Critère | Attendu | État |
|---|---|---|---|
| 6.1 | Blocs structurés | 11 catégories en libellé / valeur, aucun paragraphe technique | ✅ |
| 6.2 | Unités propres | « 1 par cellule », jamais « 1par cellule » | ✅ |
| 6.3 | Bloc vide masqué | Une catégorie sans aucune valeur n'est pas rendue | ✅ |
| 6.4 | Absence signalée | ICPE non renseignée → « Non communiqué » | ✅ |
| 6.5 | Fidélité | Hauteur 8 m, charge 3 T/m², acrotère 10,46 m, 192 places dont 39 bornes | ✅ |

## 7. Surfaces et lots

| # | Critère | Attendu | État |
|---|---|---|---|
| 7.1 | Synthèse d'abord | 6 indicateurs, aucun tableau à l'ouverture | ✅ |
| 7.2 | Détail à la demande | « Afficher le détail des surfaces » déplie 2 tableaux | ✅ |
| 7.3 | Totaux exacts | Bâtiment A : 1 527 m² · Bâtiment B : 3 649 m² · Total 5 176 m² | ✅ |
| 7.4 | Repli possible | Le bouton referme le détail | ✅ |
| 7.5 | Sélection de lots | 2 lots cochés → « 2 lots sélectionnés — 1 171 m² » | ✅ |
| 7.6 | Teaser personnalisé | Le teaser ne contient que les lots retenus | ✅ |

## 8. Photographies, localisation, carte

| # | Critère | Attendu | État |
|---|---|---|---|
| 8.1 | Filigrane optionnel | Désactivé par défaut, activable par case à cocher | ✅ |
| 8.2 | Vignette carte | Une vignette « Voir sur la carte » dans la galerie | ✅ |
| 8.3 | Ouverture en place | La carte remplace la photo dans le même cadre | ✅ |
| 8.4 | Repère du bien | Rouge, 30 px | ✅ |
| 8.5 | Offres voisines | Repères 16 px, autre couleur, aperçu au clic (17 repères à 40 km) | ✅ |
| 8.6 | Vue satellite | Sélecteur de couche Plan / Satellite | ⚠️ |

> **Réserve 8.6.** L'imagerie satellite provient d'Esri World Imagery. Les droits
> d'usage doivent être confirmés avant mise en production. La couche est libellée
> « vue indicative, non contractuelle » : aucune mesure ne doit en être tirée.
> Aucune vue 3D n'est fournie — elle suppose un fournisseur sous licence.

## 9. Temps de trajet

| # | Critère | Attendu | État |
|---|---|---|---|
| 9.1 | Intégré à la fiche | Panneau dans la page, aucune redirection | ✅ |
| 9.2 | Paramètres | Adresse de départ, mode, durée maximale | ✅ |
| 9.3 | Lieux multiples | Empilement de plusieurs points de départ | ✅ |
| 9.4 | Résultat en place | Zone tracée sur la carte de l'annonce | ✅ |
| 9.5 | Honnêteté | Présenté comme une estimation, pas comme une mesure | ✅ |
| 9.6 | Isochrone réelle | Contour de temps de parcours effectif | ⬜ |

> **Réserve 9.6.** Le rayon affiché est une estimation vitesse × durée, pas une
> isochrone. Un service de calcul d'itinéraires est nécessaire. Point
> d'intégration : gestionnaire `submit` de `isoForm`.

## 10. Contact

| # | Critère | Attendu | État |
|---|---|---|---|
| 10.1 | Numéro visible | Affiché d'emblée, plus de « Afficher le numéro » | ✅ |
| 10.2 | E-mail seul | Envoi accepté avec la seule adresse e-mail | ✅ |
| 10.3 | Téléphone seul | Envoi accepté avec le seul numéro | ✅ |
| 10.4 | Envoi vide refusé | « Indiquez au moins une adresse e-mail ou un numéro de téléphone. » | ✅ |
| 10.5 | Nom facultatif | Marqué comme tel, non bloquant | ✅ |
| 10.6 | Autocomplétion | `autocomplete="email" / "tel" / "name"` + `inputmode` | ✅ |
| 10.7 | Actions explicites | « Demander des informations » et « Envoyer un e-mail » | ✅ |
| 10.8 | E-mail prérempli | Objet et corps conformes aux modèles fournis | ✅ |
| 10.9 | Référence partout | Formulaire, e-mail, visite et WhatsApp portent 148144 | ✅ |

## 11. Export et impression

| # | Critère | Attendu | État |
|---|---|---|---|
| 11.1 | Deux actions visibles | « Teaser » et « Imprimer la fiche » dans l'en-tête | ✅ |
| 11.2 | Deux formats | Teaser synthétique et dossier détaillé | ✅ |
| 11.3 | Teaser sur une page | Hauteur ≤ 1 123 px (A4 à 96 ppp), lots inclus | ✅ |
| 11.4 | Dossier complet | 8 sections, photos, surfaces, localisation, financier, contact | ✅ |
| 11.5 | Sans navigation | Ni en-tête de site, ni formulaire, ni carte interactive | ✅ |
| 11.6 | Référence visible | En-tête et pied de chaque page | ✅ |
| 11.7 | PDF serveur | Génération hors navigateur | ⬜ |

## 12. Tri

| # | Critère | Attendu | État |
|---|---|---|---|
| 12.1 | Options utiles | 10 tris proposés, dont hauteur libre et nombre de quais | ✅ |
| 12.2 | Liste et carte | Le tri met à jour les deux, sans déplacer le cadrage | ✅ |
| 12.3 | Ordre correct | Loyer croissant : 58, 62, 75, 90, 100, 185 €/m²/an | ✅ |
| 12.4 | Absences en fin | Une valeur non renseignée ne remonte jamais | ✅ |
| 12.5 | Pertinence explicable | Nouveautés en tête, puis complétude technique, puis fraîcheur | ✅ |
| 12.6 | Tris distincts | « Pertinence » et « Date de mise à jour » divergent dès le 8ᵉ rang | ✅ |

## 13. Référencement

| # | Critère | Attendu | État |
|---|---|---|---|
| 13.1 | Éditorial secondaire | Contenu SEO après les résultats, visuellement en retrait | ✅ |
| 13.2 | robots.txt | Valide, bloque la combinatoire de filtres | ✅ |
| 13.3 | sitemap.xml | 37 URL, `lastmod` par offre, balises équilibrées | ✅ |
| 13.4 | Données structurées | JSON-LD `Product` + `Offer` sur la fiche | ✅ |
| 13.5 | Canonique | `<link rel="canonical">` sur résultats et fiche | ✅ |
| 13.6 | Open Graph | Titre, description et type par offre | ✅ |
| 13.7 | llms.txt | Présent, distinct de robots.txt, portée explicitée | ✅ |

## 14. UX et technique

| # | Critère | Attendu | État |
|---|---|---|---|
| 14.1 | Identité CBRE | Jetons de charte inchangés (`#003f2d`, `#17e88f`) | ✅ |
| 14.2 | Sans débordement | Aucun défilement horizontal en 375, 768 et 1280 px | ✅ |
| 14.3 | Focus visible | Anneau sur tout élément interactif | ✅ |
| 14.4 | Contrastes | Rouge 4,6:1 · vert 12,6:1 sur blanc | ✅ |
| 14.5 | Mouvement réduit | `prefers-reduced-motion` neutralise transitions et défilements | ✅ |
| 14.6 | Pas de rechargement | Aucun changement de filtre ne recharge la page | ✅ |
| 14.7 | URL partageable | L'état de recherche se transmet par lien | ✅ |
| 14.8 | Mesure | 12 événements poussés dans le `dataLayer` | ✅ |
| 14.9 | Charge réelle | Tenue avec plusieurs centaines de résultats | ⬜ |
| 14.10 | Images progressives | Chargement différé des photographies | ⬜ |

> **Réserves 14.9 / 14.10.** Le jeu de démonstration compte 23 offres et aucune
> photographie réelle. La montée en charge (virtualisation de la liste,
> regroupement des repères en amas, `loading="lazy"` sur les visuels) doit être
> mesurée sur le volume réel avant mise en production.

---

## Récapitulatif

117 critères au total.

| Statut | Nombre |
|---|---|
| ✅ Vérifié | 110 |
| ⚠️ Réserve documentée | 3 |
| ⬜ À valider en intégration | 4 |

Les quatre points ⬜ dépendent de services externes ou de volumétrie réelle :
isochrone, génération PDF serveur, tenue en charge, images. Aucun n'est bloqué
par la conception ; les points d'intégration sont identifiés dans les
spécifications d'interaction.
