# encoding: UTF-8
# frozen_string_literal: true

module CLI

  class Replayer

    attr_reader :ref
    attr_reader :path
    attr_reader :reffile

    # Instanciation
    # 
    # @param  program {String}
    #         Commande jouée, c'est peut-être un raccourci, donc 
    #         c'est purement pour une question de namespace des
    #         commandes enregistrées.
    # 
    def initialize(program = nil)
      @program = program
      @command = CLI.command
      @ref = "#{@program}-#{@command}".as_normalized_filename
      folder = mkdir(File.expand_path('./.replayed_commands'))
      @path = File.join(folder, @ref)
      @values = []
      init_file
    end

    def on?
      :TRUE == @ison ||= true_or_false(cli?('_'))
    end

    def test_if_replayable
      replayable? || begin
        puts "Cette commande n'est pas rejouable.".rouge
        puts "Commence par l'utiliser pour enregistrer une suite de commande à refaire.".orange
        puts "\n\n"
        exit
      end
    end
    
    # @return true si la commande courante est "rejouable", c'est-à-
    # dire si une commande précédente a été enregistrée
    def replayable?
      File.exist?(path)
    end

    def init_file
      # Plus rien à faire maintenant qu'on enregistre tout
      # d'un coup
    end

    def save
      on? || begin
        File.open(path,'wb') do |f|
          f.write(Marshal.dump(@values))
        end
      end
    end

    def set_next_value(value)
      debug? && puts("Enregistrer : #{value.inspect}")
      @values << value
    end

    def get_next_value()
      next_value = reversed_values.pop
      debug? && puts("\n--- Next value: #{next_value}")
      if next_value.nil? && reversed_values.empty?
        exit
      else
        next_value
      end
    end

    def reversed_values
      @reversed_values ||= saved_values.reverse
    end

    def saved_values
      @saved_values ||= begin
        begin
          File.exist?(path) || raise("Pas de commandes enregistrées.")
          code = File.read(path).strip
          code.length > 0 || begin
            File.delete(path)
            raise("Le fichier des commandes est vide (il a été détruit).")
          end
          Marshal.load(code)
        rescue Exception => e
          puts e.message.rouge
          puts e.backtrace.join("\n").rouge if debug?
        end
      end
    end
  end #/class Replayer

end #/CLI
