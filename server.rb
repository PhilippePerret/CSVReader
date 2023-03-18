#!/usr/bin/env ruby
# encoding: UTF-8
=begin

  Script maitre d'une application WAA

  * Le rendre exécutable (chmod +x ./<main>.rb)
  * Faire un lien symbolique pour la commande :
    Pour une commande ma-commande, faire :
    ln -s /absolute/path/to/<main>.rb /usr/local/bin/ma-commande

=end

begin
  require_relative 'lib/required'
  WAA.goto File.join(__dir__,'main.html')
  WAA.run
rescue Exception => e
  puts"\033[0;91m#{e.message + "\n" + e.backtrace.join("\n")}\033[0m"
ensure
  WAA.driver.quit
end
