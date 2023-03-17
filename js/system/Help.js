'use strict';
/**
* Class Help
* ----------
* Gestion de l'aide d'une application.
* 
* Pour apporter une aide directement dans l'application ET en même
* temps pouvoir produire un document PDF.
* 
* Les deux méthodes de base :
* 
*   Help.display(<what>)        Afficher l'aide pour <what>
* 
*   Help.export()               Exporter le fichier md de l'aide
* 
*   Help.search(<what>,<option>)  Faire une recherche dans l'aide
*   
* 
* Le module fonctionne avec la définition, par l'application, de la
* constante DATA_HELP qui va fournir toutes les informations sur
* l'aide.
* 
* REQUIS
* ------
*   * fichier 'help.css'
*   * donnée HELP_DATA définissant l'aide propre à l'application
*   * Librairie jQuery
*   * Librairie marked (pour interpréter le markdown)
*     <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

* 
*/
class Help {

  // --- Public Methods ---

  /**
  * Affichage de l'aide sans autre indication (texte par défaut)
  */
  static show(){
    this.display('default')
  }

  /**
  * Affichage de l'aide pour le chemin +what+
  * 
  * @param what {String} Chemin d'aide composé de sujets séparés par
  *             des "/". Par exemple "raccourcis/affichage"
  */
  static display(what, options) {
    what = what.split('/')
    var node, nodeName ;
    node = HELP_DATA.root
    while ( nodeName = what.shift() ) {
      node = node[nodeName]
    }
    this.afficher(node._content, options)
  }

  /**
  * Recherche les textes +what+ avec les options +options+
  * 
  * @param what {String, Array of String} Ce qui est recherché
  *         Utiliser '+' pour forcer des choix (par exemple "bonjour+marion" impose de trouver "bonjour" et "marion" tandis que "bonjour,marion" impose de trouver "bonjour" et/ou "marion")
  * @param options {Hash} Définition de la recherche
  *           options.one   Si une liste de string est fournie, il faut seulement une correspondance
  *           options.all   Si une liste de string est fournie, il faut toutes les occurrences
  *           options.caseSensitive  Si true, regarde la casse
  *           options.links   Affiche des liens vers les résultats (sinon, tous les textes sont agglutinés les uns aux autres)
  *           options.isNode  Ne recherche que sur les noms de noeuds
  */  
  static search(what, options){
    options = options || {}
    const what_init = what
    if ( what.match(/\+/) ) {
      what = what.split('+')
      options.all = true
    } else if ( what.match(/,/) ) {
      what = what.split(',')
      options.one = true
    } else if ( not(what instanceof Array) ) {
      what = [what]
    }
    const resultats = this.execSearch(what, options)
    const headerResultat = "<div class='searched'>Recherche "+(options.isNode ? 'du nœud' : 'de')+" « "+what_init+" »</div>\n\n"
    if ( resultats.length ) {
      this.afficher(headerResultat + resultats.join("\n\n"), options)
    } else {
      this.afficher(headerResultat)
      message("Aucun texte d'aide n'a été trouvé.")
    }
  }

  /**
  * Permet d'exporter l'aide sous forme de fichier Markdown qui 
  * pourra être exporter ensuite en fichier PDF.
  * 
  * @param options {Hash} Inutilisé pour le moment.
  * 
  */
  static export(options){
    console.warn("Je dois apprendre à exporter l'aide.")
  }


  // --- Private Methods ---

  /**
  * Pour afficher le texte +str+ avec les options +options+ et
  * ouvrir la fenêtre d'aide.
  */
  static afficher(str, options){
    this.setContent(str)
    this.panel.show()
  }

  /**
  * Met le contenu de l'aide à +content+.
  * 
  * @param content {String} Code Markdown
  */
  static setContent(content){
    this.panel.display(marked.parse(content))
  }

  static execSearch(whats, options){
    this.resultats = []
    for(var i = 0, len = whats.length; i < len; ++ i){
      const what    = whats[i]
      if ( options.isNode ) {
        this.searchNode(what)
      } else {      
        const regwhat = new RegExp('('+what+')', options.caseSensitive ? 'g' : 'ig' )
        this.searchStr(regwhat)
      }
    }
    return this.resultats
  }
  static searchStr(what){
    this.traverseTextNode(HELP_DATA.root, what, this.stringFound.bind(this), false) 
  }
  static searchNode(what){
    this.traverseTextNode(HELP_DATA.root, what, this.nodeFound.bind(this), true)  
  }
  static stringFound(searched, str){
    this.resultats.push( `### Résultat #${this.resultats.length + 1}` +"\n\n"+ str.replace(searched, "<span class='found'>$1</span>") )
  }
  static nodeFound(node) {
    this.resultats.push(node._content)
  }
  static traverseTextNode(node, searched, method, searchNodeName){
    // console.log("node cherché : ", node)
    for ( var k in node ) {
      const value = node[k]
      // console.log("searched = %s, k = %s, value = ", searched, k, value)
      if ( searchNodeName ) {
        /*
        |  Recherche sur les noms de noeud
        */
        if ( k == searched ) { 
          /* --- TROUVÉ --- */
          method.call(null, value) 
        } else if ( 'object' == typeof value ) {
          this.traverseTextNode(value, searched, method, true)
        }
      } else {
        /*
        |  Recherche dans le contenu
        */
        if ( 'string' == typeof value._content /* un bout */) {
          if ( value._content.match(searched) ) {
            /* --- TROUVÉ --- */
            method.call(null, searched, value._content)
          }
        } else if ( not(value) ) {
          // on s'arrête là
        } else {
          traverseTextNode(value, what, method, false)
        }
      }
    }
  }

  /**
  * Les métadonnées transmises (HELP_DATA.metadata)
  */
  static get metadata(){ return HELP_DATA.metadata}

  /**
  * Panneau pour contenir l'aide (Instance {Panel})
  * 
  */
  static get panel(){
    return this._panel || (this._panel = new Panel(this.dataPanel) )
  }
  /* @return données pour le panneau */
  static get dataPanel(){
    return {
        id: 'help'
      , mainTitle: `Aide de ${this.metadata.app}`
      , options: {
            movable: true
          , position_x: 'center'
        }
    }
  }
}
