'use strict';

class CSVRow {


//######################      INSTANCE      ######################

/**
* Instanciation de la rangée
* 
* @param [CSV]    csv   L'instance du fichier CSV propriétaire
* @param [Array]  data  Les données de la rangée
*/  
constructor(csv, data){
  this.csv  = csv 
  this.data = data
}

/**
* = main =
* 
* Affichage de la rangée dans la table (conteneur)
* 
*/
display(conteneur){
  const tr = DCreate('TR')
  conteneur.appendChild(tr)
  this.data.forEach( cdata => {
    const td = DCreate('TD', {text: cdata})
    tr.appendChild(td)
  })
}

}
