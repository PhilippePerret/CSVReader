class CSVFile
class << self

  def getData(data)
    csv_data = getCSVData(data['csv_path'])
    #
    # On indique que la dernière table traitée (que ce soit le dernier
    # fichier ou celui donné par le serveur, il se trouve dans la clé
    # 'csv_path')
    # 
    set_last_table(data['csv_path'])
    # 
    # Renvoyer les données
    # 
    WAA.send(**{class:'CSV', method:'onReceiveCSVData', data:{csv_data: csv_data}})
  end

  # @return [Array<Hash>] Les données de la table de chemin +csv_path+
  # ainsi que toutes les données de ses tables étrangères.
  # 
  # @param [String] csv_path Chemin d'accès au fichier CSV à afficher
  def getCSVData(csv_path)
    # 
    # Reset
    # 
    @csv_files = []
    # 
    # On traite le fichier à charger (+ ses tables étrangères)
    # 
    treate_csv_file(csv_path)
    # 
    # Prendre tous les fichiers CSV définis
    # Et retourner le résultat
    # 
    @csv_files.map do |csv_file|
      csv_file.data
    end
  end

  ##
  # Méthode appelée par le serveur qui demande l'affichage de la
  # dernière table ouverte (au démarrage) ou, le cas échouant, la
  # table définie par data['csv_path_alt'] si elle est définie.
  # 
  def loadLastState(data = nil)
    last_csv = last_table ? getCSVData(last_table) : nil
    WAA.send(**{class:'CSV', method:'onReturnLastState', data:{
      ok: true,
      csv_data: last_csv,
      csv_path: last_table,     # Pour Finder.js
      last_ten: last_ten_paths, # Pour Finder.js
      favoris:  Finder.favoris, # idem
    }})
  end

  def treate_csv_file(path)
    path || raise("Il faut définir le fichier CSV à afficher.")
    File.exist?(path) || raise("Le fichier #{path.inspect} est introuvable.")
    csv = CSVFile.new(path)
    csv.load
    @csv_files << csv
    # 
    # On charge aussi les données des fichiers étrangers
    # 
    csv.foreign_csv_files.each do |csv_path|
      treate_csv_file(csv_path)
    end
  end

  # 
  # - Gestion de la dernière table affichée -
  # 
  def last_table
    @last_table ||= begin
      if File.exist?(last_table_path)
        File.read(last_table_path)
      elsif File.exist?(last_ten_filepath)
        # Quand le fichier de la dernière table a été détruit
        # de force mais qu'il y a un fichier avec les 10 dernières
        # tables
        last_ten_paths.first
      end
    end
  end
  def set_last_table(csv_path)
    File.write(last_table_path, csv_path)
    add_in_last_ten(csv_path)
  end
  def last_table_path
    @last_table_path ||= File.join(APP_FOLDER,'.last_table')
  end

  #
  # - Gestion des 10 dernières tables affichées -
  # 
  def last_ten_paths
    @last_ten_paths ||= begin
      if File.exist?(last_ten_filepath)
        File.read(last_ten_filepath).split("\n").reject{|n|n.strip.empty?}
      end
    end
  end
  def add_in_last_ten(csv_path)
    lten = last_ten_paths || []
    lten.delete(csv_path) if lten.include?(csv_path)
    lten.unshift(csv_path)
    lten = lten[0...10] if lten.count > 10
    File.write(last_ten_filepath, lten.join("\n"))
  end
  # @return [String] Chemin d'accès au fichier qui consigne les
  # x dernières tables
  def last_ten_filepath
    @last_ten_filepath ||= File.join(APP_FOLDER,'.last_10_tables')
  end

end #<< self
###################       INSTANCE      ###################

attr_reader :path
attr_reader :foreign_csv_files

def initialize(path)
  @path         = path
  @rows         = []
  @header       = nil
  @foreign_csv_files = []
end

def data
  {
    header:   @header,
    columns:  @columns, # pour les avoir dans l'ordre
    rows:     @rows,
    path:     @path
  }
end

def load
  File.readlines(path).each do |line|
    line = line.strip
    next if line.empty?
    if line.start_with?('#')
      treate_line_as_comment(line)
    else
      treate_line_as_data(line)
    end
  end
end

# Une ligne peut contenir différentes informations et notamment :
#   - la description d'un colonne : "# <nom colonne> : <description>"
#   - une clé étrangère : "# <nom colonne> : path/to/file.csv"
# @note
#   L'header doit impérativement être défini avant de définir les
#   clé étrangère (c'est comme ça que le programme les reconnait)
def treate_line_as_comment(line)
  # 
  # Si l'entête n'est pas encore défini, on ne peut pas traiter les
  # commentaires
  # 
  return if @header.nil?
  #
  # Sinon, on regarde si le commentaire définit une colonne ou une
  # clé étrangère
  # 
  if ( found = line.match(@reg_foreign_key) )
    column_name = found[1]
    foreign_key = found[2].strip
    csv_file    = consigne_foreign_csv_file(found[3].strip)
    @header[column_name].merge!(foreign_key: foreign_key, csv_file: csv_file)
  elsif ( found = line.match(@reg_def_column) )
    column_name = found[1]
    description = found[2].strip
    @header[column_name].merge!(description: description)
  else
    # - line de commentaire à passer
  end
end

def treate_line_as_data(line)
  if @header.nil?
    # 
    # Si l'entête n'est pas défini (noms des données), la première
    # ligne de données doit le contenir
    # 
    treate_line_as_header(line)
  else
    line = line.gsub(/\\#{@column_separator}/,'__VIRGULE__')
    @rows << line.split(@column_separator).map do |d|
      d.strip.gsub(/__VIRGULE__/,@column_separator)
    end
  end
end

def treate_line_as_header(line)
  @column_separator = line.match?(',') ? ',' : ';'
  @columns = line.split(@column_separator).map{|h|h.strip}
  @header = {}
  @columns.each do |column|
    @header.merge!(column => {name: column})
  end
  # 
  # On définit les expressions régulières en rapport avec
  # le nom des colonnes
  # 
  define_regulare_expressions
end

def define_regulare_expressions
  # 
  # Expression régulière pour trouver des noms de colonnes
  # 
  @reg_header = /(#{@header.keys.join('|')})/
  # 
  # Expression régulière pour trouver la définition d'une clé étrangère
  # 
  @reg_foreign_key = /^\# ?#{@reg_header} ?\-\>(.+?),(.+?)$/
  # 
  # Expression régulière pour trouver la définition d'une colonne
  # 
  @reg_def_column = /^\# ?#{@reg_header} ?\:(.+?)$/
end

# Consignation du fichier csv étranger pour pouvoir le charger
# ensuite
def consigne_foreign_csv_file(file)
  unless file.start_with?('/') && File.exist?(file)
    file = File.expand_path(File.join(folder,file))
  end
  File.exist?(file) || raise("Fichier CSV introuvable : #{file}")
  foreign_csv_files << file
  return file
end

def folder
  @folder ||= File.dirname(path)
end

end #/CSVFile
