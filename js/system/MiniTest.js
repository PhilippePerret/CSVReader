'use strict'
/**
* 
* Class MiniTest
* --------------
* version 1.0
* 
* Pour faire des minitests rapide (qui ne testent que l'égalité, pour
* des tests au chargement qui vérifient l'application en direct)
* 
* @usage
* ------
* 
*   * Un seul test simple
*     -------------------
*   miniTest(function(){
*     this.expected = 'mon résultat'
*     this.actual   = resultatDeMaFonction(param)
*     this.failure_message = "Le résultat devrait être bon"
*   })
* 
*   * Plusieurs valeurs à tester de la même manière
*     ---------------------------------------------
* 
*   cf. plus bas avec evaluateValues
* 
*   var test = new MiniTest(function(var1, var2){
*     this.expected = var1
*     this.actual   = fairePasserLeTestA(var1)
*     this.failure_message = "Ça passe pas"
*     this.success_message = "Ça passe" // affiché en vert si succès 
*   })
*   test.evaluate('bon', 'aussi')
*   test.evaluate('mauvais', 'non')
*     // On peut faire passer bien sûr autant de variables qu'on veut
* 
*   * Plusieurs valeurs semblable (evaluateValues)
*     --------------------------------------------
*     (une seule ligne de définition)
*     new MiniTest(function(arg1, arg2){
*       this.expected = arg1
*       this.actual   = laFonctionATesterAvecValeur(arg2)
*       this.failure_message = "Le message d'échec"
*     }).evaluateValues([
*         ['expected1', 'value1']
*       , ['expected2', 'value2']
*       ...
*       , ['expectedN', 'valueN']
*     ])
* 
*/


class MiniTest {
  constructor(method){
    this.method = method  
  }
  evaluate(...args){
    if ( args.length ) {
      this.method.call(this, ...args) 
    } else {
      this.method.call(this)
    }
    /*
    |  Calcul de la valeur OK
    */
    var notOk ;
    if ( this.expected instanceof Array ) {
      notOk = JString(this.expected) != JString(this.actual)
    } else {
      notOk = this.expected != this.actual
    }
    if ( notOk ) {
      console.error(`[MiniTest] ${this.failure_message}`)
      console.error('            Attendu :', this.expected)
      console.error('            Obtenu  :', this.actual)
    } else if ( this.success_message ) {
      console.log(`[MiniTest] %c${this.success_message}`, 'color:green;')
    }
  }
  evaluateValues(aryValues){
    aryValues.forEach( args => { this.evaluate(...args) })
  }
}

function miniTest(callback){
  new MiniTest(callback).evaluate()
}
