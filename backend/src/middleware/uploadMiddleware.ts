import multer, { MulterError } from 'multer'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

const uploadsDir = path.join(process.cwd(), 'uploads')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase()
    const uniqueName = uuidv4() + fileExtension
    cb(null, uniqueName)
  },
})

const allowedExt = ['.jpg', '.jpeg', '.png', '.gif']

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const fileExt = path.extname(file.originalname).toLowerCase()

    if (!file.mimetype.startsWith('image/')) {
      return cb(new MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname))
    }

    if (!allowedExt.includes(fileExt)) {
      return cb(new MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname))
    }

    cb(null, true)
  },
})

export { upload }
