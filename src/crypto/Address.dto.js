// @flow

import {
  Address,
  ByronAddress,
  BaseAddress,
  PointerAddress,
  EnterpriseAddress,
  RewardAddress,
} from '@emurgo/react-native-haskell-shelley'
import {Logger} from '../utils/logging'

// NOTE: ** IMPORTANT ** The order matters
const ADDRESS_TYPES = Object.freeze([
  ByronAddress,
  BaseAddress,
  PointerAddress,
  EnterpriseAddress,
  RewardAddress,
])

export type KeyHashesCardano = {|
  spending: string,
  staking: string,
|}

/**
 * @description The resolver for the Cardano key hashes
 * @param {Address} wasmAddress A Cardano wallet Address
 * @returns KeyHashesCardano|null You don't need to test for Byron it will return null
 */
export const getKeyHashesCardano = async (
  wasmAddress: Address,
): Promise<KeyHashesCardano | null> => {
  let addr, pay, stake, paymentKeyHash, stakingKeyHash
  for (const [i, addressType] of ADDRESS_TYPES.entries()) {
    // First = Byron
    if (!i) {
      const addr = addressType.from_address(wasmAddress)
      if (addr) return null
    } else {
      addr = await addressType.from_address(wasmAddress)
      if (addr) {
        pay = await addr.payment_cred()
        stake = await addr.stake_cred()
        if (!pay || !stake) break
        paymentKeyHash = await pay.to_keyhash()
        stakingKeyHash = await stake.to_keyhash()
        if (!paymentKeyHash || !stakingKeyHash) break
        return {
          spending: Buffer.from(await paymentKeyHash.to_bytes())?.toString(
            'hex',
          ),
          staking: Buffer.from(await stakingKeyHash.to_bytes())?.toString(
            'hex',
          ),
        }
      }
    }
  }
  // Something went wrong
  throw new Error('getSpendingKeyHash unknown address type')
}

export interface YoroiAddressInfoInterface<KeyHashes> {
  +address: string;
  +getKeyHashes: () => Promise<KeyHashes | null>;
}

// prettier-ignore
export class AddressDTOCardano
implements YoroiAddressInfoInterface<KeyHashesCardano> {
  _address: string
  _wasmAddress: Address | null
  _keyHashes: KeyHashesCardano | null

  constructor(addressBech32: string) {
    this._address = addressBech32
  }

  get address() {
    return this._address
  }

  async getWasmAddress(): Promise<Address> {
    if (!this._wasmAddress) {
      this._wasmAddress = await Address.from_bech32(this._address)
    }
    return this._wasmAddress
  }

  async getKeyHashes() {
    if (!this._keyHashes) {
      this._keyHashes = await getKeyHashesCardano(await this.getWasmAddress())
    }
    return this._keyHashes
  }
}
