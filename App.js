import React from 'react'
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import SDK from "@seald-io/sdk-react-native"

// We import the bundle version, so we won't need to bundle and polyfill node internals.
import SSKSPasswordPlugin from "@seald-io/sdk-react-native/lib/seald-sdk-plugin-ssks-password.bundle"
import AwesomeDebouncePromise from 'awesome-debounce-promise'

const apiURL = 'https://api-dev.soyouz.seald.io/'
const keyStorageURL = 'https://ssks.soyouz.seald.io/'
const teamId = '00000000-0000-1000-a000-7ea300000000'
const appId = teamId
const userId1 = 'test-user-1'
const userId2 = 'test-user-2'
const password = 'test-password'
const domainValidationKeyId = '00000000-0000-1000-a000-d11c00000000'
const domainValidationKey = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

export default function App() {

  const demo = async () => {
    console.log('Starting demo script...')
    // User1 instantiate an SDK instance
    const sdk1 = SDK({ appId, apiURL, plugins: [SSKSPasswordPlugin(keyStorageURL)] })
    console.log('generating token 1...')

    const userLicenseToken1 = await sdk1.utils.generateUserLicenseToken(userId1, domainValidationKey, domainValidationKeyId)
    console.log('generated token 1')
    console.log('initiating identity 1...')
    await sdk1.initiateIdentity({ userId: userId1, userLicenseToken: userLicenseToken1 })
    await sdk1.ssksPassword.saveIdentity({ userId: userId1, password })
    console.log('initiated identity 1')

    // Create a second account
    const sdk2 = SDK({ appId, apiURL, plugins: [SSKSPasswordPlugin(keyStorageURL)] })
    console.log('generating token 2...')
    const userLicenseToken2 = await sdk2.utils.generateUserLicenseToken(userId2, domainValidationKey, domainValidationKeyId)
    console.log('generated token 2')
    console.log('initiating identity 2...')
    await sdk2.initiateIdentity({ userId: userId2, userLicenseToken: userLicenseToken2 })
    await sdk2.ssksPassword.saveIdentity({ userId: userId2, password })
    console.log('initiated identity 2')

    console.log('creating session...')
    // user1 create an encrypted chat session, with only user2 as recipients
    const sdk1EncryptionSession = await sdk1.createEncryptionSession({ APConnectors: [`${userId2}@${appId}`] })
    console.log('session created')

    console.log('encrypting...')
    // user1 encrypt a message in that session
    const clearText = 'a very secret message'
    const sealdMessage = await sdk1EncryptionSession.encrypt(clearText)
    console.log('encrypted')

    console.log('retrieving session...')
    // user2 can join the session, and decrypt the message send by user1
    const sdk2EncryptionSession = await sdk2.retrieveEncryptionSession({ sessionId: sdk1EncryptionSession.sessionId /* encryptedMessage: sealdMessage */ })
    console.log('session retrieved')
    console.log('decrypting...')
    const decryptedText = await sdk2EncryptionSession.decrypt(sealdMessage)
    console.log('decrypted')
    console.log('decryptedText === clearText', decryptedText === clearText)

    // clearText === decryptedText
    console.log('encrypting...')

    // user2 can encrypt its reply, user1 decrypt it
    const clearReply = 'a very secret reply'
    const sealdReply = await sdk2EncryptionSession.encrypt(clearReply)
    console.log('encrypted')
    console.log('decrypting...')
    const decryptReply = await sdk1EncryptionSession.decrypt(sealdReply)
    console.log('decrypted')
    console.log('clearReply === decryptReply', clearReply === decryptReply)

    // Later or elsewhere (App restart, login, another device, ...)

    // user1 can retrieve its SDK account, and
    const sdk1_b = SDK({ appId, apiURL, plugins: [SSKSPasswordPlugin(keyStorageURL)] })
    console.log('retrieving identity 1...')
    await sdk1_b.ssksPassword.retrieveIdentity({ userId: userId1, password })
    console.log('identity retrieved')

    // user1 can retrieve an old encrypted chat session
    console.log('retrieving session...')
    const sdk1BRetrievedSession = await sdk1_b.retrieveEncryptionSession({ sessionId: sdk1EncryptionSession.sessionId })
    console.log('session retrieved')
    console.log('decrypting...')
    const decryptedLater = await sdk1BRetrievedSession.decrypt(sealdMessage)
    console.log('decrypted')
    console.log('clearText === decryptedLater', clearText === decryptedLater)
    console.log('Done')
  }

  const debouncedDemo = AwesomeDebouncePromise(
    demo,
    1000
  )

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={debouncedDemo}><Text>Start the demo</Text></TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    padding: 30
  }
})
