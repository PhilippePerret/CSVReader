# CSVReader

Un lecteur pour données CSV

Deux possibilités (une seule à choisir) :

1. C'est une page HTML dynamtique (WWA) qui charge les fichiers CSV, les traite et les affiche
2. C'est un module (script) ruby qui transforme des données CSV en fichier HTML prêt à l'affichage.

## Avantages et inconvénients de chaque formule

1. Page Dynamique (javascript)

#### Avantages

- très souple : traitement facile des nouvelles données

##### Inconénients

* se replonger dans le fonction de WWA (ça peut être rapide)

2. Module ruby

#### Avantages 

- en ruby
- plus simple

#### Inconvénient

* on doit lancer la fabrication des pages chaque fois que les données changes ou qu'on veut changer quelque chose
