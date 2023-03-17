import { InsideTest, assert, wait, waitUntil, waitWhile, itraise } from '../system/InsideTest/inside-test.lib.js'
import {ITFactory} from './utils/ITFactory.js'
import {ITApp, ITFragment, ITParagraph, ITMot} from './utils/IT_Classes.js'



/**
* Mettre dans le 'eval' du test pour charger le texte contenant
* 4 fragments
*/
function evalForTexteMultiFragments(){
  return ITFactory.load_texte(
        InsideTest.current
      , 'texte_multi_fragments.txt'
      , {then:'apresChargementTexte'}
    )
}

function checkForDataFragment(){
  try {
    return App.fragments_data.calculated === true
  } catch(err){
    console.error(err)
    return true // pour passer quand même à la suite
  }  
}

new InsideTest({
    error: 'Il %{doit} y avoir 4 fragments'
  , eval: evalForTexteMultiFragments
  , checkForDataFragment: checkForDataFragment
  , apresChargementTexte:function(data){
      /* Il faut attendre que le serveur ait remonté les informations
         concernant les autres fragments */
      waitWhile('checkForDataFragment').then('checkFragmentsApp')
    }
  , checkFragmentsApp:function(){
      ITApp.should.have(4, 'fragments')
      /* Tous les fragments doivent être inférieurs à 20 000  */
      ITApp.fragments.forEach(fragment => {
        ITApp.fragments[0].should.haveLength(20000, '<')
      })
      return true
    }
})//.exec()

new InsideTest({
    error: 'Le changement d’offset d’un mot modifie tout ce qui suit'
  , eval: evalForTexteMultiFragments
  , checkForDataFragment: checkForDataFragment
  , checkForAllFragmentsLoaded: function(){
      console.log("App.allFragmentLoaded = ", App.allFragmentLoaded)
      return App.allFragmentLoaded == true 
    }
  , apresChargementTexte:function(){
      waitUntil('checkForDataFragment').then('chargeAllFragment') 
    }
  , chargeAllFragment:function(){
      /* Chargement des autres fragments */
      App.loadSilentlyAllFragments()
      waitUntil('checkForAllFragmentsLoaded').then('checkChangementsOffsets')
    }
  , checkChangementsOffsets:function(){

      function getOffsetFrag(i){
        return int(App.getFragment(i).offsetInText)
      }
      function randomMotInFrag(ifrag){
        const frag = App.getFragment(ifrag)
        return frag.mots[int(Math.random() * frag.mots.length)]
      }

      // *-- valeurs préliminaires --*
      const oldOffFrag1 = getOffsetFrag(1)
      const oldOffFrag2 = getOffsetFrag(2)
      const oldOffFrag3 = getOffsetFrag(3)
      const oldOffFrag4 = getOffsetFrag(4)
      // Des mots au hasard
      // const randMot1 = randomMotInFrag(2)
      // const randMot2 = randomMotInFrag(3)
      // const randMot3 = randomMotInFrag(4)
      // console.log("Mot 1 au hasard = ", randMot1)
      // console.log("Mot 2 au hasard = ", randMot2)
      // console.log("Mot 3 au hasard = ", randMot3)
      // const oldOffMot1  = int(randMot1.offsetInText)
      // const oldOffMot2  = int(randMot2.offsetInText)
      // const oldOffMot3  = int(randMot3.offsetInText)

      // *-- Opération --*
      const diff = 4
      const paragraph = TextFragment.current.paragraphs[4]
      console.log("paragraph", paragraph)
      const mot = paragraph.mots[6]
      console.log("mot", mot)
      paragraph.updateOffsets({fromOffset: mot.offsetInPara + 1, diff: diff})

      // *-- Post-Check --*
      // *-- Valeurs post-opération --*
      const newOffFrag1 = getOffsetFrag(1)
      const newOffFrag2 = getOffsetFrag(2)
      const newOffFrag3 = getOffsetFrag(3)
      const newOffFrag4 = getOffsetFrag(4)
      assert(oldOffFrag1, newOffFrag1, "Offset pour le fragment 1 (ne devrait pas avoir changé")
      assert(oldOffFrag2 - diff, newOffFrag2, "Offset du fragment 2")
      assert(oldOffFrag3 - diff, newOffFrag3, "Offset du fragment 3")
      assert(oldOffFrag4 - diff, newOffFrag4, "Offset du fragment 4")

      // const newOffMot1 = int(randMot1.offsetInText)
      // const newOffMot2 = int(randMot2.offsetInText)
      // const newOffMot3 = int(randMot3.offsetInText)
      // assert(oldOffMot1 - diff, newOffMot1,   'Offset d’un mot au hasard du fragment 2')
      // assert(oldOffMot2 - diff, newOffMot2,   'Offset d’un mot au hasard du fragment 3')
      // assert(oldOffMot3 - diff, newOffMot3,   'Offset d’un mot au hasard du fragment 4')

      return true
    }
}).exec()
