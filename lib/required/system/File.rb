# encoding: UTF-8

class File

  ##
  # Lit le fichier XML de chemin d'accès +path+
  #
  def self.read_xml(path)
    File.read(path).gsub(/> *\n *</, '><').gsub(/> *\n *</, '><')
  end

end
