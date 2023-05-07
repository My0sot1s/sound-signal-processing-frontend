import { showFailToast } from 'vant'

let chunks: Blob[] = []
let recorder: MediaRecorder

class Webm {
  audioURL: string
  blob: Blob
  constructor(audioURL: string, blob: Blob) {
    this.audioURL = audioURL
    this.blob = blob
  }
}
let webm: Webm

let getStream = function () {
  let stream: MediaStream | undefined
  return new Promise<MediaStream>((resolve, reject) => {
    if (stream) {
      resolve(stream)
    } else {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((res) => {
          stream = res
          resolve(stream)
        })
        .catch(() => {
          showFailToast('获取麦克风权限失败！')
          reject()
        })
    }
  })
}

function initRecorder(recorder: MediaRecorder) {
  recorder.ondataavailable = (e) => {
    chunks.push(e.data)
  }
}

async function record() {
  const stream = await getStream()
  if (stream) {
    recorder = new MediaRecorder(stream)
    initRecorder(recorder)
    recorder.start()
  }
}

function stopRecord() {
  return new Promise<void>((resolve) => {
    recorder.onstop = async () => {
      let blob = new Blob(chunks, { type: 'audio/webm' })
      chunks = []
      let audioURL = window.URL.createObjectURL(blob)
      webm = new Webm(audioURL, blob)
      resolve()
    }
    recorder.stop()
  })
}

export { record, stopRecord, webm }
