'use strict';
/**
* 
* Class Finder
* ------------
* Pour interagir avec le Finder
* 
* @usage
* ------
* 
*     Finder.choose(<options>)
*     .then(finderElement => {
*       // traitement du +finderElement+ choisi
*       // finderElement.path contient le chemin d'accès à l'élément
*       // cf. en bas de fichier pour voir l'instance
*     })
*     .catch(err => { // erreur ou renoncement })
* 
* … qui permet de choisir un élément dans le Finder
* 
* 
* REQUIS
*   - lib/system/Finder.rb
*   - css/system/Finder.css
* 
* @autres_méthodes
* ----------------
* 
*   Finder.peupleLastTen(<array de full-path>)
* 
*     Rempli le menu avec les 10 derniers paths utilisés par 
*     l'application
* 
*   Finder.
*/
class Finder {

  /**
  * @public
  * 
  * Méthode principale pour choisir un élément de Finder
  * 
  * @param [Hash] options Définition de la recherche
  * @option options [Array<String>] types Liste des extensions acceptées
  * @option options [String] wantedType Le type de l'élément attendu ('file', 'folder' ou 'both')
  */
  static choose(options){
    return new Promise((ok,ko) => {
      this.current.init(ok, ko, options)
      this.current.getFinderFrom()
    })
  }

  /**
  * @public
  * 
  * Méthode qui met les 10 derniers paths choisis avec Finder.js,
  * dans l'application courante, dans un menu pour les rechoisir
  * 
  * @param [Array<String>] last_ten Les x derniers paths
  */
  static peupleLastTen(last_ten){
    if ( ! last_ten ) return ;
    this.current.peupleLastTen(last_ten)
  }

  /**
  * @private
  */
  static get current(){
    if ( undefined == this._current ) {
      this._current = new Finder()
    }; return this._current
  }

  // /**
  // * Retour du serveur avec les fichiers
  // */
  // static receiver(data){
  //   this.current.receivedFromFinder(data)
  // }

//#################     INSTANCE      ####################

  init(ok, ko, options){
    this.ok = ok // méthode à appeler en cas de succès
    this.ko = ko // méthode à appeler en cas d'erreur
    this.options = options
    // - Pour savoir ce qu'il faut trouver -
    this.wantedType = options.wantedType; // 'folder' ou 'file'
  }

  /**
  * La méthode à appeler pour charger un dossier et l'afficher
  */
  displayFolder(path){
    this.options.fromPath = path
    this.getFinderFrom()
  }

  getFinderFrom(){
    WAA.send({class:'Finder',method:'get',data:this.options})
  }
  receivedFromFinder(data){
    this.display(data)
  }

  /**
  * Affichage des données +data+
  * 
  * @param [Hash] data    Table des données à afficher
  * @option data [Array<Hash>]  elements  Liste des éléments du Finder. Chaque élément est une table {:path, :filename, :type (folder/file)}
  * @option data [Array]        favoris   Liste des favoris
  * @option data [String]       fromPath  Le chemin d'accès au dossier courant
  */
  display(data){
    this.div || this.build(data)
    this.listing.innerHTML = ''
    const elements = data.elements
    elements.forEach( delement => {
      const element = new FinderElement(this,delement)
      this.listing.appendChild(element.as_option)
    })
    this.setBackpath(data.fromPath)
    this.show()
  }

  build(data){
    this.div = DCreate('DIV',{class:'finder-window hidden'})
    this.div.addEventListener('click',this.onClick.bind(this))
    this.backpaths = DCreate('SELECT',{class:'finder-window-backpaths'})
    this.backpaths.addEventListener('change', this.onChooseBackpath.bind(this))
    this.lasttens = DCreate('SELECT',{class:'finder-window-last_ten'})
    this.lasttens.addEventListener('change', this.onChooseLastTen.bind(this))
    const centerDiv = DCreate('CENTER')
    centerDiv.appendChild(this.backpaths)
    centerDiv.appendChild(this.lasttens)
    this.div.appendChild(centerDiv)
    this.listing = DCreate('DIV', {class:'finder-window-select'})
    this.div.appendChild(this.listing)
    this.divButtons = DCreate('DIV',{class:'finder-window-buttons'})
    this.div.appendChild(this.divButtons)
    document.body.appendChild(this.div)
    // - Boutons -
    this.boutonOuvrir  = DCreate('BUTTON', {text:'Ouvrir…'})
    this.boutonOuvrir.addEventListener('click', this.onClickBoutonOuvrir.bind(this))
    this.boutonChoisir = DCreate('BUTTON', {text:'Choisir'})
    this.boutonChoisir.addEventListener('click', this.onClickBoutonChoisir.bind(this))
    this.boutonInFavoris = DCreate('BUTTON', {class:'btn-in-favoris', text:'❤︎ ⇤', title:"Mettre dans les favoris"})
    this.boutonInFavoris.addEventListener('click', this.onClickAddInFavoris.bind(this))
    this.menuFavoris = DCreate('SELECT', {class:'menu-favoris'})
    this.menuFavoris.addEventListener('change', this.onChooseFavori.bind(this))
    this.boutonCancel = DCreate('BUTTON', {text:'Annuler', class:'fleft'})
    this.boutonCancel.addEventListener('click', this.onClickBoutonCancel.bind(this))
    // - Ajouter tous les boutons -
    this.divButtons.appendChild(this.boutonCancel)
    this.divButtons.appendChild(this.menuFavoris)
    this.divButtons.appendChild(this.boutonInFavoris)
    this.divButtons.appendChild(this.boutonOuvrir)
    this.divButtons.appendChild(this.boutonChoisir)
    this.hideBoutonChoisir()
    this.hideBoutonOuvrir()
    this.hideBoutonInFavoris()
    this.peupleFavoris(data.favoris)
    this.peupleLastTen(data.last_ten)
  }

  show(){
    this.div.classList.remove('hidden')
  }
  hide(){
    this.div.classList.add('hidden')
  }


  /**
  * --- Traitement des "last ten" ---
  */
  initMenuLastTen(){
    this.lasttens.innerHTML = ''
    this.lasttens.appendChild(DCreate('OPTION',{value:'', text:'Élément récent…'}))
    this.lasttens.disabled = true
  }
  peupleLastTen(last_ten){
    this.div || this.build({})
    last_ten = last_ten || this.last_ten || []
    this.initMenuLastTen()
    last_ten.forEach( path => {
      const dpath = path.split('/')
      let short_path = [dpath.pop(),dpath.pop()].reverse().join('/')
      const option = DCreate('OPTION',{value:path, text:short_path})
      this.lasttens.appendChild(option)
    })
    this.last_ten = last_ten
    if ( last_ten.length ) {
      this.lasttens.disabled = false
      this.lasttens.appendChild(DCreate('OPTION',{disabled:true,text:'________________________'}))
      this.lasttens.appendChild(DCreate('OPTION',{value:'reset_all', text:'Initialiser le menu'}))      
    }
  }
  onChooseLastTen(ev){
    const path = this.lasttens.value
    if ( path == 'reset_all' ) {
      /*
      |  Réinitialisation demandée
      */
      WAA.send({class:'Finder',method:'resetLastTens', data:'OK'})
      this.last_ten = []
      this.peupleLastTen()
    } else {
      /*
      |  Choix d'un "last ten"
      */
      this.ok(path)
      // - On remet toujours au-dessus -
      this.lasttens.selectedIndex = 0
      this.hide()
      return stopEvent(ev)
    }
  }


  /**
  * 
  * --- Méthodes d'Observers ---
  */

  /**
  * Quand on clique dans la fenêtre, en dehors de tout
  */
  onClick(ev){
    this.deselectAll()
    return stopEvent(ev)
  }

  /**
  * Quand on choisit un dossier précédent dans la liste des dossiers
  */
  onChooseBackpath(ev){
    const sel = this.backpaths.selectedIndex
    var chemin = []
    for(var i = this.backpathsCount - 1; i >= sel; --i){
      chemin.push(this.backpaths.options[i].innerHTML)
    }
    chemin = '/' + chemin.join('/')
    /*
    |  On demande à afficher ce dossier
    */
    this.displayFolder(chemin)
    return stopEvent(ev)
  }

  /**
  * Initialisation des "back path" (pour remonter la hiérarchie des dossiers)
  */
  setBackpath(path){
    var chemin = path.split('/')
    // on retire le dernier, qui est le fichier
    // chemin.pop()
    // on retire le premier, qui est vide
    chemin.shift()
    // Le nombre (utile pour reconstituer le chemin)
    this.backpathsCount = chemin.length
    /*
    |  Boucle sur chaque dossier pour faire le menu
    */
    this.backpaths.innerHTML = ''
    var dossier
    while ( dossier = chemin.pop() ){
      const opt = DCreate('OPTION', {text:dossier})
      this.backpaths.appendChild(opt)
    }
  }

  deselectAll(){
    if ( this.selected ) this.selected.unsetSelected()
    this.selected = null
    delete this.selected
    this.hideBoutonChoisir()
    this.hideBoutonOuvrir()
    this.hideBoutonInFavoris()
  }
  select(element){
    this.deselectAll()
    element.setSelected()
    this.selected = element
    /*
    |  Bouton à activer en fonction du type voulu
    */
    if ( this.wantedType == this.selected.type ){
      this.showBoutonChoisir()
    } else if (this.selected.type == 'folder') {
      this.showBoutonOuvrir()
    }
    // - toujours pour les favoris -
    this.showBoutonInFavoris()
  }

  /**
  * Pour simuler l'action sur le bouton "Ouvrir" ou "Choisir" en fonction
  * de l'élément sélectionné
  * 
  * @note
  *   Cette méthode est appelée quand on double-clique sur un élément
  */
  onClickBoutonAction(ev){
    if ( this.wantedType == this.selected.type ){
      this.onClickBoutonChoisir(ev)
    } else if (this.selected.type == 'folder') {
      this.onClickBoutonOuvrir(ev)
    }
  }

  showBoutonChoisir(){
    this.boutonChoisir.disabled = false
  }
  hideBoutonChoisir(){
    this.boutonChoisir.disabled = true
  }
  onClickBoutonChoisir(ev){
    ev.stopPropagation()
    ev.preventDefault()
    this.ok(this.selected)
    this.hide()
    return false
  }

  showBoutonOuvrir(){
    this.boutonOuvrir.disabled = false
  }
  hideBoutonOuvrir(){
    this.boutonOuvrir.disabled = true
  }
  onClickBoutonOuvrir(ev){
    this.displayFolder(this.selected.path)
    return stopEvent(ev)
  }

  /**
  * 
  * --- Traitement des favoris ---
  * 
  */
  /* Ajout de la sélection courante aux favoris */
  onClickAddInFavoris(ev){
    WAA.send({class:'Finder',method:'add_favori',data:{fav_path: this.selected.path}})
    return stopEvent(ev)
  }
  /* Methode de retour de la méthode précédente */
  onReturnAddFavoris(data){
    if ( data.ok ) {
      this.addFavori(data.favori)
    } else {
      erreur(data.msg)
    }
  }
  showBoutonInFavoris(){
    this.boutonInFavoris.disabled = false
  }
  hideBoutonInFavoris(){
    this.boutonInFavoris.disabled = true
  }
  /* Pour vider les favoris de cette application */
  resetFavoris(){
    this.initMenuFavoris()
    WAA.send({class:'Finder',method:'reset_favoris', data:'OK'})
  }
  initMenuFavoris(){
    this.menuFavoris.disabled = true
    this.menuFavoris.innerHTML = ''
    this.menuFavoris.appendChild(DCreate('OPTION',{text:'Choisir…', value:''}))
  }
  /* Pour mettre les favoris dans le menu (à l'ouverture) */
  peupleFavoris(favs){
    this.div || this.build({})
    if ( favs ) {
      this.favoris = favs
    } else if ( undefined == this.favoris ) {
      this.favoris = []
    }
    this.initMenuFavoris()
    this.favoris.forEach(dfavori => {
      const option = DCreate('OPTION',{value:dfavori.path, text:dfavori.name})
      this.menuFavoris.appendChild(option)
    })
    if ( this.favoris.length ) {
      this.menuFavoris.appendChild(DCreate('OPTION',{disabled:true,text:'________________________'}))
      this.menuFavoris.appendChild(DCreate('OPTION',{value:'reset_all',text:'Initialiser les favoris'}))
      this.menuFavoris.disabled = false
    }
  }
  /* Pour ajouter un favori */
  addFavori(dfavori){
    this.favoris.push(dfavori)
    this.peupleFavoris()
  }
  onChooseFavori(ev){
    const favori_path = this.menuFavoris.value
    if ( favori_path == 'reset_all') {
      this.resetFavoris()
    } else {    
      this.menuFavoris.selectedIndex = 0 // remettre au premier (utile ?)
      this.displayFolder(favori_path)
    }
    return stopEvent(ev)
  }

  onClickBoutonCancel(ev){
    this.hide()
    this.ko()
    return stopEvent(ev)
  }
}



class FinderElement {
  constructor(finder, data){
    this.finder   = finder
    this.path     = data.path
    this.type     = data.type
    this.filename = data.filename
  }

  get as_option(){
    const o = DCreate('DIV', {class:'option', text: this.picto + ' ' + this.filename })
    o.addEventListener('click', this.onClick.bind(this))
    o.addEventListener('dblclick', this.onDoubleClick.bind(this))
    this.obj = o
    return o
  }

  get picto(){return this.type == 'folder' ? '📂' : '📄'}

  setSelected(){
    this.obj.classList.add('selected')
  }
  unsetSelected(){
    this.obj.classList.remove('selected')
  }

  onClick(ev){
    this.finder.select(this)
    return stopEvent(ev)
  }

  onDoubleClick(ev){
    this.finder.select(this)
    this.finder.onClickBoutonAction(ev)
    return stopEvent(ev) 
  }

}
