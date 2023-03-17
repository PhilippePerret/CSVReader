# CSV Reader

Lecteur de données CSV (et un petit peu enregistreur)

## Composition d'un fichier CSV valide

* la première ligne de données rencontrée (donc ne commençant pas par `#`) doit définir 1) le séparateur et 2) les entêtes, donc les noms des colonnes (note : le séparateur de données est défini automatiquement — ce programme est intelligent).
* les séparateurs utilisés comme texte doivent être échappés (`\,` si le séparateur est une virgule).

### Définition d'une clé étrangère

Une clé étrangère se définit par :

~~~csv

# <nom colonne> -> <key>, </path/to/file.csv>

~~~

> Note : l'entête (nom des colonnes) doit bien entendu être défini avant cette ligne, car le fichier est lu séquentiellement.

### Description d'une colonne

Une colonne peut être décrite, en commentaire, par :

~~~csv

# <nom colonne> : <description> 

~~~

> Notes : 
    - ne pas mettre d'insécable avant les deux points.
    - l'entête (nom des colonnes) doit bien entendu être défini avant cette ligne, car le fichier est lu séquentiellement.

