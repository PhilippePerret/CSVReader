# encoding: UTF-8
=begin

  Module WAA
  ----------
  version 3.0
  
  Pour les applications WAA (Without Ajax Application)
  C'est le pendant de la librairie waa.js côté client

  La données transmises dans un sens comme dans l'autre doivent
  être au format JSON.

  Le format de base est le suivant :
    {
      id:     '<identifiant universell unique>'
      class:  '<nom de la classe de l'app à appeler>',
      method: '<nom de la méthode de la classe à appeler>',
      data:   {<données JSON à transmettre à la méthode>}
    }

=end
require 'selenium-webdriver'

class InterruptionSilencieuse < StandardError; end

class Waa
  
  attr_reader :browser, :driver

  def version
    @version ||= '1.0'
  end

  ##
  # @public
  # 
  # Pour provoquer une action côté client
  # 
  def send(data)
    puts "WAA.send: Data envoyée :" + data.pretty_inspect if verbose?
    data = data.to_json if not(data.is_a?(String))
    data = data.gsub(/"/,'\\"')
    data = data.gsub(/\\n/,'\\\\\\n')
    resultat = driver.execute_script('return WAA.receive("'+data+'")')
  end

  ##
  # @public
  # 
  # Pour transmettre (n'importe quand) une notification au client
  # 
  def notify(msg, msg_type = 'notify')
    msg = msg.gsub(/\n/,'<br />')
    data = {class:'WAA', method:'onNotify', data:{message: msg, type_message:msg_type}}
    self.send(data)
  end

  #
  # Instanciation
  #
  def initialize(browser = :firefox)
    @browser = browser
  end

  def goto(file)
    driver.navigate.to 'file://'+file
  end

  # 
  # La boucle d'attente jusqu'à la fin
  # (pour le moment, rien n'indique la fin)
  # 
  def run
    state = 1
    iloop = 20 # pour des essais
    wait.until do
      check_clsv_message
      # 
      # Pour des essais
      # 
      if false #true
        iloop -= 1
        break if iloop < 0
      end

      # Marque la fin du programme
      state == 0
    end
  rescue Exception => e
    puts e.inspect
    puts e.backtrace.join("\n")
  end

  #
  # Méthode qui regarde essaie de récupérer une donnée s'il y en a
  # 
  # "clsv" signifie "client-server"
  # 
  def check_clsv_message
    begin
      msg = driver.execute_script('return WAA.get_message()')
    rescue Selenium::WebDriver::Error::InvalidSessionIdError => e
      # Erreur qui survient lorsqu'on quitte le browser
      raise InterruptionSilencieuse.new
    rescue Exception => e
      # Par exemple quand on recharge la page client
      puts "ERREUR BLOQUÉE : #{e.message}".orange
      return 
    end
    if msg
      traite_message(msg)
    else
      # out("Aucun message envoyé.")
    end
  end

  def traite_message(msg)
    message = Waa::Message.new(msg)
    #
    # On exécute le message
    #
    message.execute

  end


  ##
  # Le driver
  def driver
    @driver ||= begin
      if browser == :firefox
        # options = Selenium::WebDriver::Firefox::Options.new(profile: profile)
        opts = Selenium::WebDriver::Firefox::Options.new(
          # args: ['-devtools'], # -headless, -devtools, -jsconsole
          # args: ['-devtools'], # -headless, -devtools, -jsconsole
          # args: ['-jsconsole'], # ce n'est pas console des devtools
          # prefs: {
          #   'devtools.debugger.start-panel-collapsed': true,
          #   'devtools.toolbox.zoomValue': 4,
          #   'devtools.toolsidebar-height.inspector': 300,
          #   'devtools.chrome.enabled': true
          # },
          profile: 'aScenario'
          # à essayer :
          # devtools.debugger.ui.editor-wrapping true/false
          # devtools.debugger.ui.panes-visible-on-startup
        )
      else
        opts = {}
      end
      Selenium::WebDriver.for(browser, options: opts)
    end
  end

  ##
  # Le waiter
  def wait
    @wait ||= Selenium::WebDriver::Wait.new(:timeout => 24 * 3600 )
  end

class Message
  def initialize(raw_data)
    @raw_data = raw_data    
  end

  def execute
    # puts "Waa::Message: ruby_classe = #{ruby_classe.inspect}" 
    # puts "Waa::Message: ruby_method = #{ruby_method.inspect}" 
    if defined?(ruby_classe) == 'method' # wierd…
      classe = Object.const_get(ruby_classe)
      if classe.respond_to?(ruby_method)
        if method_args
          classe.send(ruby_method, method_args)
        else
          classe.send(ruby_method)
        end
      else
        raise "Méthode de classe inconnue : #{classe}::#{ruby_method}"
      end
    else
      raise "Classe inconnue : #{ruby_classe}"
    end
  end
  
  def data
    @data ||= JSON.parse(@raw_data)
  end

  def id;           @id           ||= data['id'] end
  def ruby_classe;  @ruby_classe  ||= data['class']   end
  def ruby_method;  @ruby_method  ||= data['method'].to_sym  end
  def method_args;  @method_args  ||= data['data'] end

end #/class Message

end #/class Waa


WAA = Waa.new
