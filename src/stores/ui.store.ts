import {makeAutoObservable, runInAction, toJS, autorun} from 'mobx'
import {IRootStore} from 'Store'
import {INativeEvent, solNative} from 'lib/SolNative'
import {AsyncStorage, Linking, Clipboard} from 'react-native'
import {CONSTANTS} from 'lib/constants'
import {getCurrentWeather} from 'lib/weather'
import Fuse from 'fuse.js'
import {doubleTranslate} from 'lib/translator'
import {Parser} from 'expr-eval'

const exprParser = new Parser()

const FUSE_OPTIONS = {
  threshold: 0.2,
  ignoreLocation: true,
  keys: ['name'],
}

// export const PIPE_OPTIONS = [
//   {
//     title: 'Translate',
//   },
//   {
//     title: 'Google',
//   },
// ]

export const FAVOURITES = [
  {
    title: 'Mail',
    callback: () => {
      Linking.openURL('https://mail.protonmail.com/u/0/inbox')
    },
  },
  {
    title: 'PL',
    callback: () => {
      Linking.openURL('vscode://file/Users/osp/Developer/productlane')
    },
  },
  {
    title: 'PL Admin',
    callback: () => {
      Linking.openURL('https://productlane.io/admin')
    },
  },
  {
    title: 'Sol',
    callback: () => {
      Linking.openURL('vscode://file/Users/osp/Developer/sol')
    },
  },
]

const MEETING_PROVIDERS_URLS = [
  'https://us06web.zoom.us',
  'https://meet.google.com',
  'https://meet.ffmuc.net',
]

export enum FocusableWidget {
  SEARCH = 'SEARCH',
  TODOS = 'TODOS',
  CALENDAR = 'CALENDAR',
  WEATHER = 'WEATHER',
}

export enum ItemType {
  APPLICATION = 'APPLICATION',
  CONFIGURATION = 'CONFIGURATION',
}

interface IApp {
  url: string
  type: ItemType.APPLICATION
  name: string
}

interface IItem {
  icon?: string
  url?: string
  type: ItemType
  name: string
  callback?: () => void
}

function extractLinkFromDescription(text?: string, location?: string) {
  let link = text
    ?.replace(/\n/g, ' ')
    .split(' ')
    .filter(token => CONSTANTS.REGEX_VALID_URL.test(token))
    .find(link =>
      MEETING_PROVIDERS_URLS.some(baseUrl => link.includes(baseUrl)),
    )

  if (!link && !!location) {
    const isLocationUrl = CONSTANTS.REGEX_VALID_URL.test(location)
    if (isLocationUrl) {
      link = location
    }
  }

  return link
}

export let createUIStore = (root: IRootStore) => {
  const persist = async () => {
    const plainState = toJS(store)

    AsyncStorage.setItem('@ui.store', JSON.stringify(plainState))
  }

  let hydrate = async () => {
    const storeState = await AsyncStorage.getItem('@ui.store')

    if (storeState) {
      let parsedStore = JSON.parse(storeState)

      runInAction(() => {
        store.minimalistMode = parsedStore.minimalistMode
        store.frequencies = parsedStore.frequencies
      })
    }
  }

  const SETTING_ITEMS: IItem[] = [
    {
      icon: '☯️',
      name: 'Turn on minimalism',
      type: ItemType.CONFIGURATION,
      callback: () => {
        store.toggleMinimalist()
      },
    },
    {
      icon: '🌕',
      name: 'Dark mode',
      type: ItemType.CONFIGURATION,
      callback: () => {
        solNative.toggleDarkMode()
      },
    },
    {
      icon: '💤',
      name: 'Sleep',
      type: ItemType.CONFIGURATION,
      callback: () => {
        solNative.executeAppleScript('tell application "Finder" to sleep')
      },
    },
    {
      icon: '💻',
      name: 'AirDrop',
      type: ItemType.CONFIGURATION,
      callback: () => {
        solNative.executeAppleScript(`tell application "Finder"
        if exists window "AirDrop" then
                tell application "System Events" to ¬
                        tell application process "Finder" to ¬
                                perform action "AXRaise" of ¬
                                        (windows whose title is "AirDrop")
        else if (count Finder windows) > 0 then
                make new Finder window
                tell application "System Events" to ¬
                        click menu item "AirDrop" of menu 1 of menu bar item ¬
                                "Go" of menu bar 1 of application process "Finder"
        else
                tell application "System Events" to ¬
                        click menu item "AirDrop" of menu 1 of menu bar item ¬
                                "Go" of menu bar 1 of application process "Finder"
        end if
        activate
end tell`)
      },
    },
  ]

  let store = makeAutoObservable({
    //    ____  _                              _     _
    //   / __ \| |                            | |   | |
    //  | |  | | |__  ___  ___ _ ____   ____ _| |__ | | ___  ___
    //  | |  | | '_ \/ __|/ _ \ '__\ \ / / _` | '_ \| |/ _ \/ __|
    //  | |__| | |_) \__ \  __/ |   \ V / (_| | |_) | |  __/\__ \
    //   \____/|_.__/|___/\___|_|    \_/ \__,_|_.__/|_|\___||___/
    visible: false as boolean,
    query: '' as string,
    selectedIndex: 0 as number,
    minimalistMode: false as boolean,
    focusedWidget: FocusableWidget.SEARCH as FocusableWidget,
    events: [] as INativeEvent[],
    currentTemp: 0 as number,
    nextHourForecast: null as null | string,
    apps: [] as IApp[],
    isLoading: false as boolean,
    translationResults: null as null | {
      en: string | undefined
      de: string | undefined
    },
    frequencies: {} as Record<string, number>,
    temporaryResult: null as string | null,
    track: null as
      | {title: string; artist: string; artwork: string}
      | null
      | undefined,
    commandPressed: false as boolean,
    //    _____                            _           _
    //   / ____|                          | |         | |
    //  | |     ___  _ __ ___  _ __  _   _| |_ ___  __| |
    //  | |    / _ \| '_ ` _ \| '_ \| | | | __/ _ \/ _` |
    //  | |___| (_) | | | | | | |_) | |_| | ||  __/ (_| |
    //   \_____\___/|_| |_| |_| .__/ \__,_|\__\___|\__,_|
    //                        | |
    //                        |_|
    get items(): IItem[] {
      if (store.query) {
        let results = new Fuse([...store.apps, ...SETTING_ITEMS], {
          ...FUSE_OPTIONS,
          sortFn: (a: any, b: any) => {
            const freqA = store.frequencies[a.item[0].v] ?? 0
            const freqB = store.frequencies[b.item[0].v] ?? 0
            return freqB - freqA
          },
        })
          .search(store.query)
          .map(r => r.item)

        if (results.length === 0) {
          return [
            {
              icon: '🌎',
              name: 'Google',
              type: ItemType.CONFIGURATION,
              callback: () => {
                Linking.openURL(`https://google.com/search?q=${store.query}`)
              },
            },
          ]
        }

        return results
      } else {
        return [...store.apps, ...SETTING_ITEMS].sort((a, b) => {
          const freqA = store.frequencies[a.name] ?? 0
          const freqB = store.frequencies[b.name] ?? 0
          return freqB - freqA
        })
      }
    },
    //                _   _
    //      /\       | | (_)
    //     /  \   ___| |_ _  ___  _ __  ___
    //    / /\ \ / __| __| |/ _ \| '_ \/ __|
    //   / ____ \ (__| |_| | (_) | | | \__ \
    //  /_/    \_\___|\__|_|\___/|_| |_|___/
    toggleMinimalist: () => {
      store.minimalistMode = !store.minimalistMode
    },
    setFocus: (widget: FocusableWidget) => {
      store.focusedWidget = widget
    },
    setQuery: (query: string) => {
      store.focusedWidget = FocusableWidget.SEARCH
      store.query = query
      store.selectedIndex = 0

      try {
        const res = exprParser.evaluate(store.query)
        if (res) {
          store.temporaryResult = res.toString()
        } else {
          store.temporaryResult = null
        }
      } catch (e) {
        store.temporaryResult = null
      }
    },
    keyDown: async ({
      keyCode,
      meta,
    }: {
      key: string
      keyCode: number
      meta: boolean
    }) => {
      // esc = "\u{1B}" or 53
      // arrow up = "" or 126
      // arrow down = "" or 125
      // tab = "\t" or 48
      // enter = "\r" or 36
      // command = "command" or 55
      // console.warn('key pressed', keyCode)

      switch (keyCode) {
        // tab
        case 48: {
          let nextWidget = store.focusedWidget
          switch (store.focusedWidget) {
            case FocusableWidget.SEARCH:
              if (!!store.events.length) {
                if (store.events[0].isAllDay) {
                  store.selectedIndex = 1
                } else {
                  store.selectedIndex = 0
                }
                nextWidget = FocusableWidget.CALENDAR
              }
              break
            case FocusableWidget.CALENDAR:
              store.selectedIndex = 0
              nextWidget = FocusableWidget.SEARCH
              break
          }

          store.focusedWidget = nextWidget

          break
        }

        // Enter key
        case 36: {
          switch (store.focusedWidget) {
            case FocusableWidget.CALENDAR: {
              const event = store.events[store.selectedIndex]
              if (event) {
                let eventLink = event.url
                if (!eventLink && event.notes) {
                  eventLink = extractLinkFromDescription(event.notes)
                }
                if (eventLink) {
                  Linking.openURL(eventLink)
                } else {
                  Linking.openURL('ical://')
                }
              } else {
                Linking.openURL('ical://')
              }
              break
            }

            case FocusableWidget.SEARCH: {
              if (store.translationResults) {
                if (store.selectedIndex === 0) {
                  Clipboard.setString(store.translationResults.en!)
                } else {
                  Clipboard.setString(store.translationResults.de!)
                }
                solNative.hideWindow()
                store.translationResults = null
              } else {
                const item = store.items[store.selectedIndex]
                if (item.url) {
                  solNative.openFile(item.url)
                } else if (item.callback) {
                  item.callback()
                }

                // bump frequency
                store.frequencies[item.name] = store.frequencies[item.name]
                  ? store.frequencies[item.name] + 1
                  : 1
                solNative.hideWindow()
              }
              break
            }
          }

          break
        }

        // escape
        case 53: {
          if (store.query && store.translationResults) {
            store.query = ''
            store.translationResults = null
          } else {
            store.focusedWidget = FocusableWidget.SEARCH
            solNative.hideWindow()
          }
          break
        }

        // arrow up
        case 126: {
          store.selectedIndex = Math.max(0, store.selectedIndex - 1)
          break
        }

        // arrow down
        case 125: {
          switch (store.focusedWidget) {
            case FocusableWidget.SEARCH: {
              if (store.translationResults) {
                store.selectedIndex = (store.selectedIndex + 1) % 2
              } else {
                store.selectedIndex = Math.min(
                  store.items.length - 1,
                  store.selectedIndex + 1,
                )
              }
              break
            }

            case FocusableWidget.CALENDAR: {
              store.selectedIndex = Math.min(2, store.selectedIndex + 1)
              break
            }
          }
          break
        }

        // "1"
        case 18: {
          if (meta) {
            if (store.query) {
              store.isLoading = true
              try {
                const translations = await doubleTranslate(store.query)
                runInAction(() => {
                  store.translationResults = translations
                  store.selectedIndex = 0
                })
              } catch (e) {
              } finally {
                runInAction(() => {
                  store.isLoading = false
                })
              }
            } else {
              FAVOURITES[0].callback()
            }
          }
          break
        }

        // "2"
        case 19: {
          if (meta) {
            if (store.query) {
              Linking.openURL(`https://google.com/search?q=${store.query}`)
              store.query = ''
            } else {
              FAVOURITES[1].callback()
            }
          }
          break
        }

        // "3"
        case 20: {
          if (meta) {
            if (store.query) {
              Linking.openURL(`https://google.com/search?q=${store.query}`)
              store.query = ''
            } else {
              FAVOURITES[2].callback()
            }
          }
          break
        }

        // "4"
        case 21: {
          if (meta) {
            FAVOURITES[3].callback()
          }
          break
        }

        // "5"
        case 23: {
          if (meta) {
            FAVOURITES[4].callback()
          }
          break
        }

        case 55: {
          store.commandPressed = true
          break
        }
      }
    },
    keyUp: async ({
      keyCode,
      meta,
    }: {
      key: string
      keyCode: number
      meta: boolean
    }) => {
      switch (keyCode) {
        case 55:
          store.commandPressed = false
          break

        default:
          break
      }
    },
    onShow: () => {
      runInAction(() => {
        store.visible = true
      })

      solNative
        .getNextEvents()
        .then(events => {
          runInAction(() => {
            store.events = events
          })
        })
        .catch(e => {
          console.warn('Error getting events', e)
        })

      getCurrentWeather().then(res => {
        runInAction(() => {
          store.currentTemp = res?.temp ? Math.round(res.temp) : 0
          store.nextHourForecast = res?.nextHourForecast ?? null
        })
      })

      solNative.getMediaInfo().then(res => {
        runInAction(() => {
          store.track = res
        })
      })

      solNative.getApps().then(apps => {
        // Each "app" is a macOS file url, e.g. file:///Applications/SF%20Symbols
        const cleanApps = apps.map(url => {
          const pureUrl = decodeURI(url.replace('file://', ''))
          const tokens = pureUrl.split('/')
          return {
            type: ItemType.APPLICATION as ItemType.APPLICATION,
            url: pureUrl,
            name: tokens[tokens.length - 2].replace('.app', ''),
          }
        })

        runInAction(() => {
          store.apps = cleanApps
        })
      })
    },
    onHide: () => {
      store.focusedWidget = FocusableWidget.SEARCH
      store.setQuery('')
      store.selectedIndex = 0
      store.translationResults = null
      store.visible = false
    },
  })

  hydrate().then(() => {
    autorun(persist)
  })

  solNative.addListener('keyDown', store.keyDown)
  solNative.addListener('keyUp', store.keyUp)
  solNative.addListener('onShow', store.onShow)
  solNative.addListener('onHide', store.onHide)

  return store
}
