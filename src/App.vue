<template>
    <a-config-provider :locale="zh_CN">
        <div id="app">
            <div id="nav">
                <a-button shape="round" size="small" type="primary">申请使用</a-button>
                <router-link to="/">Home</router-link> |
                <router-link to="/about">About</router-link>|
                <router-link to="/login">Login</router-link>
            </div>
            <router-view />
        </div>
    </a-config-provider>
</template>

<script>
import zh_CN from "ant-design-vue/lib/locale-provider/zh_CN";

export default {
    name: "app",
    data() {
        return {
            zh_CN,
        };
    },
};
</script>
