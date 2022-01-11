import mongoose from 'mongoose'
import md5 from 'md5'
import validator from 'validator'

const userSchema = new mongoose.Schema({
  account: {
    type: String,
    minlength: [4, '帳號必須4個字以上'],
    maxlength: [20, '帳號小於20個字'],
    unique: true,
    required: [true, '帳號不能為空']

  },
  password: {
    type: String,
    required: [true, '密碼不能為空']
  },
  email: {
    type: String,
    required: [true, '信箱不能為空'],
    unique: true,
    validator: {
      validator (email) {
        return validator.isEmail(email)
      },
      message: '信箱格式不正確'
    }

  },
  role: {
    // 0 = 一般會員
    // 1 = 管理員
    type: Number,
    default: 0
  },
  tokens: {
    // 是不是管理員(存jwt)
    type: [String]
  },
  cart: {
    type: [
      {
        product: {
          type: mongoose.ObjectId,
          ref: 'products',
          required: [true, '缺少商品ID']

        },
        quantity: {
          type: Number,
          required: [true, '缺少商品數量']
        }
      }
    ]
  }
}, { versionKey: false })

// 存檔之前要先執行加密
userSchema.pre('save', function (next) {
  const user = this
  // 如果密碼有被修改
  if (user.isModified('password')) {
    // 如果密碼長度大於4並且小於20
    if (user.password.length >= 4 && user.password.length <= 20) {
      // 加密
      user.password = md5(user.password)
    } else {
      // 如果沒有就錯誤
      const error = new mongoose.Error.ValidationError(null)
      // 回傳密碼長度錯誤訊息
      error.addError('password', new mongoose.Error.ValidatorError({ message: '密碼長度錯誤' }))
      next(error)
      return
    }
  }
  next()
})

// 之前找到並更新
userSchema.pre('findOneAndUpdate', function (next) {
  const user = this._update
  if (user.password) {
    if (user.password.length >= 4 && user.password.length <= 20) {
      user.password = md5(user.password)
    } else {
      const error = new mongoose.Error.ValidationError(null)
      error.addError('password', new mongoose.Error.ValidatorError({ message: '密碼長度錯誤' }))
      next(error)
      return
    }
  }
  next()
})

export default mongoose.model('users', userSchema)
