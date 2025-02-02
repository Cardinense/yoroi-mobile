// @flow

import React, {useState} from 'react'
import {useSelector} from 'react-redux'
import {View, Linking, TouchableOpacity, LayoutAnimation, Image} from 'react-native'
import _ from 'lodash'
import {injectIntl, defineMessages, type IntlShape} from 'react-intl'
import {BigNumber} from 'bignumber.js'

import {
  transactionsInfoSelector,
  internalAddressIndexSelector,
  externalAddressIndexSelector,
  walletMetaSelector,
  tokenInfoSelector,
  defaultNetworkAssetSelector,
} from '../../selectors'
import {formatTokenWithSymbol} from '../../utils/format'
import {Text, Button, OfflineBanner, Banner, StatusBar} from '../UiKit'
import Screen from '../../components/Screen'
import {getNetworkConfigById} from '../../config/networks'
import AddressModal from '../Receive/AddressModal'
import AssetList from '../Common/MultiAsset/AssetList'
import assetListStyle from '../Common/MultiAsset/styles/AssetListTransaction.style'
import {MultiToken} from '../../crypto/MultiToken'

import styles from './styles/TxDetails.style'

import arrowUp from '../../assets/img/chevron_up.png'
import arrowDown from '../../assets/img/chevron_down.png'

import {TRANSACTION_DIRECTION, type Token} from '../../types/HistoryTransaction'
import globalMessages from '../../i18n/global-messages'

const txTypeMessages = defineMessages({
  SENT: {
    id: 'components.txhistory.txdetails.txTypeSent',
    defaultMessage: '!!!Sent funds',
  },
  RECEIVED: {
    id: 'components.txhistory.txdetails.txTypeReceived',
    defaultMessage: '!!!Received funds',
  },
  SELF: {
    id: 'components.txhistory.txdetails.txTypeSelf',
    defaultMessage: '!!!Intrawallet transaction',
  },
  MULTI: {
    id: 'components.txhistory.txdetails.txTypeMulti',
    defaultMessage: '!!!Multi-party transaction',
  },
})

const messages = defineMessages({
  addressPrefixReceive: {
    id: 'components.txhistory.txdetails.addressPrefixReceive',
    defaultMessage: '!!!/{idx}',
  },
  addressPrefixChange: {
    id: 'components.txhistory.txdetails.addressPrefixChange',
    defaultMessage: '!!!/change',
  },
  addressPrefixNotMine: {
    id: 'components.txhistory.txdetails.addressPrefixNotMine',
    defaultMessage: '!!!not mine',
  },
  fee: {
    id: 'components.txhistory.txdetails.fee',
    defaultMessage: '!!!Fee: ',
  },
  fromAddresses: {
    id: 'components.txhistory.txdetails.fromAddresses',
    defaultMessage: '!!!From Addresses',
  },
  toAddresses: {
    id: 'components.txhistory.txdetails.toAddresses',
    defaultMessage: '!!!To Addresses',
  },
  transactionId: {
    id: 'components.txhistory.txdetails.transactionId',
    defaultMessage: '!!!Transaction ID',
  },
  txAssuranceLevel: {
    id: 'components.txhistory.txdetails.txAssuranceLevel',
    defaultMessage: '!!!Transaction assurance level',
  },
  confirmations: {
    id: 'components.txhistory.txdetails.confirmations',
    defaultMessage: '!!!{cnt} {cnt, plural, one {CONFIRMATION} other {CONFIRMATIONS}}',
  },
  omittedCount: {
    id: 'components.txhistory.txdetails.omittedCount',
    defaultMessage: '!!!+ {cnt} omitted {cnt, plural, one {address} other {addresses}}',
  },
})

const Label = ({children}: {children: string}) => <Text style={styles.label}>{children}</Text>

const AdaAmount = ({amount, token}: {amount: BigNumber, token: Token}) => {
  const amountStyle = amount.gte(0) ? styles.positiveAmount : styles.negativeAmount

  return <Text style={amountStyle}>{formatTokenWithSymbol(amount, token)}</Text>
}

type AddressEntryProps = {
  address: any,
  path: any,
  isHighlighted: any,
  showModalForAddress: any,
}
const AddressEntry = ({address, path, isHighlighted, showModalForAddress}: AddressEntryProps) => {
  return (
    <TouchableOpacity activeOpacity={0.5} onPress={() => showModalForAddress(address)}>
      <Text secondary bold={isHighlighted}>
        ({path}) {address}
      </Text>
    </TouchableOpacity>
  )
}

const getShownAddresses = (intl, transaction, internalAddressIndex, externalAddressIndex) => {
  const isMyReceive = (address) => externalAddressIndex[address] != null
  const isMyChange = (address) => internalAddressIndex[address] != null
  const isMyAddress = (address) => isMyReceive(address) || isMyChange(address)

  const getPath = (address) => {
    if (isMyReceive(address)) {
      return intl.formatMessage(messages.addressPrefixReceive, {
        idx: externalAddressIndex[address],
      })
    } else if (isMyChange(address)) {
      return intl.formatMessage(messages.addressPrefixChange, {
        idx: internalAddressIndex[address],
      })
    } else {
      return intl.formatMessage(messages.addressPrefixNotMine)
    }
  }

  const {isHighlightedFrom, filterFrom, isHighlightedTo, filterTo} = {
    [TRANSACTION_DIRECTION.SENT]: {
      isHighlightedFrom: (_address) => false,
      filterFrom: null,
      isHighlightedTo: (address) => !isMyAddress(address),
      filterTo: null,
    },
    [TRANSACTION_DIRECTION.RECEIVED]: {
      isHighlightedFrom: (_address) => false,
      filterFrom: null,
      isHighlightedTo: (address) => isMyAddress(address),
      filterTo: (address) => isMyAddress(address),
    },
    [TRANSACTION_DIRECTION.SELF]: {
      isHighlightedFrom: (_address) => false,
      filterFrom: null,
      isHighlightedTo: (address) => !isMyChange(address),
      filterTo: null,
    },
    [TRANSACTION_DIRECTION.MULTI]: {
      isHighlightedFrom: (address) => isMyAddress(address),
      filterFrom: null,
      isHighlightedTo: (address) => isMyAddress(address),
      filterTo: null,
    },
  }[transaction.direction]

  // TODO(ppershing): decide on importance based on Tx direction
  const fromAddresses = _.uniq(transaction.inputs).map(({address, assets}) => ({
    address,
    assets,
    path: getPath(address),
    isHighlighted: isHighlightedFrom(address),
  }))
  const fromFiltered = fromAddresses.filter(({address}) => (filterFrom ? filterFrom(address) : true))
  const cntOmittedFrom = fromAddresses.length - fromFiltered.length

  const toAddresses = _.uniq(transaction.outputs).map(({address, assets}) => ({
    address,
    assets,
    path: getPath(address),
    isHighlighted: isHighlightedTo(address),
  }))
  const toFiltered = toAddresses.filter(({address}) => (filterTo ? filterTo(address) : true))
  const cntOmittedTo = toAddresses.length - toFiltered.length

  return {
    fromFiltered,
    cntOmittedFrom,
    toFiltered,
    cntOmittedTo,
  }
}

type RouterProps = {|
  navigation: any,
  route: any,
|}
type Props = {|
  intl: IntlShape,
|}
const TxDetails = ({intl, route}: Props & RouterProps) => {
  const transaction = useSelector(transactionsInfoSelector)[route.params.id]
  const internalAddressIndex = useSelector(internalAddressIndexSelector)
  const externalAddressIndex = useSelector(externalAddressIndexSelector)
  const walletMeta = useSelector(walletMetaSelector)
  const tokenMetadata = useSelector(tokenInfoSelector)
  const defaultNetworkAsset = useSelector(defaultNetworkAssetSelector)

  const [addressDetail, setAddressDetail] = React.useState(null)

  const openInExplorer = () => {
    if (transaction) {
      const networkConfig = getNetworkConfigById(walletMeta.networkId)
      // note: don't await on purpose
      Linking.openURL(networkConfig.EXPLORER_URL_FOR_TX(transaction.id))
    }
  }

  const showModalForAddress = (address) => {
    setAddressDetail(address)
  }

  const hideAddressModal = () => {
    setAddressDetail(null)
  }

  const {fromFiltered, cntOmittedFrom, toFiltered, cntOmittedTo} = getShownAddresses(
    intl,
    transaction,
    internalAddressIndex,
    externalAddressIndex,
  )
  const txFee: ?BigNumber = transaction.fee ? MultiToken.fromArray(transaction.fee).getDefault() : null
  const amountAsMT = MultiToken.fromArray(transaction.amount)
  const amount: BigNumber = amountAsMT.getDefault()
  const amountDefaultAsset: ?Token = tokenMetadata[amountAsMT.getDefaultId()]

  const defaultAsset = amountDefaultAsset || defaultNetworkAsset

  const [expandedIn, setExpandedIn] = useState(false)
  const [expandedOut, setExpandedOut] = useState(false)

  const toggleExpandIn = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpandedIn(!expandedIn)
  }

  const toggleExpandOut = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpandedOut(!expandedOut)
  }

  return (
    <View style={styles.container}>
      <StatusBar type="dark" />

      <OfflineBanner />
      <Screen scroll>
        <Banner label={intl.formatMessage(txTypeMessages[transaction.direction])}>
          <AdaAmount amount={amount} token={defaultAsset} />
          {txFee && (
            <Text small>
              {intl.formatMessage(messages.fee)} {formatTokenWithSymbol(txFee, defaultAsset)}
            </Text>
          )}
        </Banner>
        <View style={styles.content}>
          <Label>{intl.formatMessage(messages.fromAddresses)}</Label>
          {fromFiltered.map((item, i) => (
            <>
              <AddressEntry key={i} {...item} showModalForAddress={showModalForAddress} />
              {item.assets.length > 0 && (
                <TouchableOpacity style={styles.assetsExpandable} activeOpacity={0.5} onPress={() => toggleExpandIn()}>
                  <Text style={styles.assetsTitle}>
                    {` -${item.assets.length} ${intl.formatMessage(globalMessages.assetsLabel)} `}
                  </Text>
                  <Image source={expandedIn ? arrowUp : arrowDown} />
                </TouchableOpacity>
              )}
              {expandedIn && <AssetList styles={assetListStyle} assets={item.assets} assetsMetadata={tokenMetadata} />}
            </>
          ))}
          {cntOmittedFrom > 0 && <Text>{intl.formatMessage(messages.omittedCount, {cnt: cntOmittedFrom})}</Text>}

          <View style={styles.borderTop}>
            <Label>{intl.formatMessage(messages.toAddresses)}</Label>
          </View>
          {toFiltered.map((item, i) => (
            <>
              <AddressEntry key={i} {...item} showModalForAddress={showModalForAddress} />
              {item.assets.length > 0 && (
                <TouchableOpacity style={styles.assetsExpandable} activeOpacity={0.5} onPress={() => toggleExpandOut()}>
                  <Text style={styles.assetsTitle}>
                    {` +${item.assets.length} ${intl.formatMessage(globalMessages.assetsLabel)} `}
                  </Text>
                  <Image source={expandedOut ? arrowUp : arrowDown} />
                </TouchableOpacity>
              )}
              {expandedOut && <AssetList styles={assetListStyle} assets={item.assets} assetsMetadata={tokenMetadata} />}
            </>
          ))}
          {cntOmittedTo > 0 && <Text>{intl.formatMessage(messages.omittedCount, {cnt: cntOmittedTo})}</Text>}
          <View style={styles.borderTop}>
            <Label>{intl.formatMessage(messages.txAssuranceLevel)}</Label>
          </View>
          <View>
            <Text secondary>
              {intl.formatMessage(messages.confirmations, {
                cnt: transaction.confirmations,
              })}
            </Text>
            <Label>{intl.formatMessage(messages.transactionId)}</Label>
            <Button onPress={openInExplorer} title={transaction.id} />
          </View>
        </View>
      </Screen>
      {/* $FlowFixMe TODO: index does not exist in AddressModal props */}
      <AddressModal visible={!!addressDetail} onRequestClose={hideAddressModal} address={addressDetail} index={null} />
    </View>
  )
}

export default injectIntl(TxDetails)
