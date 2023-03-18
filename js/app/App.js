'use strict';

class App {

  /* TODO : la remonter du serveur */
  static get APP_VERSION(){ return '1.0.1' }

  /**
  * Pour remonter une erreur depuis le serveur avec WAA.
  * (WAA.send(class:'App',method:'onError', data:{:message, :backtrace}))
  */
  static onError(err){
    erreur(err.message + " (voir en console)")
    console.error(err.message)
    console.error(err.backtrace)
  }
  
  /**
  * Pour afficher l'explication du petit '+' qui est ajouté lorsqu'une
  * rangée contient, sur une colonne étrangère, plusieurs identifiants
  * assemblés avec '+' et que CSVReader crée autant de rangées qu'il
  * y a de valeurs. Un '+' est ajouté en exposant pour garder en 
  * tête que ce sont des valeurs assemblés.
  * 
  * Pour bien comprendre :
  * - imaginons que nous affichons une table de LIVRES.
  * - la colonne "auteurs" de ces livres est une clé étrangère liée
  *   à la table AUTEURS
  * - CSVReader va assembler les données de façon transparente, c'est
  *   à-dire que sur chaque ligne de livre, l'auteur sera affiché
  * - maintenant, imaginons qu'un livre a plusieurs auteurs. Dans ce
  *   cas, la colonne AUTEURS contiendra quelque chose comme "12+23+45"
  * - CSVReader créera alors 1 rangée livre pour chaque autre : la
  *   rangée pour l'auteur #12, pour l'autre #23 et pour l'auteur #45
  * - pour garder une trace de la combinaison, les chiffres 23 et 45
  *   auront un petit '+' en exposant, indiquant qu'ils sont liés à
  *   12.
  */
  static show_explication_plus_en_exposant_de_id(){
    DGet('#explication-plus-en-exposant-id')
  }
} // /class App


