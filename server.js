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
    ]
    // Allow any Vercel deployment URL or no origin (Postman etc)
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
app.get('/', (req, res) => res.send('NorthNova API running'))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Sending mail as: ${process.env.EMAIL_USER}`)
  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_16_char_app_password_here') {
    console.warn('WARNING: EMAIL_PASS is not set in .env — emails will fail!')
  }
})
