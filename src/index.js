const config = require('./config')
const file = require('./file')
const convert = require('./convert')

const createThumbAndUpload = async (s3Record, filterData, imageData) => {
  try {
    const outName = file.getOutputDirNameThumb(s3Record.object.key, filterData.name, imageData.ext)

    // convert thumb
    await convert.thumb(file.getDownloadNameIfHeic(s3Record.object.key, imageData.ext), outName, filterData, imageData)

    // upload to destination bucket
    await file.upload(config.DESTINATION_BUCKET, file.getNameWithPrefix(s3Record.object.key, filterData.name, '/', imageData.ext),
      outName)

    // remove unnecessary thumb
    await file.remove(outName)
  } catch (e) {
    console.log('createThumbAndUpload error', e)
  }
}

module.exports.handler = async (event) => {
  const s3Record = event.Records[0].s3
  const sourceKey = s3Record.object.key
  if (!file.isPhoto(sourceKey)) {
    return true
  }
  await file.download(s3Record.bucket.name, sourceKey,file.getDownloadName(sourceKey))
  const ext = file.getExt(sourceKey)
  const isHeic = file.isHeic(sourceKey)

  // convert iphone photo format to jpg
  if (isHeic) {
    await convert.heicToJpg(file.getDownloadName(sourceKey), file.getDownloadNameIfHeic(sourceKey, ext))
  }

  // create thumbs by config.RESOLUTIONS
  const { width, height, rotate } = await convert.getResolution(file.getDownloadNameIfHeic(sourceKey, ext))
  await Promise.all(config.RESOLUTIONS.map(r => createThumbAndUpload(s3Record, r, { width, height, rotate, ext })))

  // remove unnecessary files
  await file.remove(file.getDownloadName(sourceKey))
  if (isHeic) {
    await file.remove(file.getDownloadNameIfHeic(sourceKey, ext))
  }
  return true
}

