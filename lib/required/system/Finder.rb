=begin

  Pendant serveur de Finder.js

=end
class Finder
class << self

  def get(options)

    # puts "options = #{options.inspect}"
    fromPath = options['fromPath'] || File.expand_path('~')

    # 
    # Les données à retourner
    # 
    data = {fromPath:nil, favoris:nil, elements:nil}

    # 
    # On met l'élément de base
    # 
    data.merge!({fromPath: fromPath})

    # 
    # Si les types ne commencent pas par un point, il faut l'ajouter
    # 
    if options['types']
      options['types'] = options['types'].map { |n| n = ".#{n}" unless n.start_with?('.'); n}
    end

    ins = Dir["#{fromPath}/*"].map do |pth|
      dpath = {type:'file', path: pth, filename: File.basename(pth)}
      if File.directory?(pth)
        dpath.merge!({type: 'folder'})
      elsif options['types'].nil? || options['types'].include?(File.extname(pth))
        dpath
      end
    end.compact

    data.merge!({elements: ins})

    # 
    # On ajoute toujours le cloud, sauf s'il est choisi
    # 
    if File.exist?(icloud_path) && ins.count > 0 && not(ins.first[:path].start_with?(icloud_path))
      ins << {type:'folder', path:icloud_path, filename: "iCloud"}
    end

    #
    # On ajoute les favoris
    # 
    data.merge!({favoris: favoris})

    WAA.send(**{class:'Finder.current',method:'receivedFromFinder',data: data})
  end

  ##
  # Pour réinitialiser la liste des favoris
  def reset_favoris(waa_data)
    if File.exist?(favoris_path)
      File.delete(favoris_path) 
      @favoris = nil
    end
  end

  ##
  # Pour ajouter un favori à cette application
  def add_favori(data)
    if defined?(APP_FOLDER)
      favori = data['fav_path']
      # 
      # On vérifie qu'il n'existe pas déjà
      # 
      if favori_exist?(favori)
        data.merge!({
          'ok' => false,
          'msg' => "Ce favori est déjà enregistré."
        })
      else
        # 
        # Sinon on l'enregistre
        # 
        favori_name = favori.split('/')[-2..-1].join('/')
        # 
        # La donnée du favori
        # 
        dfavori = {name:favori_name, path:favori}
        # 
        # On enregistre le favori
        # 
        favoris << dfavori
        save_favoris
        # 
        # Retour au client
        # 
        data.merge!({
          'ok' => true,
          'favori' => dfavori
        })
      end
    else
      data['ok'] = false
      data['msg'] = "La constante ruby APP_FOLDER n'est pas définie, je ne peux pas enregistrer de favoris pour cette application."
    end
    WAA.send(**{class:'Finder.current',method:'onReturnAddFavoris',data:data})
  end

  # @return true si le favori existe
  def favori_exist?(fav_path)
    favoris.each do |dfav|
      return true if dfav['path'] == fav_path
    end
    return false
  end

  ##
  # @return La données des favoris si elle est définie
  # 
  def favoris
    @favoris ||= begin
      if defined?(APP_FOLDER) && File.exist?(favoris_path)
        JSON.parse(File.read(favoris_path))
      else
        []
      end
    end
  end
  def save_favoris
    File.write(favoris_path, favoris.to_json)
  end
  def favoris_path
    @favoris_path ||= File.join(APP_FOLDER,'.finder_favoris')
  end


  # 
  # --- Gestion des récents (last tens) ---
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

  ##
  # Pour réinitialiser les récents de l'application
  def resetLastTens(waa_data)
    File.delete(last_ten_filepath) if File.exist?(last_ten_filepath)
    @last_ten_paths = nil
  end



  # --- Méthodes Path utiles ---

  def icloud_path
    # @icloud_path ||= File.expand_path('~/Library/Mobile Documents')
    @icloud_path ||= File.expand_path('~/Library/Mobile Documents/com~apple~CloudDocs')
  end

end #/ << self
end #/class Finder
