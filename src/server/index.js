'use strict'

const express = require('express')
const path = require('path')

const app = express()

app.use(express.static(path.join(__dirname, '../public')))

const host = process.env.IP
const port = process.env.PORT

const server = app.listen(port, host, () => {
  console.log(`Magic happens on port:${port}`)
})
