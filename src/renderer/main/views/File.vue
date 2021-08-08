<template>
    <div>
        <div class="navbar">
            <div class="navbar-content">
                <form class="search-form">
                    <div class="input-group">
                        <button class="btn-search">
                            <unicon name="search" class="unicons" fill="rgb(38, 130, 230)"></unicon>
                        </button>
                        <input type="text" class="form-control" id="" placeholder="找吧找吧（待开发）...">
                    </div>
                </form>
                <div class="operator">
                    <button class="btn-refresh">
                        <unicon name="sort-amount-down" fill="rgb(38, 130, 230)"></unicon>
                    </button>
                    <button class="btn-refresh">
                        <unicon name="list-ol" fill="rgb(38, 130, 230)"></unicon>
                    </button>
                    <button class="btn-refresh" @click="refresh">
                        <unicon name="sync" fill="rgb(38, 130, 230)"></unicon>
                    </button>
                    <button class="btn-refresh" @click="returnFolder">
                        <unicon name="corner-up-left" fill="rgb(38, 130, 230)"></unicon>
                    </button>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="content" v-if="inFolder == 0">
                <div class="file-container">
                    <div class="new" v-on:dblclick="createFolder">
                        <div class="icon-view-folder">
                            <img src="../components/img/folderadd.png" class="icon-folder" />
                        </div>
                        <p>Create New</p>
                    </div>
                </div>
                <div class="file-container" :key="folder.guid" v-for="folder in folders">
                    <div class="new" v-on:dblclick="openFolder($event,'')" :id="folder.guid" @contextmenu="rightClick(folder)">
                        <div class="icon-view-folder">
                            <img src="../components/img/folder.png" class="icon-folder" />
                        </div>
                        <p :id="'folder-name-' + folder.guid" onkeypress="if(window.event.keyCode==13) this.blur()">{{folder.name}}</p>
                    </div>
                </div>
            </div>
            <div class="content" v-else-if="inFolder != 0 && inFolder != 2">
                <div class="file-container">
                    <div class="new" v-on:dblclick="createNote">
                        <div class="icon-view-new-note">
                            <img src="../components/img/markadd.png" class="icon-note" />
                        </div>
                        <p>Create New</p>
                    </div>
                </div>
                <div class="file-container" :key="note.guid" v-for="note in notelists">
                    <div class="new" :id="note.guid" v-on:dblclick="openNote($event)" @contextmenu="rightClick(note)">
                        <div class="icon-view-note">
                            <img src="../components/img/markup.png" class="icon-note" />
                        </div>
                        <p :id="'note-name-' + note.guid" onkeypress="if(window.event.keyCode==13) this.blur()">{{note.title}}</p>
                    </div>
                </div>
            </div>
            <div v-else>
                <div class="loader">
                    <div class="loader-inner">
                        <div class="loader-line-wrap">
                            <div class="loader-line"></div>
                        </div>
                        <div class="loader-line-wrap">
                            <div class="loader-line"></div>
                        </div>
                        <div class="loader-line-wrap">
                            <div class="loader-line"></div>
                        </div>
                        <div class="loader-line-wrap">
                            <div class="loader-line"></div>
                        </div>
                        <div class="loader-line-wrap">
                            <div class="loader-line"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
// @ is an alias to /src
// import GraphView from '@/components/GraphView.vue'
import { ipcRenderer } from 'electron'
var Evernote = require('evernote')
const { dialog } = require('electron').remote

export default {
  name: 'File',
  data () {
    return {
      folders: [],
      inFolder: 0,
      notelists: [],
      client: '',
      noteStore: ''
    }
  },
  mounted () {
    this.getFolders()
  },
  methods: {
    createNote () {
      let accessToken = this.$Store.get('accessToken')

      var authenticatedClient = new Evernote.Client({
        token: accessToken,
        sandbox: true,
        china: false
      })
      if (this.noteStore === '') { this.noteStore = authenticatedClient.getNoteStore() }
      var nBody = '<?xml version="1.0" encoding="UTF-8"?>'
      nBody += '<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">'
      nBody += '<en-note></en-note>'
      var newNote = new Evernote.Types.Note()
      newNote.title = '新建note_' + (new Date()).valueOf()
      newNote.content = nBody
      newNote.notebookGuid = this.inFolder
      let _this = this
      this.noteStore.createNote(newNote).then(function (note) {
        console.log('created note: ', note.title, ' guid: ', note.guid)
        _this.refresh()
      }).catch(err => {
        console.log('createNote Error: ', err)
        dialog.showErrorBox('创建笔记失败', JSON.stringify(err))
      })
    },
    openNote (e) {
      console.log('openNote:', e.target.id)
      let noteGuid = e.target.id
      let accessToken = this.$Store.get('accessToken')
      ipcRenderer.send('showEditorWindow', noteGuid, accessToken)
    },
    refresh () {
      if (this.inFolder === 0) {
        this.getFolders()
      } else if (this.inFolder !== 2) {
        this.openFolder('', this.inFolder)
      }
    },
    returnFolder () {
      if (this.inFolder !== 0) { this.getFolders() }
    },
    createFolder () {
      let accessToken = this.$Store.get('accessToken')
      var authenticatedClient = new Evernote.Client({
        token: accessToken,
        sandbox: true,
        china: false
      })
      if (this.noteStore === '') { this.noteStore = authenticatedClient.getNoteStore() }
      var newNoteBook = new Evernote.Types.Notebook()
      newNoteBook.name = '新建NoteBook_' + (new Date()).valueOf()
      let _this = this
      this.noteStore.createNotebook(newNoteBook).then(function (notebook) {
        console.log('created notebook: ', notebook.name, ' guid: ', notebook.guid)
        _this.refresh()
      }).catch(err => {
        console.log('createNote Error: ', err)
        dialog.showErrorBox('创建笔记本失败', JSON.stringify(err))
      })
    },
    getFolders () {
      this.inFolder = 2
      let accessToken = this.$Store.get('accessToken')
      let _this = this
      var authenticatedClient = new Evernote.Client({
        token: accessToken,
        sandbox: true,
        china: false
      })
      if (this.noteStore === '') { this.noteStore = authenticatedClient.getNoteStore() }
      this.noteStore.listNotebooks().then(function (notebooks) {
        _this.folders = notebooks
        _this.inFolder = 0
        console.log(notebooks)
      })
    },
    getNoteStore () {
      console.log('getNoteStore')
      let accessToken = this.$Store.get('accessToken')
      if (this.client === '') {
        var authenticatedClient = new Evernote.Client({
          token: accessToken,
          sandbox: true,
          china: false
        })
        this.client = authenticatedClient
      }
      if (this.noteStore === '') { this.noteStore = authenticatedClient.getNoteStore() }
    },
    openFolder (e, inGuid) {
      this.inFolder = 2
      let _this = this
      let guid = ''
      if (e === '' && inGuid !== '') {
        guid = inGuid
      } else {
        guid = e.target.id
      }
      this.getNoteStore()
      var filter = new Evernote.NoteStore.NoteFilter({
        notebookGuid: guid
      })
      var spec = new Evernote.NoteStore.NotesMetadataResultSpec({
        includeTitle: true,
        includeContentLength: true,
        includeCreated: true,
        includeUpdated: true,
        includeDeleted: true,
        includeUpdateSequenceNum: true,
        includeNotebookGuid: true,
        includeTagGuids: true,
        includeAttributes: true,
        includeLargestResourceMime: true,
        includeLargestResourceSize: true
      })
      this.noteStore.findNotesMetadata(filter, 0, 999, spec).then(function (notesMetadataList) {
        _this.inFolder = guid
        _this.notelists = notesMetadataList.notes
        console.log(notesMetadataList, _this.inFolder)
      }).catch(err => {
        console.log('findNotesMetadata: ', err)
      })
    },
    // Delete is not supported on third Party apps
    // deleteFolder (notebook) {
    //   let _this = this
    //   this.getNoteStore()
    //   this.noteStore.expungeNotebook(notebook.guid).then(function (res) {
    //     console.log(res)
    //     _this.refresh()
    //   }).catch(err => {
    //     dialog.showMessageBox({
    //       type: 'error',
    //       title: '删除笔记本失败',
    //       message: JSON.stringify(err),
    //       buttons: ['OK']
    //     }).then(result => {
    //       console.log('您的选择:', result.response)
    //       console.log(result)
    //     }).catch(e => {
    //       console.log(e)
    //     })
    //   })
    // },
    renameNote (item) {
      let _this = this
      this.getNoteStore()
      let title = document.getElementById('note-name-' + item.guid)
      title.addEventListener('focus', () => {
        console.log('title focus')
        var selection = window.getSelection()
        selection.removeAllRanges()
        var range = document.createRange()
        range.selectNodeContents(title)
        selection.addRange(range)
      })

      title.addEventListener('blur', () => {
        console.log('title blur')
        title.setAttribute('contenteditable', false)
        title.classList.remove('enable_edit')
        let content = title.innerHTML.replace(/&nbsp;/ig, '').trim()
        if (content === '') {
          dialog.showErrorBox('重命名失败', '笔记名不能为空！')
          title.innerHTML = item.title
        } else if (content !== item.title) {
          item.title = content
          _this.noteStore.updateNote(item).then(function (res) {
            console.log(res)
            _this.refresh()
          }).catch(err => {
            dialog.showErrorBox('重命名失败', JSON.stringify(err))
          })
        }
      })

      title.setAttribute('contenteditable', true)
      title.classList.add('enable_edit')
      let range = document.createRange()
      range.selectNodeContents(title)
      range.collapse(false)
      let sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    },
    renameFolder (item) {
      let _this = this
      this.getNoteStore()
      let title = document.getElementById('folder-name-' + item.guid)
      title.addEventListener('focus', () => {
        console.log('title focus')
        var selection = window.getSelection()
        selection.removeAllRanges()
        var range = document.createRange()
        range.selectNodeContents(title)
        selection.addRange(range)
      })

      title.addEventListener('blur', () => {
        console.log('title blur')
        title.setAttribute('contenteditable', false)
        title.classList.remove('enable_edit')
        let content = title.innerHTML.replace(/&nbsp;/ig, '').trim()
        if (content === '') {
          dialog.showErrorBox('重命名失败', '笔记本名不能为空！')
          title.innerHTML = item.name
        } else if (content !== item.name) {
          item.name = content
          _this.noteStore.updateNotebook(item).then(function (res) {
            console.log(res)
            _this.refresh()
          }).catch(err => {
            dialog.showErrorBox('重命名失败', JSON.stringify(err))
          })
        }
      })

      title.setAttribute('contenteditable', true)
      title.classList.add('enable_edit')
      let range = document.createRange()
      range.selectNodeContents(title)
      range.collapse(false)
      let sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    },
    deleteNote (note) {
      let _this = this
      this.getNoteStore()
      this.noteStore.deleteNote(note.guid).then(function (res) {
        console.log(res)
        _this.refresh()
      }).catch(err => {
        dialog.showErrorBox('删除笔记本失败', JSON.stringify(err))
      })
    },
    rightClick: function (item) {
      console.log(item, this.inFolder)
      const _this = this
      // 需要用到 electron
      const { remote } = require('electron')
      const { Menu, MenuItem } = remote
      // 右键菜单
      const menu = new Menu()
      if (this.inFolder === 0) {
        menu.append(new MenuItem({
          label: '重命名',
          click: function () {
            _this.renameFolder(item)
          }
        }))
      } else {
        menu.append(new MenuItem({
          label: '重命名',
          click: function () {
            _this.renameNote(item)
          }
        }))
        menu.append(new MenuItem({
          label: '删除此笔记',
          click: function () {
            console.log('删除笔记', item.guid)
            dialog.showMessageBox({
              type: 'error',
              title: '删除笔记',
              message: '是否确认删除该笔记？',
              buttons: ['是', '否']
            }).then(result => {
              if (result.response === 0) {
                _this.deleteNote(item)
              }
            }).catch(e => {
              console.log(e)
            })
          }
        }))
      }
      menu.popup(remote.getCurrentWindow())
    }
  }
}
</script>
<style scoped>
@font-face {
    font-family: pingfang;
    src: url('../assets/font/pingfangsc.otf')
}

.enable_edit {
    border: 3px dashed #2682e6;
    border-radius: 5px;
    outline:none;
}

.navbar { 
    height: 130px;
    padding: 0;
    z-index: 100;
    width: calc(100% - 300px);
    position: fixed;
    -webkit-app-region: drag;
}

.navbar-content {
    width: 100%;
    height: 100%;
    padding: 30px 30px;
    text-align: left;
}

.search-form {
    width: 40%;
    height: 100%;
    margin-left: 10px;
    display: inline-block;
}

.input-group {
    height: 100%;
    text-align: left;
    border-radius: 50px;
    background: linear-gradient(145deg, #dedede, #ffffff);
    box-shadow: 13px 13px 26px #ededed,
        -13px -13px 26px #ffffff;
    -webkit-app-region: no-drag;
}

.btn-search {
    border: none;
    margin-left: 20px;
    background-color: transparent;
}

.unicon {
    font-size: 5px;
    border-bottom: 2px solid rgb(38, 130, 230);
}

.form-control {
    font-family: pingfang;
    border: none;
    outline: none;
    background-color: transparent;
    height: 100%;
    font-size: 1.3rem;
    margin-left: 10px;
    margin-right: 15px;
    caret-color: rgb(38, 130, 230);
    letter-spacing: 2px;
    width: auto-fill;
}

.container {
    width: 100%;
    height: calc(100% - 140px);
    bottom: 0;
    position: absolute;
}

.operator {
    width: 50%;
    height: 100%;
    display: inline;
    float: right;
}

.btn-refresh {
    width: 70px;
    height: 70px;
    text-align: center;
    vertical-align: middle;
    margin-right: 30px;
    border: none;
    float: right;

    background-color: transparent;
    border-radius: 50px;
    background: linear-gradient(145deg, #ffffff, #d6d6d8);
    box-shadow: 13px 13px 26px #bababb,
        -13px -13px 26px #ffffff;
    -webkit-app-region: no-drag;
}

.btn-refresh:hover {
    border-radius: 50px;
    background: linear-gradient(145deg, #d6d6d8, #ffffff);
    box-shadow: 13px 13px 26px #bababb,
        -13px -13px 26px #ffffff;
    transition: box-shadow 0.5s ease-in-out;
}

.btn-refresh:active {
    border-radius: 50px;
    background: #eeeef0;
    box-shadow: inset 13px 13px 26px #cdcdce,
        inset -13px -13px 26px #ffffff;
    transition: box-shadow 0.3s ease-in-out;
}

.content {
    width: 100%;
    height: 100%;
    bottom: 0;
    position: absolute;
    overflow-y: auto;
    display: grid;
    padding-top: 30px;
    padding-bottom: 30px;
    padding-left: 50px;
    padding-right: 20px;
    font-family: pingfang;
    grid-template-columns: repeat(auto-fill, 200px);
    grid-template-rows: repeat(auto-fill, 250px);
    grid-column-gap: 10px;
    grid-row-gap: 10px;
}

.file-container {
    width: 100%;
    height: 100%;
    display: block;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

.new {
    z-index: 100;
    width: 80%;
    height: 80%;
    padding: 20px 20px;
    color: rgb(38, 130, 230);
    text-align: center;
    justify-self: center;
    border-radius: 21px;
    background: #eeeef0;
    box-shadow: 5px 5px 10px #e0e0e2,
        -5px -5px 10px #fcfcfe;

}

.new:hover {
    border-radius: 21px;
    background: #eeeef0;
    box-shadow: inset 5px 5px 10px #e0e0e2,
        inset -5px -5px 10px #fcfcfe;
    transition: box-shadow 0.5s ease-in-out;
}

.new:active {
    border-radius: 21px;
    background: #eeeef0;
    box-shadow: inset 12px 12px 24px #e0e0e2,
        inset -12px -12px 24px #fcfcfe;
    transition: box-shadow 0.3s ease-in-out;
}

.new>p {
    display: inline;
    margin-top: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
    max-width: 100%;
    display: block;
}

.icon-view-new-note {
    height: 80%;
    line-height: 120px;
    border: 2px dotted rgba(30, 130, 230, 0.4);
    pointer-events: none;
}

.icon-view-note {
    height: 80%;
    line-height: 120px;
    border: 2px solid rgb(219, 219, 219);
    pointer-events: none;
}

.icon-note {
    width: 50px;
    vertical-align: middle;
    pointer-events: none;
}

.icon-view-folder {
    height: 80%;
    line-height: 120px;
    pointer-events: none;
}

.icon-folder {
    width: 100px;
    vertical-align: middle;
    pointer-events: none;
}


.loader {
    overflow: hidden;
    position: fixed;
    bottom: 0;
    top: 0;
    z-index: 99999;
    left: 0;
    right: 0;
    margin-left: 300px;
    margin-top: 130px;
    background: #eeeef0;
    /*background: radial-gradient(#222, #000);*/
    z-index: 99999;
}

.loader-inner {
    bottom: 30%;
    height: 60px;
    left: 0;
    margin: auto;
    position: absolute;
    right: 0;
    top: 0;
    width: 100px;
}

.loader-line-wrap {
    animation:
        spin 2000ms cubic-bezier(.175, .885, .32, 1.275) infinite;
    box-sizing: border-box;
    height: 50px;
    left: 0;
    overflow: hidden;
    position: absolute;
    top: 0;
    transform-origin: 50% 100%;
    width: 100px;
}

.loader-line {
    border: 4px solid transparent;
    border-radius: 100%;
    box-sizing: border-box;
    height: 100px;
    left: 0;
    margin: 0 auto;
    position: absolute;
    right: 0;
    top: 0;
    width: 100px;
}

.loader-line-wrap:nth-child(1) {
    animation-delay: -50ms;
}

.loader-line-wrap:nth-child(2) {
    animation-delay: -100ms;
}

.loader-line-wrap:nth-child(3) {
    animation-delay: -150ms;
}

.loader-line-wrap:nth-child(4) {
    animation-delay: -200ms;
}

.loader-line-wrap:nth-child(5) {
    animation-delay: -250ms;
}

.loader-line-wrap:nth-child(1) .loader-line {
    border-color: hsl(0, 80%, 60%);
    height: 90px;
    width: 90px;
    top: 7px;
}

.loader-line-wrap:nth-child(2) .loader-line {
    border-color: hsl(60, 80%, 60%);
    height: 76px;
    width: 76px;
    top: 14px;
}

.loader-line-wrap:nth-child(3) .loader-line {
    border-color: hsl(120, 80%, 60%);
    height: 62px;
    width: 62px;
    top: 21px;
}

.loader-line-wrap:nth-child(4) .loader-line {
    border-color: hsl(180, 80%, 60%);
    height: 48px;
    width: 48px;
    top: 28px;
}

.loader-line-wrap:nth-child(5) .loader-line {
    border-color: hsl(240, 80%, 60%);
    height: 34px;
    width: 34px;
    top: 35px;
}

@keyframes spin {

    0%,
    15% {
        transform: rotate(0);
    }

    100% {
        transform: rotate(360deg);
    }
}

</style>