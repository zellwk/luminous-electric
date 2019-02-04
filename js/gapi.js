var CLIENT_ID = '118471806134-gqo837o0v4v5g5uo5j00pkvbnkqhi3r9.apps.googleusercontent.com'
var API_KEY = 'AIzaSyA80zAWHQEdeZmKai4uoMKXUta3DtcaOMs'
var DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4']
var SCOPES = 'https://www.googleapis.com/auth/spreadsheets'

var authorizeButton = document.getElementById('authorize_button')
var signoutButton = document.getElementById('signout_button')

/**
 *  On load, called to load the auth2 library and API client library.
 */
export const handleClientLoad = () => {
  gapi.load('client:auth2', initClient)
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient () {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(function () {
    // Listen for sign-in state changes.
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus)

    // Handle the initial sign-in state.
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get())
    authorizeButton.onclick = handleAuthClick
    signoutButton.onclick = handleSignoutClick
  }, function (error) {
    appendPre(JSON.stringify(error, null, 2))
  })
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus (isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none'
    signoutButton.style.display = 'block'
    populateDatalist()
  } else {
    authorizeButton.style.display = 'block'
    signoutButton.style.display = 'none'
  }
}

function handleAuthClick (event) {
  gapi.auth2.getAuthInstance().signIn()
}

function handleSignoutClick (event) {
  gapi.auth2.getAuthInstance().signOut()
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre (message) {
  var pre = document.getElementById('content')
  var textContent = document.createTextNode(message + '\n')
  pre.appendChild(textContent)
}

function populateDatalist () {
  gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: '1qg4OqKdVkt1R2PUhJSzWxWYby_TSk04HlBVAF-t9NJU',
    range: 'A2:B'
  })
    .then(response => {
      const formatted = response.result.values.map(data => {
        return data
          .reduce((obj, curr, index) => {
            if (index === 0) obj.description = curr
            if (index === 1) obj.price = parseFloat(curr)
            return obj
          }, {})
      })
      const datalist = document.querySelector('datalist')
      datalist.innerHTML = formatted.map(item => {
        return `<option value="${item.description}" data-price=${item.price}></option>`
      })

      const event = new CustomEvent('data-ready', {
        detail: {
          data: formatted
        }
      })

      document.body.dispatchEvent(event)
    })
    .catch(err => {
      console.log(err)
    })
}
