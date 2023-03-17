import { itraise, ITClass } from '../../system/InsideTest/inside-test.lib.js'

/**
* Librairie permettant de tester facilement les mots avec des
* méthodes should comme :
* 
*   be(<what>)        Doit être ce mot {String}
*   exist()
*   beDisplayed()
*   haveOffset(<x>)
* 
* À faire :
* --------
*   shouldHasOffset(x)
*   shouldHasLength(x)
*   shouldIsMot()
*   shouldHasSpaceBefore()
* 
* 
* @usage
* ------
*     import {ITMot} from './utils/IT_Mot.js'
*/
class ITMotClass extends ITClass {
  constructor(instance_mot){
    super(tp('Le mot "%s"', instance_mot.mot))
    this.instance  = instance_mot
    this.consigneActualValues()
  }

  consigneActualValues(){
    this.initData = JSON.parse(this.instance.to_json)
    console.log("initData = ", this.initData)
  }
  get initId()        {return this.initData[0]}
  get initMot()       {return this.initData[1]}
  get initTtTag()     {return this.initData[2]}
  get initType()      {return this.initData[3]}
  get initLemma()     {return this.initData[4]}
  get initIsSelected(){return this.initData[5]}
  get initOffset()    {return this.initData[6]}

  be(str){
    this.estimate(this.instance.mot == str) || this.err('le mot "'+str+'" (vaut "'+this.instance.mot+'")')
  }
  existAsMot(){
    this.estimate(MotType.getByMot(this.instance.mot)) || this.err("être consigné pour son lemme")
  }
  exist(){
    this.estimate(this.instance) || this.err("être consigné pour son lemme")
  }
  beDisplayed(){
    this.estimate(DGet(`#${this.instance.domId}`)) || this.err('être affiché')
  }
  haveOffset(x){
    this.estimate(this.instance.offset == x) || this.err('avoir un offset de ' + x +' (il vaut '+this.instance.offset+').')
  }

}


export function ITMot(motStr){
  return new ITMotClass(motStr)
}
