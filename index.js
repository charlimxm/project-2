require('dotenv').config({silent: true})

const url = process.env.NODE_ENV === 'production' ? process.env.MONGODB_URI : 'mongodb://localhost/fatPocketLH'
const port = process.env.PORT || 9000

// installing all modules
const bodyParser = require('body-parser') // for accessing POST request
const express = require('express')
const exphbs = require('express-handlebars')
const methodOverride = require('method-override') // for accessing PUT / DELETE
const mongoose = require('mongoose') // for DB
const path = require('path') // for Public files
const passport = require('./config/ppConfig') // to register passport strategies
const session = require('express-session') // to create session and cookies
const MongoStore = require('connect-mongo')(session) // to store session into db

// require all model files
const User = require('./models/user')
const FixedDeposit = require('./models/fixed-deposit')
const SavingsAccount = require('./models/savings-account')
const CreditCard = require('./models/credit-card')
const Account = require('./models/account')

// require all my route files
const login_routes = require('./routes/login_routes')
const register_routes = require('./routes/register_routes')
const profile_routes = require('./routes/profile_routes')
const account_routes = require('./routes/account_routes')
const fixed_deposit_routes = require('./routes/fixed_deposit_routes')
const savings_account_routes = require('./routes/savings_account_routes')
const credit_card_routes = require('./routes/credit_card_routes')


// initiating express
const app = express()

// VIEW ENGINES aka handlebars setup
app.engine('handlebars', exphbs({defaultLayout: 'main'}))
app.set('view engine', 'handlebars')

// MIDDLEWARES
app.use(express.static(path.join(__dirname, 'public')))
app.use(function (req, res, next) {
  console.log('Method: ' + req.method + ' Path: ' + req.url)
  next()
})

// setup bodyParser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

// setup methodOverride
app.use(methodOverride('_method'))

mongoose.Promise = global.Promise
mongoose.connect(url, {
  useMongoClient: true
})
.then(
  () => { console.log('db is connected') },
  (err) => { console.log(err) }
)

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: new MongoStore({ mongooseConnection: mongoose.connection })
}))

app.use(passport.initialize())
app.use(passport.session())

app.use((req, res, next) => {
  app.locals.user = req.user
  app.locals.fixed_deposits = req.FixedDeposits
  app.locals.savings_account = req.SavingsAccount
  app.locals.credit_card = req.CreditCard
  app.locals.account = req.account
  next()
})

app.get('/', (req, res) => {
  res.render('home')
})

app.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})

app.use('/login', login_routes)
app.use('/register', register_routes)
app.use('/profile', profile_routes)
app.use('/accounts', account_routes)
app.use('/fixed-deposit', fixed_deposit_routes)
app.use('/savings-account', savings_account_routes)


app.get('/credit-card', (req, res) => {
  CreditCard.find()
    .then(creditcards => {
      CreditCard.distinct('type')
      .then(types => {
        res.render('credit-card', {creditcards, types})
    })
  })
})

app.post('/search', (req, res) => {
    const keyword = req.body.keyword
    const regex = new RegExp(keyword, 'i')

    CreditCard.find({
      type: regex
    })
    .limit(20)
    .then(creditcards => res.send(creditcards))
    .catch(err => res.send(err)) // in case we have an error
})


app.listen(port, () => {
  console.log(`Server is running on ${port}`)
})
