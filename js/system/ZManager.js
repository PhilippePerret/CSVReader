'use strict'
/**
* Class ZManager
* --------------
* Gestion des annulations

* @usage
  ------
    Dans App, définir la méthode getZManagerData() qui doit retourner
    les données actions. Cf. ci-dessous

* @data_actions
  -------------
* 
* 
* Courant :
*   Faire une classe qui puisse fonctionner pour n'importe quelle
*   application en définissant certaines conventions.
* 
*/

class ZManager {

  // *-- Public Methods --*

  static resetAll(){
    this.history = []
    this.cursor  = -1
  }
  static resetCursor(){
    this.cursor = this.count - 1
  }

  static undo(){

  }
  static redo(){

  }
  /**
  * Ajoute une action annulable
  */
  static add(ref, params){
    this.history.push(new ZManager(ref, params))
    this.resetCursor()
  }

  // *-- Private Methods --*

  static get count(){return this.history.length}

  // *-- Tests Methods --*

  static get last(){ return this.history[this.count - 1] }

  // *-- Data --*

  static get Data(){
    return this._dataactions || (this._dataactions = App.Undo.Data) 
  }

  // ################      INSTANCES       ###################

  constructor(ref, params){
    this.ref    = ref
    this.action = ref.split(' ')[0] // pour la donnée
    this.params = params
  }

  undo(){
    'function' == typeof App[this.method] || raise(tp('La méthode d’annulation App.Undo.', [this.method]))
    App[this.method].call(App, this.params)
  }

  get method(){
    return this._meth || (this._meth = this.calcMethod())
  }


  // --- Private Methods ---

  calcMethod(){
    return this.ref.replace(/ /g,'_').toLowerCase()
  }

}
