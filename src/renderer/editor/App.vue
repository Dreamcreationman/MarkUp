<template>
    <div id="app">
        <div class="header">
            <div class="btn-container">
                <button class="btn-window-set" style="background-color: rgb(250, 98, 92);" @click="closeWins">
                    <unicon name="multiply" class="unicons"></unicon>
                </button>
                <button class="btn-window-set" style="background-color: rgb(251, 180, 58);" @click="minimizeWins">
                    <unicon name="minus" class="unicons"></unicon>
                </button>
                <button class="btn-window-set" style="background-color: rgb(62, 197, 68);" @click="maximizeWins">
                    <unicon name="plus" class="unicons"></unicon>
                </button>
            </div>
            <div class="title" id="title" >{{note.title}}</div>
        </div>
        <div class="main">
            <div class="editor">
                <textarea class="editor-box" id="editor" @scroll="handleScroll($event, 1)" v-model="contents" v-on:keyup="contentInfoShow()"></textarea>
            </div>
            <div class="display" id="display" @scroll="handleScroll($event, 2)" v-html='result'></div>
        </div>
    </div>
</template>
<script>
import { remote, ipcRenderer, shell } from 'electron'
import markdownItAnchorToc from 'markdown-it-toc-and-anchor'
import mermaid from 'mermaid-it'
import './assets/css/default.css'
import './assets/css/display.css'
import 'highlight.js/styles/vs2015.css'

var Evernote = require('evernote')
var hljs = require('highlight.js')
const { dialog } = require('electron').remote

// enable everything
var mdResolver = require('markdown-it')({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
  langPrefix: 'language-',
  /* eslint-disable */
  highlight: function (str, lang) {
    
    // 此处判断是否有添加代码语言
    if (lang && hljs.getLanguage(lang)) {
    
      try {
    
        // 得到经过highlight.js之后的html代码
        const preCode = hljs.highlight(lang, str, true).value
        // 以换行进行分割
        const lines = preCode.split(/\n/).slice(0, -1)
        // 添加自定义行号
        let html = lines.map((item, index) => {
    
          return '<li><span class="line-num" data-line="' + (index + 1) + '"></span>' + item + '</li>'
        }).join('')
        html = '<ol>' + html + '</ol>'
        // 添加代码语言
        if (lines.length) {
    
          html += '<b class="name">' + lang + '</b>'
        }
        return '<pre class="hljs"><code>' +
          html +
          '</code></pre>'
      } catch (__) {
    }
    }
    // 未添加代码语言，此处与上面同理
    const preCode = mdResolver.utils.escapeHtml(str)
    const lines = preCode.split(/\n/).slice(0, -1)
    let html = lines.map((item, index) => {
    
      return '<li><span class="line-num" data-line="' + (index + 1) + '"></span>' + item + '</li>'
    }).join('')
    html = '<ol>' + html + '</ol>'
    return '<pre class="hljs"><code>' +
      html +
      '</code></pre>'
  }
})
mdResolver.use(require('markdown-it-deflist'))
    .use(require('markdown-it-abbr'))
    .use(require('markdown-it-sub'))
    .use(require('markdown-it-sup'))
    .use(require('markdown-it-task-lists'))
    .use(require('markdown-it-emoji'))
    .use(markdownItAnchorToc)
    .use(mermaid)
    .use(require('markdown-it-footnote'))
    .use(require('markdown-it-plantuml'))
    .use(require('markdown-it-latex2img'))

export default {
    name: 'editor',
    data() {
        return {
            noteGuid: '',
            contents: '',
            result: '',
            noteStore: '',
            accessToken: '',
            note: {title: "加载中"},
            scorllItem: 0,
            scrollTimer: ''
        }
    },
    watch: {
      result: function () {
          this.$nextTick(function(){
                console.log('v-for渲染已经完成')
                const links = document.querySelectorAll('a[href]')
                links.forEach(link => {
                    link.addEventListener('click', e => {
                        const url = link.getAttribute('href')
                        e.preventDefault()
                        shell.openExternal(url)
                    })
                })
            })
          
        }
    },
    components: {
    },
    mounted () {
        ipcRenderer.on('editorNote', (event, argOne, argTwo) => {
            this.noteGuid = argOne
            this.accessToken = argTwo
            var authenticatedClient = new Evernote.Client({
                token: this.accessToken,
                sandbox: true,
                china: false
            })
            let _this = this
            if (this.noteStore === '') { this.noteStore = authenticatedClient.getNoteStore() }
            this.noteStore.getNote(this.noteGuid, true, true, true, true).then(function(note) {
                _this.note = note
                console.log("openNote:", note)
                _this.contents = _this.processContent(_this.note.content)

                console.log("processContent:")
                _this.result = mdResolver.render(_this.contents)
                console.log("mdResolver renderContent:")
            }).catch(err => {
                console.log('openNote Error: ', err)
            })
        })
        this.interval = setInterval(this.save, 30000)
    },
    methods: {
        contentInfoShow() {
            this.result = mdResolver.render(this.contents)

            if (!this.note.title.endsWith("*")) {
                this.note.title += '*'
              document.getElementById('title').innerHTML = this.note.title
            }
            this.contentInfoComposite()
        },
        contentInfoComposite() {
            let nBody = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>'
            nBody += '<!DOCTYPE en-note SYSTEM \"http://xml.evernote.com/pub/enml2.dtd\">'
            nBody += '<en-note>' + this.contents.replace(/</g, "[left-arrow]") + '</en-note>'
            this.note.content = nBody
            console.log("processed content is ", this.note.content)
        },
        processContent(text) {
            /* eslint-disable */
            // var endNoteReg = /([^\\\\x00-\\\\xff]*.*?)<\/en-note>/
            // var m = endNoteReg.exec(text);
            let m = text.split("<en-note>")[1].replace("<\/en-note>", "").replace(/\[left-arrow\]/g, "<")
            console.log("m is", m)
            return m
        },
        save(closeWindow) {
            console.log("save param:", closeWindow)
            if (!document.getElementById('title').innerHTML.endsWith("*") ) {
                console.log("no need save")
                if (closeWindow) {
                    ipcRenderer.send('closeEditorWindow')
                  }
                return
            }
            var authenticatedClient = new Evernote.Client({
                token: this.accessToken,
                sandbox: true,
                china: false
            })
            if (this.noteStore === '') { this.noteStore = authenticatedClient.getNoteStore() }
            console.log("note", this.note)
            if (this.note.title.endsWith("*")) {
                console.log("end with *")
                this.note.title = this.note.title.replace("*", "")
                document.getElementById('title').innerHTML = this.note.title
            }
            let _this = this
            this.contentInfoComposite()
            console.log("save content", this.note)
            this.noteStore.updateNote(this.note).then(function(res) {
                console.log("saved:", res)
                document.getElementById('title').innerHTML = _this.note.title
                if (closeWindow) {
                    console.log("save and closeEditorWindow")
                    ipcRenderer.send('closeEditorWindow')
                }
            }).catch(err => {
                console.log("error update :", _this.note.title)
                if (!_this.note.title.endsWith("*")){
                    _this.note.title += '*'
                    document.getElementById('title').innerHTML = _this.note.title
                    console.log("error update :", _this.note.title)
                }
                    
                console.log('updateNote Error: ', err)
                if (closeWindow) {
                    console.log("save and closeEditorWindow Failed")
                    dialog.showErrorBox('保存失败', JSON.stringify(err))
                }
            })

        },
        minimizeWins() {
            console.log('minimizeWin')
            remote.getCurrentWindow().minimize()
        },
        maximizeWins() {
            console.log('maximizeWin')
            const win = remote.getCurrentWindow()
            if (win.isMaximized()) {
                win.restore()
            } else {
                win.maximize()
            }
        },
        closeWins() {
            console.log('closeWin')
            this.save(true)
        },
        handleScroll (e, block) { 
            console.log(e, block)
            let { scrollHeight, scrollTop, clientHeight  } = event.target
            let scale = scrollTop / (scrollHeight - clientHeight) 
            let editor = document.getElementById('editor')
            let display = document.getElementById('display')
            if(block === 1) {
                if(this.scorllItem === 0) this.scorllItem = 1;  // 记录主动触发滚动的区域
                if(this.scorllItem === 2) return;    // 当前是「展示区」主动触发的滚动，因此不需要再驱动展示区去滚动

                this.driveScroll(scale, display)  // 驱动「展示区」的滚动
            } else if(block === 2) {  
                if(this.scorllItem === 0) this.scorllItem = 2;
                if(this.scorllItem === 1) return;    // 当前是「编辑区」主动触发的滚动，因此不需要再驱动编辑区去滚动

                this.driveScroll(scale, editor)
            }
        },
        driveScroll (scale, element) { 
            console.log(scale, element)
            let scrollHeight  = element.scrollHeight
            let clientHeight   = element.clientHeight 
            element.scrollTop = (scrollHeight - clientHeight)  * scale

            let _this = this
            if(this.scrollTimer) clearTimeout(this.scrollTimer);
            this.scrollTimer = setTimeout(() => {
                _this.scorllItem = 0    // 在滚动结束后，将scrolling设为0，表示滚动结束
                clearTimeout(_this.scrollTimer)
            }, 200)
        },
    }
}
</script>
<style>
@font-face {
    font-family: futura;
    src: url('./assets/font/Futura.ttf')
}

@font-face {
    font-family: pingfang;
    src: url('./assets/font/pingfangsc.otf')
}

html,
body {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    font-family: pingfang;
}

html {
    -webkit-text-size-adjust: 100%;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}

* {
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
}

#app {
    width: 100%;
    height: 100%;
    font-family: pingfang, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    max-width: 100%;
}

.header {
    height: 30px;
    width: 100%;
    background-image: linear-gradient(#f1f1f1, #bbbbbb);
    -webkit-app-region: drag;
    position: fixed;
    text-align: center;
}

.btn-container {
    margin-left: 20px;
    position: absolute;
    text-align: center;
    line-height: 30px;
}

.btn-window-set {
    width: 20px;
    height: 20px;
    line-height: 20px;
    border: none;
    margin: 0 7px;
    padding: 0;
    border-radius: 100%;
    vertical-align: middle;
    -webkit-app-region: no-drag;
}

.unicons {
    display: inline-block;
    height: 100%;
    vertical-align: middle;
}

.title {
    line-height: 30px;
}

.main {
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.editor {
    margin-top: 30px;
    width: 50%;
    height: 100%;
    background-color: #36312c;
    float: left;
    display: inline
}

.editor-box {
    width: 100%;
    height: 100%;
    background-color: transparent;
    border: none;
    padding: 50px;
    font-family: sans-serif;
    font-size: 1.5rem;
    color: white;
    resize: none;
    outline: none;
    line-height: 1.35
}

.display {
    margin-top: 30px;
    width: 50%;
    height: 100%;
    background-color: white;
    overflow-y: scroll;
    float: left;
    display: inline;
    padding: 50px;
    text-align: left;
    word-wrap: break-word;
}
</style>