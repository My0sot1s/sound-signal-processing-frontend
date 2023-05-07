import axios from 'axios'
import { Toast } from 'vant'

axios.defaults.baseURL = '/api'

/* 响应拦截 */
axios.interceptors.response.use(
  (response) => {
    const { code, msg } = response.data
    if (
      code &&
      ![200, 406].includes(code) &&
      !sessionStorage.getItem('tourist')
    ) {
      if (msg === 'Unauthorized') {
        Toast.fail('用户未登录！')
      } else {
        return Promise.reject(msg)
      }
    }
    return response
  },
  (error) => {
    return Promise.reject(error.message)
  }
)

const http = {
  get<T>(url: string, params = {}): Promise<[any, T | undefined]> {
    /* 是否出现错误，都返回resolve */
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      try {
        const res = await axios.get(url, { params })
        resolve([null, res.data.data || res.data.result || res.data.songs])
      } catch (err) {
        console.dir(err)
        resolve([err, undefined])
      }
    })
  },
  post<T>(
    url: string,
    data: object,
    headers: object
  ): Promise<[any, T | undefined]> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      try {
        const res = await axios.post(url, data, { headers })
        resolve([null, res.data.data || res.data.result || res.data.songs])
      } catch (err) {
        console.dir(err)
        resolve([err, undefined])
      }
    })
  }
}

export default http
