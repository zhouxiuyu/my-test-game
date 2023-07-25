;(function () {
  window.addEventListener('load', (e) => {
    const PLAYDECK_DOMAIN = 'https://api.playdeck.fantasylabsgames.dev'
    const BOT_URL = 'https://t.me/playdeckbot'
    const PLAYDECK_SDK_VERSION = '0.3'
    const LOG = '[playdeck 🎮 :]'

    const args = parseArgs([
      'id',
      'username',
      'gameShortName',
      'gameTitle',
      'gameDescription',
      'isFavorite',
      'gameCover',
      'gameToken',
      'locale',
    ])
    console.log(LOG, { args })
    const tgInitParams = TelegramGameProxy.initParams
    console.log(LOG, `✈️ TelegramGameProxy.initParams -> `, { tgInitParams })

    const menu = document.createElement('playdeck-menu')
    menu.innerHTML = makeHtml(args, BOT_URL, PLAYDECK_SDK_VERSION)
    document.body.appendChild(menu)

    const style = document.createElement('style')
    style.textContent = makeCss()
    document.head.append(style)

    const listeners = []
    /** Delivers event to all subscribed game listeners.
     * You can subscribe by `window.playdeck.addGameListener((event) => {...})`
     * @param {'play' | 'pause'} event
     */
    const fireEvent = (event) => {
      console.log(LOG, `fireEvent(${event})`)
      listeners.forEach((listener) => listener(event))
    }

    const closeBottomMenu = () => {
      //hide with animations bottom-popup
      const popupBottom = document.getElementsByClassName('playdeck-bottom')[0]
      popupBottom.classList.remove('appearance')
      popupBottom.classList.add('disappearance')
      //hide overlay
      const popupOverlay = document.getElementsByClassName('playdeck-overlay')[0]
      popupOverlay.classList.add('disappearance')
      //shop popupTop
      const popupTop = document.getElementsByClassName('playdeck-top')[0]
      popupTop.classList.add('appearance')
    }

    const openBottomMenu = (isContinue = false) => {
      //show with animations popup
      const popupBottom = document.getElementsByClassName('playdeck-bottom')[0]
      popupBottom.classList.remove('disappearance')
      popupBottom.classList.add('appearance')

      if (isContinue) {
        //change text on "continue" instead of play
        const btnContent = document.getElementsByClassName('playdeck-bottom__btn-text')[0]
        btnContent.innerHTML = 'Continue'
      } else {
        const btnContent = document.getElementsByClassName('playdeck-bottom__btn-text')[0]
        btnContent.innerHTML = 'Play'
      }

      //show overlay
      const popupOverlay = document.getElementsByClassName('playdeck-overlay')[0]
      popupOverlay.style.display = 'block'
      popupOverlay.style.hidden = false
    }

    const favorite = document.getElementById('btn-favorite')
    favorite.onclick = async () => {
      if (favorite.classList.contains('active')) {
        favorite.classList.remove('active')
      } else {
        favorite.classList.add('active')
      }
      const response = await fetch(`${PLAYDECK_DOMAIN}/api/v1/like/${args.gameShortName}?id=${args.id}`, {
        method: 'PUT',
      })
      console.log(response)
    }

    const shareBottomMenu = document.getElementById('btn-share')
    shareBottomMenu.onclick = () => {
      console.log('share!')
      TelegramGameProxy.shareScore()
    }

    const setProgress = (progress) => {
      const progressbar = document.getElementsByClassName('playdeck-bottom__progress-bar__progress')[0]
      progressbar.style.width = `${progress}%`
      if (progress === 100) {
        const btnContent = document.getElementsByClassName('playdeck-bottom__btn-text')[0]
        btnContent.innerHTML = 'Play'
        const bottomPanel = document.getElementsByClassName('playdeck-bottom__footer')[0]
        bottomPanel.classList.remove('loading')
        bottomPanel.classList.add('play')
      }
    }

    const getProgress = () => {
      const progressBar = document.getElementsByClassName('playdeck-bottom__progress-bar__progress')[0]
      return parseInt(progressBar.style.width)
    }

    const shareTopMenu = document.getElementsByClassName('playdeck-top__btn-right')[0]
    shareTopMenu.onclick = () => {
      // openBottomMenu(true)
      // hidePause()
      console.log('share!')
      TelegramGameProxy.shareScore()
      // fireEvent('pause')
    }

    const hideShare = () => {
      const btnPause = document.getElementsByClassName('playdeck-top__btn-right')[0]
      btnPause.style.display = 'none'
    }

    hideShare()
    setProgress(0)

    const showShare = () => {
      const btnPause = document.getElementsByClassName('playdeck-top__btn-right')[0]
      btnPause.style.display = 'flex'
    }

    const play = document.getElementsByClassName('playdeck-bottom__footer')[0]
    play.onclick = () => {
      if (play.classList.contains('play')) {
        showShare()
        closeBottomMenu()
        fireEvent('play')
      }
    }

    const popupIsOpen = () => {
      const popupBottom = document.getElementsByClassName('playdeck-bottom')[0]
      if (popupBottom.classList.contains('appearance')) {
        return true
      }
      return false
    }

    const playdeck = {
      /** 🆔 Get telegram user id & nickname @return {Object} "{\"id\":\"74882337\",\"username\":\"Jack\"}"*/
      getUser: function () {
        return { id: args.id, username: args.username }
      },

      /** 🚦 Whether or not the bottom menu is open. Use to disable the game, while user is at the menu. @return {boolean}  */
      popupIsOpen: popupIsOpen,

      /** 📻 Subscribe for game events from playdeck */
      addGameListener: function (listener) {
        listeners.push(listener)
      },

      /** 🏁 Call a gameEnd */
      gameEnd: function () {
        console.log(LOG, `gameEnd()`)
        openBottomMenu()
        hideShare()
      },

      /** 🔤 Get User Locale @returns {string} string(2) */
      getUserLocale: function () {
        return args.locale
      },

      /** 🎖️ Set Score @param {number} score @param {boolean} force - set this flag to `true` if the high score is allowed to decrease. This can be useful when fixing mistakes or banning cheaters */
      setScore: async function (score, force = false) {
        console.log(LOG, `🏅 setScore(${score}, ${force})`)
        const response = await fetch(`${PLAYDECK_DOMAIN}/api/v1/score/${score}?id=${args.id}&force=${force}`, {
          method: 'PUT',
        })
      },

      /** 🎖️ Get Score from the card @return \{\"position\":1,\"score\":73} **OR** \{"error":{"type":"OBJECT_NOT_FOUND","message":"Game score not found","error":true}} */
      getScore: async function () {
        console.log(LOG, `🏅 getScore()`)
        const response = await fetch(`${PLAYDECK_DOMAIN}/api/v1/score?id=${args.id}&game=${args.gameShortName}`, {
          method: 'GET',
        })
        return response.json()
      },

      /** 🔋 Set Loader Progress.
       * - Use `loading(pct)`, to customize the bottom progress bar, pct in % [0..100]. Use this if you have a loader.
       * - **OR**
       * - Use `loading()` to start animation from 0% to 95% and then wait
       * - Use `loading(100)` when all your assets has been downloaded, to make Play button available.
       * @param {number | undefined} pct */
      loading: function (pct) {
        console.log(LOG, `🔋 loading(${pct})`)
        if (pct === undefined) {
          const intervalLoading = setInterval(() => {
            const next = getProgress() + 15
            if (next >= 95) {
              clearInterval(intervalLoading)
              return
            }
            setProgress(next)
          }, 300)
        } else {
          setProgress(pct)
        }
      },

      /** 💾 Set Data - use to save arbitary data in between sessions.
       * @param {string} data - value
       * @param {string} key - key name */
      setData: async (key, data) => {
        console.log(LOG, `💾 setData(${key}, ${data})`)
        const response = await fetch(`${PLAYDECK_DOMAIN}/api/v1/cloudsave`, {
          method: 'POST',
          headers: {
            'X-Game-Token': args.gameToken,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key: key, data: data, telegramId: Number(args.id) }),
        })
        // console.log(LOG, `💾 setData -> `, { response })
        return response.json()
      },

      /** 💾 Get Data - use to obtain saved data.
       * @param {string} key - key name @return `{}` **OR** `{data: "2", key: "numOfGames"}` */
      getData: async (key) => {
        console.log(LOG, `💾 getData(${key})`)
        const response = await fetch(`${PLAYDECK_DOMAIN}/api/v1/cloudsave/${Number(args.id)}/${key}`, {
          method: 'GET',
          headers: {
            'X-Game-Token': args.gameToken,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        })
        // console.log(LOG, `💾 getData -> `, { response })
        return response.json()
      },
    }

    /**
     * @type string
     */
    window.playdeck = playdeck
  })

  const makeHtml = (args, botUrl, version) => {
    return `
  <div class="playdeck-overlay"></div>
  <div class="playdeck-top appearance">
    <div class="playdeck-top__container">
      <a class="playdeck-top__btn-left" href="${botUrl}">
        <div class="playdeck-top__btn-left__icon"></div>
        <p class="playdeck-top__btn-left__text">Games</p>
      </a>
      <a class="playdeck-top__btn-right active">
        <div class="playdeck-top__btn-right__icon"></div>
        <p class="playdeck-top__btn-right__text">Share</p>
      </a>
    </div>
  </div>
  <div class="playdeck-bottom appearance">
    <div class="playdeck-bottom__container">
      <div class="playdeck-bottom__header">
        <div class="playdeck-bottom__title-row">
          <img src="${args.gameCover}" id="title-row__game-cover" />
          <h1 class="playdeck-bottom__row__name">${args.gameTitle}</h1>
        </div>
        <div class="playdeck-bottom__desc-row">
          <p>${args.gameDescription}</p>
        </div>
        <div class="playdeck-bottom__options-row">
          <a id="btn-share" class="playdeck-btn playdeck-bottom__btn-share">
            <div id="btn-share" class="btn-share__content">
              <div class="btn-share__icon"></div>
              <div>Share game with friends</div>
            </div>
          </a>
          <a id="btn-favorite" class="playdeck-btn playdeck-bottom__btn-favorite ${
            args.isFavorite === 'true' ? 'active' : ''
          }">
            <div class="btn-favorite__content"></div>
          </a>
        </div>
      </div>
      <a class="playdeck-bottom__footer loading">
        <div class="playdeck-bottom__progress-bar">
          <div class="playdeck-bottom__progress-bar__progress"></div>
        </div>
        <p class="playdeck-bottom__btn-text">Loading...</p>
      </a>
      <div class="playdeck-version">v ${version}</div>
    </div>
  </div>
  

`
  }

  const makeCss = () => `
@import 'https://fonts.cdnfonts.com/css/satoshi';
@import 'https://fonts.googleapis.com/css2?family=DM+Sans&display=swap';
html,
body,
div,
iframe,
p,
a,
h1,
img {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 100%;
  font: inherit;
  vertical-align: baseline;
}
body {
  line-height: 1;
  overflow: hidden;
}

.playdeck-top__btn-left__icon {
  width: 14px;
  height: 14px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 18 14' fill='none'%3E%3Cpath d='M4.295 5.76124C4.295 5.44402 4.49668 5.2455 4.82562 5.2455H5.81595V4.28761C5.81595 3.96136 6.0091 3.75652 6.33055 3.75652C6.64615 3.75652 6.84405 3.96136 6.84405 4.28761V5.2455H7.7731C8.1276 5.2455 8.341 5.44402 8.341 5.76124C8.341 6.08808 8.1276 6.29245 7.7731 6.29245H6.84405V7.24928C6.84405 7.57658 6.64615 7.78518 6.33055 7.78518C6.0091 7.78518 5.81595 7.57658 5.81595 7.24928V6.29245H4.82562C4.49668 6.29245 4.295 6.08808 4.295 5.76124ZM10.078 6.60158C10.078 6.10847 10.4635 5.72984 10.9449 5.72984C11.4333 5.72984 11.8119 6.10847 11.8119 6.60158C11.8119 7.08783 11.4333 7.46643 10.9449 7.46643C10.4635 7.46643 10.078 7.08783 10.078 6.60158ZM11.8223 4.84402C11.8223 4.35089 12.202 3.97226 12.6845 3.97226C13.1765 3.97226 13.5504 4.35089 13.5504 4.84402C13.5504 5.33128 13.1765 5.70406 12.6845 5.70406C12.202 5.70406 11.8223 5.33128 11.8223 4.84402ZM2.78832 12.3087C3.65433 12.3087 4.2473 11.9852 4.76902 11.3737L5.8106 10.158C5.9608 9.98583 6.1155 9.90323 6.29655 9.90323H11.8536C12.0347 9.90323 12.1894 9.98583 12.3396 10.158L13.3822 11.3737C13.9039 11.9841 14.4958 12.3087 15.3619 12.3087C16.7195 12.3087 17.6502 11.4139 17.6502 9.99113C17.6502 9.37778 17.5175 8.68178 17.2848 7.91118C16.9242 6.70263 16.2962 5.06363 15.6996 3.80222C15.1915 2.74015 14.9147 2.22066 13.6303 1.92992C12.5045 1.6727 10.9583 1.50488 9.078 1.50488C7.1967 1.50488 5.6457 1.6727 4.51988 1.92992C3.23551 2.22066 2.95871 2.74015 2.45164 3.80222C1.85504 5.06363 1.22598 6.70263 0.866445 7.91118C0.633711 8.68178 0.5 9.37778 0.5 9.99113C0.5 11.4139 1.4307 12.3087 2.78832 12.3087Z' fill='%23FCFCFD'/%3E%3C/svg%3E");
}

.playdeck-overlay {
  display: block;
  width: 100%;
  height: 100%;
  left: 0%;
  top: 0%;
  position: absolute;
  background: linear-gradient(45deg,#FF73DF, #FF8670, #FF9900);
  background-size: 600% 100%;
  animation: playdeck-gradient 2s linear infinite;
  animation-direction: alternate; 
}

.playdeck-overlay.appearance {
  background: linear-gradient(45deg,#FF73DF, #FF8670, #FF9900);
  background-size: 600% 100%;
  animation: playdeck-gradient 2s linear infinite;
  animation-direction: alternate; 
}

.playdeck-overlay.disappearance {
  animation: 1s ease forwards playdeck-gradient-disappearance;
  
}

@keyframes playdeck-gradient {
  0% {background-position: 0%}
  100% {background-position: 100%}
}

@keyframes playdeck-gradient-disappearance {
  0%{visibility: visible;}
  100%{opacity: 0; visibility: hidden;}
}


#title-row__game-cover {
  width: 64px;
  height: 64px;
}

.playdeck-version {
  position: absolute;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  border-radius: 4px;
  background: rgba(20, 20, 22, 0.50);
  color: #FFFFFF;
  left: 16px;
  bottom: -3px;
  padding: 2px 4px;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  line-height: 130%;
  text-align: center;
}

.playdeck-bottom__container {
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 0 16px;
  padding-bottom: 24px;
  gap: 16px;
}
.playdeck-bottom__container img {
  pointer-events: none;
}
.playdeck-bottom__header {
  background-color: #fcfcfd;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  padding: 0px 16px;
  padding: 16px;
  padding-bottom: 12px;
}
.playdeck-bottom__title-row {
  font-family: 'Satoshi', sans-serif;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  text-overflow: ellipsis;
  font-weight: 700;
  line-height: 112%;
}
.playdeck-bottom__row__name {
  font-size: 24px;
  text-overflow: ellipsis;
  whitespace: nowrap;
  line-height: 112%;
}
.playdeck-bottom__desc-row {
  margin-top: 16px;
  text-overflow: ellipsis;
  whitespace: nowrap;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 400;
  line-height: 140%;
  color: #3b4152;
}
.playdeck-bottom__options-row {
  margin-top: 16px;
  display: flex;
  flex-direction: row;
  gap: 4px;
  justify-content: center;
}
.playdeck-bottom__btn-share {
  padding: 13px 24px 15px 24px;
  width: 100%;
}
.btn-share__icon {
  background-image: url("data:image/svg+xml,%3Csvg width='21' height='20' viewBox='0 0 21 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg id='Icon / Tg'%3E%3Cpath id='Vector' fill-rule='evenodd' clip-rule='evenodd' d='M3.09992 9.06503C7.39487 7.07681 10.2589 5.76605 11.6919 5.13276C15.7834 3.32458 16.6335 3.01048 17.1877 3.00011C17.3095 2.99783 17.5821 3.02992 17.7586 3.18211C17.9076 3.31061 17.9486 3.4842 17.9683 3.60604C17.9879 3.72787 18.0123 4.00542 17.9929 4.22228C17.7712 6.69754 16.8118 12.7043 16.3237 15.4767C16.1172 16.6497 15.7105 17.0431 15.3169 17.0816C14.4613 17.1652 13.8116 16.4808 12.9829 15.9036C11.6862 15.0005 10.9537 14.4383 9.69503 13.557C8.24043 12.5385 9.18338 11.9788 10.0124 11.0639C10.2293 10.8245 13.999 7.18137 14.0719 6.85088C14.0811 6.80955 14.0895 6.65547 14.0034 6.57412C13.9172 6.49276 13.7901 6.52058 13.6983 6.54271C13.5683 6.57407 11.4968 8.02884 7.48389 10.907C6.89591 11.336 6.36333 11.545 5.88616 11.5341C5.36012 11.522 4.34822 11.218 3.59598 10.9582C2.67333 10.6396 1.94002 10.4711 2.00388 9.92988C2.03714 9.64799 2.40248 9.35971 3.09992 9.06503Z' fill='%23141416'/%3E%3C/g%3E%3C/svg%3E%0A");
  height: 20px;
  width: 20px;
}
.playdeck-bottom__btn-favorite {
  padding: 13px 20px 15px 20px;
}
.playdeck-bottom__btn-share,
.playdeck-bottom__btn-favorite {
  background-color: #e6e6ea;
  cursor: pointer;
}
.playdeck-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  line-height: 110%;
}
.btn-share__content {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  font-family: 'Satoshi', sans-serif;
}
.playdeck-bottom__footer {
  font-family: 'Satoshi', sans-serif;
  display: flex;
  border-radius: 14px;
  background-color: #e6e6ea;
  height: 48px;
  justify-content: center;
  align-items: center;
  color: #fff;
  width: 100%;
}
.playdeck-bottom__footer .playdeck-bottom__btn-text {
  position: absolute;
  font-size: 15px;
  font-family: 'Satoshi', sans-serif;
  font-weight: 700;
}
.playdeck-bottom__footer.play {
  cursor: pointer;
}
.playdeck-bottom__footer.loading {
  cursor: auto;
}
.playdeck-bottom__progress-bar {
  background-color: #8eb5ff;
  display: block;
  position: relative;
  height: 100%;
  width: 100%;
  border-radius: 14px;
  border-top-right-radius: none;
  border-bottom-right-radius: none;
}
.playdeck-bottom__progress-bar__progress {
  display: block;
  background-color: #1e6bff;
  height: 100%;
  width: 0%;
  border-radius: 14px;
  transition: width 0.4s ease;
}
.playdeck-bottom__btn-favorite .btn-favorite__content {
  display: block;
  width: 20px;
  height: 20px;
  background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg id='Icon / Heart'%3E%3Cg id='heart.fill'%3E%3Cg id='Group'%3E%3Cpath id='Vector' d='M9.26737 5.27879L9.87915 6.4116L10.4973 5.28227C11.151 4.08801 12.1859 3.35347 13.5449 3.35347C15.7865 3.35347 17.6384 5.13581 17.6384 7.86898C17.6384 9.45468 16.9735 11.0839 15.7026 12.7095C14.4323 14.3343 12.583 15.9196 10.291 17.3981C10.1783 17.4676 10.0687 17.5283 9.97464 17.5699C9.9355 17.5872 9.90504 17.5985 9.88305 17.6054C9.8616 17.5987 9.83197 17.5876 9.79407 17.5707C9.70156 17.5295 9.59401 17.4689 9.48597 17.4004C7.18885 15.9212 5.33654 14.335 4.06475 12.7094C2.79301 11.0838 2.12822 9.45465 2.12822 7.86898C2.12822 5.13582 3.98014 3.35347 6.22169 3.35347C7.58101 3.35347 8.62886 4.09648 9.26737 5.27879Z' stroke='%23141416' stroke-width='1.4'/%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/svg%3E%0A");
}
.playdeck-bottom__btn-favorite.active {
  background-color: #fddedf;
}
.playdeck-bottom__btn-favorite.active .btn-favorite__content {
  display: block;
  width: 20px;
  height: 20px;
  background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M9.8833 18.3111C10.0967 18.3111 10.4082 18.1487 10.6646 17.9902C15.338 14.9767 18.3384 11.4454 18.3384 7.86898C18.3384 4.7898 16.2124 2.65347 13.5449 2.65347C11.884 2.65347 10.636 3.57105 9.8833 4.94616C9.14437 3.57791 7.88107 2.65347 6.22169 2.65347C3.55417 2.65347 1.42822 4.7898 1.42822 7.86898C1.42822 11.4454 4.42856 14.9767 9.10887 17.9902C9.35844 18.1487 9.66837 18.3111 9.8833 18.3111Z' fill='%23EF4444'/%3E%3C/svg%3E%0A");
}
.playdeck-overlay {
  display: block;
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 9998;
}
.playdeck-bottom {
  bottom: 10px;
  width: 100%;
  position: fixed;
  z-index: 9999;
}
.playdeck-bottom.appearance {
  animation-name: bottom-appearance;
  animation-duration: 1s;
  animation-timing-function: ease;
}
@keyframes bottom-appearance {
  0% {
    transform: translateY(105%);
  }
  100% {
    transform: translateY(0%);
  }
}
.playdeck-bottom.disappearance {
  animation-name: bottom-disappearance;
  animation-duration: 1s;
  animation-timing-function: ease;
  animation-fill-mode: forwards;
}
@keyframes bottom-disappearance {
  0% {
    transform: translateY(0%);
  }
  100% {
    transform: translateY(105%);
  }
}
.playdeck-top {
  position: fixed;
  width: 100%;
  top: 0%;
  left: 0%;
  font-family: 'Satoshi', sans-serif;
  color: #fff;
  font-size: 13px;
  display: flex;
  align-items: center;
  text-align: center;
  background: rgba(255, 255, 255, 0.12);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  height: 40px;
  font-weight: 700;
  line-height: 110%;
  z-index: 9999;
  transform: translateY(-100%);
}
.playdeck-top.appearance {
  animation-name: top-appearance;
  animation-duration: 1s;
  animation-timing-function: ease;
  animation-fill-mode: forwards;
}
@keyframes top-appearance {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(0%);
  }
}
.playdeck-top.disappearance {
  animation-name: top-disappearance;
  animation-duration: 1s;
  animation-timing-function: ease;
  animation-fill-mode: forwards;
}
@keyframes top-disappearance {
  0% {
    transform: translateY(0%);
  }
  100% {
    transform: translateY(-100%);
  }
}
.playdeck-top__container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin: 0px 16px;
}
.playdeck-top__btn-left {
  background-color: #1e6bff;
  border-radius: 14px;
  display: flex;
  height: 28px;
  padding: 0px 16px;
  justify-content: center;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  text-decoration: none;
}

.playdeck-top__btn-left__text {
  color:#FFF;
  text-align: center;
  font-family: 'Satoshi', sans-serif;
  font-size: 13px;
  height: 14px;
  font-style: normal;
  font-weight: 700;
  line-height: 110%
}

.playdeck-top__btn-right {
  border-radius: 14px;
  display: flex;
  height: 28px;
  padding: 0px 16px 0px 12px;
  justify-content: center;
  align-items: center;
  gap: 4px;
  background-color: #D97706;
  cursor: pointer;
}
.playdeck-top__btn-right .playdeck-top__btn-right__icon {
  width: 16px;
  height: 16px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M2.07915 7.25192C5.51512 5.66135 7.8063 4.61274 8.9527 4.10611C12.2259 2.65957 12.906 2.40829 13.3494 2.39999C13.4469 2.39817 13.6649 2.42384 13.8061 2.54559C13.9253 2.64839 13.9581 2.78726 13.9738 2.88473C13.9895 2.9822 14.0091 3.20424 13.9935 3.37773C13.8162 5.35793 13.0487 10.1634 12.6582 12.3812C12.493 13.3197 12.1676 13.6344 11.8527 13.6652C11.1682 13.7321 10.6485 13.1845 9.98557 12.7228C8.94821 12.0003 8.36218 11.5505 7.35524 10.8455C6.19156 10.0307 6.94593 9.58291 7.60911 8.85104C7.78266 8.65951 10.7984 5.745 10.8568 5.48061C10.8641 5.44754 10.8708 5.32428 10.8019 5.2592C10.733 5.19411 10.6313 5.21637 10.5579 5.23407C10.4538 5.25916 8.79666 6.42297 5.58633 8.7255C5.11595 9.0687 4.68988 9.23591 4.30815 9.22715C3.88731 9.21749 3.0778 8.97433 2.476 8.76648C1.73788 8.51155 1.15124 8.37676 1.20232 7.94381C1.22893 7.7183 1.5212 7.48767 2.07915 7.25192Z' fill='%233B4152'/%3E%3C/svg%3E");
}
.playdeck-top__btn-right.active {
  color: #141416;
  background-color: #dadae0;
}
.playdeck-top__btn-right.active .playdeck-top__btn-right__icon {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M2.07915 7.25192C5.51512 5.66135 7.8063 4.61274 8.9527 4.10611C12.2259 2.65957 12.906 2.40829 13.3494 2.39999C13.4469 2.39817 13.6649 2.42384 13.8061 2.54559C13.9253 2.64839 13.9581 2.78726 13.9738 2.88473C13.9895 2.9822 14.0091 3.20424 13.9935 3.37773C13.8162 5.35793 13.0487 10.1634 12.6582 12.3812C12.493 13.3197 12.1676 13.6344 11.8527 13.6652C11.1682 13.7321 10.6485 13.1845 9.98557 12.7228C8.94821 12.0003 8.36218 11.5505 7.35524 10.8455C6.19156 10.0307 6.94593 9.58291 7.60911 8.85104C7.78266 8.65951 10.7984 5.745 10.8568 5.48061C10.8641 5.44754 10.8708 5.32428 10.8019 5.2592C10.733 5.19411 10.6313 5.21637 10.5579 5.23407C10.4538 5.25916 8.79666 6.42297 5.58633 8.7255C5.11595 9.0687 4.68988 9.23591 4.30815 9.22715C3.88731 9.21749 3.0778 8.97433 2.476 8.76648C1.73788 8.51155 1.15124 8.37676 1.20232 7.94381C1.22893 7.7183 1.5212 7.48767 2.07915 7.25192Z' fill='%233B4152'/%3E%3C/svg%3E");
}
`
  const stubArgs = {
    gameTitle: 'Trexrunner',
    gameDescription:
      '🦖 Lonely T-Rex continuously moves from left to right across a black-and-white desert landscape, with the player attempting to avoid oncoming obstacles such as cacti and Pteranodons by jumping or ducking.',
    gameCover: 'https://storage.googleapis.com/playdeck-static-storage-bucket-3f781a4/g/trex-cool.png',
    isFavorite: false,
    gameShortName: 'trexrunner',
    locale: 'en',
    //gameToken: 'SEZoVEhnUHBxQQ==:BOiGkBcTnCsKt1N',
    //id: '74882337',
    //nickname: '',
    isFavorite: 'true',
  }
  const parseArgs = (names) => {
    const args = {}
    const searchParams = new URLSearchParams(decodeURI(window.location.search))
    names.forEach((name) => {
      args[name] = searchParams.get(name) ?? stubArgs[name] ?? ''
    })
    return args
  }
})()
