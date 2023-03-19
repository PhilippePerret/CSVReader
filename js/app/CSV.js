'use strict';

class CSV {

  /**
  * Appelée par le bouton "Ouvrir…" de l'interface
  * Pour choisir un fichier dans le finder et l'afficher
  */
  static chooseAndDisplayCSVFile(){
    Finder.choose({types:['csv'], wantedType:'file'})
    .then(finderElement => {if ( finderElement ) { this.displayFile(finderElement.path)}})
    .catch(err => log("Renoncement", err))
  }

  static displayFile(path){
    WAA.send({class:'CSVFile', method:'getData', data:{csv_path:path}})
  }

  /**
  * Appelée au démarrage, cette méthode affiche la dernière table
  * affichée
  */
  static loadLastState(){
    WAA.send({class:'CSVFile', method:'loadLastState'})
  }
  /**
  * @param [Hash] waa Données retournées par WAA
  * @option waaData [Array] csv_data Données de la table à afficher
  * @option waaData [String] csv_path Chemin d'accès à la dernière table à afficher
  * @option waaData [Array<String>] last_ten Liste des 10 dernières tables affichées (chemin d'accès complet)
  */
  static onReturnLastState(waa){
    if ( waa.ok ) {
      if (waa.csv_path) {
        /*
        |  Si une dernière table existe
        */
        this.onReceiveCSVData({csv_data: waa.csv_data})
        /*
        |  Si la donnée des 10 dernières tables existe
        */
        waa.last_ten && Finder.current.peupleLastTen(waa.last_ten)
        /*
        |  On définit les favoris
        */
        waa.favoris && Finder.current.peupleFavoris(waa.favoris)
      } else {
        /*
        |  Sinon on demande à la choisir (avec Finder.js)
        */
        this.chooseAndDisplayCSVFile()
      }
    } else {
      erreur(waa.message)
    }
  }


  static onReceiveCSVData(tableData){
    // log("Données reçues : ", tableData)
    this.csv_files = []
    this.tablePerPath = {}
    /*
    |  Dispatcher les données
    |
    | On fait une instance CSV par fichier remonté, donc une instance
    | par fichier CSV, par table.
    |
    */
    tableData.csv_data.forEach(dcsv => {
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
    this.id = this.constructor.newId()
    this.dispatchData(data)
    this.instancie_rows()
  }

  remove(ev){
    this.conteneur.remove()
    return stopEvent(ev)
  }

  display(options) {
    /*
    |  Le conteneur
    */
    const conteneur = DCreate('DIV',{class:'table-csv-conteneur'})
    $(conteneur).draggable()
    document.body.appendChild(conteneur)
    this.conteneur = conteneur
    /*
    |  Entête du conteneur
    */
    const header = DCreate('DIV', {class:'table-csv-conteneur-header'})
    const btnClose = DCreate('BUTTON',{text:'❌', class:'fright'})
    btnClose.addEventListener('click', this.remove.bind(this))
    header.appendChild(btnClose)
    /*
    |  Footer du conteneur
    */
    const footer = DCreate('DIV', {class:'table-csv-conteneur-footer'})
    this.divPath = DCreate('DIV', {class:'table-path', text:this.path})
    footer.appendChild(this.divPath)
    /*
    |  Préparer la table d'affichage des données
    */
    const table = DCreate('TABLE', {class:'table_csv'})
    conteneur.appendChild(header)
    conteneur.appendChild(table)
    conteneur.appendChild(footer)

    /*
    |  L'entête
    */
    const thead = DCreate('THEAD')
    const tr_header = DCreate('TR')
    thead.appendChild(tr_header)
    table.appendChild(thead)
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
    table.appendChild(tbody)
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
    this.filename     = this.path.split('/').pop()
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
        // log("Colonne étrangère : ", column)
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
          // log("Traitement de la colonne étrangère", cname)
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
        |
        |  Parfois, une valeur de clé étrangère peut contenir 
        |  plusieurs valeurs, reliées par des '+'. Par exemple, un
        |  livre peut avoir été écrit par plusieurs auteurs. Dans ce
        |  cas, chaque auteur a son Id dans la colonne 'Auteurs' du
        |  livre (qui prend une valeur comme "12+25").
        |  Ici, il faut créer autant de rangées que nécessaire. S'il 
        |  y a deux auteurs, il faut ajouter une rangée
        |
        */
        const finalRows = [] // contiendra toutes les rangées
        this.rows.forEach(row => {
          var foreignKeyValue = row.get(column.name) // l'Id, souvent
          if ( foreignKeyValue.indexOf('+') > -1 ) {
            /*
            |  Traitement spécial pour clé multiple : il faut ajouter
            |  des rangées
            */
            App.show_explication_plus_en_exposant_de_id()
            const ids = foreignKeyValue.split('+')
            row.set(column.name, ids[0])
            finalRows.push(row)
            for (var i = 1, len = ids.length; i < len; ++ i) {
              const dupData = JSON.parse(JSON.stringify(row.data))
              const newRow = new CSVRow(this, dupData)
              newRow.set(column.name, ids[i], `${ids[i]}<sup>+</sup>`)
              finalRows.push(newRow)
            }
          } else {
            /*
            |  Sinon, on ajoute simplement la rangée
            */
            finalRows.push(row)
          }
        })
        this.rows = finalRows // On la remet
        /*
        |  On ajoute les données à chaque rangée de cette table
        */
        this.rows.forEach(row => {
          var foreignKeyValue = row.get(column.name) // l'Id, souvent
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
