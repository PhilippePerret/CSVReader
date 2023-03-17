import { ITFragment }       from './IT_Fragment.js'
import { itraise, ITClass } from '../../system/InsideTest/inside-test.lib.js'

/**
*   Librairie permettant de tester facilement un paragraphe avec
*   des méthodes should et should.not comme :
* 
*   have(x).fragments
* 
* À faire :
* --------
* 
* 
* @usage
* ------
*     import {ITApp} from './utils/IT_App.js'
*/
class ITAppClass extends ITClass {
  constructor(paragraph){
    super('Le texte')
  }

  have(nb, what) {
    this.evaluateWith(what, nb)
    return this // chainage
  }

  /**
  * @return la liste de fragments sous forme d'instance ITFragments
  */
  get fragments(){
    if ( undefined == this._fragments ) {
      this._fragments = []
      const datafrag = App.fragments_data
      for(var ifrag = 0, len = datafrag.count; ifrag < len; ++ ifrag){
        this._fragments.push(new ITFragment(App.getFragment(ifrag)))
      }
    }
    return this._fragments
  }

  // *-- Private Methods --*

  /**
  * Appelé par should.have(x).paragraphs
  */
  evaluateWith(thing, expected){
    const actual = this.getNombreThing(thing)
    this.estimate(actual == expected) || this.err(tp('comporter %s fragments, il en comporte %s.', [expected, actual]))
  }

  getNombreThing(thing){
    switch(thing){
    case 'fragments'  : return App.fragments_data.count
    case 'paragraphs' : return App.paragraphsCount
    case 'mots'       : return App.motsCount
    case 'texels'     : return App.texelsCount
    default: raise("Je ne sais pas compter les '"+thing+"' de l'application.")
    }
  }

}

export const ITApp = new ITAppClass()
