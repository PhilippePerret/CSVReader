# encoding: UTF-8
class MyLogger

  attr_reader :logs, :errors

  ##
  # Afficher (mode verbeux)
  # ou Consigner (mode test)
  # ou consigner dans un fichier (mode silencieux)
  # le message +msg+
  #
  def log(msg, color_method = nil)
    if test?
      @logs << {message:msg, colo: :color_method}
    elsif verbose?
      msg = msg.send(color_method) if color_method
      puts(msg)
    else
      LOGGER.in_file(msg)
    end  
  end

  ##
  # Afficher (ou enregistrer un message d'erreur)
  #
  def error(msg)
    if test?
      @errors << {message:msg, color: :rouge}
    else
      log(msg, :rouge)
      verbose? || puts(msg.rouge)
    end
  end

  ##
  # À chaque appel de commande, on doit réinitialiser
  # les messages et les erreurs. Cela est très utile pour
  # les tests par exemple
  def reset
    @errors = []
    @logs   = [] 
  end

  def in_file(msg)
    @ref ||= File.open(log_path,'a')
    @ref.puts "#{Time.now.strftime(FMT_DATE_HEURE)} #{msg}"
  end
  def log_path
    @log_path ||= File.join(APP_FOLDER,'daily.log')
  end
end #/MyLogger
LOGGER = MyLogger.new

def log(msg, couleur = nil, force = nil)
  LOGGER.log(msg, couleur)
end

def log_success(msg)
  LOGGER.log(msg, :vert)
end

# Ce message est toujours affiché à la console, que le mode
# verbeux soit en route ou non.
def log_error(msg)
  msg = "ERROR: #{msg}"
  LOGGER.error(msg)
end

def log_minor_error(msg)
  LOGGER.log("MINOR ERROR: #{msg}",:orange)
end

def log_notice(msg)
  LOGGER.log("NOTICE: #{msg}", :gris)
end

