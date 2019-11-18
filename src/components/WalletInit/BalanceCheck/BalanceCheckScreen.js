// @flow

import React from 'react'
import {View, ScrollView} from 'react-native'
import {compose} from 'redux'
import {connect} from 'react-redux'
import {withHandlers, withStateHandlers} from 'recompose'
import {SafeAreaView} from 'react-navigation'
import {injectIntl, defineMessages, intlShape} from 'react-intl'
import _ from 'lodash'

import {Text, Button, ValidatedTextInput, StatusBar, Banner} from '../../UiKit'
import BalanceCheckModal from './BalanceCheckModal'
import {CONFIG} from '../../../config'
import {
  validateRecoveryPhrase,
  INVALID_PHRASE_ERROR_CODES,
  // cleanMnemonic,
} from '../../../utils/validators'
import {withNavigationTitle} from '../../../utils/renderUtils'
import {isKeyboardOpenSelector} from '../../../selectors'

import styles from './styles/BalanceCheckScreen.style'

import type {InvalidPhraseError} from '../../../utils/validators'
import type {ComponentType} from 'react'
import type {Navigation} from '../../../types/navigation'

const mnemonicInputErrorsMessages = defineMessages({
  TOO_LONG: {
    id: 'components.walletinit.restorewallet.restorewalletscreen.toolong',
    defaultMessage: '!!!Phrase is too long. ',
    description: 'some desc',
  },
  TOO_SHORT: {
    id: 'components.walletinit.restorewallet.restorewalletscreen.tooshort',
    defaultMessage: '!!!Phrase is too short. ',
    description: 'some desc',
  },
  INVALID_CHECKSUM: {
    id:
      'components.walletinit.restorewallet.restorewalletscreen.invalidchecksum',
    defaultMessage: '!!!Please enter valid mnemonic.',
    description: 'some desc',
  },
  UNKNOWN_WORDS: {
    id: 'components.walletinit.restorewallet.restorewalletscreen.unknowwords',
    defaultMessage: '!!!{wordlist} {cnt, plural, one {is} other {are}} invalid',
    description: 'some desc',
  },
})

const messages = defineMessages({
  title: {
    id: 'components.walletinit.balancecheck.balancecheckscreen.title',
    defaultMessage: '!!!Balance Check',
    description: 'some desc',
  },
  mnemonicInputLabel: {
    id:
      'components.walletinit.balancecheck.balancecheckscreen.mnemonicInputLabel',
    defaultMessage: '!!!Recovery phrase',
    description: 'some desc',
  },
  confirmButton: {
    id: 'components.walletinit.balancecheck.balancecheckscreen.confirmButton',
    defaultMessage: '!!!Confirm',
    description: 'some desc',
  },
  instructions: {
    id: 'components.walletinit.balancecheck.balancecheckscreen.instructions',
    defaultMessage:
      '!!!Enter the 15-word recovery phrase used to back up your other wallet ' +
      'to restore the balance and transfer all the funds to current wallet. ',
    description: 'some desc',
  },
})

// TODO: these are just placeholders for UI render testing
const testAddresses = [
  '2cWKMJemoBakWtKxxsZpnEhs3ZWRf9tG3R9ReJX6UsAGiZP7PBpmutxYPRAakqEgMsK1g',
  '2cWKMJemoBahkhQS5QofBQxmsQMQDTxv1xzzqU9eHXBx6aDxaswBEksqurrfwhMNTYVFK',
  '2cWKMJemoBahVMF121P6j54LjjKua29QGK6RpXZkxfaBLHExkGDuJ25wcC8vc2ExfuzLp',
]
const testBalance = 1233464.123

const _translateInvalidPhraseError = (intl: any, error: InvalidPhraseError) => {
  if (error.code === INVALID_PHRASE_ERROR_CODES.UNKNOWN_WORDS) {
    return intl.formatMessage(mnemonicInputErrorsMessages.UNKNOWN_WORDS, {
      cnt: error.words.length,
      wordlist: error.words.map((word) => `'${word}'`).join(', '),
    })
  } else {
    return intl.formatMessage(mnemonicInputErrorsMessages[error.code])
  }
}

const errorsVisibleWhileWriting = (errors) => {
  return errors
    .map((error) => {
      if (error.code !== INVALID_PHRASE_ERROR_CODES.UNKNOWN_WORDS) return error
      if (!error.lastMightBeUnfinished) return error
      // $FlowFixMe flow does not like null here
      if (error.words.length <= 1) return null
      return {
        code: error.code,
        words: _.initial(error.words),
        lastMightBeUnfinished: error.lastMightBeUnfinished,
      }
    })
    .filter((error) => !!error)
}

const BalanceCheckScreen = ({
  intl,
  phrase,
  setPhrase,
  translateInvalidPhraseError,
  isKeyboardOpen,
  showSuccessModal,
  openSuccessModal,
  closeSucessModal,
  addresses,
  balance,
}) => {
  const errors = validateRecoveryPhrase(phrase)
  const visibleErrors = isKeyboardOpen
    ? errorsVisibleWhileWriting(errors.invalidPhrase || [])
    : errors.invalidPhrase || []

  const errorText = visibleErrors
    .map((error) => translateInvalidPhraseError(error))
    .join(' ')

  return (
    <>
      <SafeAreaView style={styles.safeAreaView}>
        <StatusBar type="dark" />
        <Banner error text="You are on the Shelley Balance Check Testnet" />

        <ScrollView keyboardDismissMode="on-drag">
          <View style={styles.container}>
            <Text>{intl.formatMessage(messages.instructions)}</Text>
            <ValidatedTextInput
              multiline
              numberOfLines={3}
              style={styles.phrase}
              value={phrase}
              onChangeText={setPhrase}
              placeholder={intl.formatMessage(messages.mnemonicInputLabel)}
              blurOnSubmit
              error={errorText}
              autoCapitalize="none"
              keyboardType="visible-password"
              // hopefully this prevents keyboard from learning the mnemonic
              autoCorrect={false}
            />
          </View>
        </ScrollView>

        <Button
          // TODO: replace by a handler that actually checks the balance
          onPress={openSuccessModal}
          title={intl.formatMessage(messages.confirmButton)}
          disabled={!_.isEmpty(errors)}
          shelleyTheme
        />
      </SafeAreaView>
      <BalanceCheckModal
        visible={showSuccessModal}
        onRequestClose={closeSucessModal}
        addresses={addresses}
        balance={balance}
      />
    </>
  )
}

export default injectIntl(
  (compose(
    connect((state) => ({
      isKeyboardOpen: isKeyboardOpenSelector(state),
    })),
    withNavigationTitle(({intl}) => intl.formatMessage(messages.title)),
    withStateHandlers(
      {
        showSuccessModal: false,
        // TODO
        addresses: testAddresses,
        balance: testBalance,
        phrase: CONFIG.DEBUG.PREFILL_FORMS ? CONFIG.DEBUG.MNEMONIC1 : '',
      },
      {
        openSuccessModal: (state) => () => ({showSuccessModal: true}),
        closeSucessModal: (state) => () => ({showSuccessModal: false}),
        setPhrase: (state) => (value) => ({phrase: value}),
      },
    ),
    withHandlers({
      translateInvalidPhraseError: ({intl}) => (error) =>
        _translateInvalidPhraseError(intl, error),
    }),
  )(BalanceCheckScreen): ComponentType<{
    navigation: Navigation,
    intl: intlShape,
  }>),
)