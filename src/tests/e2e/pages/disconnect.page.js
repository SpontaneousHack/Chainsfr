import MetamaskPage from './metamask.page'
import log from 'loglevel'
import Web3 from 'web3'
import ERC20_ABI from '../../../contracts/ERC20'
import SimpleMultiSigContractArtifacts from '../../../contracts/SimpleMultiSig.json'
import url from '../../../url'
import { CRYPTO_ACCOUNTS } from '../mocks/cryptoAccounts'
log.setDefaultLevel('info')
const NETWORK_ID = 4
class DisconnectPage {
  async disconnect () {
    await expect(page).toClick('button', { text: 'Disconnect' })
    log.info('Disconnect clicked')
    await page.waitForNavigation()
  }

  async setAllowance (amount, walletType) {
    const metamaskPage = new MetamaskPage()
    await expect(page).toFillForm('[data-test-id="set_erc20_allowance"]', {
      allowance: amount
    })
    await expect(page).toClick('button', { text: `Set Allowance ${walletType}` })
    if (walletType === 'metamask') {
      await metamaskPage.approve()
    }
    
    let newAllowance
    const ownderAddress = CRYPTO_ACCOUNTS.find(item => {
      return item.walletType === walletType && item.cryptoType === 'dai'
    }).address
    log.info('Sending out tx to reset allowance, wait for confirmation...')
    while (true) {
      let web3 = new Web3(new Web3.providers.HttpProvider(url.INFURA_API_URL))
      const targetContract = new web3.eth.Contract(ERC20_ABI, process.env.REACT_APP_DAI_ADDRESS)
      newAllowance = (await targetContract.methods
        .allowance(ownderAddress, SimpleMultiSigContractArtifacts.networks[NETWORK_ID].address)
        .call()).toString()
      if (newAllowance === amount) {
        log.info('newAllowance', newAllowance)
        break
      }
      await page.waitFor(5000)
    }
    log.info('Reset allowance tx confirmed')
  }
}

export default DisconnectPage
