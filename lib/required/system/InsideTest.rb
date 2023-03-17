# # encoding: UTF-8
# =begin

#   class Scenario::InsideTest
#   --------------------------
#   Pour la gestion des "inside-tests".

# =end
# module Scenario

# # class ITClass
# # -------------
# # Toutes classe doit hériter de cette classe pour pouvoir utiliser
# # les méthodes de gestion des erreurs et des tests comme 
# # must_be_equal ou reset_errors
# # 
# # À la fin de chaque test, on récupère errors pour avoir la liste des
# # erreurs commises.
# # 
# module ITClass

#   # --- Méthodes de gestion des erreurs ---
  
#   attr_reader :errors

#   def reset_errors
#     @errors = []
#   end

#   def must_be_equal(actual, expected, msg)
#     if actual != expected
#       err msg, expected, actual
#     end
#   end

#   def err(msg, expected, actual)
#     msg = "#{msg} Expected: #{expected.inspect}. Actual: #{actual.inspect}"
#     @errors.push(epure(msg))
#   end

#   def epure(str)
#     str = str.to_s
#     str = str.gsub(/\n/, '⏎')
#     str = str.gsub(/"/,"'")

#     return str
#   end
# end #/class ITClass

# class InsideTest

#   extend ITClass

# class << self

#   def test_import(data)
#     require File.join(tests_folder, 'import.tests')
#     exec_tests_import(data)
#   end

#   def fd_files_folder
#     @fd_files_folder ||= mkdir(File.join(insidetest_folder,'fd_files'))
#   end

#   # Dossier contenant tous les tests ruby
#   def tests_folder
#     @tests_folder ||= mkdir(File.join(insidetest_folder,'tests'))
#   end

#   # Dossier principal des inside-tests, version ruby
#   def insidetest_folder
#     @insidetest_folder ||= mkdir(File.join(APP_FOLDER,'lib','InsideTest'))
#   end

# end #/<< self
# end #/class InsideTest
# end #/module Scenario
