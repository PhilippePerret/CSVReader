'use strict';
/**
* Class DOMTable
* --------------
* Production simple du code {String} pour une table.
* 
* 
* REQUIS
* ------
*   * Librairie marked.js (pour parser le code markdown)
*   * Libraire CSS DOMTable.css
* 
* USAGE
* -----
*   const table = DOMTable.new({
*     css:        '<classes css de la table>'   P.e. 'listing'
*     colsWidth:  []  Liste des largeurs de colonnes (if any)
*     colsClass:  []  Liste des classes de colonnes (if any)
*     // note : il faut au moins colsWidth ou colsClass
*     rows: [
*         ['cell1', 'cell2', ... 'cellN']
*       , ['cell1', 'cell2', ... 'cellN']
*       , ...
*     ]
*   })
* 
*   On l'inscrit dans la page avec : table.to_html()
* 
*/

class DOMTable {
  constructor(data){
    this.colsWidth = data.colsWidth
    this.colsClass = data.colsClass
    this.code = [`<table class="${data.css}">`]
    data.rows && this.injectRows(data.rows)
  }
  tr(...cells){
    this.code.push('<tr>')
    const tr = []
    for (var icol = 0, len = this.colsWidth.length; icol < len; ++icol){
      const dTemp = []
      this.colsWidth && dTemp.push(this.colsWidth[icol])
      this.colsClass && dTemp.push(this.colsClass[icol])
      dTemp.push(marked.parseInline(cells[icol] || ''))
      tr.push(tp(this.templateTd, dTemp))
    }
    this.code.push(tr.join(''))
    this.code.push('</tr>')
  }
  get templateTd(){
    return this._temptr || (this._temptr = this.buildTemplateTd())
  }
  injectRows(rows){
    rows.forEach(row => {this.tr(...row)})
    return this;//chainage
  }
  to_html(){ 
    this.code.push('</table>')
    return this.code.join('')
  }

  // --- Private Methods ---

  buildTemplateTd(){
    var htm = '<td'
    if (this.colsWidth) { htm += ' style="width:%spx;"'}
    if (this.colsClass) { htm += ' class="%s"'}
    htm += '>%s</td>'
    return htm
  }
}
