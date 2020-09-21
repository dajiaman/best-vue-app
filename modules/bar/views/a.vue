<template>
  <div class="container">
    <h1>hello a.vue</h1>
    {{a}}
  </div>
</template>

<script>
  import {createNamespacedHelpers} from 'vuex'

  const {mapState} = createNamespacedHelpers('bar')


  export default {
    computed: {
      ...mapState(["a"])
    },

    created() {

    }
  }
</script>


<style>
  .container {
    background: #fff;
  }
</style>
