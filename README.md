# 🎮 playdeck sdk

<img width="200" alt="image" src="https://github.com/ton-play/PlayDeckSDK/assets/1473995/f263c958-0dfa-4184-97a6-53f622a803bb"> <img width="200" alt="image" src="https://github.com/ton-play/PlayDeckSDK/assets/1473995/455b422f-54a9-4000-b19f-393487f0b3c4"> <img width="200" alt="image" src="https://github.com/ton-play/PlayDeckSDK/assets/1473995/06ae7e0e-6d1b-4988-b11f-cf74d970a630"> <img width="200" alt="image" src="https://github.com/ton-play/PlayDeckSDK/assets/1473995/370c65c8-0ddd-4545-a72a-23022bde3f5f">

## 🏗️ integration guide

- 🏗️ Admin panel: comming soon
- 🦖 See the running trex example. Go to @playdeckbot to play it.
  - ⚙️ will show the dev tools with args, logs and api call results. Use any http server to debug (`http-server -c-1`) locally. `http://127.0.0.1:8080/?id=<tg id>&gameToken=<your_token_take_from_⚙️_args>` will handle the REST.

---

- Add `playdeck.js` to your html file. You would also need to include telegram `game.js` library:

```html
<!-- <script src="playdeck.js"></script> -->
<script src="https://g.fantasylabsgames.dev/playdeck.js"></script>
<script src="https://telegram.org/js/games.js"></script>
```

- After window loading - `playdeck` would be available for you to use in `window` object.

```js
window.addEventListener('load', (e) => {
  const playdeck = window.playdeck
```

- You can also add `.d.ts` to the root folder for type completion (at least in vscode)
  <img width="300" alt="image" src="https://github.com/ton-play/PlayDeckSDK/assets/1473995/536487d2-b3bb-443e-82ad-7e4b22a578bb">

---

- 🔋 Crop your game if needed: playdeck overlay will cover `28px` from the top for `Share` / `All Games` / `Mute` and other buttons.During initial content loading, we'll cover game area with our custom loader 🍊. You can pass loading progress by `loading(pct)`.`loading(100)` will show the play button.

- 🎖️ At the end of the play session, send user score for leaderboard card `setScore(score, force)`

- 🔤 User language available by `getUserLocale`
- 🆔 User itself: `getUser`
- 💾 Persist api (if you need / don't have your own): `setData(key, val)`, `getData(key)` (_There are no limits atm on records count, key is up to 50 characters and data is up to 1000_)

---

```ts
declare class Playdeck {
  /** 🆔 Get telegram user id & nickname @return {Object} "{\"id\":\"74882337\",\"username\":\"Jack\"}"*/
  getUser: () => Object

  /** 🚦 Whether or not the bottom menu is open. Use to disable the game, while user is at the menu. @return {boolean}  */
  popupIsOpen: () => boolean

  /** 🔋 Set Loader Progress.
   * - Use `loading(pct)`, to customize the bottom progress bar, pct in % [0..100]. Use this if you have a loader.
   * - **OR**
   * - Use `loading()` to start animation from 0% to 95% and then wait
   * - Use `loading(100)` when all your assets has been downloaded, to make Play button available.
   * @param {number | undefined} pct */
  loading: (pct: number | undefined) => void

  /** 📻 Subscribe for game events from playdeck */
  addGameListener: (listener: (event: 'play' | 'pause') => void) => void

  /** 🏁 Call a gameEnd */
  gameEnd: () => void

  /** 🔤 Get User Locale @returns {string} string(2) */
  getUserLocale: () => string

  /** 🎖️ Set Score @param {number} score @param {boolean} force - set this flag to `true` if the high score is allowed to decrease. This can be useful when fixing mistakes or banning cheaters */
  setScore: (score: number, force: boolean = false) => void

  /** 🎖️ Get Score from the card @return \{\"position\":1,\"score\":73} **OR** \{"error":{"type":"OBJECT_NOT_FOUND","message":"Game score not found","error":true}} */
  getScore: () => Object

  /** 💾 Set Data - use to save arbitary data in between sessions.
   * @param {string} data - value
   * @param {string} key - key name */
  setData: (key: string, data: string) => void

  /** 💾 Get Data - use to obtain saved data.
   * @param {string} key - key name @return `{}` **OR** `{data: "2", key: "numOfGames"}` */
  getData: (key: string) => Object
}

declare var playdeck: Playdeck
```
