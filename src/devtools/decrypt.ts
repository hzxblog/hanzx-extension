import { sm2 } from 'sm-crypto';
import { SM4 } from 'gm-crypto';

const PREFIX_STRING = '04';

function getPrivateString(key: string, sm4: string) {
  if (key) {
    const keyArrStr = SM4.decrypt(key, sm4, {
      inputEncoding: 'base64',
      outputEncoding: 'utf8'
    });
    const keyArr = JSON.parse(keyArrStr);
    if (keyArr && keyArr.length > 1) {
      return keyArr[1];
    }
  }
  return '';
}


export default function decrypt(key: string, sm4: string, data: string): any {
  const str = getPrivateString(key, sm4)
  if (str && typeof data === 'string' && data.startsWith(PREFIX_STRING)) {
    return JSON.parse(sm2.doDecrypt(data.substring(PREFIX_STRING.length), str));
  }
  return data;

}