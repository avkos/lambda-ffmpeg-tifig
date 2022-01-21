const os = require('os')

const JPEG = 'jpeg'
const JPG = 'jpg'
const PNG = 'png'
const HEIC = 'heic'
const HEIF = 'heif'
const LIB_PATH = process.env.LIB_PATH !== undefined ? process.env.LIB_PATH : '/opt/'
const config = {
  DESTINATION_BUCKET: process.env.DESTINATION_BUCKET,
  REGION: process.env.REGION || 'us-east-1',
  LIB_PATH,
  TIFIG: `${LIB_PATH}tifig`,
  FFMPEG: `${LIB_PATH}ffmpeg`,
  FFPROBE: `${LIB_PATH}ffprobe`,
  TEMP_DIR: process.env.TEMP_DIR || os.tmpdir(),
  IMAGE: {
    FORMAT: {
      JPEG,
      JPG,
      PNG,
      HEIC,
      HEIF,
    },
    LIST: [HEIC, HEIF, JPEG, JPG, PNG],
  },
  RESOLUTIONS: [
    {
      name: '1920x1080',
      width: 1920,
      height: 1080,
    },
    {
      name: '1280x720',
      width: 1280,
      height: 720,
    },
    {
      name: 'crop600x400',
      width: 600,
      crop: true,
      height: 400,
    },
    {
      name: 'crop300x300',
      crop: true,
      width: 300,
      height: 300,
    },
  ],
}
module.exports = config
