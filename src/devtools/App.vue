<script setup>
import { ref } from 'vue'
import decrypt from './decrypt.ts'

const keys_string = ref(null)
const sm4_string = ref(null)
const urls = ref([])
const urlDetail = ref({})
const tabValue = ref(1)
const showDetail = ref(false)
const token = ref(null)
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
  const { type, data } = message
  if (type === 'params') {
    const query = data.data
    const res = []
    query.split('&').forEach(item => {
      const arr = item.split('=');
      res.push({
        name: arr[0],
        value: arr[1]
      })
    })
    urlDetail.value.request.params = res
  }
  if (!message.data) return
  keys_string.value = message.data.keys_string
  sm4_string.value = message.data.sm4_string
  token.value = message.data.token

});
// Relay the tab ID to the background page
backgroundPageConnection.postMessage({
  type: 'inject-script',
  tabId: chrome.devtools.inspectedWindow.tabId,
  scriptToInject: "js/content-script.js"
});

chrome.devtools.network.onRequestFinished.addListener(
  (res) => {
    const { responseDat, request, _resourceType } = res
    if (_resourceType === 'xhr') {
      request.headers = [
        {
          name: 'Url',
          value: request.url
        },
        {
          name: 'Method',
          value: request.method
        },
        ...request.headers,
      ]
      request.href = request.url.split('?')[0];
      res.id = uuid();
      res.getContent((content) => {
        request.responseData = decrypt(keys_string.value, sm4_string.value, content);
      })
      urls.value.push(res);
    }
    
  }
);

function clearUrlList() {
  urls.value = [];
}


function handleClickDetail(item) {
  showDetail.value = true
  urlDetail.value = item;
  let query = ''
  if (item.request.queryString.length) query = item.request.queryString[0].value
  backgroundPageConnection.postMessage({
    type: 'xhr',
    data: {
      token: token.value,
      data: query
    }
  });
}

function handleClickTab(item) {
  tabValue.value = item.value;
}

function closeDetail() {
  showDetail.value = false
}

</script> 

<template>
  <div style="width: 100%; height: 100%; overflow: hidden;">
    <div class="opera-header">
      <a-button type="primary" @click="clearUrlList" size="small">
        <template #icon><stop-outlined /></template>
      </a-button>
    </div>
    <div class="content">
      <div class="url-list">
        <table class="table">
          <thead>
            <tr>
              <th>名称</th>
              <th>状态</th>
              <th>类型</th>
              <th>大小</th>
              <th>时间</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in urls" 
              :key="index"
              :class="['url-item', urlDetail.id === item.id && 'active']"
              @click="handleClickDetail(item)"
            >
              <td>{{ item.request.href }}</td>
              <td>{{ item.response.status }}</td>
              <td>{{ item._resourceType }}</td>
              <td>{{ item.response.content.size / 1024 }} kb</td>
              <td>{{ item.time }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="showDetail" class="url-detail">
        <div class="url-detail_header align-center">
          <a-button type="primary" @click="closeDetail" size="small">
            <template #icon><stop-outlined /></template>
          </a-button>
          <div class="tab">
            <div 
              v-for="item in tabList"
              :key="item.value"
              :class="['tab-item', item.value === tabValue && 'active']"
              @click="handleClickTab(item)"
            >
              <div class="tab-item_content">{{ item.label }}</div>
            </div>
          </div>
        </div>
        <div class="url-detail_content">
          <div v-if="tabValue === 1">
            <div v-for="item in urlDetail.request.headers" :key="item.name" class="list-item">
              <span class="name">{{ item.name }}: </span> {{ item.value }}
            </div>
          </div>
          <div v-else-if="tabValue === 2">
            <div v-for="query in urlDetail.request.params" :key="query.name" class="list-item">
              <span class="name">{{ query.name }}: </span> {{ query.value }}
            </div>
          </div>
          <div v-else-if="tabValue === 3">
            <JsonViewer
              :value="urlDetail.responseData"
              :expand-depth="2"
              copyable
            ></JsonViewer>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.table {
  width: 100%;
  border-spacing: 0;
  th {
    padding: 5px 3px;
    background: #F1F3F4;
  }
  th {
    padding: 3px;
  }
  td,
  th {
    text-align: left;
    border-bottom:1px solid #CACDD1;
  }
  td,
  th:not(:last-child) {
    border-right:1px solid #CACDD1;
  }
}
.list-item {
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
  height: 100%;
  padding: 0 10px;
  cursor: pointer;
  text-align: center;
  .tab-item_content {
    height: 100%;
    border: 1px solid transparent;
  }
  &.active {
    .tab-item_content {
      color: #333333;
      border-bottom: 2px solid #1A73E8;
    }
  }
}
.url-detail_header {
  background: #F1F3F4;
  border-bottom: 1px solid #CACDD1;
}
.url-detail_content {
  height: calc(100% - 25px);
  overflow: auto;
}
.opera-header {
  background: #F1F3F4;
  border-bottom: 1px solid #CACDD1;
  padding: 5px;
}
.content {
  display: flex;
  align-items: stretch;
  height: calc(100% - 30px);
}
.url-list {
  flex: 1;
  width: 0;
  height: 100%;
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