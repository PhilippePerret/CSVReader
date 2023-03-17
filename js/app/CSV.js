'use strict';

class CSV {

  static displayFile(){
    var path = DGet('#csv-file-1').value
    WAA.send({class:'CSVFile', method:'getData', data:{csv_path:path}})
  }

  /**
  * Appelée au démarrage, cette méthode affiche la dernière table
  * affichée ou celle définie dans le champ idoine.
  */
  static display_last_table(){
    var path = DGet('#csv-file-1').value
    WAA.send({class:'CSVFile', method:'getLastCSVFile', data:{csv_path_alt:path}})
  }


  static onReceiveCSVData(data){
    // console.log("Données reçues : ", data)
    this.csv_files = []
    /*
    |  Dispatcher les données
    |
    | On fait une instance CSV par fichier remonté, donc une instance
    | par fichier CSV, par table.
    |
    */
    data.csv_data.forEach(dcsv => {
      const csv = new CSV(dcsv)
      this.csv_files.push(csv)
    })

    /*
    |  Afficher les données CSV de la première table
    */
    this.csv_files[0].display()
  }

//######################      INSTANCE      ######################

  constructor(data){
    this.dispatchData(data)
    this.instancie_rows()
  }

  display(options) {
    /*
    |  Préparer la table
    */
    log("-> Préparation de la table")
    const conteneur = DCreate('TABLE', {id:'table_csv'})
    document.body.appendChild(conteneur)
    /*
    |  L'entête
    */
    log("-> Préparation de l'entête")
    const tr_header = DCreate('TR')
    conteneur.appendChild(tr_header)
    this.columnNames.forEach( columnName => {
      const td_column = DCreate('TH', {text: columnName})
      tr_header.appendChild(td_column)
    })
    /*
    |  Afficher toutes les rangées
    */
    log("-> Affichage des rangées")
    this.rows.forEach( row => row.display(conteneur) )
  }

  dispatchData(data){
    this.data         = data
    this.columnNames  = data.columns
    this.header       = data.header
    this.raw_rows     = data.rows
    this.path         = data.path
  }

  instancie_rows(){
    this.rows = []
    this.raw_rows.forEach(drow => {
      const row = new CSVRow(this, drow)
      this.rows.push(row)
    })
  }

}
