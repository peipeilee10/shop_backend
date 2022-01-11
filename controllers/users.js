import users from '../models/users.js'
import md5 from 'md5'
import jwt from 'jsonwebtoken'
import products from '../models/products.js'

// 註冊
export const register = async (req, res) => {
  if (!req.headers['content-type'] || !req.headers['content-type'].includes('application/json')) {
    res.status(400).send({ success: false, message: '資料格式不正確' })
    return
  }
  try {
    await users.create(req.body)
    res.status(200).send({ success: true, message: '' })
  } catch (error) {
    console.log(error)
    if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      res.status(400).send({ success: false, message: error.errors[key].message })
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      res.status(400).send({ success: false, message: '帳號已存在' })
    } else {
      res.status(500).send({ success: false, message: '伺服器錯誤' })
    }
  }
}

// 登入
export const login = async (req, res) => {
  try {
    const user = await users.findOne(
      { account: req.body.account, password: md5(req.body.password) },
      '-password'
    )
    if (user) {
      const token = jwt.sign({ _id: user._id.toString() }, process.env.SECRET, { expiresIn: '7 days' })
      user.tokens.push(token)
      await user.save()
      const result = user.toObject()
      delete result.tokens
      result.token = token
      result.cart = result.cart.length
      res.status(200).send({ success: true, message: '', result })
    } else {
      res.status(404).send({ success: false, message: '帳號或密碼錯誤' })
    }
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}
// 登入
// export const login = async (req, res) => {
//   try {
//     // 在資料庫找登入資料(不要顯示密碼、token)
//     const user = await users.findOne(
//       { account: req.body.account, password: md5(req.body.password) },
//       '-password'
//     )
//     // 如果找的到
//     if (user) {
//       // 給他jwt 期限七天
//       const token = jwt.sign({ _id: user._id.toString() }, process.env.SECRET, { expiresIn: '7 days' })
//       // 加進tokens陣列
//       user.tokens.push(token)
//       // 存檔
//       await user.save()
//       const result = user.toObject()
//       delete result.tokens
//       result.token = token
//       // 回復訊息(回復user資料以及token)
//       res.status(200).send({ success: true, message: '', result: { ...user, token } })
//     } else {
//       // 如果找不到，回復錯誤
//       res.stauts(404).send({ success: false, message: '帳號或密碼錯誤' })
//     }
//   } catch (error) {
//     // 伺服器錯誤等問題
//     res.stauts(500).send({ success: false, message: '伺服器錯誤' })
//   }
// }

// 登出

export const logout = async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => token !== req.token)
    await req.user.save()
    res.status(200).send({ success: true, message: '' })
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

// jwt 舊換新
export const extend = async (req, res) => {
  try {
    // 找到使用者提供的token索引
    const idx = req.user.tokens.findIndex(token => token === req.token)
    // 給新的jwt
    const token = jwt.sign({ _id: req.user._id.toString() }, process.env.SECRET, { expiresIn: '7 days' })
    req.user.tokens[idx] = token
    // 標記已修改
    req.user.markModified('tokens')
    // 存檔
    await req.user.save()
    res.status(200).send({ success: true, message: '', result: { token } })
  } catch (error) {
    res.stauts(500).send({ success: false, message: '伺服器錯誤' })
  }
}

// 抓使用者資料
export const getUserInfo = (req, res) => {
  try {
    const result = req.user.toObject()
    delete result.tokens
    result.cart = result.cart.length
    res.status(200).send({ success: true, message: '', result })
  } catch (error) {
    res.stauts(500).send({ success: false, message: '伺服器錯誤' })
  }
}

export const addCart = async (req, res) => {
  try {
    const idx = req.user.cart.findIndex(item => item.product.toString() === req.body.product)
    if (idx > -1) {
      req.user.cart[idx].quantity += req.body.quantity
    } else {
      const result = await products.findById(req.body.product)
      if (!result || !result.sell) {
        res.status(404).send({ success: false, message: '商品不存在' })
        return
      }
      req.user.cart.push(req.body)
    }
    await req.user.save()
    res.status(200).send({ success: true, message: '', result: req.user.cart.length })
  } catch (error) {
    if (error.name === 'CastError') {
      res.status(404).send({ success: false, message: '找不到' })
    } else if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      res.status(400).send({ success: false, message: error.errors[key].message })
    } else {
      res.status(500).send({ success: false, message: '伺服器錯誤' })
    }
  }
}

export const getCart = async (req, res) => {
  try {
    const { cart } = await users.findById(req.user._id, 'cart').populate('cart.product')
    res.status(200).send({ success: true, message: '', result: cart })
  } catch (error) {
    res.status(500).send({ success: false, message: '伺服器錯誤' })
  }
}

export const updateCart = async (req, res) => {
  try {
    if (req.body.quantity === 0) {
      // await users.findByIdAndUpdate(req.user._id,
      //   {
      // mongoDB 刪除陣列裡的東西語法，$pull刪除 將 cart陣列裡product裡的req.body.product刪除
      //     $pull: {
      //       cart: { product: req.body.product }
      //     }
      //   }
      // )
      const idx = req.user.cart.findIndex(item => item.product.toString() === req.body.product)
      if (idx > -1) {
        req.user.cart.splice(idx, 1)
      }
      await req.user.save()
      res.status(200).send({ success: true, message: '' })
    } else {
      // await users.findOneAndUpdate(
      //   { _id: req.user._id, 'cart.product': req.body.product },
      //   {
      //     $set: {
      //       'cart.$.quantity': req.body.quantity
      //     }
      //   }
      // )
      const idx = req.user.cart.findIndex(item => item.product.toString() === req.body.product)
      if (idx > -1) {
        req.user.cart[idx].quantity = req.body.quantity
      }
      await req.user.save()
      res.status(200).send({ success: true, message: '' })
    }
  } catch (error) {
    console.log(error)
    res.status(500).send({ success: false, messaga: '伺服器錯誤' })
  }
}
