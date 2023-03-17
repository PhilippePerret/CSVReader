'use strict';
/**
* Class Interactif
* ----------------
* 
* Pour gérer notamment les méthodes confirm ou prompt
*/
class InteractiveElement {

  /**
  * @param params {Hash} Les paramètres
  *           params.poursuivre     
  *             Fonction avec laquelle poursuivre (c'est à cette méthode
  *             qu'est transmis le choix de l'utilisateur true/false
  *             en premier argument)
  *           params.buttonOk 
  *             Paramètres pour le bouton OK (:name)
  *           params.buttonCancel
  *             Idem pour le bouton Cancel
  *             params.buttonCancel.isDefault pour en faire le bouton
  *             par défaut.
  * 
  */  
  constructor(type, question, params){
    this.type     = type // 'prompt' ou 'confirm'
    this.question = question
    this.params   = this.defaultizeParams(params)
    this.build()
  }
  onClickOk(e){
    this.hide()
    this.params.poursuivre.call(null, true)
    return stopEvent(e)
  }
  onClickCancel(e){
    this.hide()
    this.params.poursuivre.call(null, false)
    return stopEvent(e)
  }
  onKeyUp(e){

  }
  onKeyDown(e){
    if (e.key == 'Enter') {
      return this.onClickOk(e)
    } else if ( e.key == 'Escape') {
      return this.onClickCancel(e)
    } else {
      return stopEvent(e)
    }
  }
  
  show(){
    this.obj.classList.remove('hidden')
  }
  hide(){
    this.unobserveKeys()
    this.obj.remove()
  }

  build(){
    const o = DCreate('DIV', {class:'hidden', style:this.divStyle})
    this.obj = o
    this.msgField   = DCreate('DIV', {class:'inter-message', text: this.question, style:this.msgFieldStyle})
    /*
    |  --- Les boutons ---
    */
    const btnsDiv = DCreate('DIV', {style:this.divButtonsStyle})
    const styleDefault = "background-color:#07A518;color:white;"
    /*
    |  Le bouton OK
    */
    const dataBtnOk = {class:'btn-ok', text: this.btnOkName}
    if ( not(this.params.buttonCancel.isDefault) ) { dataBtnOk.style = styleDefault }
    this.btnOk      = DCreate('BUTTON', dataBtnOk)
    /*
    |  Le boutons Cancel
    */
    const dataBtnCancel = {class:'btn-cancel fleft', text: this.btnCancelName}
    if ( this.params.buttonCancel.isDefault ) { dataBtnCancel.style = styleDefault }
    this.btnCancel  = DCreate('BUTTON', dataBtnCancel)
    btnsDiv.appendChild(this.btnOk)
    btnsDiv.appendChild(this.btnCancel)
    
    o.appendChild(this.msgField)
    o.appendChild(btnsDiv)
    document.body.appendChild(o)
    this.observe()
  }
  observe(){
    if ( this.params.buttonCancel.isDefault ) {
      this.btnOk    .addEventListener('click', this.onClickCancel.bind(this))
      this.btnCancel.addEventListener('click', this.onClickOk.bind(this))      
    } else {
      this.btnOk    .addEventListener('click', this.onClickOk.bind(this))
      this.btnCancel.addEventListener('click', this.onClickCancel.bind(this))      
    }

    this.observeKeys()
  }

  observeKeys(){
    this.oldKeyUpObserver   = window.onkeyup
    this.oldKeyDownObserver = window.onkeydown
    window.onkeyup    = this.onKeyUp.bind(this)
    window.onkeydown  = this.onKeyDown.bind(this)
  }
  unobserveKeys(){
    window.onkeyup    = this.oldKeyUpObserver
    window.onkeydown  = this.oldKeyDownObserver
  }

  get btnOkName(){
    return this.params.buttonOk.name
  }
  get btnCancelName(){
    return this.params.buttonCancel.name
  }

  get divStyle(){
    return "background-color:#EFEFEF;user-select:none;position:fixed;z-index:1010;bottom:200px;left:calc(50% - 250px);width:500px;box-shadow:25px 26px 50px grey;border:1px solid grey;border-radius:0.5em;padding:1.5em;font-size:18pt;font-family:'Arial Narrow', Arial, Helvetica, Geneva;"
  }
  get msgFieldStyle(){
    return 'padding:2em 1em;border:1px solid #CCC;border-radius:0.5em;margin-bottom:2em;font-size:inherit;font-family:inherit;'
  }
  get divButtonsStyle(){
    return 'text-align:right;'
  }

  defaultizeParams(params){
    params.poursuivre         || raise("Il faut absolument définir la fonction pour suivre…")
    params.buttonOk           || Object.assign(params, {buttonOk: {name:'OK'}})
    params.buttonOk.name      || Object.assign(params.buttonOk, {name: 'OK'})
    params.buttonCancel       || Object.assign(params, {buttonCancel: {name:'Cancel'}})
    params.buttonCancel.name  || Object.assign(params.buttonCancel, {name:'Cancel'})
    return params
  }
}

const confirmer = confirm = function(question, params){
  new InteractiveElement('confirm', question, params).show()
}
const demander = function(question, defaultResponse, params){
  console.warn("Il faut que j'apprenne à prompter une valeur")
}
