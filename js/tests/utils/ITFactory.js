'use strict';
const FILE_DELIMITOR = '/'
/**
* class ITFactory
* ---------------
* Usine pour les tests de Proximot
*/
export class ITFactory {
  static get File(){
    return this._fileclass || ( this._fileclass = new ITFactoryFile() )
  }

  /**
  * 
  * Charge un texte (ou un package) 
  * -------------------------------
  * non seulement la méthode charge le package voulu (puis appelle la
  * suite du texte) mais elle prépare complètement l'interface en
  * respectant les +options+ choisies.
  *
  * 
  * @param test {InsideTest} Le test qui appelle la méthode
  *             NOTE IMPORTANTE : s'il y a plusieurs tests (…) utiliser
  *             `InsideTest.current' et pas `this'
  * @param filename {String} Le nom du texte dans xassets/InsideTest/textes
  * @param options {Hash} Table des options. Elles serviront aussi
  *                       de data pour IT_WAA.send
  *           options.keepAll    
  *               Si true, on ne ressette pas l'application comme 
  *               pour un nouveau texte. Dans le cas contraire 
  *               (défaut) tout est remis à zéro comme si on relançait
  *               l'application.
  *           options.then 
  *               La méthode du test à appeler plutôt que la méthode
  *               par défaut test.afterServerEval
  */
  static load_texte(test, filename, options){
    options = options || {}
    /*
    |  Si nécessaire, on nettoie entièrement l'application
    |  NON Ça ne sert à rien puisque ça initialise l'application à 
    |  l'instanciation du test, PAS au moment où il est exécuté.
    |  Donc on utilise plutôt une propriété envoyée à Proximot::App.load
    |  qui sera remontée et demandera à l'application de tout 
    |  réinitialiser avant d'afficher le texte (rappel : on ne doit
    |  pas généraliser cette ré-initialisation car quelquefois on 
    |  remonte un texte qui suit un autre et on doit alors conserver
    |  des choses. 
    */
    // options.keepAll || this.cleanUpAll()
    /*
    |  Chargement du texte voulu
    */
    let data = {filepath:this.File.textePath(filename), keepAll:options.keepAll}
    Object.assign(data, options)
    data = {class:'Proximot::App', method:'load', data:data}
    IT_WAA.send(test, data)

    return true // pour utiliser 'return ITFactory.load_texte' sans faux négatif
  }
  static load_package(...args){return this.load_texte(...args)}

  /**
  * Nettoyage intégral de l'application, comme au chargement initial
  * quand le texte n'a pas encore été chargé.
  */
  static cleanUpAll() { App.resetAll() }
}


/**
* Class ITFactoryFile
* -------------------
* Classe d'usine pour tout ce qui concerne les fichiers
* 
* @usage:     ITFactory.File.<method>
*/  
class ITFactoryFile {
  textePath(filename){
    return [APP_FOLDER,'xassets','InsideTest','textes',filename].join(FILE_DELIMITOR)
  }
}
