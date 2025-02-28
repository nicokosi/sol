import {solNative} from 'lib/SolNative'
import {observer} from 'mobx-react-lite'
import React, {useEffect} from 'react'
import {Linking, Text, TouchableOpacity, View} from 'react-native'
import {useStore} from 'store'
import {Widget} from 'stores/ui.store'
import tw from 'tailwind'
import {useDeviceContext} from 'twrnc'
import {CalendarWidget} from 'widgets/calendar.widget'
import {ClipboardWidget} from 'widgets/clipboard.widget'
import {CreateItemWidget} from 'widgets/createItem.widget'
import {EmojisWidget} from 'widgets/emojis.widget'
import {GeneralWidget} from 'widgets/general.widget'
import {GifsWidget} from 'widgets/gifs.widget'
import {GoogleMapWidget} from 'widgets/googleMap.widget'
import {OnboardingWidget} from 'widgets/onboarding.widget'
import {ProjectCreationWidget} from 'widgets/projectCreation.widget'
import {ProjectSelectWidget} from 'widgets/projectSelect.widget'
import {ScratchpadWidget} from 'widgets/scratchpad.widget'
import {SearchWidget} from 'widgets/search.widget'
import {SettingsWidget} from 'widgets/settings.widget'
import {TranslationWidget} from 'widgets/translation.widget'

export const RootContainer = observer(() => {
  useDeviceContext(tw)
  const store = useStore()
  const mainStyle = tw`bg-light dark:bg-dark`
  const calendarVisible =
    (store.ui.calendarAuthorizationStatus === 'authorized' ||
      store.ui.calendarAuthorizationStatus === 'notDetermined') &&
    store.ui.calendarEnabled &&
    !store.ui.query

  const widget = store.ui.focusedWidget

  useEffect(() => {
    return () => {
      store.ui.cleanUp()
    }
  }, [])

  if (widget === Widget.CLIPBOARD) {
    return <ClipboardWidget style={mainStyle} />
  }

  if (widget === Widget.GIFS) {
    return <GifsWidget style={mainStyle} />
  }

  if (widget === Widget.EMOJIS) {
    return <EmojisWidget style={mainStyle} />
  }

  if (widget === Widget.SCRATCHPAD) {
    return <ScratchpadWidget style={mainStyle} />
  }

  if (widget === Widget.GOOGLE_MAP) {
    return <GoogleMapWidget />
  }

  if (widget === Widget.CREATE_ITEM) {
    return <CreateItemWidget style={mainStyle} />
  }

  if (widget === Widget.ONBOARDING) {
    return <OnboardingWidget style={mainStyle} />
  }

  if (widget === Widget.PROJECT_CREATION) {
    return <ProjectCreationWidget style={mainStyle} />
  }

  if (widget === Widget.PROJECT_SELECT) {
    return <ProjectSelectWidget style={mainStyle} />
  }

  if (widget === Widget.TRANSLATION) {
    return <TranslationWidget style={mainStyle} />
  }

  if (widget === Widget.SETTINGS) {
    return <SettingsWidget />
  }

  return (
    <View
      style={tw.style(mainStyle, {
        'h-[125]': !!store.ui.query,
      })}
      onLayout={e => {
        if (e.nativeEvent.layout.height !== 0) {
          if (!!store.ui.query) {
            solNative.setWindowHeight(500)
          } else {
            solNative.setWindowHeight(Math.round(e.nativeEvent.layout.height))
          }
        }
      }}>
      <SearchWidget />

      {!!store.ui.items.length &&
        !!Object.entries(store.calendar.groupedEvents).length && (
          <View className="border-t border-lightBorder dark:border-darkBorder" />
        )}

      {calendarVisible && <CalendarWidget />}
      {!store.ui.isAccessibilityTrusted && (
        <>
          <View className="w-full border-lightBorder dark:border-darkBorder border-t" />
          <TouchableOpacity
            onPress={() => {
              solNative.requestAccessibilityAccess()
              solNative.hideWindow()
            }}>
            <Text className="text-xs px-3 py-2">
              Click to grant accessibility access
            </Text>
          </TouchableOpacity>
        </>
      )}
      {!store.ui.hasFullDiskAccess && (
        <>
          <View className="w-full border-lightBorder dark:border-darkBorder border-t" />
          <TouchableOpacity
            onPress={() => {
              Linking.openURL(
                'x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles',
              )
              solNative.hideWindow()
            }}>
            <Text className="text-xs px-3 py-2">
              Click to grant full disk access{' '}
              <Text className="text-xs dark:text-neutral-500">
                (needed to read Safari bookmarks)
              </Text>
            </Text>
          </TouchableOpacity>
        </>
      )}
      {store.ui.showHintBar && <GeneralWidget />}
    </View>
  )
})
