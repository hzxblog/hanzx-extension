import { createApp } from 'vue'
import App from './App.vue'
import JsonViewer from 'vue3-json-viewer'
import 'vue3-json-viewer/dist/index.css'
import '../styles/common.scss'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';

const app=createApp(App)
app.use(JsonViewer)
app.use(Antd)
app.mount('#app')