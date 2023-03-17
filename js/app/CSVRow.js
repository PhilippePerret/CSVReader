'use strict';

class CSVRow {

  static newId(){
    this.lastId || (this.lastId = 0)
    return ++ this.lastId
  }


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
  this.id   = this.constructor.newId()
}

/**
* = main =
* 
* Affichage de la rangée dans la table (conteneur)
* 
*/
display(conteneur){
  const tr = DCreate('TR', {id: `TR-${this.id}`})
  this.tr = tr
  conteneur.appendChild(tr)
  this.data.forEach( cdata => {
    const td = DCreate('TD', {text: cdata})
    tr.appendChild(td)
  })
}

/**
* @return la valeur de la colonne +columnName+ de la rangée
*/
get(columnName){
  try {
    return this.to_h[columnName].value
  } catch(err) {
    console.error(err)
    console.error("Erreur survenue avec ", this)
    console.error("Et la clé demandée : ", columnName)
  }
}

/**
* Ajout de colonnes à la rangée (clés étrangères)
*/
addColumn(colName, colValue){
  log("Ajout de colonne %s avec valeur : ", colName, colValue)
  this.data.push(colValue)
  Object.assign(this._ashash, {[colName]: {value: colValue}})
}

/**
* La rangée sous forme de table (dictionnaire), où les clés sont
* les noms des colonnes et les valeurs les valeurs de cellule
* 
* La méthode #get(colonne) permet d'obtenir une valeur
*/
get to_h(){
  if ( undefined == this._ashash) {
    this._ashash = {}
    for( var i in this.data ) {
      var key = this.csv.columnNames[i]
      var val = this.data[i]
      Object.assign(this._ashash, {[key]: {value:val}})
    }
    // log("this._ashash = ", this._ashash)
  }
  return this._ashash
}

}//class CSVRow
