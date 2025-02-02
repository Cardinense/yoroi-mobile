// @flow

import React from 'react'
import {StyleSheet, View} from 'react-native'

import {storiesOf} from '@storybook/react-native'

import ToggleEasyConfirmationScreen from './ToggleEasyConfirmationScreen'

const styles = StyleSheet.create({
  toggleEasyConfirmationScreen: {
    flex: 1,
  },
})

storiesOf('ToggleEasyConfirmationScreen', module)
  .addDecorator((getStory) => <View style={styles.toggleEasyConfirmationScreen}>{getStory()}</View>)
  .add('Default', ({navigation}) => <ToggleEasyConfirmationScreen navigation={navigation} />)
