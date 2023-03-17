'use strict';

class App {

  /* TODO : la remonter du serveur */
  static get APP_VERSION(){ return '0.5.1' }

  // --- Offset Methods ---
  static updateOffsets(args){
    const {fromIndex, diff} = args
    const len = this.fragments_data.count
    for(var ifrag = fromIndex; ifrag < len; ++ ifrag) {
      this.fragments_data[ifrag].offset += diff
    }
  }

  /**
  * RÉINITIALISATION COMPLÈTE
  * -------------------------
  * Pour tout réinitialiser au chargement d'un nouveau texte par
  * exemple (un texte qui n'est pas le fragment suivant d'un autre)
  * C'est également cette méthode qui est appelée entre les tests.
  * 
  */
  static resetAll(){
    delete this._fragments_data
    delete this._state
    ZManager      .resetAll()
    ConsoleClass  .resetAll()
    AnyText       .resetAll()
    Editor        .resetAll()
    Lemmas        .resetAll()
    MotType       .resetAll()
    Paragraph     .resetAll()
    Proximity     .resetAll()
    TextElement   .resetAll()
    Preferences   .resetAll_andApply()
    TextFragment  .resetAll()
    TextUtils     .resetAll()
  }

  static get STATE_DATA(){
    if (undefined == this._statedata){
      this._statedata = {
          'created_at'      : {hname:'Date de création de l’analyse'}
        , 'last_open'       : {hname:'Date de dernière ouverture de l’analyse'}
        , 'saved_at'        : {hname:'Date de dernière sauvegarde de l’analyse'} 
        , 'fragment_index'  : {hname:'Index du fragment de texte courant'}
        , 'fragments_data'  : {hname:'Données de tous les fragments du texte'}
        , 'app_version'     : {hname:'Version de l’application'}
        , 'last_texel_id'   : {hname:'Dernier ID de texel'}
      }
    } return this._statedata
  }
  static get STATE_KEYS(){
    return this._statekeys || ( this._statekeys = Object.keys(this.STATE_DATA) )
  }
  /* Pour retourner les valeurs de l'état de l'application 
      cf. getState 
  */
  static get_created_at()     { return this.State.created_at || hdateFor(new Date()) }
  static get_last_open()      { return hdateFor(this.lastOpenDate || new Date()) }
  static get_saved_at()       { return hdateFor(new Date()) }
  static get_fragment_index() { return TextFragment.current.index }
  static get_app_version()    { return this.APP_VERSION}
  static get_fragments_data() { return this.fragments_data }
  static get_last_texel_id()  { return TextElement.lastId }

  /**
   * @return la table des données d'état à sauvegarder dans le 
   * fichier.
   * 
   */
  static getState(){
    const tbl = {}
    this.STATE_KEYS.forEach( stateKey => {
      Object.assign( tbl, {[stateKey]: this[`get_${stateKey}`].call(this) })
    })
    console.log("Table retournée par App.getState:", tbl)
    return tbl
  }

  static setState(data){
    this.lastOpenDate  = new Date()
    this.State         = data
  }

  /**
  * Pour remonter une erreur depuis le serveur avec WAA.
  * (WAA.send(class:'App',method:'onError', data:{:message, :backtrace}))
  */
  static onError(err){
    erreur(err.message + " (voir en console)")
    console.error(err.message)
    console.error(err.backtrace)
  }
  
  static get State(){ 
    return this._state || { /* valeurs par défaut */
        fragments: this.fragments_data
      , last_texel_id: 0
    }
  }
  static set State(state){this._state = state}

  // *-- Fragment Methods --*

  /**
  * Méthode qui procède discrètement au chargement des autres frag-
  * ments que celui chargé au départ.
  */
  static loadSilentlyAllFragments(){
    this.allFragmentLoaded = true
  }
  /* Méthode qui reçoit le chargement discret d'un fragment */
  static onLoadSilentlyFragment(data){
    console.log("Chargement du fragment de données : ", data)
  }

  static get fragment(){ return TextFragment.current }

  static get fragments_data(){
    if (undefined == this._fragments_data){
      this._fragments_data = {
          count: 1
        , 0: {index: 0, offset: 0, lenInFile: null}
      }
    } return this._fragments_data
  }
  static set fragments_data(data){ 
    this._fragments_data = data
    this.State.fragments = data
  }
  static setFragmentsData(data){
    Object.assign(this.fragments_data, Object.assign(data, {calculated: true}))
  }

  /**
  * @return l'instance TextFragment du fragment d'index +indexFrag+
  * 
  * Noter que le nombre est 1-start mais que dans this._fragments
  * la valeur est 0-start comme dans toute liste.
  */
  static getFragment(indexFrag){
    if ( undefined == this._fragments ) {
      this._fragments = []
      for(var ifrag = 0; ifrag < this.fragments_data.count; ++ifrag){
        const dataFrag = this.fragments_data[ifrag]
        this._fragments.push(new TextFragment({
            index         : int(ifrag)
          , lexicon       : dataFrag.lexicon    || this.lexicon
          , text_path     : dataFrag.text_path  || this.text_path
          , prox_path     : dataFrag.prox_path  || this.prox_path
          , offsetInText  : dataFrag.offset
        }))
      }
    }
    return this._fragments[indexFrag - 1]
  }

  static get lexicon(){
    return this._lex || (this._lex = TextFragment.current.lexicon )
  }
  static get text_path(){
    return this.txpath || (this.txpath = TextFragment.current.text_path )
  }
  static get prox_path(){
    return this.pxpath || (this.pxpath = TextFragment.current.prox_path )
  }

  /**
  * Pour actualiser un fragment
  * 
  * Note : si la longueur du fragment a changé, cela actualise aussi
  * les offsets des fragments suivants
  */
  static setFragment(fragment){
    const lastFragmentLength = this.fragments_data[fragment.index].length
    /*
    |  On actualise la donnée
    */
    Object.assign(this.fragments_data, {[fragment.index]: {
        index   : fragment.index
      , offset  : fragment.offset
      , length  : fragment.length  
    }})
    /*
    |  Si la longueur du fragment a changé, on actualise l'offset de
    |  tous les fragments suivants
    */
    if ( fragment.length != lastFragmentLength ) {
      for (var ifragment = fragment.index + 1; ifragment < fragments_data.count; ++ifragment){
        const prevFramentData = this.fragments_data[ifragment - 1]
        this.fragments_data[ifragment].offset = prevFramentData.offset + prevFramentData.length
      }
    }
  }

  static getDataOtherFragments(text_path){
    Log.in('App::getDataOtherFragments')
    const data = {
        fragments_data  : this.fragments_data
      , from_offset     : this.fragments_data[0].lenInFile
      , text_path       : text_path
    }
    WAA.send({class:'Proximot::App',method:'getDataOtherFragments', data: data})
  }
  static receiveDataOtherFragment(data){
    Log.debug("[App::receiveDataOtherFragment] Données reçues pour les autres fragments", data)
    this.setFragmentsData(data)
  }

} // /class App


