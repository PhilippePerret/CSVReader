'use strict';

class CSVRow {

  static newId(){
    this.lastId || (this.lastId = 0)
    return ++ this.lastId
  }

  /**
  * @return [HTMLString] la valeur à afficher en fonction du
  * nom de la colonne +colName+
  */
  static formated_value_for(colName, rdata){
    switch(colName.toLowerCase()){
    case 'sexe':
      return rdata == 'H' ? '🧑🏻‍🦱' : '👩🏻‍🦰';
    case 'date':
      return this.formated_value_as_date(rdata);
    default:
      return rdata
    }
  }

  static formated_value_as_date(str){
    var delimitor;
    if (str.indexOf('-') > -1) {
      delimitor = '-'
    } else if (str.indexOf('/') > -1 ) {
      delimitor = '/'
    } else if (str.indexOf(' ') > -1 ) {
      delimitor = ' '
    } else {
      return str // pas de traitement
    }
    const ddate = str.split(delimitor)
    if ( ddate[0].length == 4 ) {
      /*
      |  Date inversée
      */
      return ddate[2] + ' ' + MOIS[Number(ddate[1])].court + ' ' + ddate[0];
    } else if ( ddate[2].length == 4 ) {
      /*
      |  Date dans l'ordre
      */
      return ddate[1] + ' ' + MOIS[Number(ddate[1])].court + ' ' + ddate[2];
    } else {
      /*
      |  Format inconnu
      */
      return str
    }
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
  // this.data.forEach( cdata => {
  //   const td = DCreate('TD', {text: cdata})
  //   tr.appendChild(td)
  // })
  /*
  |  On utilise la table pour avoir le nom de la colonne et
  |  pouvoir formater la donnée
  */
  for ( var col in this.to_h ) {
    const cvalue = this.to_h[col].value
    const td = DCreate('TD', {text: cvalue})
    tr.appendChild(td)
  }
}

/**
* Définit la valeur de la colonne +columnName+ à +newValue+
* Si +formatedValue+ est défini, ce sera la valeur affichée
*/
set(columnName, newValue, formatedValue){
  try {
    // La valeur brute, telle quelle
    this.to_h[columnName].raw_value = newValue
    // La valeur formatée en fonction du nom de colonne
    if ( undefined == formatedValue ) {
      formatedValue = this.constructor.formated_value_for(columnName,newValue)
    }
    this.to_h[columnName].value = formatedValue
  } catch(err) {
    console.error(err)
    console.error("Erreur survenue avec ", this)
    console.error("Et la clé demandée : ", columnName)
  }
}
/**
* @return la valeur de la colonne +columnName+ de la rangée
*/
get(columnName){
  try {
    return this.to_h[columnName].raw_value
  } catch(err) {
    console.error(err)
    console.error("Erreur survenue avec ", this)
    console.error("Et la clé demandée : ", columnName)
  }
}

/**
* Ajout de colonnes à la rangée (clés étrangères)
* 
* @note
*   Ici, colValue est déjà traitée (formatée)
*/
addColumn(colName, colValue){
  // log("Ajout de colonne %s avec valeur : ", colName, colValue)
  this.data.push(colValue)
  Object.assign(this._ashash, {[colName]: {value: colValue}})
}

/**
* La rangée sous forme de table (dictionnaire), où les clés sont
* les noms des colonnes et les valeurs les valeurs de cellule
* 
* La méthode #get(colonne) permet d'obtenir une valeur
* 
* @note
*   Cette méthode permet aussi de formater la valeur en fonction
*   du nom de la colonne. Typiquement, si la colonne s'appelle 
*   'Sexe' (insensible à la casse) alors la fonction remplace 'H'
*   par 🧑🏻‍🦱 et 'F' par 👩🏻‍🦰
*/
get to_h(){
  if ( undefined == this._ashash) {
    this._ashash = {}
    for( var i in this.data ) {
      var key = this.csv.columnNames[i]
      var val = this.constructor.formated_value_for(key, this.data[i])
      Object.assign(this._ashash, {[key]: {value:val, raw_value:this.data[i]}})
    }
    // log("this._ashash = ", this._ashash)
  }
  return this._ashash
}

}//class CSVRow
