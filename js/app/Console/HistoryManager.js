'use strict';
/**
 * class ConsoleHistoryManager
 * ---------------------------
 * Gestion des l'historique de la console
 * 
 */
class ConsoleHistoryManager {

  constructor(owner){
    this.owner = owner // Console
  }

  prepare(){
    this.history = []
  }

  addToCommandHistory(command){
    this.history.push(command)
    if ( this.maxHistoryIndex > 50 ) {
      this.history.shift()
    }
    this.historyIndex     = this.history.length // toujours 1 de plus
    this.maxHistoryIndex  = parseInt(this.history.length,10)
  }

  /**
    * Remettre la commande suivante de l'historique
    */
  forwardCommandHistory(){
    if ( this.historyIndex < this.maxHistoryIndex ) {
      ++ this.historyIndex
      this.setCurrentCommandHistory()
    } else {
      message("C'est la dernière commande.")
    }
  }
  /**
   * Remettre la commande précédente de l'historique des commandes
   */
  backwardCommandHistory(){
    console.log("-> backwardCommandHistory / index:%i", this.historyIndex)
    console.log("history :", this.history)
    if ( this.historyIndex > 0 ) {
      -- this.historyIndex
      if ( this.historyIndex < 0 ) this.historyIndex = 0
      console.log("Index mis à %i, pour la commande '%s'", this.historyIndex, this.history[this.historyIndex])
      this.setCurrentCommandHistory()      
    } else {
      message("Aucune commande avant.")
    }
  }

  /**
   * @return les données de l'historique des commandes à enregistrer
   * 
   */
  getHistory(){
    console.info("[history2save] this.history = ", this.history)
    return this.history || []
  }

  setHistory(histo){
    this.history      = histo
    this.historyIndex = histo.length
  }

  /*- private -*/ 

  setCurrentCommandHistory(){
    this.owner.value = this.history[this.historyIndex] || ''
  }

}
