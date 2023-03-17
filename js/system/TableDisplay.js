'use strict';
/**
 * class TableDisplay
 * -------------------
 * Affichage de tables en colonnes, redimensionnables
 * 
 */

class TableDisplay {

  /**
   * 
   * Instanciation
   * 
   * @param data {Array d'Array} table des données
   * 
   * @param options {Hash} table des options d'affichage
   *    options.container  {DOMElement} dans lequel mettre la table
   *    options.header {Array} ["Première colonne", "Deuxième", etc.]
   *    options.widths {Array} Les dimensions de chaque colonne
   *    options.aligns {Array} Les alignements de chaque colonne
   */
  constructor(data, options){
    this.data = data
    this.options = options || {}
  }

  /**
   * Pour construire la table
   * 
   */
  build(){
    var col, row, cell, style ;
    const o = DCreate('DIV',{class:'tabled'})
    if ( this.options.header ) {
      row = DCreate('DIV', {class:'table-row header'})
      for(col = 0; col < this.nombreColonnes; ++col){
        const tcell = this.options.header[col]
        style = []
        if ( this.options.widths ) { style.push(`width:${this.options.widths[col]};`)}
        if ( this.options.aligns ) { style.push(`text-align:${this.options.aligns[col]};`)}
        cell = DCreate('DIV', {class:'table-cell', text: tcell, style:style.join('')})
        row.appendChild(cell)
        $(cell).resizable({handles:'e,w'})
      }
      o.appendChild(row)
    }
    this.data.forEach( drow => {
      row = DCreate('DIV', {class:'table-row'})
      for(col = 0; col < this.nombreColonnes; ++col) {
        const dcell = {class:'table-cell', text: drow[col]}
        style = []
        if ( this.options.widths ) { style.push(`width:${this.options.widths[col]};`)}
        if ( this.options.aligns ) { style.push(`text-align:${this.options.aligns[col]};`)}
        if ( style.length ) {
          Object.assign(dcell, {style: style.join('')})
        }
        cell = DCreate('DIV', dcell)
        row.appendChild(cell)
      }
      o.appendChild(row)
    })
    this.container.appendChild(o)
    this.o = o
    this.observe()
  }

  observe(){

  }


  get nombreColonnes(){
    return this._nbcols || (this._nbcols = this.data[0].length)
  }

  get container(){
    return this._container || (this._container = this.options.container || document.body)
  }
}
