import axios from 'axios';

import { getToken } from '@/utils/auth'
import store from '@/store'

// 用于存储目前状态为pending的请求标识
let pendingRequest = [];

const handleRequestIntercept = config => {

  if(store.getters.token){
    config.headers['X-Token'] = getToken()
  }

  // 区别请求的唯一标识，这里用方法名+请求路径
  // 如果一个项目里有多个不同baseURL的请求
  // 可以改成`${config.method} ${config.baseURL}${config.url}`
  const requestMark = `${config.method} ${config.url}`;
  console.log('请求标记为: ', requestMark);

  // 找当前请求的标识是否存在pendingRequest中，即是否重复请求了
  const markIndex = pendingRequest.findIndex(item => {
    return item.name === requestMark;
  })
  // 存在， 表示重复了
  if(markIndex > -1){
    // 取消上个重复的请求
    pendingRequest[markIndex].cancel();
    // 删除在pendingRequest中的请求标识
    pendingRequest.splice(markIndex, 1);
  }
  // 重新 新建针对这次请求的axios的cancelToken标识
  const CancelToken = axios.CancelToken;
  const source = CancelToken.source();
  config.cancelToken = source.token;
  // 设置自定义配置requestMark项， 主要用于响应拦截中
  config.requestMark = requestMark;
  // 记录本次请求的标识
  pendingRequest.push({
    name: requestMark,
    cancel: source.cancel,
    routeChangeCancel: config.routeChangeCancel // 可能会有优先级高于默认设置的routeChangeCancel项值
  });


  return config;
};


const handleResponseIntercept = config => {
  const markIndex = pendingRequest.findIndex(item => {
    return item.name === config.requestMark;
  });
  // 找到了就删除该标识
  markIndex > -1 && pendingRequest.splice(markIndex, 1);
}

const createAxiosInstance = (baseUrl) => {
  /* eslint-disable */
  const instance = axios.create({
    baseURL: baseUrl ? baseUrl : process.env.VUE_APP_API,
    timeout: process.env.API_TIMEOUT,
    withCredentials: true
  });

  // 默认把请求视为切换路由就会把pending状态的请求取消，false为不取消
  instance.defaults.routeChangeCancel = true;

  // 请求拦截
  instance.interceptors.request.use(handleRequestIntercept, error => {
    return Promise.reject(error)
  });


  //响应拦截
  instance.interceptors.response.use(res => {
    handleResponseIntercept(res.config);

    // TODO
    // something
    return res.data;

  }, error => {
    console.log('error', error);
    const response = error.response;
    // 设置返回的错误对象格式
    let errorFormat = {
      status: response && response.status,
      data: response && response.data
    };

    // 如果是主动取消了请求， 做个标识
    if(axios.isCancel(error)){
      errorFormat.selfCancel = true;
    }

    return Promise.reject(errorFormat);

  });

  return instance;
}



export {
   pendingRequest,
   createAxiosInstance
}
