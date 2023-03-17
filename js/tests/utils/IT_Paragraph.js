import { itraise, ITClass } from '../../system/InsideTest/inside-test.lib.js'

/**
* Librairie permettant de tester facilement un paragraphe avec
* des méthodes should et should.not comme :
* 
*   haveLength(<x>)
*   haveFramentOffset()
*   haveTextOffset()
*   haveNombreMots(<x>)
* 
* À faire :
* --------
* 
* 
* @usage
* ------
*     import {ITFragment} from './utils/IT_Mot.js'
*/
class ITParagraphClass extends ITClass {
  constructor(paragraph){
    super('Le paragraphe')
    this.parag = paragraph
  }

  haveNombreMots(nb){
    this.estimate(this.parag.mots.length == nb) || this.err('avoir '+nb+' mots (en a '+this.parag.mots.length+')')
  }
  haveLength(len) {
    this.estimate(this.parag.length == len) || this.err('avoir une longueur de '+len+' (sa longueur est '+this.parag.length+')')
  }

  haveFramentOffset(nb){
    this.estimate(this.parag.offsetInFrag == nb) || this.err('avoir un offset de '+nb+' dans son fragment (son offsetInFrag vaut '+this.parag.offsetInFrag+')')
  }
  haveTextOffset(nb){
    this.estimate(this.parag.offsetInText == nb) || this.err('avoir un offset de '+nb+' dans le texte (son offsetInText vaut '+this.parag.offsetInText+')')
  }

}


export function ITParagraph(){
  return new ITParagraphClass()
}

