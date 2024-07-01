/* 
temporary while we work on excalibur features alongside this example.
vite needs some additional configuration when excalibur is symlinked.
should be removed once example is ready to be published.
*/

import { defineConfig } from 'vite'
import fs from 'fs'

const isExcaliburSymlinked =
  fs.existsSync('./node_modules/excalibur') &&
  fs.lstatSync('./node_modules/excalibur').isSymbolicLink()

export default defineConfig({
  base: '/sample-jelly-jumper/',
  optimizeDeps: {
    include: isExcaliburSymlinked ? [] : ['excalibur'],
  },
  resolve: {
    dedupe: isExcaliburSymlinked ? ['excalibur'] : [],
  },
})
