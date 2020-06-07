import express from 'express'
import winston from 'winston'
import cors from 'cors'
import stateRouter from '../routes/states.js'

const app = express()

const { combine, timestamp, label, printf } = winston.format

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`
})

global.logger = winston.createLogger({
  level: 'silly',
  transports: [
    new (winston.transports.Console)(),
    new (winston.transports.File)({ filename: 'states-api.log' })
  ],
  format: combine(
    label({ label: 'states-api' }),
    timestamp(),
    myFormat
  )
})

app.use(express.json())

app.use(cors())

app.use('/state', stateRouter)

app.listen(3000, async () => {
  console.log('Running app')
})
