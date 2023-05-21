<template>
  <div class="container">
    <div id="mic" @click="toggle"></div>
    <div class="notice">{{ notice }}</div>
    <div class="contents">
      <div class="user">
        <van-icon name="contact" />
        <div>
          <span>姓名:</span>
          <span class="text" contenteditable>
            {{ nowRecog.data.userName }}
          </span>
        </div>
      </div>
      <van-cell-group inset>
        <van-cell title="识别结果:" :label="nowRecog.data.text"
          ><template #right-icon>
            <button class="play" @click="nowRecog.play()">
              <van-icon :name="nowRecog.playIcon" />
              <div>{{ nowRecog.playStatus }}</div>
            </button></template
          ></van-cell
        >
        <van-cell title="拼音:" :label="nowRecog.data.pinyin" />
        <pre><van-cell title="评分:" :label="`准确度:${nowRecog.data.score.accuracyScore}\n整体印象分:${nowRecog.data.score.emotionScore}\n流畅度分:${nowRecog.data.score.fluencyScore}\n总分:${nowRecog.data.score.totalScore}`" /></pre>
      </van-cell-group>
      <div class="history-title">历史录音</div>
      <van-collapse accordion v-model="activeNames">
        <van-collapse-item
          v-for="(item, index) in historyList"
          :title="index + 1"
          :name="index"
        >
          <van-cell title="识别结果:" :label="item.data.text"
            ><template #right-icon>
              <button class="play" @click="item.play()">
                <van-icon :name="item.playIcon" />
                <div>{{ item.playStatus }}</div>
              </button></template
            ></van-cell
          >
          <van-cell title="拼音:" :label="item.data.pinyin" />
          <pre><van-cell title="评分:" :label="`准确度:${item.data.score.accuracyScore}\n整体印象分:${item.data.score.emotionScore}\n流畅度分:${item.data.score.fluencyScore}\n总分:${item.data.score.totalScore}`" /></pre>
        </van-collapse-item>
      </van-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAll, updateUserName } from '@/request/api.ts'
import { Recognition } from '@/request/api.ts'
import { record, stopRecord, webm } from '@/tools/record.ts'
import { showLoadingToast, showSuccessToast, showFailToast } from 'vant'
import lottie from 'lottie-web'
import mic from '@/animation/mic.json'

class Sound {
  audio: HTMLAudioElement
  data: Recognition
  playStatus: '播放'
  playIcon: 'play-circle-o'

  constructor(data: Recognition, audioURL?: string) {
    this.audio = new Audio()
    if (audioURL) {
      this.audio.src = audioURL
    }
    this.data = data
    this.playStatus = '播放'
    this.playIcon = 'play-circle-o'
  }
  async play() {
    if (!this.audio.src) {
      this.audio.src = `${location.host}/play?featureId=${this.data.featureId}`
    }
    this.audio.play()
  }
}

const historyList = ref<Sound[]>([])

let microPhone: any
let micBox: HTMLElement
let contentBox: HTMLElement
let userNameBox: HTMLElement
let noticeBox: HTMLElement

let nowRecog = ref<Sound>(
  new Sound({
    text: '123',
    pinyin: '123',
    featureId: '123',
    userName: '123',
    newUserName: '',
    score: {
      accuracyScore: '123',
      emotionScore: '123',
      fluencyScore: '123',
      totalScore: '123'
    },
    featureList: []
  })
)

// 加载动画，获取DOM
onMounted(() => {
  microPhone = lottie.loadAnimation({
    container: document.querySelector('#mic') as Element,
    renderer: 'svg',
    loop: true,
    autoplay: false,
    animationData: mic // the path to the animation json
  })
  micBox = document.querySelector('#mic') as HTMLElement
  contentBox = document.querySelector('.contents') as HTMLElement
  noticeBox = document.querySelector('.notice') as HTMLElement
  userNameBox = document.querySelector('.text') as HTMLElement

  userNameBox.addEventListener('input', () => {
    nowRecog.value.data.newUserName = userNameBox.innerText
  })
  userNameBox.addEventListener('blur', changeUserName)
  document.onkeydown = (e) => {
    if (e.key === 'Enter') {
      changeUserName()
      userNameBox.blur()
    }
  }
})

async function changeUserName() {
  showLoadingToast({
    forbidClick: true
  })
  const [err] = await updateUserName({
    oldUserName: nowRecog.value.data.userName,
    newUserName: nowRecog.value.data.newUserName
  })
  if (!err) {
    showSuccessToast('修改成功!')
    nowRecog.value.data.userName = nowRecog.value.data.newUserName
  } else {
    showFailToast('修改失败!')
    console.log(err)
  }
}

// 录音逻辑
const recording = ref(false)
const notice = ref('点击开始录音')
// 录音按钮被点击
async function toggle() {
  recording.value = !recording.value
  if (recording.value) {
    // 开始录音
    setRecordingAnimation()
    record()
  } else {
    // 结束录音，上传录音
    setRecognizingAnimation()
    await stopRecord()
    const [err, res] = await uploadSound()
    if (!err) {
      // 结果成功返回
      historyList.value = []
      console.log(res)
      nowRecog.value = new Sound(res, webm.audioURL)
      console.log(nowRecog.value.data.userName)
      res.featureList.forEach((element: Recognition) => {
        historyList.value.push(new Sound(element))
      })
      console.log(historyList)
      setDoneAnimation()
    } else {
    }
  }
}
function setRecordingAnimation() {
  notice.value = '录音中...'
  noticeBox.style.display = 'block'
  micBox.setAttribute('id', 'mic-recording')
  microPhone.loop = true
  microPhone.playSegments([0, 12], true)
  microPhone.playSegments([12, 34], false)
  micBox.style.transform = 'translate(0, 25vh)'
  micBox.style.width = '80vw'
  contentBox.style.transform = 'translate(0, 100vh)'
}

function setRecognizingAnimation() {
  notice.value = '识别中...'
  microPhone.goToAndStop(35, false)
  micBox.classList.add('rotating')
}

function setDoneAnimation() {
  micBox.classList.remove('rotating')
  contentBox.style.display = 'block'
  // rotate动画正确移除后进行移动
  requestAnimationFrame(() => {
    microPhone.playSegments([35, 51], true)
    microPhone.loop = false
    noticeBox.style.display = 'none'
    contentBox.style.transform = 'scale(1)'
    micBox.style.transform = 'scale(1)'
    micBox.style.width = '64vw'
  })
}

async function uploadSound() {
  const formData = new FormData()
  formData.append('voiceFile', webm.blob, 'audio.webm')
  const [err, res] = await getAll(formData)
  return [err, res]
}

const activeNames = ref(0)
</script>
<style lang="less">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.container {
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: rgb(247, 248, 250);
}
#mic,
#mic-recording {
  position: relative;
  width: 80vw;
  transform: translate(0, 25vh);
  transition: all 0.8s ease-in-out;
  overflow: visible;
  z-index: 9;
}

#mic::before {
  content: '';
  display: block;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: rgba(25, 181, 254, 0.2);
  animation: ripple 1s infinite alternate;
  z-index: -1;
  opacity: 0;
}

#mic::after {
  content: '';
  display: block;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  height: 120%;
  border-radius: 50%;
  background-color: rgba(52, 152, 219, 0.2);
  animation: ripple 1s infinite alternate 0.3s;
  z-index: -2;
  opacity: 0;
}

.notice {
  font-size: 6vw;
  color: #bbb;
  position: absolute;
  top: 80vh;
  animation: twinkle 0.8s alternate infinite;
}

.user {
  margin: 0 24px;
  padding: 4vw 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  > :nth-child(2) {
    margin-left: 1vw;
    flex-grow: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .text {
    padding: 0 1vw;
    outline: none;
  }
}
.contents {
  display: none;
  width: 100%;
  transform: translate(0, 100vh);
  transition: all 1s;
  .van-cell__label {
    padding-left: 2vw;
  }
  .play {
    font-size: 4vw;
    display: flex;
    align-items: center;
    :first-child {
      margin-right: 1vw;
    }
  }
}

.history-title {
  margin: 0 24px;
  padding: 4vw 0;
}

.van-collapse {
  padding: 0 16px 10vw 16px;
  .van-collapse-item__wrapper .van-cell {
    padding: 2vw 0;
  }
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes ripple {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.5;
  }
}

@keyframes rotate {
  0% {
    transform: translate(0, 25vh) rotate(0deg);
  }
  100% {
    transform: translate(0, 25vh) rotate(360deg);
  }
}

@keyframes twinkle {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.play {
  background-color: transparent;
  border: 0;
  outline: none;
}
.play:active {
  animation: bounce 5s;
}
@keyframes bounce {
  0% {
    font-size: 100%;
  }
  25% {
    font-size: 150%;
  }
  50% {
    font-size: 100%;
  }
  75% {
    font-size: 50%;
  }
  100% {
    font-size: 100%;
  }
}
</style>
