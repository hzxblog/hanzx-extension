<script setup>
import { reactive, ref } from 'vue'
import decrypt from './decrypt.ts'

const keys_string = ref(null)
const sm4_string = ref(null)
const urls = ref([])
const urlDetail = ref({})
const tabValue = ref(1)
const tabList = ref([
  {
    value: 1,
    label: '标头'
  },
  {
    value: 2,
    label: '载荷'
  },
  {
    value: 3,
    label: '预览'
  },
])

function uuid(range = 32) {
  let str = ''
  const arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] // 随机产生
  for (var i = 0; i < range; i++) {
    const pos = Math.round(Math.random() * (arr.length - 1))
    str += arr[pos]
  }

  return str
}

var backgroundPageConnection = chrome.runtime.connect({
  name: "devtools-page"
});

backgroundPageConnection.onMessage.addListener(function (message) {
  if (!message.data) return
  keys_string.value = message.data.keys_string
  sm4_string.value = message.data.sm4_string
});
// Relay the tab ID to the background page
backgroundPageConnection.postMessage({
  type: 'inject-script',
  tabId: chrome.devtools.inspectedWindow.tabId,
  scriptToInject: "js/content-script.js"
});

chrome.devtools.network.onRequestFinished.addListener(
  (res) => {
    const request = res.request;
    request.href = request.url.split('?')[0];
    request.id = uuid();
    // request.queryString = request.queryString.map(item => {
    //   return {
    //     ...item,
    //     value: decrypt(keys_string.value, sm4_string.value, item.value)
    //   }
    // })
    res.getContent((content) => {
      request.responseData = decrypt(keys_string.value, sm4_string.value, content);
    })
    urls.value.push(request);
    console.log(request)
  }
);

function clearUrlList() {
  urls.value = [];
}

function handleClickDetail(item) {
  urlDetail.value = item;
}

function handleClickTab(item) {
  tabValue.value = item.value;
}

</script> 

<template>
  <div style="width: 100%; height: 100%; overflow: hidden;">
    <div class="opera-header">
      <button @click="clearUrlList">清除</button>
    </div>
    <div class="content">
      <div class="url-list">
        <div 
          v-for="(item, index) in urls" 
          :key="index" 
          :class="['url-item', urlDetail.id === item.id && 'active']"
          @click="handleClickDetail(item)"
        >
        {{ item.href }}</div>
      </div>
      <div v-if="urlDetail.id" class="url-detail">
        <div class="url-detail_header align-center">
          <button @click="clearUrlList">关闭</button>
          <div class="tab">
            <div 
              v-for="item in tabList"
              :key="item.value"
              :class="['tab-item', item.value === tabValue && 'active']"
              @click="handleClickTab(item)"
            >
            {{ item.label }}
            </div>
          </div>
        </div>
        <div>
          <div v-if="tabValue === 1"></div>
          <div v-else-if="tabValue === 2">
            <div v-for="query in urlDetail.queryString" :key="query.name" class="query-item">
              <span class="name">{{ query.name }}: </span> {{ query.value }}
            </div>
          </div>
          <div v-else-if="tabValue === 3">

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.query-item {
  padding: 5px;
  line-height: 1.5;
  word-break: break-all;
  .name {
    color: #5F6368;
    padding-right: 5px;
    white-space: nowrap;
    word-break: break-all;
    font-weight: bold;
  }
}
.tab {
  height: 100%;
  display: flex;
  align-items: center;
}
.tab-item {
  padding: 0 10px;
  cursor: pointer;
  text-align: center;
  &.active {
    color: #333333;
    border-bottom: 2px solid #1A73E8;
  }
}
.url-detail_header {
  background: #F1F3F4;
  padding: 5px;
  border-bottom: 1px solid #CACDD1;
  height: 25px;
  line-height: 25px;
}
.opera-header {
  background: #F1F3F4;
  padding: 5px;
  border-bottom: 1px solid #CACDD1;
}
.content {
  display: flex;
  align-items: stretch;
  height: 100%;
}
.url-list {
  flex: 1;
  width: 0;
  height: calc(100% - 25px);
  overflow: auto;
}
.url-detail {
  flex: 1;
  border-left: 2px solid #CACDD1;
  height: 100%;
  overflow: auto;
}
.url-item {
  padding: 2px 5px;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: break-all;
  cursor: pointer;
  &:hover {
    background: #F5F5F5;
  }
  &.active {
    color: #fff;
    background: #1A73E8;
  }
}
</style>