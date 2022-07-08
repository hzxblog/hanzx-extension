module.exports = {
  devServer: {
    port: 3000
  },
  lintOnSave: false,
  pages: {
    popup: {
      template: 'public/index.html',
      entry: './src/popup/main.ts',
      title: 'Popup'
    },
    devtools: {
      template: 'public/index.html',
      entry: './src/devtools/main.ts',
      title: 'Devtools'
    },
    'devtools-background': {
      template: 'public/index.html',
      entry: './src/devtools-background/main.ts',
      title: 'devtools-background'
    }
  },
  pluginOptions: {
    browserExtension: {
      componentOptions: {
        background: {
          entry: 'src/background.ts'
        },
        contentScripts: {
          entries: {
            'content-script': [
              'src/content-scripts/content-script.ts'
            ]
          }
        }
      }
    }
  }
}
