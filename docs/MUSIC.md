# 歡樂競速配樂

`src/audio/party-music.js` 是本專案原創的 140 BPM 派對競速配樂。以跳躍低音、切分和弦、短促銅管感主旋律、拍手與手鼓營造輕快氣氛；16 小節循環包含留白、問答旋律、八小節鼓花與後段高音變奏。完賽另有約兩秒的原創勝利樂句。旋律、節奏編排與聲音均在本機合成，沒有引用或取樣商業遊戲音樂。

```js
import {PartyMusic} from './audio/party-music.js';
const music = new PartyMusic({volume: .38}); // 預設靜音
// 在使用者點擊音樂開關時：
await music.unlock();
music.setMuted(false);
music.setPhase('running');
// 隨比賽狀態更新 ready / countdown / running / paused / finished
music.setPhase('paused');
// 卸載應用程式時：
music.dispose();
```

`unlock()` 回傳布林值，代表 Web Audio 是否已啟用；須從點擊或觸控事件呼叫。可傳入既有 `AudioContext`：`new PartyMusic({context})`，或在 `unlock()` 後讀取 `music.context` 給提示音使用。傳入的 context 不會被 `dispose()` 關閉。`setVolume(0..1)` 可調整配樂音量；遊戲的音效開關可同時控制 `setMuted()`。

配樂只在倒數與競速時循環，暫停、靜音與分頁隱藏時會取消排程並迅速淡出；重新顯示分頁時依目前狀態恢復。完賽樂句只播放一次。預設不自動播放，遵守瀏覽器手勢啟用音訊的限制。

每 40 毫秒排程未來 130 毫秒的音符，使用 Web Audio 的音訊時鐘，不依賴渲染幀率。打擊樂共用單一 0.8 秒雜訊緩衝區，音符結束即釋放節點；沒有音訊檔下載、外部服務、每幀合成迴圈或 Worker 訊息。配樂與提示音不會參與物理模擬或抽獎結果。
