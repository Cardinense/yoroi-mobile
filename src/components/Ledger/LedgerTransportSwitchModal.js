// @flow

import React from 'react'
import {View, ScrollView, Platform} from 'react-native'
import {injectIntl, defineMessages, type IntlShape} from 'react-intl'
import DeviceInfo from 'react-native-device-info'

import {Text, Button, Modal} from '../UiKit'
import {CONFIG} from '../../config/config'
import {type PressEvent} from 'react-native/Libraries/Types/CoreEventTypes'

import styles from './styles/LedgerTransportSwitchModal.style'

const messages = defineMessages({
  title: {
    id: 'components.ledger.ledgertransportswitchmodal.title',
    defaultMessage: '!!!Choose Connection Method',
  },
  usbExplanation: {
    id: 'components.ledger.ledgertransportswitchmodal.usbExplanation',
    defaultMessage:
      '!!!Choose this option if you want to connect to a Ledger Nano model X ' +
      'or S using an on-the-go USB cable adaptor:',
  },
  usbButton: {
    id: 'components.ledger.ledgertransportswitchmodal.usbButton',
    defaultMessage: '!!!Connect with USB',
  },
  usbButtonNotSupported: {
    id: 'components.ledger.ledgertransportswitchmodal.usbButtonNotSupported',
    defaultMessage: '!!!Connect with USB\n(Not supported)',
  },
  usbButtonDisabled: {
    id: 'components.ledger.ledgertransportswitchmodal.usbButtonDisabled',
    defaultMessage: '!!!Connect with USB\n(Blocked by Apple for iOS)',
  },
  bluetoothExplanation: {
    id: 'components.ledger.ledgertransportswitchmodal.bluetoothExplanation',
    defaultMessage: '!!!Choose this option if you want to connect to a Ledger Nano model X through Bluetooth:',
  },
  bluetoothButton: {
    id: 'components.ledger.ledgertransportswitchmodal.bluetoothButton',
    defaultMessage: '!!!Connect with Bluetooth',
  },
})

type Props = {|
  onSelectUSB: (event: PressEvent) => any,
  onSelectBLE: (event: PressEvent) => any,
|}

const useIsUsbSupported = () => {
  const [isUSBSupported, setUSBSupported] = React.useState(false)
  React.useEffect(() => {
    DeviceInfo.getApiLevel().then((sdk) =>
      setUSBSupported(Platform.OS === 'android' && sdk >= CONFIG.HARDWARE_WALLETS.LEDGER_NANO.USB_MIN_SDK),
    )
  }, [])

  return isUSBSupported
}

const LedgerTransportSwitchView = ({intl, onSelectUSB, onSelectBLE}: {...Props, intl: IntlShape}) => {
  const isUSBSupported = useIsUsbSupported()

  const getUsbButtonTitle = (): string => {
    if (Platform.OS === 'ios') {
      return intl.formatMessage(messages.usbButtonDisabled)
    } else if (!CONFIG.HARDWARE_WALLETS.LEDGER_NANO.ENABLE_USB_TRANSPORT || !isUSBSupported) {
      return intl.formatMessage(messages.usbButtonNotSupported)
    } else {
      return intl.formatMessage(messages.usbButton)
    }
  }

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.content}>
        <View style={styles.heading}>
          <Text style={styles.title}>{intl.formatMessage(messages.title)}</Text>
        </View>
        <Text style={styles.paragraph}>{intl.formatMessage(messages.usbExplanation)}</Text>
        <Button
          block
          onPress={onSelectUSB}
          title={getUsbButtonTitle()}
          disabled={!isUSBSupported || !CONFIG.HARDWARE_WALLETS.LEDGER_NANO.ENABLE_USB_TRANSPORT}
          style={styles.button}
        />
        <Text style={styles.paragraph}>{intl.formatMessage(messages.bluetoothExplanation)}</Text>
        <Button
          block
          onPress={onSelectBLE}
          title={intl.formatMessage(messages.bluetoothButton)}
          style={styles.button}
        />
      </View>
    </ScrollView>
  )
}

export const LedgerTransportSwitch = injectIntl(LedgerTransportSwitchView)

type ModalProps = {|
  visible: boolean,
  onRequestClose: () => any,
  showCloseIcon?: boolean,
  ...Props,
|}

const LedgerTransportSwitchModal = ({visible, onSelectUSB, onSelectBLE, onRequestClose, showCloseIcon}: ModalProps) => (
  <Modal visible={visible} onRequestClose={onRequestClose} showCloseIcon={showCloseIcon}>
    <LedgerTransportSwitch onSelectUSB={onSelectUSB} onSelectBLE={onSelectBLE} />
  </Modal>
)

export default LedgerTransportSwitchModal
