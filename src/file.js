const fs = require('fs')
const config = require('./config')
const { S3 } = require('aws-sdk')
const os = require('os')
const path = require('path')

class File {
  constructor() {
    this.s3 = new S3({ region: config.REGION })
    this.dir = {
      download: path.join(config.TEMP_DIR, 'download'),
      output: config.TEMP_DIR,
    }
  }

  async download(Bucket, Key, name) {
    const contents = await this.s3.getObject({ Bucket, Key }).promise()
    fs.writeFileSync(name, contents.Body)
  }

  remove(localFilePath) {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath)
    }
  }

  async upload(Bucket, Key, fileFullPath) {
    await this.s3.putObject({
      Bucket,
      Key,
      Body: fs.readFileSync(fileFullPath),
      ContentType: 'image/webp',
    }).promise()
  }

  getExt(key) {
    const d = String(key).toLowerCase().split('.')
    return d[d.length - 1]
  }

  isHeic(key) {
    return this.getExt(key) === config.IMAGE.HEIC
  }

  isPhoto(fName) {
    return !!~config.IMAGE.LIST.indexOf(this.getExt(fName))
  }

  getDownloadName(key) {
    return `${this.dir.download}-${String(key).replace(new RegExp(/\//ig), '-')}`
  }

  getDownloadNameIfHeic(key, ext) {
    return ext === config.IMAGE.HEIC ? `${this.getDownloadName(key)}.${config.IMAGE.JPG}` : this.getDownloadName(key)
  }

  getPrefix(name) {
    return name
  }

  getNameWithPrefix(key, name, divider = '/', ext = '') {
    if (ext === config.IMAGE.HEIC) {
      return `${this.getPrefix(name)}${divider}${String(key).replace(new RegExp(/\//ig), '-')}.${config.IMAGE.JPG}`
    }
    return `${this.getPrefix(name)}${divider}${String(key).replace(new RegExp(/\//ig), '-')}`
  }

  getOutputDirNameThumb(key, name, ext) {
    if (ext === config.IMAGE.HEIC) {
      return path.join(this.dir.output, `${this.getNameWithPrefix(key, name, '-')}.${config.IMAGE.JPG}`)
    }
    return path.join(this.dir.output, `${this.getNameWithPrefix(key, name, '-')}`)
  }

}

module.exports = new File()
