<script setup lang="ts">
import { ref, reactive } from 'vue'
import decrypt from './decrypt.ts'

const keys_string = ref(null)
const sm4_string = ref(null)
const urls = reactive([])
const urlDetail = ref({})
const tabValue = ref(1)
const showDetail = ref(false)
const token = ref(null)
const activeKey = ref('1')
const colActiveKey = ref(['1', '2', '3']);
const labelStyle = ref({
  fontWeight: 'bold',
  color: '#66666'
})
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

type TableDataType = {
  text: string;
  record: any;
  index: number;
};

type ColumnType = {
  title: string;
  dataIndex: string;
  key: string;
  customRender?:(value: TableDataType) => string
};

const columns: ColumnType[] = ref([
  {
    title: '名称',
    dataIndex: 'request.href',
    customRender({ record }: TableDataType ): string {
      return record.request.href
    }
  },
  {
    title: '状态',
    dataIndex: 'response.status',
    customRender({ record }: TableDataType): string {
      return record.response.content.size
    }
  },
  {
    title: '类型',
    dataIndex: '_resourceType',
  },
  {
    title: '大小',
    dataIndex: 'response.content.size',
    customRender({ record }: TableDataType): string {
      return record.response.content.size
    }
  },
  {
    title: '时间',
    dataIndex: 'time',
  }
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
      request.href = request.url.split('?')[0];
      res.id = uuid();
      res.getContent((content) => {
        res.responseData = decrypt(keys_string.value, sm4_string.value, content);
      })
      urls.push(res);
      console.log(urls)
    }
  }
);

function clearUrlList() {
  urls = reactive([]);
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

</script> 

<template>
  <div style="width: 100%; height: 100%; overflow: hidden;">
    <div class="opera-header">
      <a-button type="primary" @click="clearUrlList" size="small">
          清除
      </a-button>
    </div>
    <div class="content">
      <a-table
        style="width: 100%;"
        size="small"
        :pagination="false"
        :dataSource="urls"
        :columns="columns"
        :customRow="
          (record) => {
            return {
              onClick: () => {
                handleClickDetail(record)
              }
            }
          }
        "
      >
      </a-table>
      <a-drawer 
        v-model:visible="showDetail"
        :mask="false"
        width="50%"
      >
        <div class="url-detail">
          <a-tabs v-model:activeKey="activeKey" size="small">
            <a-tab-pane key="1" tab="标头">
              <a-collapse v-model:activeKey="colActiveKey" size="small">
                <a-collapse-panel key="1" header="常规">
                  <a-descriptions  
                    :column="1" 
                    size="small"
                    :labelStyle="labelStyle"
                  >
                    <a-descriptions-item label="请求网址">
                      {{ urlDetail.request.url }}
                    </a-descriptions-item>
                    <a-descriptions-item label="请求方式">
                      {{ urlDetail.request.method }}
                    </a-descriptions-item>
                    <a-descriptions-item label="状态码">
                      {{ urlDetail.response.status }} {{ urlDetail.response.statusText }}
                    </a-descriptions-item>
                    <a-descriptions-item label="远程地址">
                      {{ urlDetail.serverIPAddress }}
                    </a-descriptions-item>
                  </a-descriptions>
                </a-collapse-panel>
                <a-collapse-panel key="2" header="响应标头">
                  <a-descriptions
                    :column="1" 
                    size="small"
                    :labelStyle="labelStyle"
                  >
                    <a-descriptions-item 
                      v-for="item in urlDetail.response.headers" 
                      :key="item.name" 
                      :label="item.name">
                      {{ item.value }}
                    </a-descriptions-item>
                  </a-descriptions>
                </a-collapse-panel>
                <a-collapse-panel key="3" header="请求标头">
                  <a-descriptions
                    :column="1" 
                    size="small"
                    :labelStyle="labelStyle"
                  >
                    <a-descriptions-item 
                      v-for="item in urlDetail.request.headers" 
                      :key="item.name" 
                      :label="item.name">
                      {{ item.value }}
                    </a-descriptions-item>
                  </a-descriptions>
                </a-collapse-panel>
              </a-collapse>
            </a-tab-pane>
            <a-tab-pane key="2" tab="载荷">
              <a-descriptions
                bordered
                :column="1" 
                size="small"
                :labelStyle="labelStyle"
              >
                <a-descriptions-item 
                  v-for="item in urlDetail.request.params" 
                  :key="item.name" 
                  :label="item.name">
                  {{ item.value }}
                </a-descriptions-item>
              </a-descriptions>
            </a-tab-pane>
            <a-tab-pane key="3" tab="预览">
              <JsonViewer
                :value="urlDetail.responseData"
                :expand-depth="2"
                copyable
              ></JsonViewer>
            </a-tab-pane>
          </a-tabs>
        </div>
      </a-drawer>
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
</style>