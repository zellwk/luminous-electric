const FIRST_PAGE_ROWS = 24
const SUBSEQUENT_PAGE_ROWS = 24

const makeRow = index => {
  const tr = document.createElement('tr')
  tr.innerHTML = `
    <td data-item></td>
    <td><input type="text" data-quantity/></td>
    <td><input list="items" data-description/></td>
    <td><input type="text"  data-price/></td>
    <td data-subtotal></td>
  `

  return tr
}

const addRows = evt => {
  const tbody = document.querySelector('tbody')
  const index = tbody.children.length
  const rowsToCreate = index >= FIRST_PAGE_ROWS ? SUBSEQUENT_PAGE_ROWS : FIRST_PAGE_ROWS
  console.log(index > FIRST_PAGE_ROWS)
  const frag = document.createDocumentFragment()

  new Array(rowsToCreate).fill(0)
    .forEach((item, arrayIndex) => {
      const tr = makeRow(arrayIndex + index)
      frag.appendChild(tr)
    })

  tbody.appendChild(frag)
}

export const createTable = _ => {
  const table = document.querySelector('table')
  const tbody = table.querySelector('tbody')
  const frag = document.createDocumentFragment()

  new Array(FIRST_PAGE_ROWS).fill(0)
    .forEach((item, index) => {
      const tr = makeRow(index)
      frag.appendChild(tr)
    })
  tbody.appendChild(frag)

  const buttons = [...document.querySelectorAll('.jsAddrow')]
  buttons.forEach(button => button.addEventListener('click', addRows))
}

// Table creation:
//   1. Create multiple <table> elements to format for print
//   2. First table element will have header (on screen)
//   3. All table elements will have header (on print)
//   4. Index should proceed smoothly from first table to next
//   5. Insert new table before .tfoot
// First table has 25 items
// Subsequent tables has 37 items
export const formatTablesForPrint = _ => {
  const table = document.querySelector('.table')
  const rows = [...table.querySelector('tbody').children]
  const tfoot = document.querySelector('.tfoot')
  const header = document.querySelector('.header')
  const count = rows.length

  // First page contains FIRST_PAGE_ROWS rows.
  if (count <= FIRST_PAGE_ROWS) return

  const firstPage = rows.slice(0, FIRST_PAGE_ROWS)
  const subsequentPages = chunk(rows.slice(FIRST_PAGE_ROWS), SUBSEQUENT_PAGE_ROWS)
  const pages = [firstPage, ...subsequentPages]

  // Remove original table.
  // Replace with formatted tables
  header.parentElement.removeChild(header)
  table.parentElement.removeChild(table)

  pages.forEach((page, index) => {
    const t = document.createElement('table')
    const head = document.createElement('thead')
    const body = document.createElement('tbody')
    const bodyFrag = document.createDocumentFragment()

    t.classList.add('table')

    head.innerHTML = ` <th>Item</th>
      <th>Quantity</th>
      <th>Description</th>
      <th>Price</th>
      <th>Amount</th>
    `

    for (const row of page) {
      bodyFrag.appendChild(row)
    }

    body.appendChild(bodyFrag)

    const frag = document.createDocumentFragment()
    const headClone = header.cloneNode(true)

    t.appendChild(head)
    t.appendChild(body)
    frag.appendChild(headClone)
    frag.appendChild(t)
    tfoot.parentElement.insertBefore(frag, tfoot)
  })
}

function chunk (array, size) {
  const temp = []
  for (let index = 0; index < array.length; index += size) {
    const chunk = array.slice(index, index + size)
    temp.push(chunk)
  }

  return temp
}
