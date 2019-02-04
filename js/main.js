/* globals dateFns localStorage */
import { formatTablesForPrint } from './table.js'
import { handleClientLoad } from './gapi.js'

// Populate Date
const dateField = document.querySelector('.jsDate')
dateField.textContent = dateFns.format(new Date(), 'D/M/YYYY')

handleClientLoad()

document.body.addEventListener('data-ready', e => {
  console.log('ready')
  // console.log(e.detail.data)
})

// Creating Invoice data state
const ROWS_IN_ONE_PAGE = 24

let invoiceItems = Array.from({ length: ROWS_IN_ONE_PAGE }, i => ({}))
const datalist = document.querySelector('datalist')

const renderInvoice = _ => {
  tbody.innerHTML = invoiceItems
    .map(row => {
      const {
        num, quantity, description, price, amount
      } = formatDataForRender(row)
      return `<tr>
        <td data-item contenteditable>${num}</td>
        <td><input type="text" value="${quantity}" data-quantity /></td>
        <td><input list="items" value="${description}" data-description /></td>
        <td><input type="text" value="${price}" data-price /></td>
        <td data-subtotal>${amount}</td>
      </tr>`
    })
    .join('')
}

const updateInvoiceDOM = field => {
  const row = field.closest('tr')
  const index = [...row.parentElement.children].findIndex(tr => tr === row)
  const data = invoiceItems[index]

  const tds = [...row.children]

  tds.forEach((td, index) => {
    if (td === field || td.children[0] === field) return

    if (index === 0) td.textContent = data.num
    if (index === 1) td.children[0].value = data.quantity
    if (index === 2) td.children[0].value = data.description
    if (index === 3) td.children[0].value = data.price
    if (index === 4) td.textContent = data.amount
  })
}

const formatDataForRender = item => {
  const num = item.num || ''
  const quantity = parseFloat(item.quantity) || ''
  const description = item.description || ''
  const price = parseFloat(item.price) || ''
  let amount = (quantity * price).toFixed(0) || ''

  // Further adjustments to amount
  if (!description) amount = ''
  if (amount === '0') amount = ''

  return {
    num,
    quantity,
    description,
    price,
    amount
  }
}

const updateInvoiceItems = field => {
  const row = field.closest('tr')
  const index = [...tbody.children].findIndex(tr => row === tr)
  const item = invoiceItems[index]
  const type = getFieldType(field)

  item[type] = getFieldValue(field, type)

  // Description Field assigns a price, but only if price not custom-written already...
  if (type === 'description' && typeof item.price === 'undefined') {
    const match = [...datalist.children].find(opt => opt.value === item.description)
    if (match) {
      item.price = match.dataset.price
      item.quantity = 1
    }
  }

  invoiceItems[index] = formatDataForRender(item)
}

const getFieldType = field => {
  if (field.hasAttribute('data-item')) return 'num'
  if (field.hasAttribute('data-quantity')) return 'quantity'
  if (field.hasAttribute('data-description')) return 'description'
  if (field.hasAttribute('data-price')) return 'price'
}

const getFieldValue = (field, type) => {
  let ret = ''
  if (type === 'num') ret = field.textContent

  if (
    type === 'quantity' ||
    type === 'description' ||
    type === 'price'
  ) {
    ret = field.value
  }
  return ret.trim()
}

const updateTotals = _ => {
  const totalTd = document.querySelector('.jsTotal')
  const depositTd = document.querySelector('.jsDeposit')
  const balanceTd = document.querySelector('.jsBalance')

  const totalAmount = invoiceItems.reduce((sum, curr) => {
    if (typeof curr.amount === 'undefined' || curr.amount === '') curr.amount = 0
    return sum + parseFloat(curr.amount)
  }, 0) || 0

  const depositAmount = parseFloat(depositTd.textContent) || 0
  const balanceAmount = totalAmount - depositAmount || 0

  totalTd.textContent = totalAmount.toFixed(0)
  depositTd.textContent = depositAmount.toFixed(0)
  balanceTd.textContent = balanceAmount.toFixed(0)
}

// Execution
const table = document.querySelector('table')
const tbody = table.querySelector('tbody')
renderInvoice()

tbody.addEventListener('input', evt => {
  console.log('inputting')
  updateInvoiceItems(evt.target)
  updateInvoiceDOM(evt.target)
  updateTotals()
})

const depositTd = document.querySelector('.jsDeposit')
depositTd.addEventListener('input', evt => updateTotals())

// Add rows
const addRowButton = document.querySelector('.jsAddrow')
addRowButton.addEventListener('click', evt => {
  let newItems = Array.from({ length: ROWS_IN_ONE_PAGE }, i => ({}))
  invoiceItems = invoiceItems.concat(newItems)
  renderInvoice()
})

// Save and load
const loadButton = document.querySelector('.jsLoad')
const saveButton = document.querySelector('.jsSave')
const savedData = localStorage.getItem('invoiceItems')

if (!savedData) loadButton.style.display = 'none'

saveButton.addEventListener('click', evt => {
  localStorage.setItem('invoiceItems', JSON.stringify(invoiceItems))
  loadButton.style.display = 'inline-block'
})

loadButton.addEventListener('click', evt => {
  invoiceItems = JSON.parse(localStorage.getItem('invoiceItems'))
  renderInvoice()
})

// Print
const printButton = document.querySelector('.jsPrint')
printButton.addEventListener('click', async evt => {
  await formatTablesForPrint()
})
