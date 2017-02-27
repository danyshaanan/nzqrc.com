'use strict'

const {port, baseURL, agent, sessionSecret, githubClient, githubSecret} = require('./config.json')
const request = require('request-promise')

const stateParam = `state=${require('crypto').randomBytes(8).toString('hex')}`
const clientParam = `client_id=${githubClient}`
const ghOauth = 'https://github.com/login/oauth/'
const loginUrl = `${ghOauth}authorize?${stateParam}&${clientParam}&redirect_uri=${baseURL}/callback`
const callbackUrl = code => `${ghOauth}access_token?${stateParam}&${clientParam}&client_secret=${githubSecret}&code=${code}`
const apiUserUrl = token => `https://api.github.com/user?access_token=${token}`
const get = async (url, cb) => await request.get({url, json: true, headers: {'User-Agent': agent}})


const app = require('express')()

app.set('view engine', 'pug')
app.use(require('express-session')({ secret: sessionSecret, resave: false, saveUninitialized: false}))

app.get('/callback', async (req, res) => {
  const {access_token} = await get(callbackUrl(req.query.code))
  req.session.user = await get(apiUserUrl(access_token))
  res.redirect('/')
})

app.get('/logout', (req, res) => {
  delete req.session.user
  res.redirect('/')
})

app.get('/', (req, res) => {
  const user = req.session.user
  if (user) res.render('index', {url: user.avatar_url, pre: JSON.stringify(user, 0, 2)})
  else      res.render('login', {loginUrl})
})

app.listen(port, _ => { console.log(`${baseURL}`) })
