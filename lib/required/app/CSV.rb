class CSVFile
class << self

  def getData(data)
    treate_csv_file(data['csv_path'])
    # 
    # Prendre tous les fichiers CSV définis
    # 
    csv_data = @csv_files.map do |csv_file|
      csv_file.data
    end
    # 
    # Renvoyer les données
    # 
    WAA.send(**{class:'CSV', method:'onReceiveCSVData', data:{csv_data: csv_data}})
  end

  def treate_csv_file(path)
    @csv_files ||= []
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
    csv_file    = found[3].strip
    @header[column_name].merge!(foreign_key: foreign_key, csv_file: csv_file)
    consigne_foreign_csv_file(csv_file)
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
end

def folder
  @folder ||= File.dirname(path)
end

end #/CSVFile
