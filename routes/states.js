import express from 'express'
import { promises } from 'fs'

const router = express.Router()

const { readFile, writeFile } = promises

router.get('/', (request, response) => {
  logger.info('GET /state')
  response.json({ message: 'states' })
})

router.post('/create', async (request, response) => {
  logger.info('POST /state/create - Started')

  const statesDATA = await readFile('./db/Estados.json', 'utf8')
  const statesJSON = JSON.parse(statesDATA)

  const citiesDATA = await readFile('./db/Cidades.json', 'utf8')
  const citiesJSON = JSON.parse(citiesDATA)

  const returnedWrite = await statesJSON.map(async (state) => {
    const citiesByState = citiesJSON.filter((city) => state.ID === city.Estado)
    try {
      await writeFile(`./db/estados/${state.Sigla}.json`, JSON.stringify(citiesByState))
      return { state: state.Sigla, createdFile: true }
    } catch (err) {
      return { state: state.Sigla, createdFile: false }
    }

    logger.info(`POST /state/create - created ${state.Sigla}.json`)
  })
  const stateFiles = await Promise.all(returnedWrite)

  logger.info('POST /state/create - End')
  response.json(stateFiles)
})

router.post('/:state/count', async (request, response) => {
  const state = request.params.state.toUpperCase()
  logger.info(`POST /state/${state}/count - Started`)

  const statesDATA = await readFile(`./db/estados/${state}.json`, 'utf8')
  const statesJSON = await JSON.parse(statesDATA)

  logger.info(`POST /state/${state}/count - End`)
  response.json({ state, total: statesJSON.length })
})

router.post('/top5', async (request, response) => {
  const order = request.body.order
  const statesDATA = await readFile('./db/Estados.json', 'utf8')
  const statesJSON = JSON.parse(statesDATA)

  const totalCitiesByStatePromisse = await statesJSON.map(async (state) => {
    const statesCitiesDATA = await readFile(`./db/estados/${state.Sigla}.json`, 'utf8')
    const statesCitiesJSON = await JSON.parse(statesCitiesDATA)

    return { state: state.Sigla, total: statesCitiesJSON.length }
  })
  const totalCitiesByState = await Promise.all(totalCitiesByStatePromisse)

  const top5max = totalCitiesByState.sort((a, b) => order === 'desc'
    ? b.total - a.total
    : a.total - b.total).splice(0, 5)

  response.json(top5max)
})

router.post('/length-name-city-by-state', async (request, response) => {
  const order = request.body.order

  const statesDATA = await readFile('./db/Estados.json', 'utf8')
  const statesJSON = JSON.parse(statesDATA)

  const maxNameCityByStatePromisse = await statesJSON.map(async (state) => {
    const statesCitiesDATA = await readFile(`./db/estados/${state.Sigla}.json`, 'utf8')
    const statesCitiesJSON = await JSON.parse(statesCitiesDATA)

    return { sigla: state.Sigla, cities: statesCitiesJSON }
  })

  const maxNameCityByState = await Promise.all(maxNameCityByStatePromisse)

  const topNamesCityByState = maxNameCityByState.map(state => {
    const cityOrdered = order === 'desc'
      ? state.cities.sort((a, b) => b.Nome.length - a.Nome.length || a.Nome.localeCompare(b.Nome))[0]
      : state.cities.sort((a, b) => a.Nome.length - b.Nome.length || a.Nome.localeCompare(b.Nome))[0]

    return {
      sigla: state.sigla,
      nameCity: cityOrdered.Nome
    }
  })

  const topName = order === 'desc'
    ? topNamesCityByState.sort((a, b) => b.nameCity.length - a.nameCity.length || a.nameCity.localeCompare(b.nameCity))[0]
    : topNamesCityByState.sort((a, b) => a.nameCity.length - b.nameCity.length || a.nameCity.localeCompare(b.nameCity))[0]

  response.json({ topName: topName.nameCity, list: topNamesCityByState })
})

export default router
