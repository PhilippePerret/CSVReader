'use strict';
/**
 * class IO
 * --------
 * Pour entrée et sortie, gestion des fichiers
 * 
 */
class IO {

  /**
   * Méthode principale sauvant tout le fichier courant
   * C'est-à-dire :
   * - les fragments    (le fragment courant seulement ?)
   * - les paragraphes  (index des mots ou id)
   * - les mots
   * - les préférences
   * - les proximités   (même si elles pourraient être recalculées)
   * - l'historique des commandes
   * 
   * La sauvegarde se fait de façon séquentielle pour ne pas
   * surcharger les envois. Elle est reçue et opérée côté serveur
   * par la classe miroir IO.rb
   * 
   * La première fois, +data+ ne contient que :next_step  et 
   * :save_as. Ensuite, ont été mis dedans :data, les données à
   * sauvegarder et :prox_path, le chemin d'accès au package Proximot
   * 
   * @param data {Hash} Données
   *          data.save_as  Nouveau path sous lequel sauver les
   *                        données (TODO)
   */
  static saveAll(data){

    let next_step
      , add2data 
      ;
    const fragment = TextFragment.current || raise(ERRORS.fragmentRequired)

    if (data.result && data.result.error){
      raise("Une erreur est survenue pendant l'enregistrement : " + data.result.error)
      return 
    }

    switch( data.saving_step ){

    case 'app_state':
      add2data = {  data:       App.getState()
                  , next_step:  'preferences'
                  , text_path:  fragment.text_path
                  , prox_path:  fragment.prox_path  }
      break
    
    case 'preferences':
      add2data = {  data:       Preferences.getValues()
                  , next_step:  'console_history' }
      break

    case 'console_history':
      add2data = {  data:       Console.HistoryManager.getHistory()
                  , next_step:  'current_fragment' }
      break

    case 'current_fragment':
      add2data = {  data:       fragment.getData()
                  , next_step:  null }
      console.log("Données fragment à enregistrer : ", add2data.data)
      break

    default:
      /*
      |  Fin de l'enregistrement
      */
      message("Enregistrement terminé avec succès.")
      return true
    }

    Object.assign(data, add2data)
    console.log("data envoyées pour enregistrement : ", data)
    WAA.send({class:'Proximot::App',method:'save_text', data:data})
  }

  /**
  * Pendant de la précédente : charge toutes les données depuis un
  * package .pxw
  * La remontée se fait sequentiellement.
  */
  static loadAllFromPackage(data){
   Log.debug("[loadAllFromPackage] Données (package) pour l'étape '" + data.loading_step + "'", data)

    var next_step, extra_data ;

    switch(data.loading_step){
    case 'app_state':
      /* Par défaut, on réinitialise tout */
      data.keepAll || App.resetAll()
      App.setState(data.loadData)
      next_step   = 'preferences'
      break
    case 'preferences':
      Preferences.setValues(data.loadData)
      next_step   = 'current_fragment'
      extra_data  = {fragment_index: int(App.State.fragmentIndex || 0)}
      break
    case 'current_fragment':
      const fragment = TextFragment.createFromData(data.loadData)
      fragment.display()
      next_step   = 'console_history'
      break
    case 'console_history':
      Console.HistoryManager.setHistory(data.loadData)
      next_step   = false
      break
    }

    if ( next_step ) {
      const ndata = {
          prox_path: data.prox_path
        , loading_step: next_step
      }
      if ( extra_data ) Object.assign(ndata, extra_data)
      WAA.send({class:'Proximot::IO',method:'load_from_package',data:ndata})
    }

  } // loadAllFromPackage

  static loadAllFromText(data){
    try {    
      Log.debug("[IO::loadAllFromText] Données texte : ", data)
      
      /*
      |  Par défaut, on réinitialise tout
      */
      data.keepAll || App.resetAll()

      App.lastOpenDate = new Date()
      /*
      |  Instanciation du fragment
      */
      const fragment = TextFragment.createFromData(data)
      /*
      |  Affichage du fragment
      */
      fragment.display()
      /*
      |  On règle les données du premier fragment
      */
      App.setFragmentsData({
          count: 1
        , 0: {index:0, offset:0, lenInFile: data.fragment_length}
      })
      /*
      |  Une fois que c'est fini, on peut demander de relever les
      |  information des autres fragments si nécessaire.
      */
      data.other_fragments && App.getDataOtherFragments(data.text_path)
    
    } catch(err) {
      console.error(err)
    }

  }

} // class IO
