'use strict';
/**

  WAA.js
  ------
  version 3.1
  
  Librairie permettant de gérer la WAA application. De façon simple,
  elle reçoit et elle transmet les données au script (ruby) qui a
  lancé l'application avec le web-driver Selenium, appelé ci-dessus
  le "script maitre"

  WAA.state = 1   au démarrage
  WAA.state = 2   quand l'application est prête

  Pour les applications de la suite Score, ajouter :
  <script type="text/javascript" src="../lib/js/WAA.js"></script>


*/
class Waa {

  /**
   * Méthode appelée par le serveur (script maitre) pour savoir 
   * s'il y a des 'messages' à recevoir. Si c'est le cas, on le
   * retourne.
   * 
   * Note-rappel : un 'Message' est un échange entre serveur et 
   * client qui a toujours la même forme. Dans la première version
   * de WAA, il contient :classe (définition d'une classe à appeler),
   * :method (la méthode de la classe à appeler) et :data (optionnel-
   * lement, les données, une table, à passer à la méthode).
   * 
   */
  get_message(){
    if (this.datastack && this.datastack.length) {
      return this.datastack.shift()
    }
  }

  /**
   * Pour envoyer des données au script maitre
   * (cf. dans waa.rb le format des données)
   */
  send(data_message){
    // console.log("data_message dans send: ", data_message)
    // return false
    if(undefined == this.datastack) this.datastack = []
    if('string' != typeof data_message) data_message = JSON.stringify(data_message)
    // console.log("data_message dans send: ", data_message)
    // return false
    this.datastack.push(data_message)
  }

  /**
   * Pour recevoir des données du script maitre par un 'Message'
   * (cf. dans waa.rb le format des données)
   * 
   */
  receive(data_message){
    // return false
    try {
      try {
        data_message = JSON.parse(data_message)  
      } catch(err){
        data_message = data_message.replace(/\\/g, '\\\\')
        data_message = JSON.parse(data_message)
      }
    } catch(err){
      const err_msg = "Une erreur fatale est survenue. Consulter la console pour y remédier."
      erreur(err_msg)
      console.error("Impossible de dejissonner (JSON.parse) le message de retour : ", data_message, err)
      return false
    }

    Log.debug("[WAA.receive] data_message = ", data_message)
    // return false

    // 
    // Classe définie par le message
    // 
    let classe = eval(data_message.class)
    // 
    // Appeler la méthode définie par le message, avec les 
    // données définies (if any)
    // 
    classe[data_message.method].call(classe, data_message.data)
    /*
    |  Cas spécial des tests InsideTest
    |  --------------------------------
    |  Si la propriété data_message.__ITData__ est définie, c'est 
    |  qu'une méthode régulière (ie hors-tests, une méthode normale 
    |  de l'application). Dans ce cas, il faut appeler la méthode
    |  IT_WAA qui doit réceptionner le retour. 
    |
    |  NOTE : ça ne coûte rien d'envoyer toutes les données remontées
    |  ça permettra au contraire de faire des tests dessus.
    */
    if ( isDefined(data_message.data.__ITData__) ) {
      IT_WAA.receive(data_message.data)
    }
    /*
    |  On retourne true pour le check
    */
    return true
  }

  /**
   * Pour recevoir une notification
   * 
   * Côté serveur, on appelle cette méthode par WAA.notify(msg,type)
   * 
   */
  onNotify(data){
    const msg = data.message
    switch(data.message_type){
      case 'error':
        erreur(msg)
        break
      default:
        message(msg)
    }
  }

  get state(){ return this._state || 1 }
  set state(v){ this._state = v }

}

var WAA = new Waa();
