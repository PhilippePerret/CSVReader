'use strict'
/**
 * class TextUtils
 * ---------------
 * Utilitaires pour gérer les textes
 * C'est la classe qui en tout premier lieu permet de spliter
 * le texte donné en mots, ponctuations, etc.
 * 
 */

class TextUtils {

  static resetAll(){
    delete this.analyzeOptions
  }

  /**
   * Pour analyser le texte +text+ côté serveur et remonter (dans la
   * méthode suivante) les tokens.
   * 
   * @param options {Hash}
   *            options.poursuivre    Méthode pour suivre.
   */
  static analyze(text, options){
    const data = {text: text}
    this.analyzeOptions = options
    WAA.send({class:'Proximot::App',method:'analyze_text',data:data})
  }
  
  static receiveAnalyze(data){
    console.log("this.analyzeOptions = ", this.analyzeOptions)
    console.log("[receiveAnalyze] data = ", data)
    this.analyzeOptions.poursuivre(data)
  }

}
