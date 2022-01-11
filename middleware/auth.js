import jwt from 'jsonwebtoken'
import users from '../models/users.js'

export default async (req, res, next) => {
  try {
    // 將token的Bearer 取代成空字串
    const token = req.headers.authorization?.replace('Bearer ', '') || ''
    if (token.length > 0) {
      // 解譯
      const decoded = jwt.decode(token)
      // 找到使用者的token
      req.user = await users.findOne({ _id: decoded._id, tokens: token })
      req.token = token
      if (req.user) {
        jwt.verify(token, process.env.SECRET)
        next()
      } else {
        throw new Error()
      }
    } else {
      throw new Error()
    }
  } catch (error) {
    // 如果錯誤名稱為TokenExpiredError，並且來源/users、/extend
    if (error.name === 'TokenExpiredError' && req.baseUrl === '/users' && req.path === '/extend') {
      // 就讓它通過
      next()
    } else {
      res.status(401).send({ success: false, message: '驗證錯誤' })
    }
  }
}
