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


  static onReceiveCSVData(waaData){
    // log("Données reçues : ", waaData)
    this.csv_files = []
    this.tablePerPath = {}
    /*
    |  Dispatcher les données
    |
    | On fait une instance CSV par fichier remonté, donc une instance
    | par fichier CSV, par table.
    |
    */
    waaData.csv_data.forEach(dcsv => {
      const csv = new CSV(dcsv)
      this.csv_files.push(csv)
      Object.assign(this.tablePerPath, {[csv.path]: csv})
    })
    /*
    |  Traiter les clés étrangères dans chaque fichier
    */
    this.csv_files.forEach(csvfile => csvfile.traite_foreign_keys())
    /*
    |  Afficher les données CSV de la première table
    */
    this.csv_files[0].display()
  }

  /**
  * @return [CSV] La table CSV correspondant au path +path+
  */
  static getByFile(path){
    // log("this.tablePerPath = ", this.tablePerPath)
    return this.tablePerPath[path]
  }

  /**
  * Identifiant unique pour chaque table instanciée
  */
  static newId(){
    this.lastId || (this.lastId = 0)
    return ++ this.lastId
  }

//######################      INSTANCE      ######################

  constructor(data){
    log("INSTANCIATION", data)
    Log.info("Instanciation csv file")
    this.id = this.constructor.newId()
    this.dispatchData(data)
    this.instancie_rows()
  }

  display(options) {
    /*
    |  Préparer la table
    */
    const conteneur = DCreate('TABLE', {id:'table_csv'})
    document.body.appendChild(conteneur)
    /*
    |  L'entête
    */
    const thead = DCreate('THEAD')
    const tr_header = DCreate('TR')
    thead.appendChild(tr_header)
    conteneur.appendChild(thead)
    this.columnNames.forEach( columnName => {
      const td_column = DCreate('TH')
      const spanName    = DCreate('SPAN', {text: columnName, class:'name'})
      const sortUpBtn   = DCreate('span', {text: '△', class:'btn'})
      const sortDownBtn = DCreate('span', {text: '▽', class:'btn'})
      td_column.appendChild(spanName)
      td_column.appendChild(sortUpBtn)
      td_column.appendChild(sortDownBtn)
      tr_header.appendChild(td_column)
      /*
      |  Observers
      */
      sortUpBtn.addEventListener('click', this.sort_rows.bind(this,columnName, 'up'))
      sortDownBtn.addEventListener('click', this.sort_rows.bind(this,columnName, 'down'))
    })
    /*
    |  Afficher toutes les rangées
    */
    const tbody = DCreate('TBODY')
    this.tbody = tbody
    conteneur.appendChild(tbody)
    this.rows.forEach( row => row.display(tbody) )
  }

  /**
  * Dispatch les données remontées
  * @param [Hash] data Toutes les données
  * @option data header Contient les données des colonnes et, notamment, l'indication des clés étrangères
  */
  dispatchData(data){
    this.data         = data
    this.columnNames  = data.columns
    this.header       = data.header
    this.raw_rows     = data.rows
    this.path         = data.path
  }

  instancie_rows(){
    this.rows = []
    this.tableRows = {} // clé = Id de la row
    this.raw_rows.forEach(drow => {
      const row = new CSVRow(this, drow)
      this.rows.push(row)
      Object.assign(this.tableRows, {[row.id] : row})
    })
  }

  /**
  * Traitement des clés étrangères
  * 
  * En gros : on remplace leur colonne par des colonnes avec les données
  */
  traite_foreign_keys(){
    Object.values(this.header).forEach( column => {
      if ( column.foreign_key ) {
        log("Colonne étrangère : ", column)
        /*
        |  Instanciation de la table qui contient les données
        |  étrangères.
        */
        const foreignTable = this.constructor.getByFile(column.csv_file)
        // log("Table étrangère : ", foreignTable)
        /*
        |  On doit supprimer la colonne +column+ et la remplacer par
        |  les colonnes de l'autre table (en injectant les données)
        |  
        |  Boucle sur chaque colonne de la table étrangère
        |
        */
        foreignTable.columnNames.forEach(cname => {
          if (cname == column.foreign_key) return
          log("Traitement de la colonne ", cname)
          /*
          |  On ajoute cette colonne (nom)
          */
          this.columnNames.push(cname)
        })
        /*
        |  Pour nommer de façon unique les colonnes
        */
        const suffixForeignTable = `T${foreignTable.id}`
        /*
        |  On ajoute les données à chaque rangée de cette table
        */
        this.rows.forEach(row => {
          var foreignKeyValue = row.get(column.name) // l'Id, souvent
          if ( foreignKeyValue.indexOf('+') > -1 ) {
            /*
            |  Traitement spécial pour clé multiple
            */
            foreignKeyValue = foreignKeyValue.split('+')[0]
          }
          const foreignRow = foreignTable.getRow(column.foreign_key, foreignKeyValue) // les données de la table étrangère
          // log("foreignRow = ", foreignRow)
          if ( foreignRow ) {            
            /*
            |  On ajoute ces données à la rangée
            */
            for(var col in foreignRow.to_h){
              // console.log("col = %s / fkey = %s",col, column.foreign_key)
              /*
              |  Si c'est la colonne de la clé étrangère, on passe
              */
              if ( col == column.foreign_key) continue
              /*
              |  Ajout de la colonne à la donnée (en mettant un
              |  nom de colonne unique)
              */
              var colname = `${suffixForeignTable}-${col}`
              row.addColumn(colname, foreignRow.to_h[col].value)
            }
          } else {
            console.error("Bizarrement, la rangée étrangère est indéfinie pour :", this)
            console.error("Colonne : ", column)
            console.error("Rangée : ", row)
          }
        })
      }
    })
  }

  /**
  * Obtenir une rangée dans la table (quand c'est une table étrangère)
  * La rangée dont la valeur +key+ (nom colonne) est +keyValue+
  */
  getRow(columnName, columnValue){
    // log("Retourner la rangée dont la colonne %s vaut %s", columnName, columnValue)
    for(var row of this.rows){
      if ( row.get(columnName) == columnValue ) {
        return row
      }
    }
  }

  /**
  * Classement des rangées
  * 
  * @param [String] key La clé de classement (nom de la colonne)
  */
  sort_rows(key, dir){
    const sorted = this.rows.sort(this.sortRowMethod.bind(this, key))
    if ( dir == 'up' ) { sorted.reverse() }
    sorted.forEach( row => this.tbody.appendChild(row.tr) )
  }

  sortRowMethod(key, a, b){
    if ( a.get(key) > b.get(key) ) {
      return -1
    } else {
      return 1
    }
  }
}
