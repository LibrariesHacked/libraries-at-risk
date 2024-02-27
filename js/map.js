const fetchHexJson = fetch(librariesAtRisk.hexJson).then(res => res.json())
const fetchServicesData = fetch(librariesAtRisk.services).then(res =>
  res.json()
)
const fetchAtRiskData = fetch(librariesAtRisk.atRiskRegister).then(res =>
  res.text()
)
const allData = Promise.all([fetchHexJson, fetchServicesData, fetchAtRiskData])
const hexMapElement = document.getElementById('div-library-hexmap')

let storedData = null

const buildHexMap = () => {
  hexMapElement.innerHTML = ''
  const hexdata = storedData[0]
  const serviceData = storedData[1]
  const csvText = storedData[2]
  const schema = uDSV.inferSchema(csvText) // authority, status, contributor, note
  const parser = uDSV.initParser(schema)
  const authorityArrays = parser.typedObjs(csvText) // [ {authority: "Bournemouth, Christchurch and Poole", status: "CILIP engaged", contributor: "CILIP", note: ""} ]

  Object.keys(hexdata.hexes).forEach(hexCode => {
    const service = serviceData.find(x => x.Code === hexCode)
    if (service) {
      let atRiskData = authorityArrays.find(
        x => x.authority === service['Name']
      )
      hexdata.hexes[hexCode].status = atRiskData ? atRiskData.status : ''

      // A few custom matches because of naming conventions
      switch (service['Name']) {
        case 'Bristol':
          atRiskData = authorityArrays.find(
            x => x.authority === 'Bristol, City of'
          )
          break
        case 'Herefordshire':
          atRiskData = authorityArrays.find(
            x => x.authority === 'Herefordshire, County of'
          )
          break
        case 'Southend-on-Sea':
          atRiskData = authorityArrays.find(
            x => x.authority === 'Southend-on-sea'
          )
          break
        case 'Kingston upon Hull':
          atRiskData = authorityArrays.find(
            x => x.authority === 'Kingston upon Hull, City of'
          )
          break
      }

      let colour = '#e5e5e5'
      let letter = '&nbsp;'
      if (atRiskData) {
        switch (atRiskData.status) {
          case 'CILIP engaged':
            colour = '#09bb9f'
            letter = 'C'
            break
          case 'Changes proposed':
            colour = '#fa8c00'
            letter = 'P'
            break
          case 'CILIPS engaged':
            colour = '#f6d500'
            letter = 'S'
            break
        }
      } else {
        console.log('No data for', service['Name'])
      }

      hexdata.hexes[hexCode].colour = colour
      hexdata.hexes[hexCode].letter = letter
      hexdata.hexes[hexCode].status = atRiskData && atRiskData.status
        ? atRiskData.status
        : 'No current information'
    }
  })

  new OI.hexmap(hexMapElement, {
    label: {
      show: true,
      clip: true,
      format: function (txt, attr) {
        const service = attr.hex.n
        const letter = attr.hex.letter

        var data_attrs = `data-service="${service}" data-status="${attr.hex.status}"`

        return `<tspan ${data_attrs} class="hexdata">${letter}</tspan>`
      }
    },
    hexjson: storedData[0]
  })

  tippy('#div-library-hexmap .hexmap-inner svg g', {
    trigger: 'click',
    content: reference => {
      var span = reference.querySelector('.hexdata')
      if (span && span.dataset) {
        return `<div class="popup"><span class="popup-title">${span.dataset.service}</span><br/>${span.dataset.status}</div>`
      }
      return null
    },
    allowHTML: true
  })

  document.getElementById('p-data-loading').style.display = 'none'
}

allData.then(res => {
  storedData = res
  buildHexMap()
})
