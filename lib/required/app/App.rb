# encoding: UTF-8
module Proximot
class App

# Longueur maximale (en caractères) pour un fragment
MAX_FRAGMENT_SIZE = 20000  # environ 10 pages
  
class << self

  ##
  # = main point d'entrée =
  #
  # Lance l'application
  # 
  def run
    clear
    # return if test 
    begin
      Proximot::App.prepare
      WAA.goto File.join(APP_FOLDER,'MAIN.HTML')
      WAA.run
    ensure
      WAA.driver.quit
    end
  end

  ##
  # Préparation de l'application
  #
  # Cette préparation consiste surtout à placer des informations dans
  # le code HTML, notamment sur :
  #   - le user courant
  #   - le mode de fonctionnement (dev, prod ou test)
  #
  def prepare
    prepare_dynamic_constants_file
  end

  def prepare_dynamic_constants_file
    constantes = DYNAMIC_JS_CONSTANTES.map do |cst, val| 
      val = val.call() if val.is_a?(Proc)
      "const #{cst} = #{val.inspect};" 
    end.join("\n")
    path_dyn_consts = File.join(APP_FOLDER,'js','dynamic_constants.js')
    File.write(path_dyn_consts, PREAMBULE_DYNAMIC_CONSTANTES + constantes)
  end

  ##
  # Pour charger le texte à analyser/travailler
  #
  # Ce texte peut provenir soit d'un texte non encore analysé soit
  # d'un package Proximot
  #
  # C'est cette méthode qui est appelée après le lancement de l'app
  # pour charger le texte à analyser (soit en version brut, soit en
  # version déjà analysée).
  #
  # @param data {Hash} Seulement utilisé pour les tests pour le 
  #             moment.
  #         data['filepath'] Le fichier à charger, if any (surtout
  #             utilisé pour les tests, pour le moment)
  #         data['__ITData__']  Données des InsideTests si la méthode
  #             a été appelée depuis un InsideTest.
  #         data['keepAll'] Pour savoir si l'application doit être
  #             complètement réinitialisée avant le traitement du
  #             texte remonté. Si cette valeur existe et est true,
  #             côté client on n'appellera pas App.resetAll() comme
  #             c'est le cas par défaut.
  # 
  def load(data = nil)
    # puts "[App.load] data : #{data.pretty_inspect}".jaune
    #
    # On cherche un texte valide à proximité…
    # 
    file_path = data.nil? ? search_file_path() : data['filepath']
    # puts "file_path: #{file_path}".jaune

    data ||= {}

    #
    # Suivant l'extension, on lit le texte comme un document Proximot
    # ou comme un simple texte.
    # 
    if File.extname(file_path) == '.pxw'

      # 
      # Un fichier XML proximot à charger (.pxw)
      # 

      # load_data = {'prox_path' => file_path, 'loading_step'=>'app_state'}
      # IO.load_from_package(load_data)

      data.merge!('prox_path' => file_path, 'loading_step'=>'app_state')
      IO.load_from_package(data)

    else
      
      # 
      # Un fichier texte normal (.txt)
      # 
      
      # load_data = {'text_path' => file_path}
      # IO.load_from_text(load_data)

      data.merge!('text_path' => file_path)
      IO.load_from_text(data)

    end
  end

  ##
  # Pour sauver le texte en cours
  #
  # (simple raccourci pour la méthode IO.save_)
  def save_text(data)
    # puts "-> App::save_text avec les données : #{data.pretty_inspect}".bleu
    IO.save_current(data)
  end

  ##
  # En cas de fragmentation du texte, on appelle cette méthode pour
  # découper les parties restant.
  # 
  # @param data {Hash} Données transmises par le client
  #         data['text_path']   Chemin d'accès absolu au texte
  #         data['from_offset'] Caractère duquel il faut partir
  #         data['fragments_data'] {Hash} Les données actuelles (donc
  #               ne contenant que les informations du premier 
  #               fragment)
  # 
  def getDataOtherFragments(data)
    fragment_idx    = 1
    fragments_data  = data['fragments_data']
    last_break      = data['from_offset'] - 1
    text_path       = data['text_path'].freeze
    file_size       = File.size(text_path).freeze
    current_offset  = last_break
    while current_offset < file_size
      # puts "current_offset = #{current_offset} (file_size = #{file_size})".bleu
      str_fragment = File.read(text_path, MAX_FRAGMENT_SIZE, current_offset += 1)
      break if str_fragment.nil? || str_fragment.empty?
      last_break    = str_fragment.rindex(/[\.\n]/)
      str_fragment  = str_fragment[0..last_break]
      fragments_data.merge!(
        fragment_idx => {index: fragment_idx, offset: current_offset, lenInFile: str_fragment.length}
      )
      fragments_data['count'] += 1
      fragment_idx += 1
      current_offset += last_break
    end
    
    WAA.send(class:'App', method:'receiveDataOtherFragment', data:fragments_data)
  end


  ##
  # Procède à l'analyse du texte +text+ (en général pas très long, 
  # environ 500 mots dont 3000 caractères)
  # C'est la méthode appelée côté client pour analyser les modifica-
  # tions apportées au passage courant, par exemple quand un mot est 
  # remplacé par un autre.
  #
  # @param data {Hash}
  #             Donnée envoyée par le client, contenant la clé :text
  #             qui définit le texte à analyser.
  def analyze_text(data)
    text = data['text']
    puts "Analyse demandée du texte : #{text.inspect}".bleu
    options = {}
    #
    # S'il existe un fichier lexicon.lex, il faut le prendre en 
    # compte.
    # 
    lexicon_path = File.join(CURRENT_FOLDER,'lexicon.lex')
    if File.exist?(lexicon_path)
      options.merge!(lexicon: lexicon_path)
    end
    # 
    # On procède à l'analyse
    # 
    data = TTAnalyzer.new.analyze(text, options)
    # 
    # On la retourne au client
    # 
    WAA.send(class:'TextUtils', method:'receiveAnalyze', data:data)
  end

  ##
  # Retourne le chemin du texte à utiliser
  # On le cherche dans le dossier dans lequel a été ouvert le 
  # Terminal
  # 
  def search_file_path
    if ARGV[0] && File.exist?(ARGV[0])

      # 
      # Par chemin d'accès absolu existant
      # 
      
      return ARGV[0]
    
    elsif ARGV[0] && File.exist?(File.join(CURRENT_FOLDER,ARGV[0]))
      
      # 
      # Par chemin relatif dans le dossier courant
      # 
      
      return File.join(CURRENT_FOLDER,ARGV[0])
    
    elsif (paths_pxw  = Dir["#{CURRENT_FOLDER}/*.pxw"]).count > 0 # TODO: REMETTRE

      # 
      # Pour le moment on prend le premier fichier pxw (après on 
      # pourra proposer le choix TODO)
      # 

      return paths_pxw.first

    elsif (paths_text = Dir["#{CURRENT_FOLDER}/*.{text,txt}"]).count == 1

      # 
      # Un seul fichier texte dans le dossier
      # 

      return paths_text.first

    elsif paths_text.count > 1

      # 
      # Choisir parmi plusieurs textes
      # 

      Q.select("Quel fichier choisir ?".bleu) do |q|
        paths_text.each do |path_text|
          q.choice File.basename(path_text), path_text
        end
        q.per_page paths_text.count
      end

    else

      raise "Aucun fichier texte brut (.txt ou .text) défini dans le dossier courant."

    end
  end

  def test
    pxpath = File.join(CURRENT_FOLDER,'essai_proximot.pxw')
    prox = Proximot::Document.new(pxpath)
    puts "App state : #{prox.app_state.pretty_inspect}"
    # puts "Préférences : #{prox.preferences.pretty_inspect}"
    # puts "Console history : #{prox.console_history.pretty_inspect}"
    # puts "Proximités : #{prox.proximities.pretty_inspect}"
    puts "Fragments : #{prox.fragment(prox.app_state['fragment_index'].to_i)}"

  rescue Exception => e
    puts e.message.rouge
    puts e.backtrace.join("\n").rouge  
  ensure
    return true # mettre false pour lancer l'application
  end

end #/<< self

  PREAMBULE_DYNAMIC_CONSTANTES = <<~JAVASCRIPT
  /**
  * Ce fichier est créé automatiquement, ne pas le modifier à la
  * main.
  * Pour ajouter des constantes, modifier la liste constante
  * DYNAMIC_JS_CONSTANTES dans le fichier constants.rb de l'app.
  */

  JAVASCRIPT

end #/class App
end #/module Proximot
