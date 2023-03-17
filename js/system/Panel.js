'use strict';
/**
* Class Panel
* -----------
* Gestion des panneaux à l'écran
* 
* const panneau = new Panel({
*     id:         Identifiant du panneau (utiliser ce selector pour
*                 modifier l'apparence)
*     mainTitle:  Titre princpal
*     options:  {
*         movable: true
*         container:    Le contenant (le body, par défaut)
*         position_x:   Position horizontale ('left','right','center' par défaut)
*     }
*   })
*/
class Panel {

  static reset(){
    this.stack = []
  }

  // --- Public Class Method ---

  /**
  * Fermeture du panneau courant (par exemple avec Escape)
  * Utiliser : Panel.closeCurrent()
  */
  static closeCurrent(){
    this.current && this.current.hide()
  }

  /**
  * Le panneau courant
  */
  static get current(){
    return this.stack[this.stack.length - 1]
  }

  static addToStack(panel){
    this.stack || this.reset()
    this.stack.push(panel)
  }

  static removeFromStack(panel){
    const newStack = []
    this.stack.forEach( pan => {
      if ( pan.id == panel.id ) { return }
      else { newStack.push(pan) }
    })
    this.stack = newStack
  }


  //##############        INSTANCE       ###################

  constructor(data){
    this.isBuilt  = false
    this.data     = data
    this.options  = this.constructor.defaultizeOptions(data.options)
  }

  // --- Public Methods ---

  /**
  * Pour afficher le texte +texte+ avec les options +options+
  * 
  * @param texte {HTML String} Le message au format HTML
  * @param options {Hash} Table d'options
  * 
  */
  display(texte, options){
    this.isBuilt || this.build()
    this.setContent(texte)
    this.show()
  }

  /**
  * Affichage du panneau
  */
  show(){
    this.isBuilt || this.build()
    this.obj.classList.remove('hidden')
    this.constructor.addToStack(this)
  }
  /**
  * Masquage du panneau
  */
  hide(){
    this.obj.classList.add('hidden')
    this.constructor.removeFromStack(this)
  }

  // --- Private Methods ---


  // --- Content Methods ---

  /**
  * Définir le contenu principal
  */
  setContent(content){
    if ( content instanceof Array ) content = content.join("<br>")
    DGet('.content', this.obj).innerHTML = content
  }

  // --- Listening Methods ---

  onClickOk(){ 
    this.hide()
  }
  onClickCancel(){
    this.hide()
  }

  // --- Building Methods ---

  build(){
    const o = DCreate('DIV',{id:this.data.id, class:'panel hidden'})
    this.obj = o
    /*
    |  Le titre principal
    */
    o.appendChild(DCreate('DIV',{class:'panel-main-title', text:this.data.mainTitle}))
    /*
    |  Le contenu
    */
    o.appendChild(DCreate('DIV',{class:'content'}))
    /*
    |  La barre des outils
    */
    const tols  = DCreate('DIV',{class:'tools'})
    this.btnOk      = DCreate('BUTTON',{class:'btn-ok', text:'OK'})
    this.btnCancel  = DCreate('BUTTON', {class:'btn-cancel', text:'Fermer'})
    tols.appendChild(this.btnOk)
    tols.appendChild(this.btnCancel)
    o.appendChild(tols)
    /*
    |  On met le panneau dans le document
    */
    this.options.container.appendChild(o)
    /*
    |  On le positionne
    */
    this.positionne()
    /*
    |  Observation du panneau
    */
    this.observe()
    /*
    |  On indique qu'il est construit
    */
    this.isBuilt = true
  }

  observe(){
    const o = this.obj
    this.btnOk.addEventListener('click', this.onClickOk.bind(this))
    this.btnCancel.addEventListener('click', this.onClickCancel.bind(this))
    /*
    |  Rendre le panneau mouvant, sauf s'il est spécifié le contraire
    */
    this.options.movable && $(o).draggable();
  }

  positionne(){
    const o = this.obj
    o.style.width = px(this.options.width)

    let leftMargin, rightMargin ;
    switch(this.options.position_x) {
    case 'left':
      leftMargin = '2em'; 
      break;
    case 'right': 
      rightMargin = '2em'; 
      break;
    default:
      leftMargin = `calc(50% - ${this.options.width / 2}px)`
    }
    if ( rightMargin ) o.style.marginRight = rightMargin ;
    if ( leftMargin ) o.style.marginLeft   = leftMargin ;

  }



  /**
  * Définition des valeurs par défaut
  */
  static defaultizeOptions(options) {
    options = options || {}
    /*
    | La fenêtre est draggable par défaut
    */
    this.defOptionIfRequired(options, 'movable',    true)
    this.defOptionIfRequired(options, 'position_x', 'center')
    this.defOptionIfRequired(options, 'container',  document.body)
    this.defOptionIfRequired(options, 'width',      840)
    return options;
  }
  static defOptionIfRequired(options, key, value){
    Object.assign(options, {[key]: definedOr(options[key], value)})
  }


}
