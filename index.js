import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import usersRouter from './routes/users.js'
import productsRouter from './routes/products.js'
import ordersRouter from './routes/orders.js'

mongoose.connect(process.env.DB_URL, () => {
  console.log('MongoDB Connected')
})

const app = express()

// cors 前端請求
app.use(cors({
  // origin(請求來源),callback(是否讓他過)
  origin (origin, callback) {
    // 如果origin是undefined(來自postman)、github或localhost
    if (origin === undefined || origin.includes('github') || origin.includes('localhost')) {
      // 可以過(null 沒有錯誤)
      callback(null, true)
    } else {
      // 來自其他地方，就回傳not allowed訊息
      callback(new Error('Not allowed'), false)
    }
  }
}))

// 因為已經知道是cors的錯誤，所以就不用寫error 以底線替代
app.use((_, req, res, next) => {
  res.status(403).send({ success: false, message: '請求被拒絕' })
})

app.use(express.json())

// express.json的錯誤
app.use((_, req, res, next) => {
  res.status(400).send({ success: false, message: '資料格式錯誤' })
})

app.use('/users', usersRouter)
app.use('/products', productsRouter)
app.use('/orders', ordersRouter)

app.all('*', (req, res) => {
  res.status(404).send({ success: false, message: '找不到' })
})

app.listen(process.env.PORT || 3000, () => {
  console.log('Server Started')
})
