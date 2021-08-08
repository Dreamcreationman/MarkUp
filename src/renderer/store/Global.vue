<script>
import Store from 'electron-store'
var CONSUMER_KEY = 'tenyondy'
var CONSUMER_SECRET = '4a1d28a3ee352b06'
var OAUTH_VERIFIER = ''
var OAUTH_TOKEN = ''
var OAUTH_TOKEN_SECRET = ''

const store = new Store()
export default {
  CONSUMER_KEY,
  CONSUMER_SECRET,
  OAUTH_TOKEN,
  OAUTH_TOKEN_SECRET,
  OAUTH_VERIFIER,
  store
}
</script>