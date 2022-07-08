
chrome.runtime.sendMessage(
  { 
    type: 'key',
    data: { 
      keys_string: localStorage.getItem('keys_string'),
      sm4_string: localStorage.getItem('sm4_string') 
    } 
  }, 
  () => {}
);