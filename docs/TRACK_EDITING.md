# 編輯賽道與機關

日常調整可直接使用網頁的「賽道」管理介面，操作方式見下方「瀏覽器內的賽道庫」。開發時也可編輯 `src/course-config.js` 的 `COURSE_CONFIG` 作為內建預設。每筆資料代表一個機關實例；同一種元件可以放置多次，各自設定位置與參數。賽道會依 `s` 自動排序，畫面與模擬共用這份設定。

```js
{
 id: 'deadline-extra',       // 唯一且穩定的識別碼，複製機關時請更換
 s: 390,                    // 沿賽道的位置，0～430
 type: 'sprint',             // 下表的元件名稱
 label: '最後一個 Sprint',    // 賽道招牌、進度與碰撞速報名稱
 phase: 22,                 // 動畫相位；搬動或重排時保留原值
 enabled: true,             // false 暫時停用；省略視為啟用
 params: {period: 12}        // 只填想覆寫的參數，其餘沿用元件 defaults
}
```

修改 `s` 即可搬動機關；複製一筆並給新 `id` 可增加機關。不同機關請保留間距，避免碰撞區重疊而堵住出口。`phase` 不依陣列順序決定，因此插入新機關不會改變其他機關的動作相位。終點須保留唯一的 `finish`，位置固定在 `430`。

可選的 `x` 是橫向偏移，預設 `0`。`scope-change` 與 `ux-flow` 的導流板必須銜接護欄，請保持 `x: 0`。透過賽道管理介面儲存並使用會立即套用；透過原始碼修改內建預設時，需重新建置與載入。

## 元件與預設參數

各元件均位於 `src/components/obstacles/`，檔名為下表的 `type` 加上 `.js`。距離使用賽道世界單位，時間使用模擬秒，旋轉角度使用弧度。`params` 採第一層覆寫，提供 `rows` 時會替換整個陣列。

| type | 機關 | defaults |
| --- | --- | --- |
| `gate` | Credits／Prompt／Fallback 交替閘門 | `period:10, switchDuration:0.4, warningLead:0.85, laneX:5, barWidth:9.1, lift:2.1, dividerLength:5` |
| `rotor` | Merge Conflict 旋轉擋板 | `length:15, speed:0.8, thickness:0.6` |
| `rate` | 429 限流閘門 | `period:3.8, closedDuration:2, transition:0.2, laneCount:4, laneSpacing:5, barWidth:4.05, phaseSpacing:0.65, lift:2.1` |
| `error` | 500 Error／Hotfix 活塞 | `count:3, spacing:6, speed:1.25, phaseSpacing:2, width:3.3, lift:1.7` |
| `pendulum` | Timeout／Final Test 撞球 | `amplitude:7, speed:1.3, radius:1.05` |
| `pegs` | Debug／Packet Router／Load Balancer 柱陣 | `rows:[[-8,-4,0,4,8],[-6,-2,2,6],[-8,-4,0,4,8],[-8.5,-5.1,-1.7,1.7,5.1,8.5]], rowSpacing:3.1, radius:0.43, height:1.15` |
| `finish` | 終點拱門 | 無參數 |
| `scope-change` | 需求變更轉向板 | `wallX:10.5, innerX:2.7, guideDepth:4, guideSpacing:6, height:0.95, thickness:0.65, bladeWidth:5.4, swing:0.48, speed:0.5` |
| `sprint` | Sprint 截止閘門 | `period:9, transition:0.4, warning:0.65, laneWidth:20/3, barHeight:0.7, barDepth:0.65, lift:2.1` |
| `ux-flow` | UX Flow 圓角卡片迷宮 | `wallX:10.7, innerX:2.6, spacing:5.5, guideDepth:3.6, height:1.25, thickness:0.7` |
| `handoff` | 設計交付平衡旋臂 | `width:13, depth:0.75, height:0.85, swing:0.64, speed:0.45, pivotRadius:0.55` |
| `code-review` | Code Review 分流器 | `armLength:5.5, depth:0.65, height:0.85, opening:0.68, swing:0.35, speed:0.55, spacing:3.8` |

例如，降低 `rotor.params.speed` 會減慢旋轉；增加 `sprint.params.period` 會拉長放行週期；`pegs.params.rows` 的每列數字是柱子的橫向位置。動態機關的 `speed` 表示動畫角速度；`swing` 表示來回擺動幅度。

護欄、機關寬度與通道間距必須一起考量。調整 `lift` 時需讓升起的障礙物完全離開彈珠高度；增大柱子或卡片時需保留可通行的出口。需求轉向板與 UX 卡片從護欄引導到內側，目的是中斷貼邊直通路徑。設計交付機關使用平面擺動旋臂呈現平衡感，現行物理模型不包含垂直蹺蹺板、跳台或自由落體。

## 新增一種元件

1. 在 `src/components/obstacles/` 建立獨立模組，預設匯出元件定義。
2. 在同目錄的 `index.js` 匯入模組，加入 `OBSTACLE_COMPONENTS` 的定義清單。
3. 在 `src/course-config.js` 加入使用新 `type` 的實例。

```js
// src/components/obstacles/example.js
export default {
 type: 'example',
 label: '示範擋板',
 defaults: {width: 5, depth: 0.6, height: 0.9},
 build(ctx, p, t, phase) {
  ctx.box('panel', 0, 0, 0.04, p.height, p.width, p.depth,
   {role: 'panel', materialKey: 'amber'});
 },
 decorate(view, p) {
  view.sign(view.o.label, -12, 3.2, 5, 'EXAMPLE');
 },
 update(view, t, shapes, p) {
  // 可選：更新招牌等非碰撞裝飾；機關本體的運動須放在 build。
 }
};
```

`build(ctx, params, t, phase)` 定義遊戲實體；繪圖和碰撞都讀取其結果。`ctx.box(id,x,ds,y,h,w,d,props)` 建立長方體，`ctx.add(id,kind,x,ds,y,h,props)` 支援 `circle` 圓柱與 `sphere` 球體。`x`、`ds` 相對機關原點；`y` 是距路面的底部高度。`trackBox`、`trackAdd` 會依 `ds` 處的彎道中心修正橫向位置，適合分散排列的柱陣。移動形狀需提供正確的 `angle`、`omega`、`vx`、`vs`，才能計算接觸面的速度。

每個實例的形狀數量、種類、尺寸與形狀 ID 在運行中須保持穩定；切換開關以高度或位置移動實體。`materialKey` 可選 `white`、`green`、`deep`、`metal`、`light`、`glass`、`amber` 或 `hazard`。有碰撞的可見實體必須透過建構器定義；`decorate` 用來建立招牌與高處裝飾，`update` 更新這些裝飾。請勿在裝飾中另畫未定義碰撞的低矮擋板。

通用層分工：`src/course.js` 合併預設參數並驗證設定；`src/obstacles.js` 產生實體並提供碰撞運算；`src/obstacle-view.js` 繪製相同實體；`src/track-geometry.js` 定義賽道寬度、曲線與坡面。

## 驗證與重播

```sh
npm test
npm run build
```

測試後仍需實際觀察新通道是否能讓大批彈珠通過，以及招牌是否遮擋領先群。正式活動請在現場電腦以 1,500 人、完整得獎名額排演。

新版下載的賽事 JSON 包含 `model`、`seed` 與 `course` 設定快照，重播使用紀錄中的賽道，不會套用目前編輯中的配置：

```sh
node scripts/replay.mjs "賽事紀錄-種子.json"
```

v1、v2 引擎保留在 `src/legacy/`。若未來改變元件的物理行為，請保留原版引擎／元件實作並提升 `MODEL_VERSION`；設定快照不能取代舊版物理程式碼。

## 瀏覽器內的賽道庫

按頁首「賽道」即可選擇三條內建賽道或自己的存檔。編輯名稱、機關位置、類型、啟用狀態與進階參數後，選「儲存並使用」套用；也能另存副本。內建賽道會保留，編輯後儲存為自訂賽道。機關依位置排序，終點固定於 430。套用後畫面、模擬與賽道速報共用選定配置。

每個網站網址下的 localStorage 保存最多 50 條自訂賽道與上次選擇；重新載入會還原。比賽進行、暫停與倒數期間會鎖定切換與編輯，請先「重新準備」再改賽道。尚未儲存的修改在關閉或切換時會提示保留／捨棄。

「匯出 JSON」下載目前編輯的賽道；到其他瀏覽器或另一個部署網址按「匯入 JSON」即可建立新存檔，再使用該賽道。匯入不會覆蓋原有存檔。檔案上限 512 KB，最多 128 個機關，包含停用的機關與完整預設參數。格式使用 `format: "marblerun-course"`、`version: 1`。得獎紀錄 JSON 與賽道 JSON 用途不同，請用賽道面板匯出的檔案。

localStorage 不會自動跨瀏覽器或跨網址同步；清除網站資料也會刪除本機賽道，請透過匯出備份。儲存失敗時草稿仍保留，可先匯出。任意編輯可能形成堵塞或讓比賽變慢，正式使用前請跑示範賽檢查通行狀況。

## GitHub Pages 純靜態部署

不需要後端、資料庫或 API 金鑰。`npm ci` 後執行 `npm run build`，部署產出的 `dist/` 即可。`vite.config.js` 使用相對資源路徑，支援 `https://帳號.github.io/專案名稱/` 與自訂網域。

專案附 `.github/workflows/pages.yml`：推送至 GitHub 的 `main` 分支後，到儲存庫 Settings → Pages → Build and deployment，將 Source 設為 **GitHub Actions**，即可使用工作流程建置並部署。這個流程僅發布靜態檔案，賽道與得獎紀錄依然只在各訪客的瀏覽器儲存。
