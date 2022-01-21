const childProcess = require('child_process')
const fs = require('fs')
const se = require('shell-escape')
const config = require('./config')

class Convert {
  heicToJpg(filePath, newFilePath) {
    return new Promise((resolve, reject) => {
      childProcess.exec(se([config.TIFIG, filePath, newFilePath]), { encoding: 'utf8' },
        function (error, stdout, stderr) {
          if (error) {
            console.error(stderr)
            return reject(error)
          }
          fs.unlinkSync(filePath)
          return resolve(true)
        })
    })
  }

  spawnPromise(command, argsarray, envOptions) {
    return new Promise((resolve, reject) => {
      const childProc = childProcess.spawn(command, argsarray, envOptions || { env: process.env, cwd: process.cwd() }),
        resultBuffers = []
      childProc.stdout.on('data', buffer => {
        resultBuffers.push(buffer)
      })
      childProc.stderr.on('data', buffer => console.log(buffer.toString()))
      childProc.on('exit', (code, signal) => {
        if (code || signal) {
          reject(`${command} failed with ${code || signal}`)
        } else {
          resolve(Buffer.concat(resultBuffers).toString().trim())
        }
      })
    })
  }

  async thumb(inputFile, outputFile, filterData, imageData = {}) {
    try {
      const isVertical = Number(imageData.width) < Number(imageData.height)
      let filter
      if (filterData.crop) {
        const newImageWidth = isVertical ? filterData.height : filterData.width
        const newImageHeight = isVertical ? filterData.width : filterData.height
        const resizeK = newImageWidth / imageData.width

        const x = parseInt(isVertical ? 0 : (resizeK * imageData.width / 2 - newImageWidth / 2))
        const y = parseInt(isVertical ? (resizeK * imageData.height / 2 - newImageHeight / 2) : 0)

        if (newImageWidth === newImageHeight) {
          // square
          filter = `scale=${isVertical
            ? `${newImageWidth}:-1`
            : `-1:${newImageWidth}`},crop=${newImageWidth}:${newImageHeight}:${x}:${y}`
        } else {
          filter = `scale=${isVertical
            ? `${newImageWidth}:-1`
            : `-1:${newImageWidth}`},crop=${newImageWidth}:${newImageHeight}:${x}:${y}`
        }
      } else {
        const newImageWidth = isVertical ? filterData.height : filterData.width
        filter = `scale=${newImageWidth}:-1`
      }

      if (Number(imageData.rotate) !== 0) {
        const times = Number(imageData.rotate) / 90
        for (let i = 0; i < times; i++) {
          filter += `,transpose=1`
        }
      }
      const callData = [
        '-v',
        'error',
        '-noautorotate',
        '-i',
        inputFile,
        '-filter:v',
        filter,
        '-y',
      ]

      return await this.spawnPromise(
        config.FFMPEG,
        [
          ...callData,
          outputFile],
      )
    } catch (e) {
      console.log('ffmpeg error', e)
    }
  }

  async getResolution(inputFile) {
    try {
      let rotate = await this.spawnPromise(
        config.FFPROBE,
        [
          '-v', 'error',
          '-select_streams', 'v:0',
          '-show_entries',
          'stream_tags=rotate',
          '-of', 'default=nw=1:nk=1',
          inputFile],
      )
      rotate = rotate || 0
      const str = await this.spawnPromise(
        config.FFPROBE,
        [
          '-v', 'error',
          '-select_streams', 'v:0',
          '-show_entries',
          'stream=width,height',
          '-of', 'csv=s=x:p=0',
          inputFile],
      )

      let [width, height] = String(str).split('x')

      if (String(rotate) === '90' || String(rotate) === '-90' || String(rotate) === '270' || String(rotate) ===
        '-270') {
        [width, height] = [height, width]
      }
      return { width, height, rotate }
    } catch (e) {
      console.log('ffprobe error', e)
      return { width: 1080, height: 1920 }
    }
  }
}

module.exports = new Convert()
