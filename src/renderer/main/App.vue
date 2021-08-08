<template>
  <div id="app">
    <div class="sidebar">
        <div class="sidebar-wrapper">
            <div class="app-name">
                <p class="simple-text">Markup</p>
            </div>
            <ul class="nav">
                <li class="file-set" @click="changeItem('file')">
                    <router-link class="router" :class="{checked:picked == 'file'}"  to="/file">
                        <unicon name="folder" class="unicon" :fill="picked == 'file'?'white':''"></unicon>
                        <p class="text">文件</p>
                    </router-link>
                </li>
                <li class="file-set" @click="changeItem('tag')">
                    <router-link class="router" :class="{checked:picked == 'tag'}"  to="/tag">
                        <unicon name="tag-alt" class="unicon" :fill="picked == 'tag'?'white':''"></unicon>
                        <p class="text">标签</p>
                    </router-link>
                </li>
                <li class="file-set" @click="changeItem('bin')">
                    <router-link class="router" :class="{checked:picked == 'bin'}"  to="/bin">
                        <unicon name="trash" class="unicon" :fill="picked == 'bin'?'white':''"></unicon>
                        <p class="text">垃圾</p>
                    </router-link>
                </li>
                <li class="file-set" @click="changeItem('setting')">
                    <router-link class="router" :class="{checked:picked == 'setting'}" to="/setting">
                        <unicon name="setting" class="unicon" :fill="picked == 'setting'?'white':''"></unicon>
                        <p class="text">设置</p>
                    </router-link>
                </li>
                <li class="app-set">
                    <div class="account-wrapper">
                        <a class="router" @click="login()">
                            <img alt="avatar" src="./assets/img/default-avatar.png" class="avatar">
                            <span class="text account-text">{{username}}</span>
                        </a>
                    </div>
                    <div>
                        <button class="btn-window-set" style="background-color: rgb(250, 98, 92);" @click="closeWin">
                            <unicon name="multiply" class="unicon" ></unicon>
                        </button>
                        <button class="btn-window-set" style="background-color: rgb(251, 180, 58);" @click="minimizeWin">
                            <unicon name="minus" class="unicon"></unicon>
                        </button>
                        <button class="btn-window-set" style="background-color: rgb(62, 197, 68);" @click="maximizeWin">
                            <unicon name="plus" class="unicon" ></unicon>
                        </button>
                    </div>
                </li>
            </ul>
            <div class="app-set" style="bottom: 10px;">
            </div>
        </div>
    </div>
    <div class="main-panel">
        <router-view v-if="applogined" />
        <div v-else>
            <div class="hint">
                <img src="./assets/img/login.svg" class="hint-img" />
                <h1>Please Login</h1>
            </div>
        </div>
    </div>
  </div>
</template>

<script>
import { remote } from 'electron'
import Store from 'electron-store'
const BrowserWindow = require('electron').remote.BrowserWindow

var Evernote = require('evernote')
const store = new Store()
export default {
  name: 'markup',
  props: {
    msg: String
  },
  data () {
    return {
      picked: 'file',
      username: '账户',
      applogined: false,
      interval: ''
    }
  },
  mounted () {
    this.interval = setInterval(this.checkLogin, 3000)
  },
  methods: {
    checkLogin () {
      if (store.get('accessToken') === undefined) {
        console.log('checkLogin: AccessToken Not Exists:')
        this.applogined = false
        this.login()
      } else {
        console.log('checkLogin: AccessToken Exists:')
        this.getUser(store.get('accessToken'))
      }
      // this.updataLoginState(this)
    },
    login () {
      console.log(this.interval)
      if (this.interval !== undefined) {
        clearInterval(this.interval)
        console.log(this.interval)
      }
      var client = new Evernote.Client({
        consumerKey: '',
        consumerSecret: '',
        sandbox: true,
        china: false
      })
      let _this = this
      client.getRequestToken('http://127.0.0.1:5000', function (error, oauthToken, oauthTokenSecret, res) {
        if (error) {
          console.log('getRequestToken:', error)
        } else {
          let authURL = client.getAuthorizeUrl(oauthToken)
          console.log('authURL:', authURL)
          let authen = new BrowserWindow({
            width: 800,
            height: 600,
            frame: true,
            modal: true,
            parent: remote.getCurrentWindow(),
            webPreferences: {
              webSecurity: false,
              worldSafeExecuteJavaScript: true,
              contextIsolation: true
            //   nodeIntegration: true,
            //   contextIsolation: false,
            //   enableRemoteModule: true
            }
          })
          let res = authen.loadURL(authURL)
          authen.on('page-title-updated', (sys, msg) => {
            if (msg.indexOf('"code": 0') !== -1) {
              res = JSON.parse(msg)
              authen.close()
              _this.getAccToken(client, oauthToken, oauthTokenSecret, res.oauth_verifier, _this)
            } else if ((msg.indexOf('"code": 1') !== -1) ||
                            (msg.indexOf('"code": 2') !== -1) ||
                            (msg.indexOf('"code": 3') !== -1)) {
              if (_this.$Store.get('accessToken') !== undefined) {
                _this.$Store.delete('accessToken')
                _this.username = '账户'
              }
              client = null
              _this.applogined = false
              // _this.updataLoginState(_this)
              authen.close()
            } else {
              console.log('authen window title:', msg)
            }
          })
          authen.on('closed', () => {
            _this.interval = setInterval(_this.checkLogin, 3000)
          })
        }
      })
    },
    // updataLoginState(hander) {
    //     hander.$router.push({
    //       name: 'File',
    //       params: {
    //         applogined: hander.applogined
    //       }
    //     })
    // },
    getAccToken (client, oauthToken, oauthTokenSecret, oauthVerifier, handler) {
      client.getAccessToken(oauthToken, oauthTokenSecret, oauthVerifier,
        function (error, accessToken) {
          if (error) {
            console.log('getAccessToken:', error)
          } else {
            handler.$Store.set('accessToken', accessToken)
            handler.getUser(accessToken)
          }
        })
    },
    getUser (accessToken) {
      const _this = this
      var client = new Evernote.Client({
        token: accessToken,
        sandbox: true,
        china: false
      })
      var userStore = client.getUserStore()
      userStore.getUser().then(function (user) {
        if (user !== undefined) {
          _this.username = user.username
          console.log(user)
          _this.applogined = true
          console.log('getUser: user logined')
          // _this.updataLoginState(_this)
          if (_this.interval !== undefined) {
            clearInterval(_this.interval)
          }
          store.set('user', user)
        }
      })
    },
    changeItem (item) {
      console.log('changeItem：', item)
      this.picked = item
    },
    minimizeWin () {
      remote.getCurrentWindow().minimize()
    },
    maximizeWin () {
      const win = remote.getCurrentWindow()
      if (win.isMaximized()) {
        win.restore()
      } else {
        win.maximize()
      }
    },
    closeWin () {
      remote.getCurrentWindow().close()
    }
  },
  beforeUnmount () {
    if (this.interval !== undefined) {
      clearInterval(this.interval)
    }
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
    -moz-user-select: none; 
    -webkit-user-select: none; 
    -ms-user-select: none; 
    -khtml-user-select: none; 
    user-select: none;
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

.main-panel {
    background: rgba(247, 247, 248, 0.8);
    position: relative;
    z-index: 2;
    float: right;
    width: calc(100% - 300px);
    min-height: 100%;
    max-width: 100%;
}

.sidebar .main-panel {
    max-height: 100%;
    height: 100%;
}

.sidebar {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    display: block;
    z-index: 1;
    /*color: #fff;*/
    font-weight: 200;
    background-size: cover;
    background-position: center center;
    -webkit-app-region: drag;
}


.sidebar .sidebar-wrapper {
    position: relative;
    max-height: none;
    min-height: 100%;
    overflow: hidden;
    width: 300px;
    z-index: 4;
}

.app-name {
    padding: 10px 15px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.sidebar .nav {
    margin-top: 50px;
}

.nav {
    padding-left: 0;
    margin-bottom: 0;
    list-style: none;
}

ul {
    display: block;
    list-style-type: disc;
    margin-block-start: 1em;
    margin-block-end: 1em;
    margin-inline-start: 0px;
    margin-inline-end: 0px;
    padding-inline-start: 40px;
}

li {
    text-align: -webkit-match-parent;
}

.simple-text {
    font-family: futura;
    padding: 0px;
    display: block;
    font-size: 40px;
    color: #000000;
    text-align: center;
    font-weight: 400;
    line-height: 30px;
}

.nav>.file-set {
    position: relative;
    display: block;
}


.sidebar .nav li .active>a {
    color: #FFFFFF;
    opacity: 1;
    background: rgba(255, 255, 255, 0.23);
}

.nav>li>a {
    width: 70%;
    border-radius: 50px;
    position: relative;
    display: block;
    vertical-align: middle;
}


a {
    text-decoration: none;
    font-weight: 400;
    cursor: pointer;
    text-align: center;
    -webkit-font-smoothing: antialiased;
    -webkit-app-region: no-drag;
}

.router {
    box-sizing: content-box;
    margin: 20px 10%;
    padding: 12px 15px;
    border: none;
    font-size: 1.5em;
    font-family: pingfang;
    color: black;
}

.router:hover {
    transform: scale(1.05);
    transition: all 0.3s ease-in-out;
}

.checked {
    transform: scale(1.05);
    color: white;
    background-color: rgba(38, 130, 230, 1);
    box-shadow: 0 8px 16px 0 rgba(50, 150, 255, 0.5), 0 6px 20px 0 rgba(50, 150, 255, 0.19);
    transition: all 0.3s ease-in-out;
}

.router>.unicon {
    margin-left: 20px;
    margin-right: 20px;
    margin-top: 10px;
    display: inline;
}

.sidebar .nav p {
    display: inline;
    margin: 0;
    line-height: 30px;
    padding-right: 30px;
}

.app-set {
    position: absolute;
    width: 100%;
    bottom: 20px;
}

.btn-window-set {
    width: 23px;
    height: 23px;
    border: none;
    border-radius: 100%;
    margin: 15px;
    padding: 0;
    text-align: center;
    -webkit-app-region: no-drag;
}

.account-wrapper {
    /*min-height: 70px;*/
    text-align: left;
}

.account-wrapper a {
    display: block;
}

.avatar {
    width: 60px;
    height: 60px;
    vertical-align: middle;
    margin-right: 10px;
}

.account-text {
    width: 50px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-radius: 50px;
}

.account_checked {
    transform: scale(1.05);
    color: white;
    background-color: rgba(38, 130, 230, 1);
    box-shadow: 0 8px 16px 0 rgba(50, 150, 255, 0.5), 0 6px 20px 0 rgba(50, 150, 255, 0.19);
    transition: all 0.3s ease-in-out;
}

.hint {
    color: rgba(38, 130, 230, 1);
    margin: 20% 0;
}

.hint-img {
    width: 30%; 
    height: 30%;
    max-height:600px;
    max-width:600px;
}
</style>
