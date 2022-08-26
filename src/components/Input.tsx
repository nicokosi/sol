import {useBoolean} from 'hooks'
import React, {FC, MutableRefObject} from 'react'
import {TextInput, TextInputProps, View, ViewStyle} from 'react-native'
import tw from 'tailwind'

interface Props extends TextInputProps {
  inputRef?: MutableRefObject<TextInput | null>
  style?: ViewStyle
  inputStyle?: ViewStyle
  bordered?: boolean
}

export const Input: FC<Props> = ({
  inputRef,
  style,
  inputStyle,
  bordered,
  autoFocus,
  ...props
}) => {
  const [focused, focusOn, focusOff] = useBoolean(autoFocus)
  const [hovered, hoverOn, hoverOff] = useBoolean(false)
  return (
    <View
      //@ts-ignore
      onMouseEnter={hoverOn}
      //@ts-ignore
      onMouseLeave={hoverOff}
      style={tw.style(
        'w-full rounded bg-transparent px-2 h-7 justify-center',
        {
          'border border-lightBorder dark:border-darkBorder':
            !!bordered && !focused && !hovered,
          'border border-blue-500': !!bordered && !!focused,
          'border border-gray-500': !!bordered && !focused && !!hovered,
        },
        style,
      )}>
      <TextInput
        // @ts-ignore
        enableFocusRing={false}
        ref={inputRef}
        onFocus={focusOn}
        onBlur={focusOff}
        style={[tw`text-sm`, inputStyle]}
        autoFocus={autoFocus}
        placeholderTextColor={tw.color('text-gray-400')}
        {...props}
      />
    </View>
  )
}
