# Règles de gestion des données manquantes

Le mandat de commercialisation ne renseigne jamais tous les champs. Une interface
de comparaison technique doit distinguer trois situations que le site actuel
confond régulièrement.

---

## 1. Les trois états d'une donnée

| État | Représentation | Signification | Exemple |
|---|---|---|---|
| **Renseignée** | valeur typée | Le mandat donne la valeur | `hauteurLibre: 8` |
| **Réellement nulle** | `0` | Le bien n'en possède pas | `quais: 0` — aucune porte à quai |
| **Non communiquée** | `null` | Le mandat est muet | `chargeSol: null` |

> **Règle cardinale : ne jamais convertir `null` en `0`.**
> « Pas de quai » et « quais inconnus » sont deux réponses opposées pour un
> logisticien. La première élimine le bien ; la seconde appelle un appel au
> conseiller. Les confondre fait perdre des affaires dans les deux sens.

Une chaîne vide `''` est traitée comme `null`.

---

## 2. Affichage

Deux modes, décidés champ par champ.

### Mode « masquer » — la ligne disparaît

Pour les caractéristiques d'agrément, dont l'absence n'apprend rien :
abri à vélos, local déchets, tarif électrique, dallage des bureaux,
hauteur à l'acrotère, certifications.

### Mode « Non communiqué » — la ligne reste, la valeur est signalée

Pour les champs **structurants**, dont l'absence est en soi une information
que le prospect doit voir :

- hauteur libre sous poutre
- charge au sol
- portes à quai, portes de plain-pied
- régime et rubriques ICPE
- loyer
- disponibilité
- surface minimale divisible
- DPE

Rendu : texte « Non communiqué », en gris clair, en italique
(`.tech-block dd.is-empty`). Le contraste réduit indique l'absence de valeur sans
la rendre illisible.

**Implémentation.** `CBRE.val(brut, formateur, mode)` dans `common.js`.
`mode: 'label'` renvoie « Non communiqué », sinon `null` et l'appelant n'émet pas
la ligne. Sur la fiche, `ligne()` masque et `ligneCle()` signale.

### Bloc entièrement vide

Une catégorie technique dont aucun champ n'est renseigné n'est pas affichée du
tout : un bloc « Sécurité » vide donne l'impression d'une fiche incomplète sans
apporter d'information. Voir `bloc()`, qui renvoie une chaîne vide si aucune
ligne ne subsiste.

### Cartes de résultats

Sur une carte d'annonce, une puce technique dont la valeur est absente **n'est pas
affichée**. L'espace est trop contraint pour porter des mentions d'absence, et une
rangée de « Non communiqué » nuirait à la comparaison en balayage visuel.

---

## 3. Filtrage

**Un seuil non renseigné exclut l'annonce.**

```js
if (f.hMin && (a.hauteurLibre == null || a.hauteurLibre < +f.hMin)) return false;
```

Justification : un filtre « hauteur libre ≥ 8 m » exprime une contrainte
d'exploitation. Retourner un bien de hauteur inconnue reviendrait à affirmer
qu'il satisfait la contrainte, ce qui est faux. L'utilisateur qui veut ratisser
large retire le filtre.

Conséquence assumée : **des biens potentiellement pertinents sont écartés faute
de donnée.** C'est un argument opérationnel fort pour compléter les mandats — le
taux d'exclusion par champ est mesurable et devrait être suivi.

Le filtre `divisible` se lit sur le booléen, pas sur la présence de
`surfaceMin` : un bien non divisible a une `surfaceMin` égale à sa surface totale.

### Surface maximale

Comparée à la plus petite maille commercialisable, pas à la surface totale :

```js
if (f.surfMax && (a.surfaceMin != null ? a.surfaceMin : a.surfaceTotale) > +f.surfMax) return false;
```

Un ensemble de 26 698 m² divisible dès 30 m² doit ressortir sur une recherche
« maximum 500 m² ». Le comportement inverse — comparer la surface totale — masque
précisément l'offre divisible, qui est la plus recherchée.

---

## 4. Tri

Une valeur absente part **toujours en fin de liste**, quel que soit le sens du
tri. Un tri croissant sur le loyer ne doit pas faire remonter les biens sans prix
au prétexte que `null` se compare comme un petit nombre.

```js
if (va == null && vb == null) return 0;
if (va == null) return 1;    // a après b
if (vb == null) return -1;   // b après a
```

Le tri « pertinence » utilise la **complétude technique** comme critère principal,
départagée par la fraîcheur de mise à jour : une fiche renseignée est plus utile
qu'une fiche lacunaire, et cela incite structurellement à compléter les mandats.

Aucun tri « Opportunité » n'est proposé : ce classement n'est pas explicable à
l'utilisateur, et ne peut donc pas être la valeur par défaut.

---

## 5. Unités et accords

Deux défauts constatés sur le site actuel, corrigés ici.

**« 1par cellule ».** L'unité est portée par un champ distinct
(`quaisUnite`), jamais concaténée sans séparateur.
`CBRE.avecUnite(1, 'par cellule')` → `« 1 par cellule »`.

**Accord en genre et en nombre.** L'introduction générée décline le nombre :
`0 → « aucune porte à quai »`, `1 → « une porte à quai »`,
`n → « n portes à quai »`. L'élision est appliquée devant voyelle
(`« dispose d'une porte »`, `« dispose de 2 portes »`), et l'article des axes
routiers est contracté (`« l'A15 »`, `« la N184 »`).

Le sujet de la phrase suit l'unité déclarée : « Chaque cellule dispose… » si les
valeurs sont exprimées par cellule, « Le bâtiment dispose… » sinon.

---

## 6. Documents exportés

Les mêmes règles s'appliquent, avec une nuance : sur un teaser destiné à un
client, un champ structurant absent est signalé « Non communiqué » plutôt que
masqué. Un teaser silencieux sur la charge au sol laisserait croire à un oubli de
lecture ; la mention explicite protège le conseiller.

Sur un teaser restreint à certains lots, l'indicateur « Divisible dès » est
remplacé par « Périmètre : n lots retenus » : conserver la divisibilité globale
contredirait la surface affichée.

---

## 7. Ce qu'il faut instrumenter

Pour piloter la complétude des mandats, exposer par type de bien :

1. taux de renseignement de chaque champ structurant ;
2. nombre de biens exclus par filtre faute de donnée ;
3. écart de position moyenne au tri « pertinence » entre fiches complètes et
   lacunaires.

Ces trois indicateurs transforment une contrainte de saisie en argument
commercial mesurable auprès des équipes de mandat.
