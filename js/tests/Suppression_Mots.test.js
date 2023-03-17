import { InsideTest, assert, page, mouse, itraise } from '../system/InsideTest/inside-test.lib.js'
import {ITFactory} from './utils/ITFactory.js'
import {ITMot} from './utils/IT_Mot.js'
import {ITFragment} from './utils/IT_Fragment.js'
import {ITAppStateChange as StateChanger} from './utils/StateChange.js'

/**
* Module de test pour s'assurer que la suppression de mots est
* fonctionnelle.
* 
* Tous les cas à traiter
* ----------------------
*   - Suppression du premier mot (sans proximité)
*       Répercussions sur les longueurs, les index, les offsets…
*   - Suppression du dernier mot (sans proximité)
*       Aucune répercussion autre que sur le dernier mot
*   - Suppression d'un mot avec proximité (supprimant la proximité)
*   - Suppression d'un mot avec proximité (initiant une nouvelle proximité)
*   - Suppression d'un mot sans proximité mais répété
*       Répercussions sur le nombre de mots du lemme
*   - Suppression du dernier mot d'un paragraphe qui n'en contient qu'un seul
*       Le paragraphe doit être supprimé
*   - Suppression de tous les mots (et texels) d'un paragraphe
*       Le paragraphe doit être supprimé
*   - Suppression d'un mot dans un texte suffisamment grand pour 
*     avoir plusieurs fragments. La suppression du mot dans le premier
*     doit modifier l'offset des autres fragments.
* 
* Modification à surveiller
* 
* - l'offset des mots après une suppression
* - la longueur du fragment
* - la longueur du paragraphe
* - la suppression d'une proximité
* - la création d'une proximité (if any)
*   * cas 1 : à cause de la réduction de longueur, deux mots se 
*             retrouven en proximité.
*   * cas 2 : le mot supprimé étaient en proximité avec un mot avant
*             et un mot après qui se retrouvent eux-même en proximité
*/

//*
const evalForTexteSimple = function(){
      return ITFactory.load_texte(InsideTest.current, 'texte_simple.txt', {then:'apresChargementTexte'})
    }

function command(command){
  const len = command.length
  if ( command.substring(len - 1, len) == "\n"){
    submitCommand(command.substring(0, len - 1))
  } else {
    Console.value = command
  }
}
function submitCommand(command){
  console.log("Commande : ", command)
  Console.value = command // + "\n"
  simulateEnterOn(Console.field)
}

function simulateEnterOn(field){
  const e = document.createEvent('Event')
  e.initEvent('keyup')
  e.which = e.keyCode = 13
  e.key = 'Enter'
  field.dispatchEvent(e)
}

/**
* TEST 1
* ------
* Un test simple (le plus simple) qui supprime le tout dernier mot
* du texte, un mot unique qui n'est en proximité avec aucun autre.
*/


new InsideTest({
    error: 'La suppression du dernier mot échoue'
  , eval: evalForTexteSimple
  , apresChargementTexte:function(data){
      
      const fragment = App.fragment
      /* On prend le dernier mot (celui qui va être supprimé) */
      const itmot = ITMot(fragment.mots[fragment.mots.length - 1])

      /* --- Pré-checks --- */
      assert(1, fragment.lemmas.getLemma('proximité').count)
      itmot.should.existAsMot()
      itmot.should.beDisplayed()


      new StateChanger()
        .preCheck(function(){
          // console.log("App.fragment (preCheck):", JSON.parse(App.fragment.to_json))
          this.lastMot = App.fragment.mots[App.fragment.mots.length - 1]
          this.nbMotsParagInit = int(this.lastMot.paragraph.mots.length)
        })
        .operate(function(){
          /* Suppression du dernier mot */
          submitCommand('s ' + this.get('nb_mots_fragment'))
          submitCommand('delete')
        })
        .postCheck(function(){
          // console.log("App.fragment (postCheck):", JSON.parse(App.fragment.to_json))
          /* Le paragraphe comporte un mot de moins */
          const nbMotsParagEnd = int(this.lastMot.paragraph.mots.length)
          assert(this.nbMotsParagInit - 1, nbMotsParagEnd, 'nombre de mots du paragraphe')
          /* Propriété watchable */
          this.hasChanged( 'nb_mots_fragment',    -1 )
          this.hasChanged( 'nb_texels_fragment',  -1 )
          this.hasChanged( 'fragment_length',     -9)
          this.hasChanged( 'nb_displayed_mots',   -1 )
          this.was('last_undo_ref', null).is('DESTROY mot')
        })
      
      /* Test du mot */
      itmot.should    .existAsMot()
      itmot.should.not.beDisplayed()

      /* Mais il ne devrait plus avoir d'éléments dans son lemme */
      assert(0, fragment.lemmas.getLemma('proximité').count)

      return true
    }
})//.exec()


/**
* TEST 2
* ------
* Un test un peu plus compliqué où le mot supprimé n'est pas le
* dernier.
* Cela doit modifier, en plus du précédent, l'offset des mots 
* suivants
*/

function wait(secondes){
  return new Promise((ok,ko)=>{
    var timer = setTimeout(()=>{
      clearTimeout(timer)
      ok()
    }, secondes * 1000)
  })
}

//*
new InsideTest({
    error: 'La suppression d’un mot doit modifier l’offset des mots suivants'
  , eval: evalForTexteSimple
  , apresChargementTexte:function(data){

      const itfragment    = ITFragment()
      const fragment      = TextFragment.current
      const nbMotsInit    = fragment.mots.length
      const lengthInit    = fragment.length
      /*
      |  Instancier les mots dont on a besoin.
      |  Noter que l'instanciation fait ici permet de consigner les
      |  valeurs actuelles.
      */
      const itmot      = ITMot(fragment.mots[nbMotsInit - 3])
      const derniermot = ITMot(fragment.mots[fragment.mots.length - 1])
      const avtdernier = ITMot(fragment.mots[fragment.mots.length - 2])

      /* --- Pré-Check --- */
      itmot.should.be('une')

      /* =====> Opération <====== */
      submitCommand('s ' + String(fragment.mots.length - 2) )
      submitCommand('delete')

      /* --- Post-Check --- */
      itfragment.should.haveNombreMots(nbMotsInit - 1)
      itfragment.should.haveLength(lengthInit - 3)
      /* On vérifie l'offset de chaque mot après */
      derniermot.should.haveOffset(derniermot.initOffset - 3)
      avtdernier.should.haveOffset(avtdernier.initOffset - 3)

      return true

    }
}).exec()


/**
* TEST 3
* ------
* Test de la suppression d'un mot qui est en proximité simple(*)
* avec un autre.
* 
* (*) "simple" ici signifie qu'il n'existe pas d'autres mots 
*     identique dans le fragment.
* 
* On vérifie que mot soit bien supprimé, et surtout que les proximités
* soient détruites à tous les niveaux, jusque dans les classes CSS
* de l'affichage.
*/




