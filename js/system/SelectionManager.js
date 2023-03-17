'use strict';

/**
 * Gestionnaire de sélection quelconque
 * ------------------------------------
 * (pas forcément dans un champ de texte)
 * 
 * Un élément sélectionnable doit toujours répondre aux méthodes :
 *  - setSelected
 *  - unsetSelected
 * 
 * Si le propriétaire (owner) définit la méthode beforeSetSelection, 
 * cette méthode sera appelée AVANT de définir la sélection.
 * Si le propriétaire du gestionnaire de sélection définit la méthode
 * afterSetSelection, cette méthode sera appelée APRÈS avoir défini
 * la sélection.
 * 
 */

class SelectionManager {

  constructor(owner, data){
    this.owner  = owner
    this.data   = data

    this.liste = []
  }

  forEach(method){
    this.liste.forEach(method)
  }

  get(){
    return this.liste[this.index]
  }

  /** @return Le dernier élément sélectionné */
  get last() {
    this.index = this.liste.length - 1
    return this.get()
  }
  /* Pour répondre à Editor.Selection.current */
  get current(){return this.last}

  get isEmpty(){ return this.liste.length == 0 }
  get isUniq() { return this.liste.length == 1 }

  set(newListe){
    if ( 'function' == typeof this.owner.beforeSetSelection ) {
      this.owner.beforeSetSelection.call(this.owner)
    }
    this.deselectAll()
    if ( isDefined(newListe) ) {    
      if ( not(Array.isArray(newListe)) ){ newListe = [newListe] }
      newListe.forEach( sel => this.add(sel) )
    }
    this.index = 0
    if ( 'function' == typeof this.owner.afterSetSelection ) {
      this.owner.afterSetSelection.call(this.owner)
    }
  }

  toggle(sel, keep){
    if ( sel.isSelected ) { 
      this.remove(sel) 
    } else if ( keep ) { 
      this.add(sel)
    } else {
      this.set([sel])
    }
  }

  add(sel){
    sel || raise("[SelectionManager#add] Il faut définir l'élément à sélectionner !")
    this.liste.push(sel)
    sel.setSelected()
    sel.isSelected = true
    this.index = this.liste.length - 1
  }

  remove(sel){
    this.unSelect(sel)
    var newListe = []
    this.liste.forEach( selchecked => {
      if ( sel == selchecked ) return
      newListe.push(selchecked)
    })
    this.liste = newListe
    this.index = this.liste.length - 1
  }

  deselectAll(){
    this.liste.forEach( sel => this.unSelect(sel) )
    this.liste = []
  }

  unSelect(sel){
    sel.unsetSelected()
    sel.isSelected = false
  }

}
