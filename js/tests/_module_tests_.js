import {InsideTest} from '../system/InsideTest/inside-test.lib.js'


// import('./TextUtils.tests.js')
// import('./Loading_texte.test.js')
// import('./Suppression_Mots.test.js')
import('./offsets.test.js')

$(document).ready(async e => {

  if ( INSIDE_TESTS ) {  
    Log.level = LOG_FATAL_ERROR|LOG_IOFUNCTION //|LOG_DEBUG|LOG_INFO
    await InsideTest.install()
    InsideTest.run()
  }

})
