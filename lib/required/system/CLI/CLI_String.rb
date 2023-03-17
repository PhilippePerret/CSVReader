# encoding: UTF-8
# frozen_string_literal: true

class String

  # Souligne le texte (comme un titre) avec le caractère +char+
  # ou '-' par défaut
  #
  def underline(char = '-')
    self + "\n" + char * self.length
  end

  def self.columnize(lines, delimitor = ',')
    lines = lines.join("\n") if lines.is_a?(Array)
    str = `echo "#{lines}" | column -c 30 -t -s '#{delimitor}'`
    str.gsub(/([^ \n])  /,'\1     ')
  end

  # Si le texte est :
  # 
  #       Mon titre
  # 
  # … cette méthode retourne :
  # 
  #       Mon titre
  #       ---------
  # 
  # 
  def as_title(sous = '=', indent = 2)
    len = self.length
    ind = ' ' * indent
    del = ind + sous * (len + 2)
    "\n#{del}\n#{ind} #{self.upcase}\n#{del}"
  end

  # Le texte en bleu gras pour le terminal
  def bleu_gras
    "\033[1;96m#{self}\033[0m"
  end

  # Le texte en bleu gras pour le terminal
  def bleu
    "\033[0;96m#{self}\033[0m"
    # 96=bleu clair, 93 = jaune, 94/95=mauve, 92=vert
  end

  def mauve
    "\033[1;94m#{self}\033[0m"
  end

  def fond1
    "\033[38;5;8;48;5;45m#{self}\033[0m"
  end

  def fond2
    "\033[38;5;8;48;5;40m#{self}\033[0m"
  end

  def fond3
    "\033[38;5;0;48;5;183m#{self}\033[0m"
  end

  def fond4
    "\033[38;5;15;48;5;197m#{self}\033[0m"
  end

  def fond5
    "\033[38;5;15;48;5;172m#{self}\033[0m"
  end

  def orange
    "\033[38;5;214m#{self}\033[0m"
  end
  
  def jaune
    "\033[0;93m#{self}\033[0m"
  end
  alias :yellow :jaune

  def vert
    "\033[0;92m#{self}\033[0m"
  end

  # Le texte en rouge gras pour le terminal
  def rouge_gras
    "\033[1;31m#{self}\033[0m"
  end

  # Le texte en rouge gras pour le terminal
  def rouge
    "\033[0;91m#{self}\033[0m"
  end

  def rouge_clair
    "\033[0;35m#{self}\033[0m"
  end

  def gris
    "\033[0;90m#{self}\033[0m"
  end

  def gras
    "\033[1;38m#{self}\033[0m"
  end
  def purple
    "\033[1;34m#{self}\033[0m"
  end
  def yellow
    "\033[1;33m#{self}\033[0m"
  end
  def fushia
    "\033[1;35m#{self}\033[0m"
  end
  def cyan
    "\033[1;36m#{self}\033[0m"
  end
  def grey
    "\033[1;90m#{self}\033[0m"
  end


end #/String
