'use strict'
/**
 * class ConsoleToolTipsManager
 * ----------------------------
 * Pour gérer les "tooltips" de la console, c'est-à-dire l'affichage
 * qui donne en direct des informations sur la commande courante, à
 * commencer par l'effet de la première lettre.
 * 
 */
class ConsoleToolTipsManager {
  constructor(uiconsole){
    this.uiconsole = uiconsole
  }

  /**
  * Affichage du tooltip pour la commande +cmd+
  */
  displayTooltipFor(cmd){
    let tip;
    if ( cmd == '' ) {
      tip = ""
    } else {     
      const [command,value] = this.decomposeCommand(cmd)
      tip = this.tooltipFor(command, value)
    }
    this.obj.innerHTML = tip
  }

  /**
  * Construction du texte à afficher
  */
  tooltipFor(cmd, value){
    if ( this.DATA_COMMANDS[cmd] ) {
      const dCommand = this.DATA_COMMANDS[cmd]
      var tip = [cmd + ' => ']
      tip.push(tp(dCommand.action, {selection:this.currentSelection}))
      if ( value && dCommand.ifValue) {
        if (dCommand.valueFormater) value = dCommand.valueFormater(value)
        tip.push(tp(dCommand.ifValue, value))
      } else if ( !value && dCommand.ifNoValue ) {
        tip.push(dCommand.ifNoValue)
      }
      tip = tip.join(' ')
      if (dCommand.tip) {
        tip += '<div class="smaller">(' + dCommand.tip + ')</div>'
      }
      return tip
    } else {
      return `&lt;pas d'information sur la commande "${cmd}"&gt;`
    }
  }

  decomposeCommand(cmd){
    var segs = cmd.split(' ')
    cmd = segs.shift()
    var val = segs.join(' ')
    return [cmd, val]
  }

  get currentSelection(){
    if (this.currentMot) 
      return '"'+this.currentMot.content+'"'
    else
      return '&lt;la sélection&gt;'
  }

  get currentMot(){
    return Editor.Selection.current
  }


  get obj(){
    return this._obj || (this._obj = DGet('#console-tooltip'))
  }

  get DATA_COMMANDS(){
    return {
        '0':{}
      , '/': {
            action:'Recherche et sélectionne'
          , ifValue:'le premier mot contenant "%s".'
          , ifNoValue:'le premier mot contenant le texte en argument.'
        }
      , 'aide':{
            action:'Affichage de l’aide.'
          , tip:'Pour une aide plus chirurgicale, mettre des arguments.'
        }
      , 'delete':{
            action:'Supprime tous les mots sélectionnés'
        }
      , 'del':{action:'Supprime tous les mots sélectionnés'}
      , 'sup':{action:'Supprime tous les mots sélectionnés'}
      , 'f': {
            action:'lettre générique pour les fichiers + information sur texte courant'
        }
      , 'fo':{
            action:'ouvrir le fichier'
          , ifValue:'de chemin d’accès "%s"'
          , ifNoValue:'(indiquer le chemin d’accès en argument)'
        }
      , 'fw':{
            action:'Enregistrement du texte courant'
          , ifValue:'dans le fichier de nom "%s".'
          , valueFormater: this.formatedFileName.bind(this)
          , ifNoValue:'(indiquer un nom en argument pour "Enregistrer sous…")'
        }
      , 'help':{
            action:'Affichage de l’aide.'
          , tip:'Pour une aide plus chirurgicale (précise), utiliser "h".'
        }
      , 'h': {
            action:'Obtenir de l’aide sur'
          , ifValue:'"%".'
          , ifNoValue:'la valeur en argument (une commande par exemple).'
        }
      , 'i':{
            action:'Affiche les informations sur'
          , ifValue:'le mot "%s" sélectionné.'
          , ifNoValue:'la sélection courante.'
          , tip:'et notamment les proximités'
        }
      , 'ig':{
            action:'Ignore les proximités (gauche et droite) de la sélection'
          , tip:'ig* : toutes, igl/r : celle à gauche ou droite (left/right)'
        }
      , 'igl':{
            action:'Ignore la proximité gauche'
          , ifValue:'du mot "%s" sélectionné.'
          , ifNoValue:'de la sélection.'
          , tip:'`ig` ignore les deux en même temps'
        }
      , 'igr':{
            action:'Ignore la proximité droite'
          , ifValue:'du mot "%s" sélectionné.'
          , ifNoValue:'de la sélection.'
          , tip:'`ig` ignore les deux en même temps'
        }
      , 'n': {
            action:'Pour sélectionner le prochain mot en proximité'
        }
      , 'p': {
            action:'Pour sélectionner le précédent mot en proximité'
        }
      , 'pl':{
            action:'Pour sélectionner le mot en "proximité gauche"'
          , ifValue:'%s.'
          , valueFormater:this.formateNextPrevProximite.bind(this,'left')
          , ifNoValue:'d’une sélection qui possède une proximité gauche.'
        }
      , 'pr':{
            action:'Pour sélectionner le mot en "proximité droite"'
          , ifValue:'%s.'
          , valueFormater:this.formateNextPrevProximite.bind(this,'right')
          , ifNoValue:'d’une sélection qui possède une proximité droite.'
       }
      , 'pref':{
            action:'Pour définir'
          , ifValue:'la préférence %s'
          , valueFormater:this.formateValueForPreference.bind(this)
          , ifNoValue:'une préférence (par sa clé et sa valeur séparées d’une espace)'
        }
      , 'r': {
            action:'Remplacer %{selection}'
          , ifValue: 'par %s.'
          , tip:'Utiliser "r*" pour remplacer tous les mots'
        }
      , 'r*': {
            action:'Remplacer tous les mots %{selection}'
          , ifValue: 'par %s.'
          , ifNoValue:'par la valeur spécifiée en argument.'
          , tip:'Utiliser "r" pour remplacer seulement la sélection'
        }
      , 's': {
            action:'Sélectionne'
          , ifValue:'%s'
          , valueFormater:this.formateSelectionneMot.bind(this)
          , ifNoValue:'le mot spécifié en argument.'
        }
      , 'w': {
            action:'Enregistrement du texte'
          , ifValue: 'dans le chemin d’accès spécifié' // on peut utiliser %s pour la valeur
        }
    }
  }

  //########### MÉTHODES DE FORMATAGE DES VALEURS ##############

  /**
  * Formatage du tooltip pour définir une préférence
  * 
  * Non seulement la méthode formate le message, mais elle donne en
  * plus des indications pour pouvoir trouver la clé
  *
  */
  formateValueForPreference(value){
    const [prefId, prefVal] = value.split(' ')
        ,  dPref = PREFERENCES_DATA[prefId]

    if ( dPref ) {
      /*
      |  Clé préférence connue
      */
      if ( prefVal ) {
        /*
        |  Clé préférence connue et valeur définie
        */
        return `de clé '${prefId}' à la valeur '${prefVal}'.`
      } else {
        /*
        |  Clé préférence connue mais pas de valeur
        */
        return `de clé '${prefId}' (${dPref.text}).`
      }
    } else {
      const possibleKeys = Preferences.maybePrefId(prefId)
      return 'dont la clé peut-être : ' + possibleKeys.join(', ') + '.'
    }

    
  }
  /**
  * Formatage du nom du fichier dans lequel sera enregistré le 
  * texte et ses informations.
  */
  formatedFileName(value){
    const len = value.length
    if ( value.substring(len - 4, len) != '.pxw' ) {
      return value + '.pxw'
    } else {
      return value
    }
  } 

  /**
  * Formatage de l'argument de la commande "s" pour sélectionner
  * un ou des mots
  */
  formateSelectionneMot(value){
    const len = value.length
    const lettre1 = value.substring(0,1)
    let chiffre ;

    if ( lettre1 == '+' ) {
      chiffre = value.substring(1, len)
    } else if ( lettre1 == '-' ) {
      chiffre = value.substring(1, len)
    } else {
      chiffre = value
    }

    if ( chiffre.match(/^[0-9]+$/) ) {
      const chifdes = chiffre + (parseInt(chiffre,10) > 1?'e':'er')
      switch(lettre1){
      case '+':
        return 'le ' + chifdes + ' mot après la sélection.'
        break
      case '-':
        return 'le ' + chifdes + ' mot avant la sélection.'
        break
      default:
        return 'le '+ chifdes +' mot du texte.'
      }
    } else {
      return 'le premier mot contenant "'+value+'".'
    }
  }

  /**
  * Pour l'aide sur la sélection de la proximité gauche (sens = 'left')
  * ou droite (sens = 'right'), en regardant s'il y a une sélection
  * et si elle contient la proximité voulu
  */
  formateNextPrevProximite(sens, value){
    const psens = 'proximité ' + (sens == 'left' ? "avant" : "après")
    if ( this.currentMot ) {
      if ( (this.currentMot.proxAvant && sens == 'left') || this.currentMot.proxApres && sens == 'right') {
        return 'du mot "'+value+'" sélectionné'
      } else {
        return 'du mot courant s’il possédait une ' + psens
      }
    } else {
      return 'la sélection si elle possède une ' + psens
    }
  }
}
