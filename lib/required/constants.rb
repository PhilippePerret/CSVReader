# encoding: UTF-8

LIB_FOLDER = File.dirname(__dir__)
APP_FOLDER = File.dirname(LIB_FOLDER)

#
# Dossier dans lequel on a ouvert le Terminal
# 
# Note : le texte a pu aussi être défini par argument
# 
CURRENT_FOLDER = File.expand_path('.')


#
# Constantes à définir dynamiquement (à chaque chargement de l'app
# au départ — mais pas au rechargement de la page HTML dans le 
# browser)
#
DYNAMIC_JS_CONSTANTES = [
  ['INSIDE_TESTS'   , Proc.new{ test? ? true : false } ],
  ['APP_FOLDER'     , APP_FOLDER],
  ['CURRENT_FOLDER' , CURRENT_FOLDER]
]
