// @flow

import React from 'react'
import {useSelector, useDispatch} from 'react-redux'
import {View, ScrollView} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import {injectIntl, defineMessages, type IntlShape} from 'react-intl'

import {Button, TextInput} from '../UiKit'
import {walletNameSelector, walletNamesSelector} from '../../selectors'
import {changeWalletName} from '../../actions'
import {getWalletNameError, validateWalletName} from '../../utils/validators'
import globalMessages from '../../i18n/global-messages'

import styles from './styles/ChangeWalletName.style'

import type {Navigation} from '../../types/navigation'

const WalletNameInput = TextInput

const messages = defineMessages({
  changeButton: {
    id: 'components.settings.changewalletname.changeButton',
    defaultMessage: '!!!Change name',
  },
  walletNameInputLabel: {
    id: 'components.settings.changewalletname.walletNameInputLabel',
    defaultMessage: '!!!Wallet name',
  },
})

type Props = {
  intl: IntlShape,
  navigation: Navigation,
}

const ChangeWalletName = ({intl, navigation}: Props) => {
  const oldWalletName = useSelector(walletNameSelector)
  const walletNames = useSelector(walletNamesSelector)
  const [newWalletName, setNewWalletName] = React.useState(oldWalletName)
  const validationErrors = validateWalletName(newWalletName, oldWalletName, walletNames)
  const hasErrors = Object.keys(validationErrors).length > 0

  const errorText =
    getWalletNameError(
      {
        tooLong: intl.formatMessage(globalMessages.walletNameErrorTooLong),
        nameAlreadyTaken: intl.formatMessage(globalMessages.walletNameErrorNameAlreadyTaken),
        mustBeFilled: intl.formatMessage(globalMessages.walletNameErrorMustBeFilled),
      },
      validationErrors,
    ) || undefined

  const dispatch = useDispatch()
  const changeAndNavigate = async () => {
    if (hasErrors) return

    await dispatch(changeWalletName(newWalletName))
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.safeAreaView} edges={['left', 'right', 'bottom']}>
      <ScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps={'always'}
        contentContainerStyle={styles.scrollContentContainer}
      >
        <WalletNameInput
          returnKeyType={'done'}
          errorDelay={0}
          enablesReturnKeyAutomatically
          autoFocus
          label={intl.formatMessage(messages.walletNameInputLabel)}
          value={newWalletName}
          onChangeText={setNewWalletName}
          errorText={errorText}
        />
      </ScrollView>

      <View style={styles.action}>
        <Button onPress={changeAndNavigate} title={intl.formatMessage(messages.changeButton)} disabled={hasErrors} />
      </View>
    </SafeAreaView>
  )
}

export default injectIntl(ChangeWalletName)
