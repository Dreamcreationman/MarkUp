<template>
    <div class="content" v-if="inFolder">
        <div class="file-container">
            <div class="new">
                <div class="icon-view-folder">
                    <img src="./img/folderadd.png" class="icon-folder" />
                </div>
                <p>Create New</p>
            </div>
        </div>
        <div class="file-container" :key="folder" v-for="folder in folders">
            <div class="new" v-on:dblclick="openFolder($event)" :id="folder.guid">
                <div class="icon-view-folder">
                    <img src="./img/folder.png" class="icon-folder" />
                </div>
                <p>{{folder.name}}</p>
            </div>
        </div>
    </div>
    <div class="content" v-else>
        <div class="file-container">
            <div class="new">
                <div class="icon-view-new-note">
                    <img src="./img/markadd.png" class="icon-note" />
                </div>
                <p>Create New</p>
            </div>
        </div>
        <div class="file-container" :key="note" v-for="note in notelists">
            <div class="new" :id="note.guid">
                <div class="icon-view-note">
                    <img src="./img/markup.png" class="icon-note" />
                </div>
                <p>{{note.title}}</p>
            </div>
        </div>
    </div>
</template>
<script>
// @ is an alias to /src
// import TitleBar from '@/components/TitleBar.vue'
var Evernote = require('evernote')

export default {
  name: 'GraphView',
  data () {
    return {
      inFolder: true,
      notelists: [],
      client: ''
    }
  },
  props: {
    folders: Array

  },
  components: {

  },
  methods: {
    getFolders () {
      let accessToken = this.$Store.get('accessToken')
      let _this = this
      if (this.client === '') {
        var authenticatedClient = new Evernote.Client({
          token: accessToken,
          sandbox: true,
          china: false
        })
        this.client = authenticatedClient
      }
      var noteStore = authenticatedClient.getNoteStore()
      noteStore.listNotebooks().then(function (notebooks) {
        _this.folders = notebooks
        console.log(notebooks)
      })
    },
    openFolder (e) {
      let _this = this
      let guid = e.target.id
      let accessToken = this.$Store.get('accessToken')
      if (this.client === '') {
        var authenticatedClient = new Evernote.Client({
          token: accessToken,
          sandbox: true,
          china: false
        })
        this.client = authenticatedClient
      }
      var noteStore = authenticatedClient.getNoteStore()
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
      noteStore.findNotesMetadata(filter, 0, 999, spec).then(function (notesMetadataList) {
        _this.inFolder = false
        _this.notelists = notesMetadataList.notes
        console.log(notesMetadataList, _this.inFolder)
      }).catch(err => {
        console.log('findNotesMetadata: ', err)
      })
    }
  }
}
</script>
<style scoped>
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
    display: grid;
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
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    pointer-events: none;
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
</style>