import mongoose from 'mongoose'

const productSechma = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '商品名不能為空']
  },
  price: {
    type: Number,
    min: [0, '價格格式不正確'],
    required: [true, '價格不能為空']
  },
  description: {
    type: String
  },
  image: {
    type: String
  },
  sell: {
    // 是否上架
    type: Boolean,
    default: false
  },
  category: {
    // 商品分類
    type: String,
    // 值只能是陣列的其中一個(代表商品分類只能是這些文字)
    enum: {
      values: ['飾品', '皮件', '鞋子'],
      message: '商品分類不存在'
    }
  }
}, { versionKey: false })

export default mongoose.model('products', productSechma)
