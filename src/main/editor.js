// other.js
import { BrowserWindow, ipcMain } from 'electron'
import { mainWindow } from './index'

const editorWindowURL = process.env.NODE_ENV === 'development' ? 'http://localhost:9080/editor' : `file://${__dirname}/editor/index.html`

let editorWindow
function createEditorWindow () {
  editorWindow = new BrowserWindow({
    width: 1500,
    height: 1000,
    minHeight: 800,
    minWidth: 1200,
    center: true,
    frame: false,
    modal: true,
    parent: mainWindow,
    webPreferences: {
      nodeIntegration: true, // 是否启用节点集成
      nodeIntegrationInWorker: true, // 是否在Web工作器中启用了Node集成
      contextIsolation: false, // electron为12x版本新增此行
      // devTools: true, // 是否开启 DevTools
      enableRemoteModule: true
    }
  })

  editorWindow.loadURL(editorWindowURL)

  // 监听渲染完成
  if (process.env.NODE_ENV === 'development') {
    editorWindow.webContents.on('did-frame-finish-load', () => {
      editorWindow.webContents.once('devtools-opened', () => {
        // chatRoomWindow.focus()
      })
      editorWindow.webContents.openDevTools()
    })
  }

  editorWindow.on('ready-to-show', function () {
    editorWindow.show() // 初始化后再显示
  })

  // 监听窗口关闭
  editorWindow.on('close', () => {
    editorWindow = null
  })
}

/**
 * 监听创建新窗口
 */
ipcMain.on('showEditorWindow', (event, argOne, argTwo) => {
  // 窗口存在检测
  if (editorWindow) {
    editorWindow.show()
    return
  }
  createEditorWindow()
  editorWindow.webContents.on('did-frame-finish-load', () => {
    editorWindow.webContents.send('editorNote', argOne, argTwo)
    console.log(argOne, argTwo)
  })
})

ipcMain.on('closeEditorWindow', (e) => {
  console.log('closeEditorWindow')
  if (editorWindowURL) {
    editorWindow.destroy()
    editorWindow = null
  }
})

export { editorWindow }
