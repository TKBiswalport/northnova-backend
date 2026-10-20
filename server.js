require('dotenv').config()
const express = require('express')
const cors = require('cors')
const contactRoute = require('./routes/contact')

const app = express()

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'https://sorayalabs.com',
      'https://www.sorayalabs.com',
    ]
    if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  methods: ['GET', 'POST'],
}))

app.use(express.json())
app.use('/api/contact', contactRoute)
app.get('/', (req, res) => res.json({ status: 'Soraya Labs API running' }))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  if (process.env.RESEND_API_KEY) {
    console.log('Mail provider: Resend')
  } else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log(`Mail provider: Gmail SMTP (${process.env.EMAIL_USER})`)
  } else {
    console.log('Mail provider: NOT CONFIGURED — set RESEND_API_KEY or EMAIL_USER/EMAIL_PASS')
  }
})
