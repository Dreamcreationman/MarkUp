import { app, ipcMain } from 'electron'
import { BrowserWindow } from 'electron-acrylic-window'
import { editorWindow } from './editor'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
let loading
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080/main`
  : `file://${__dirname}/main/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  // const { BrowserWindow } = require('electron-acrylic-window')

  mainWindow = new BrowserWindow({
    width: 1500,
    height: 1000,
    minHeight: 800,
    minWidth: 1200,
    frame: false,
    show: false,
    vibrancy: {
      theme: 'appearance-based',
      effect: 'acrylic',
      useCustomWindowRefreshMethod: true,
      disableOnBlur: true,
      debug: true
    },
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      // nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      // contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
    }
  })
  mainWindow.loadURL(winURL)

  setTimeout(() => { // 关闭loadpage的时候，将win, show true
    loading.hide()
    loading.close()
    mainWindow.show()
  }, 8000)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function showLoading (callback) {
  loading = new BrowserWindow({
    show: false,
    frame: false,
    width: 360,
    height: 360,
    resizable: false
  })
  loading.once('show', callback)
  loading.loadURL(`file://${__static}/loadpage.html`)
  loading.show()
}

function initApp () {
  showLoading(createWindow)
}

app.on('ready', () => {
  initApp()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  initApp()
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */

// 调整
ipcMain.on('close', (e) => {
  if (editorWindow && !editorWindow.isDestroyed()) {
    editorWindow.close()
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close()
  }
})

export { mainWindow }
