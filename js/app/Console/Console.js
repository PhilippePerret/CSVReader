'use strict';

class ConsoleClass {

  static resetAll(){
    window.Console = new ConsoleClass()
  }

  /**
   * Préparation de la console (et ses outils)
   * 
   *
   */
  prepare(){
    /*
    | Instanciation des managers
    */
    // console.log("-> Instantiation des managers de console")
    this.keyManager     = new ConsoleKeyManager(this)
    this.CommandManager = new ConsoleCommandManager(this)
    this.HistoryManager = new ConsoleHistoryManager(this)
    this.TooltipManager = new ConsoleToolTipsManager(this)
    this.HistoryManager.prepare()

    /*
    | Observation des touches
    */
    this.observe()
    this.field.focus()
  }

  /**
   * Observation de la console
   * 
   */
  observe(){

    this.field.addEventListener('keyup',    this.keyManager.onKeyUp.bind(this.keyManager))
    this.field.addEventListener('keydown',  this.keyManager.onKeyDown.bind(this.keyManager))
  }

  /*
  | ############  TOUTES LES COMMANDES #############
  |
  | Cf. Console/CommandManager
  |
  */

  /*
  | ############  HISTORIQUE DES COMMANDES #################
  |
  | Cf. Console/HistoryManager
  |
  */

  /*
  | ############    TOUTES LES PROPRIÉTÉS    #################
  */
  /** @return le contenu de la console ou le définit */
  get value(){ return this.field.value }
  set value(value) { this.field.value = value }

  /** @return le mot courant sélectionné */
  get curMot(){ return Editor.Selection.last }

  /** @return le champ de saisie (aka la console) */
  get field(){
    return this._field || (this._field = DGet('input#console'))
  }
}
window.Console = new ConsoleClass()
