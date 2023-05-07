import http from '@/request/request.ts'

export interface Recognition {
  text: string
  pinyin: string
  featureId: string
  userName: string
  newUserName: string
  score: {
    accuracyScore: string
    emotionScore: string
    fluencyScore: string
    totalScore: string
  }
  featureList: []
}

export function getAll(voiceFile: FormData) {
  return http.post<Recognition>('/getAll', voiceFile, {
    'Content-Type': 'multipart/form-data'
  })
}

export interface UserNames {
  oldUserName: string
  newUserName: string
}
export function updateUserName(form: UserNames) {
  return http.post('/update', form, {
    'Content-Type': 'application/x-www-form-urlencoded'
  })
}
