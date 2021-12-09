import {
  WIDGET_URL,
  FRAME_ID,
  FRAME_WIDTH,
  FRAME_HEIGHT,
} from './constants';
import * as templates from './templates';

export class EnfaceId {
  constructor({
    debug = false,
    button, // required, use document.getElementById to get any element on your page
    projectId, // required, get project id on the website at https://enface.ai
    backendURL, // required, read the docs
    onSuccess, // required, callback after successfull authorization
    onGetCurrentUserToken, // optional, used to link already authorized user to Enface
  }) {
    this.log = debug
      ? console.log.bind(console)
      : () => {};
    this.logError = debug
      ? console.error.bind(console)
      : () => {};
    if (!button) return console.error('[EnfaceId] button object is required');
    if (typeof onSuccess !== 'function') return console.error('type of "onSuccess" parameter must be a function');
    if (!projectId) return console.error('[EnfaceId] project id is not set');
    if (!backendURL) return console.error('[EnfaceId] Please provide backendURL variable');
    this.projectId = projectId;
    this.url = WIDGET_URL;
    this.backendURL = backendURL;
    button.onclick = e => this.main(e);
    this.onSuccess = onSuccess;
    if (
      onGetCurrentUserToken && typeof onGetCurrentUserToken !== 'function'
    ) return console.error('type of "onGetCurrentUserToken" parameter must be a function');
    this.onGetCurrentUserToken = onGetCurrentUserToken;
    this.url.endsWith('/') && (this.url = this.url.slice(0, -1));
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
    this.isChrome = /chrome/i.test(navigator.userAgent); // chrome://settings/content/camera
  }

  async onMessage(event) {
    this.log('[EnfaceId].onMessage', { data: event.data });
    if (event.origin !== WIDGET_URL) return;
    switch (event.data._) {
      case 'cancel':
        this.frameClose();
        break;
      case 'success':
        this.frameClose();
        this.onSuccess(event.data.token);
        break;
      case 'onGetCurrentUserToken':
        if (!this.onGetCurrentUserToken) return;
        this.sendMessageToChild({
          _: 'currentUserToken',
          token: await this.onGetCurrentUserToken(),
        });
        break;
      default:
        this.logError('[EnfaceId].onMessage: bad data received', { data: event.data });
        break;
    }
  }

  showOpen() {
    this.log('[EnfaceId].showOpen', { 'this': this });
    this.messageHandler && window.removeEventListener('message', this.messageHandler, false);
    this.frameClose();
    this.frameDiv = document.createElement('div');
    // this.frameDiv.innerHTML = templates.embeddedFrame.replace('%src%', `${this.url}${HTTP_URI}${this.projectId}/front`);
    this.frameDiv.innerHTML = templates.embeddedFrame.replace('%src%', `${this.url}/${this.projectId}/${Base64.encode(this.backendURL)}`);
    this.frame = this.frameDiv.querySelector(`#${FRAME_ID}`);
    this.frame.style.width = this.isMobile
      ? '100%'
      : `${FRAME_WIDTH}px`;
    this.frame.style.height = this.isMobile
      ? '100%'
      : `${FRAME_HEIGHT}px`;
    document.body.appendChild(this.frameDiv);
    this.messageHandler = event => this.onMessage(event);
    window.addEventListener('message', this.messageHandler, false);
    console.log('[SETUP FUCKING FARM]', this.frame);
  }

  frameClose() {
    this.log('[EnfaceId].frameClose', { 'this.frameDiv': this.frameDiv });
    if (!this.frameDiv) return;
    this.frameDiv.parentNode.removeChild(this.frameDiv);
    this.frameDiv = null;
  }

  clickOutside() {
    document.removeEventListener('click', this.clickOutsideHandler);
    this.frameClose();
  }

  sendMessageToChild(message) {
    console.log('[sendMessageToChild]', { 'this.frame': this.frame });
    this.frame.contentWindow && this.frame.contentWindow.postMessage(message, '*');
  }

  main(e) {
    this.log(`[EnfaceId.main] using project id ${this.projectId}`);
    this.showOpen();
    this.clickOutsideHandler = this.clickOutside.bind(this);
    document.addEventListener('click', this.clickOutsideHandler);
    e.stopImmediatePropagation();
  }
}

const Base64 = {
  _keyStr : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
  encode(input) {
    let output = '';
    let chr1,
      chr2,
      chr3,
      enc1,
      enc2,
      enc3,
      enc4;
    let i = 0;
    input = Base64._utf8_encode(input);
    while (i < input.length) {
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);
      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;
      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }
      output = output
        + Base64._keyStr.charAt(enc1) + Base64._keyStr.charAt(enc2)
        + Base64._keyStr.charAt(enc3) + Base64._keyStr.charAt(enc4);
    }
    return output;
  },
  _utf8_encode(string) {
    string = string.replace(/\r\n/g, '\n');
    let utftext = '';
    for (let n = 0; n < string.length; n++) {
      const c = string.charCodeAt(n);
      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if ((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      } else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }
    return utftext;
  },
};
