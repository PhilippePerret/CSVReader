'use strict';
/**
 * Système class Log
 * -----------------
 * To deal with console messages.
 * Voir le manuel.
 * 
 * @usages
 * 
 *    Log.level = <niveau>|null (default level)    
 *    Log.in("<fonction>") // entrée dans une fonction
 *    Log.out("<fonction>") // sortie d'une fonction
 *    Log.notice("<messages>"[, added flags])
 *    Log.test("<messages>"[, added flags])
 *    Log.warn("<messages>"[, added flags])
 *    Log.error("<message>"[, added flags])
 *    Log.fatal("<message>"[, added flags])
 *    Log.debug("<messages>"[, added flags])
 *    Log.w("<messages>", type, flags)
 */

/**
 * Constantes pour définir les messages à laisser passer, leur level
 * (drapeau)
 */
const LOG_NOTICE        = 1
const LOG_WARNING       = 2
const LOG_ERROR         = 4
const LOG_FATAL_ERROR   = 8
const LOG_INSIDE_TEST   = 16
const LOG_DEBUG         = 32
const LOG_INFO          = 64
const LOG_IOFUNCTION    = 128
//----------------------------
const LOG_NONE          = -1
const LOG_ALL = LOG_NOTICE|LOG_WARNING|LOG_ERROR|LOG_FATAL_ERROR|LOG_INSIDE_TEST|LOG_DEBUG|LOG_INFO|LOG_IOFUNCTION


// Les types de message
const LOG_MTYPE_NORMAL  = 1
const LOG_MTYPE_WARNING = 2
const LOG_MTYPE_ERROR   = 4
const LOG_MTYPE_DEBUG   = 8
const LOG_MTYPE_TEST    = 16
const LOG_MTYPE_INFO    = 32
const LOG_MTYPE_IOFCT   = 64

const STYLE_COMMUN = "font-family:'Arial Narrow';font-size:10pt;"
const LOG_MESSAGE_TYPES = {
    [LOG_MTYPE_NORMAL]:   {name:'normal', style:STYLE_COMMUN+'color:blue;font-weight:bold'} 
  , [LOG_MTYPE_WARNING]:  {name:'warning', style:STYLE_COMMUN+'color:orange,font-weight:bold'}
  , [LOG_MTYPE_ERROR]:    {name:'error', style:STYLE_COMMUN+'color:red;font-weight:bold'}
  , [LOG_MTYPE_DEBUG]:    {name:'debug',    style:'font-family:"Courier New";color:grey;font-size:8pt;'}
  , [LOG_MTYPE_TEST]:     {name:'test',     style:'font-family:Arial;font-size:8pt;color:brown;'}
  , [LOG_MTYPE_INFO]:     {name:'info',     style:STYLE_COMMUN+'color:purple;'}
  , [LOG_MTYPE_IOFCT]:    {name:'i/o fct' , style:STYLE_COMMUN+'color:fushia'}
  , location:             {name:'location', style:'float:right;font-size:7pt;color:#999;'}
  , prefix:               {name:'prefix'    , style:'display:inline-block;width:80px;font-family:Geneva;font-size:9px;color:blue;'}
}

class LogClass {

  constructor(owner){
    this.owner = owner
  }

  /**
   * Méthodes publiques
   * 
   */
  in(...args){
    var fct_name = args[0]
    if (this.owner) {fct_name = this.owner + fct_name}
    this.w('⇥ ' + fct_name, LOG_MTYPE_IOFCT, LOG_IOFUNCTION, args[1])
  }
  out(...args){
    var fct_name = args[0]
    if (this.owner) {fct_name = this.owner + fct_name}
    this.w('⇤ ' + fct_name, LOG_MTYPE_IOFCT, LOG_IOFUNCTION, args[1])
  }
  test(...args){
    this.w(args[0], LOG_MTYPE_TEST, LOG_INSIDE_TEST, args[1])
  }
  debug(...args){
    this.w(args[0], LOG_MTYPE_DEBUG, LOG_DEBUG, args[1])
  }
  notice(...args){
    this.w(args[0], LOG_MTYPE_NORMAL, LOG_NOTICE, args[1])
  }
  info(...args){
    this.w(args[0], LOG_MTYPE_INFO, LOG_INFO, args[1])
  }
  warn(...args) {
    this.w(args[0], LOG_MTYPE_WARNING, LOG_WARNING, args[1])
  }
  error(...args) {
    this.w(args[0], LOG_MTYPE_ERROR, LOG_ERROR, args[1])
  }
  fatal_error(...args) {
    this.w(args[0], LOG_MTYPE_ERROR, LOG_FATAL_ERROR, args[1])
  }
  /**
   * Write a any type message in console
   * 
   * @param str   {String} The string message
   * @param type  {Integer|Constant} The message type
   */
  w(str, type, flag, extraData){
    if ( flag & this.level ) {
      if ( extraData ) {
        /*
        |  Traitement avec une donnée supplémentaire
        |  (en fonction du fait que c'est un string ou un objet)
        */
        if ( 'string' == typeof extraData ) {
          str += `   [${extraData}]`
          extraData = null
        } else {
          str += '↘︎'
        }
      }
      this.log(str, type)
      extraData && console.log(extraData)
    }
    else { 
      // console.warn("Le message '%s' n'a pas le niveau requis", str)
    }
  }
  log(str, type){
    const stackInfo = new Error().stack.split("\n")[3].split(/[@\/\:]/)
    const method  = stackInfo[0]
    const column  = stackInfo.pop()
    const numline = stackInfo.pop()
    const file    = stackInfo.pop()
    const location = `${file}:${numline} ${method}() `
    console.log('%c'+this.prefix+' ['+this.owner+'] %c'+str + '%c' + location, LOG_MESSAGE_TYPES.prefix.style, LOG_MESSAGE_TYPES[type||LOG_MTYPE_NORMAL].style, LOG_MESSAGE_TYPES.location.style)
  }

  get prefix(){return this._prefix || '---'}
  set prefix(v){ this._prefix = v}

  get level(){return this.constructor.level}
  set level(v){return this.constructor.level = v}
  get defaultLevel(){ return this.constructor.defaultLevel}
  set defaultLevel(v){ return this.constructor.defaultLevel = v}


  static get level(){return this._level || LOG_NOTICE}
  static set level(v){ 
    this._level = v || this.defaultLevel
  }
  static get defaultLevel(){return this._defaultlevel || LOG_NOTICE|LOG_WARNING|LOG_ERROR|LOG_FATAL_ERROR }
  static set defaultLevel(v){ this._defaultlevel = v}
}

const Log = new LogClass('main')
