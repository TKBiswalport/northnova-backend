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
app.get('/', (req, res) => res.json({ status: 'NorthNova API running' }))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER || 'NOT SET'}`)
  console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? 'SET' : 'NOT SET — emails will fail'}`)
})
