/* globals dateFns */
import { createTable, formatTablesForPrint } from './table.js'

// Execution
// const dateField = document.querySelector('.jsDate')
// dateField.textContent = dateFns.format(new Date(), 'D/M/YYYY')
createTable()

// Add waiting for Google somewhere.
// Remove it when done to let user know can use.
handleClientLoad()

var CLIENT_ID = '118471806134-gqo837o0v4v5g5uo5j00pkvbnkqhi3r9.apps.googleusercontent.com'
var API_KEY = 'AIzaSyA80zAWHQEdeZmKai4uoMKXUta3DtcaOMs'
var DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4']
var SCOPES = 'https://www.googleapis.com/auth/spreadsheets'

var authorizeButton = document.getElementById('authorize_button')
var signoutButton = document.getElementById('signout_button')

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad () {
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
          // .map(cell => cell.toLowerCase())
          .reduce((obj, curr, index) => {
            if (index === 0) obj.description = curr
            if (index === 1) obj.price = parseFloat(curr)
            return obj
          }, {})
      })
      const datalist = document.querySelector('datalist')
      datalist.innerHTML = formatted.map(item => {
        return `<option value="${item.description}"></option>`
      })
      initInvoice(formatted)
    })
    .catch(err => {
      console.log(err)
    })
}

// Actual Invoice usage
const isQuantityField = field => field.hasAttribute('data-quantity')
const isDescriptionField = field => field.hasAttribute('data-description')
const isPriceField = field => field.hasAttribute('data-price')
const calculateSubtotal = (quantity, price) => {
  const r = parseFloat(quantity) * parseFloat(price)
  return isNaN(r)
    ? ''
    : r
}

const getQuantityField = field => field.closest('tr').children[1].querySelector('input')
const getPriceField = field => field.closest('tr').children[3].querySelector('input')
const getSubtotalBox = field => field.closest('tr').children[4]

const updateQuantity = (field, quantity) => {
  getQuantityField(field).value = quantity
}

const updatePrice = (field, price) => {
  getPriceField(field).value = price
}

const updateSubtotal = (field, quantity, price) => {
  if (!quantity) quantity = getQuantityField(field).value
  if (!price) price = getPriceField(field).value

  const subtotal = calculateSubtotal(quantity, price)
  if (subtotal) {
    getSubtotalBox(field).textContent = subtotal.toFixed(0)
  }
}

const updateTotalAndBalance = _ => {
  const totalField = document.querySelector('.jsTotal')
  const depositField = document.querySelector('.jsDeposit')
  const balanceField = document.querySelector('.jsBalance')

  const sum = [...document.querySelectorAll('[data-subtotal]')]
    .map(el => el.textContent)
    .filter(v => v)
    .reduce((sum, current) => sum + parseFloat(current), 0)
    .toFixed(0)

  const deposit = depositField.textContent
    ? parseFloat(depositField.textContent)
    : 0

  totalField.textContent = sum
  depositField.textContent = deposit.toFixed(0)
  balanceField.textContent = (sum - deposit).toFixed(0)
}

/**
 * Initializes invoice for user input
 * @param {array} range Range of values from Google Spreadsheet. [description, price]
 */
function initInvoice (range) {
  const table = document.querySelector('table')
  const tbody = table.querySelector('tbody')

  tbody.addEventListener('input', evt => {
    const field = evt.target

    if (isQuantityField(field) || isPriceField(field)) {
      const quantity = getQuantityField(field).value
      const price = getPriceField(field).value
      updateSubtotal(field, quantity, price)
      updateTotalAndBalance()
      return false
    }

    // Populates content + price + quantity
    if (isDescriptionField(field)) {
      const value = field.value
      const match = range.find(item => item.description === value)

      if (match) {
        const quantity = getQuantityField(field).textContent || 1
        const price = match.price
        updateQuantity(field, quantity)
        updatePrice(field, price)
        updateSubtotal(field)
        updateTotalAndBalance()
      } else {
        updateSubtotal(field)
        updateTotalAndBalance()
      }
    }
  })
}

const depositBox = document.querySelector('.jsDeposit')
depositBox.addEventListener('input', evt => {
  updateTotalAndBalance()
})

// Cleanup items and rows before printing
const cleanupButton = document.querySelector('.jsCleanup')
cleanupButton.addEventListener('click', evt => {
  let rows = [...document.querySelector('tbody').children]

  // Cleanup empty rows
  rows.forEach(row => {
    const subtotalBox = row.querySelector('[data-subtotal]').textContent
    if (!subtotalBox) row.parentNode.removeChild(row)
  })

  // Get updated rows
  rows = [...document.querySelector('tbody').children]

  // Update item number
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index]
    row.children[0].textContent = index + 1
  }
})

const printButton = document.querySelector('.jsPrint')
printButton.addEventListener('click', async evt => {
  await formatTablesForPrint()
  window.print()
})
