import {chrome} from '../mock/apis';

export default function() {
  chrome.storage.local.clear();
}
