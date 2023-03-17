import { InsideTest, ErrorTest, assert, itraise, page, mouse } from '../system/InsideTest/inside-test.lib.js'
import {ITFactory} from './utils/ITFactory.js'
/**
* Test du chargement et de l'affichage d'un texte brut
*/

/**
* Essai d'un test avec chargement direct du fichier
*/
new InsideTest({
    error: 'Un texte brut %{doit} pouvoir être chargé et correctement analysé/affiché'
  , eval:() => {
      ITFactory.load_texte(InsideTest.current, 'texte_simple.txt', {then: 'afterAffichageTexte'})
      return true // pas de faux négatif
    }
  , afterAffichageTexte:(data) => {
      /*
      |  On commence par contrôler le retour, c'est-à-dire la donnée
      |  renvoyée suite à la lecture du texte et qui servira à 
      |  produire l'instanciation de toutes les valeurs.
      */
      assert(2, data.paragraphs.length,     'nombre de paragraphes')
      assert(4, data.paragraphs[0].length,  'nombre de texels du premier paragraphe')
      assert(12, data.paragraphs[1].length, 'nombre de texels du second paragraphe')
      /**
      * Données dans le programme
      */
      assert(16, Texel.count(),     'nombre de texels dans TextElement')
      assert(14, MotType.count(),   'nombre de mot dans MotType')
      assert(1,  Proximity.count(), 'nombre de proximités')
      const fragment = TextFragment.current || itraise("Le fragment courant doit être défini")
      fragment instanceof TextFragment || itraise("Le fragment courant doit être un fragment")
      const lemmas = fragment.lemmas
      assert(11, lemmas.count(), 'nombre de lemmes')
      assert(3,  lemmas.get('un', true).count, 'nombre de mots pour le lemme "un"')
      assert(2,  lemmas.get('texte', true).count, 'nombre de mots pour le lemme "texte"')

      /* On prend le premier mot "texte" pour le vérifier */
      const design = ' pour premier "texte"'
      const textun = lemmas.get('texte').items[0]
      // console.log("texteun" , textun)
      ;[
          ['texte'  , textun.mot    , '@mot']
        , ['mot'    , textun.type   , '@type']
        , ['Mot'    , textun.Klass  , '@Klass']
        , ['texte'  , textun.lemma  , '@lemma']
        , [2        , textun.offset , '@offset']
      ].forEach( trinome => {
        const [exp, act, foo] = trinome
        assert(exp, act, foo + design )
      })
      /* Vérification de sa proximité */
      textun.proxApres        || itraise("Le premier 'texte' devrait avoir une proximité à droite")
      not(textun.proxAvant)   || itraise('Le premier "texte" ne devrait pas avoir de proximité à gauche')
      const pxApres = textun.proxApres.motApres
      assert('texte', pxApres.lemma, 'le lemme du mot en proximité droite avec "texte"')
      pxApres.proxAvant       || itraise("Le deuxième 'texte' devrait avoir une proximité gauche")
      not(pxApres.proxApres)  || itraise("Le deuxième 'texte' ne devrait pas avoir de proximité droite")
      assert(textun.id, pxApres.proxAvant.motAvant.id, 'mot de la proximité avant le deuxième "texte"')

      return false // pour générer une erreur pour le moment
    }
}).exec()
