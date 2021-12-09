import { FRAME_ID } from './constants';
import './assets/styles.css';

export const embeddedFrame = `
  <div class="overlay">
    <div class="popup-overlay">
      <iframe id="${FRAME_ID}" class="embeddedIframe" frameborder="0" src="%src%">
    </div>
  </div>
`;
