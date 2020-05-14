<template>
  <div>
    <p>
     login page 1
     </p>
    <el-button type="primary" @click="handleLogin">模拟登录</el-button>
  </div>
</template>

<script>
export default {
  created () {

  },
  methods: {
    handleLogin(){
      this.$http.post('/auth/login', {'username': 'admin', 'password': "123456"}).then(res => {
        console.log(res)
      })
    }
  }
}
</script>
