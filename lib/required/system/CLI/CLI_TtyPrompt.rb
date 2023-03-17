# encoding: UTF-8

=begin

  VERSION 2.1.2
  
  (l'historique des versions se trouve en bas de fichier)


  Pour remplacer la constante Q qui permet d'utiliser
  TTY-Prompt (Q.select, Q.ask etc.)

  Dans l'application, il doit remplacer la définition de Q.

  Dans le main.rb, il doit y avoir :

    MODE_TEST = true ou la commande doit être appelée avec --test

  Ensuite, dans les tests, il faut utiliser :

  Q.answers = ["a", "\r" etc.]

  Ou, pour select (cf. NOTE 001 ci-dessous)

      Q.answers = [
        {_name_: <nom menu>}, 
        {_item_: <indice menu 1-start>}
        ]
  Ou, pour multi_select (cf. NOTE 001 ci-dessous)

      Q.answers = [
          {_names_: [<noms menus>]},
          {_items_: [<indice menus 1-start>]}
        ]

  … pour définir les retours donnés par l'utilisateur.


  * Pour utiliser une valeur par défaut dans #ask, il faut
    utiliser :
      Q.answer = [
        ...
        "\n",         # Ou :
        "_DEFAULT_"
      ]

  * Pour utiliser les control-key, utiliser
    {ctrl: <touche>}
    Par exemple :
      Q.answers = [
        {ctrl: 'c'}  # pour interrompre le programme
        {ctrl: 'd'}  # pour interrompre une édition multiline
        {ctrl: 's'}  # dans Tableizor pour interrompre l'édition
      ]


  [NOTE 001]
  Pour un select ou un multi_select, la valeur à retourner peut
  être spécifié de trois façons :
    1.  par la valeur elle-même, telle qu'elle (qui peut être une
        table contenant :name ou :value)
    2.  par le nom (:name) du menu affiché
    3.  par l'indice du menu affiché (0-start)

  Comment est faite la distinction ?
    Si ce n'est pas une table, c'est toujours la valeur, quelle
    qu'elle soit (rappel : la valeur retournée peut être de tout
    type, même une instance de classe)
    Si c'est une table, ça peut être la valeur ou autre chose.
      Si la table contient '_name_' ou '_item_' alors c'est autre
      chose.
        Si c'est autre chose contenant '_name_', on doit trouver
        l'item de nom '_name_' et retourner sa valeur (ou '_names_'
        pour les multi_select)
        Si c'est autre chose contenant '_item_', on doit retourner
        l'item de rang '_item_' (peut être négatif) ou '_items_' pour
        les multi_select
        Noter que la seule erreur possible ici sera d'avoir à 
        renvoyer un élément qui définit les clés '_name_' ou 
        '_item_'. Mais dans ce cas, il faudrait en plus que le
        '_name_' existe en tant que menu ou qu'il existe un item
        de rang '_item_'
      Sinon on doit retourner la table.


  [NOTE 002]
    Depuis la version 1.7, le système utilisé pour les tests 
    est également utilisé pour se souvenir de la commande jouée, qui
    sera rejouable avec '<command base> _' par exemple : 
    'iced compta _'

=end

require 'tty-prompt'
require 'json'

WITH_REPLAYER = false

if WITH_REPLAYER
  require_relative 'CLI_Replayer'
end

class NoMoreValuesError < StandardError; end

class TtyPromptTest
  def answers=(val)
    @values = []
    val.each do |men|
      case men
      when Hash
        men.each do |k,v|
          @values << {k.to_s => v}
        end
      else
        @values << men
      end
    end
    # puts "@values: #{@values}"
  end
  def values
    @values ||= begin
      if ENV['CLI_TEST_ANSWERS']
        JSON.parse(ENV['CLI_TEST_ANSWERS'])
      end
    end
  end

  ##
  # Retourne la prochaine entrée utilisateur simulée
  #
  def shift(pour)
    if not(values.nil?)
      shift_value = values.shift
      verbose? && puts("[VERBOSE]\nEntrée utilisateur : #{shift_value.inspect}\n[/VERBOSE]")
      if shift_value.is_a?(String) && shift_value.upcase == '_EXIT_'
        #
        # Interruption volontaire du programme
        #
        verbose? && puts("[VERBOSE] Interruption volontaire [/VERBOSE]")
        exit 0
      elsif shift_value.is_a?(Hash) && shift_value.key?('_exit_')
        #
        # Interruption volontaire du programme avec
        # évaluation d'une fonction lambda
        #
        verbose? && puts("[VERBOSE] Interruption volontaire avec exécution [/VERBOSE]")
        eval(shift_value['_exit_'])
        exit 0
      elsif shift_value.is_a?(Hash) && shift_value.key?('ctrl')
        case shift_value['ctrl']
        when 's'
          raise Tableizor::TTYForceFinEdition.new
        when 'c'
          raise TTY::Reader::InputInterrupt.new
        end
      elsif shift_value.is_a?(Hash) && shift_value.key?('sleep')
        sleep shift_value['sleep']
        shift(pour)
      else
        #
        # Cas normal : retour de l'entrée utilisateur
        #
        return shift_value
      end
    else
      err_msg = "Plus de valeurs CLI pour #{pour}… Il faut les ajouter dans 'answers'."
      puts err_msg.rouge
      raise TTY::Reader::InputInterrupt.new(err_msg)
    end
  end

  def select(*args, &block)
    # Cf. NOTE 001 ci-dessus
    Repondeur.new(self, 'select', *args, &block).evaluate
  end

  # Cf. NOTE 001 ci-dessus
  def multi_select(*args, &block)
    Repondeur.new(self, 'multiselect', *args, &block).evaluate
  end

  def ask(*args, &block)
    Repondeur.new(self, 'ask', *args, &block).evaluate
  end
  
  def multiline(*args, &block)
    Repondeur.new(self, 'multiline', *args, &block).evaluate
  end
  
  def yes?(*args, &block)
    Repondeur.new(self, 'yes', *args, &block).evaluate
  end

  def slider(*args, &block)
    Repondeur.new(self, 'slider', *args, &block).evaluate
  end

  def on(type, &block)
    case type
    when :keypress

    end
  end
  # -------------------------------------------
  #  Class TtyPromptTest::Repondeur
  # -------------------------------------------
  # Un "répondeur" traite une commande ask, select, multiline, etc.
  # de Tty-prompt, pour l'isoler des autres commande (par exemple,
  # pour avoir son propre choices auquel on peut ajouter des valeurs)

  class Repondeur
    attr_reader :itty, :type, :args
    def initialize(itty, type, *args, &block)
      @itty = itty
      @type = type
      @args = args
      case type
      when 'select', 'multiselect'
        @choices = @args[1] if @args[1].is_a?(Array)
      end
      instance_eval(&block) if block_given?
    end

    def evaluate
      user_input = itty.shift("Q.#{type}")
      case type
      when 'multiline'
        debug? && puts("[DEBUG]\nValeur retournée par Q.multiline(#{args[0]}) :\n#{user_input.inspect}")
        return user_input
      when 'ask', 'select', 'multiselect', 'yes', 'slider'
        returned_value = send("tty_#{type}".to_sym, user_input)
        if debug?
          entete_debug = "[DEBUG]\nValeur retournée par Q.#{type}(#{args[0]}) :\n"
          puts "#{entete_debug} #{returned_value.inspect}\n[/DEBUG]"
        end
        return returned_value
      else
        raise "Aucune entrée-utilisateur retournée pour le type #{type.inspect}"
      end
    end

    # pour Q.select
    def tty_select(user_input)
      return user_input unless user_input.is_a?(Hash)
      @choices = args[1] if args[1].is_a?(Array)
      if user_input.key?('_regname_') || user_input['_name_'].is_a?(Regexp)
        uname = /#{user_input['_regname_']||user_input['_name_']}/i
        choices.each do |dchoix|
          if dchoix[:name].match?(uname)
            return dchoix[:value]
          end
        end
        raise "Impossible de trouver '#{uname}' dans #{choices.inspect}"
      elsif user_input.key?('_name_')
        uname = user_input['_name_'].downcase
        choices.each do |dchoix|
          if dchoix[:name].downcase == uname
            return dchoix[:value]
          end
        end
        puts "Impossible de trouver '#{uname}' dans #{choices.inspect}".rouge
        # on ne l'a pas trouvé => on renvoie choix
        return user_input
      elsif user_input.key?('_item_')
        # puts "choices : #{choices.inspect}"
        # sleep 5
        if choices[user_input['_item_'] - 1].key?(:value)
          return choices[user_input['_item_'] - 1][:value]
        else
          return user_input
        end
      else
        return user_input
      end
    end #/pour Q.select

    # Pour Q.ask
    def tty_ask(user_input)
      if user_input.is_a?(String) && (user_input.upcase == '_DEFAULT_' || user_input == "\n")
        user_input = @default || begin
          if args[-1].is_a?(Hash)
            args[-1][:default]
          end
        end
        debug? && puts("Réponse transformée : #{user_input}")
        if @block_convert
          user_input = @block_convert.call(@block_convert)
          puts "user_input après conversion : #{user_input.inspect}"
        end
      end

      return user_input
    end

    # Pour Q.yes?
    def tty_yes(user_input)
      case user_input.upcase
      when 'Y', "\n", 'O', '_TRUE_'
        true
      else 
        false
      end
    end

    # Pour Q.multi_select
    def tty_multiselect(user_input)
      return user_input unless user_input.is_a?(Hash)
      @choices = args[1] if args[1].is_a?(Array)
      if user_input.key?('_regnames_')
        regname = /#{user_input['_regnames_']}/
        liste = []
        choices.each do |dchoix|
          if dchoix[:name].match?(regname)
            liste << dchoix[:value]
          end
        end
        if liste.any?
          return liste
        else
          raise "Impossible de trouver des items avec #{regname.inspect} dans #{choices.inspect}…"
        end
      elsif user_input.key?('_names_') 
        liste = []
        names_attendus = {}
        user_input['_names_'].each do |nam|
          names_attendus.merge! nam => true
        end
        choices.each do |dchoix|
          names_attendus.key?(dchoix[:name]) && liste << dchoix[:value]
        end
        if liste.any?
          return liste
        else
          # on ne l'a pas trouvé => on renvoie choix
          return user_input
        end
      elsif user_input.key?('_items_')
        return user_input['_items_'].collect do |idx| # 1-start
          choices[idx - 1][:value]
        end
      else
        return user_input
      end
    end

    def tty_slider(user_input)
      return user_input unless user_input.is_a?(Hash)      
    end

    # ------- méthodes de block ------------
    # C'est-à-dire les méthodes qu'on peut trouver dans un bloc comme
    #   Q.select(...) do |q|
    #     # ici
    #   end

    # Pour les menus select et multi_select, il faut connaitre les
    # choix quand on veut retourner une valeur par son nom de menu ou
    # son indice
    def choices(vals = nil)
      # puts "Entrée dans choices avec #{vals.inspect}"
      if vals.nil?
        return @choices
      else
        @choices ||= []
        @choices += vals
      end
    end

    def choice menu, value = nil, options = nil
      @choices ||= []
      @choices << {name:menu, value:value||menu, options:options}
    end

    def per_page(*args)
      # Rien à faire ici
    end

    def default(value)
      @default = value
    end

    def enum(*args)
      # Ne rien faire
    end

    def help(str)
      # Ne rien faire
    end

    def validate(*arg, &block)
      # Ne rien faire
      # TODO Plus tard on pourra vérifier les validations aussi
    end

    def convert(*arg, &block)
      # Ne rien faire
      if block_given?
        # TODO Plus tard on pourra vérifier les conversions aussi
        # Mais attention : c'est pas forcément donné par block
      end
    end

  end #/Repondeur

end #/TtyPromptTest

module TTY
  class MyPrompt < Prompt
    def select(*)
      if WITH_REPLAYER
        if REPLAYER.on? 
          REPLAYER.test_if_replayable
          REPLAYER.get_next_value()
        else
          super.tap do |res| REPLAYER.set_next_value(res) end
        end
      else
        super
      end
    end
  end
end

Q = 
  if test? #&& test_integration?
    TtyPromptTest.new 
  else
    # TTY::Prompt.new(symbols: {radio_on:"☒", radio_off:"☐"}) # cross : essai pour utiliser disabled dans les listes pour des sous-titres
    TTY::MyPrompt.new(symbols: {radio_on:"☒", radio_off:"☐"}) # cross : essai pour utiliser disabled dans les listes pour des sous-titres
  end

if test?
  LOGGER.reset
end

=begin

  HISTORIQUE DES VERSIONS
  2.1.2
    On peut rendre le replayer optionnel (toutes les applications
    n'en ont pas besoin, loin s'en faut).
  2.1.1
    Correction du bug lorsqu'on définissait les choices d'un select
    dans les arguments et qu'on en ajoutait un par :choice dans le
    bloc de code.
  2.1.0
    Correction des clés dans Q.answers pour pouvoir utiliser
    des {Symbol}s
  2.0.0
    Utilisation de TTY::MyPrompt
  1.6.2
    Vérification que Q n'est pas déjà défini (par MyCLITest par
    exemple)
  1.6.1
    Isolation complète de chaque appel à Q. Les choices et autres
    valeurs ne peuvent plus se mélanger comme c'était le cas
  1.5.1
    Ajout des méthodes de debuggage
  1.4
    Ajout des autres méthodes .select comme 'choice' ou 'per_page'
  1.3
    En mode test, possibilité de gérer l'indication des retours par
    le nom affiché du menu ou son indice.
  1.2
    Module pour l'application elle-même, définissant Q en fonction
    du mode test ou production
  1.1
    Première mise en place

=end
