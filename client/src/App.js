import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Web3 from 'web3';
import Web3Modal from "web3modal";
import WalletConnectProvider from '@walletconnect/web3-provider'
import Loader from 'react-loader-spinner';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Header from './component/Header/Header';
import Footer from './component/Footer/Footer';
import Landing from './pages/Landing/Landing';
import MyCollections from './pages/MyCollections/MyCollections';
import MarketPlace from './pages/Marketplace/MarketPlace';
import TokenDetail from './pages/TokenDetail/TokenDetail';
import UserCollections from './pages/UserCollections/UserCollections'
import MintModal from './component/Modal/MintModal';

import {
  REMOVE_TOGGLE_STICKY,
  SET_TOGGLE_STICKY,
  SET_WALLET_ADDRESS,
  SET_CHAIN_ID,
  SET_CONNECTED,
  SET_ACCOUNT_BALANCE,
  SET_TOKEN_PRICE
} from "./redux/types";
import {
  EthereumContractAddress,
  BinanceContractAddress
} from './contracts/address';
import { getChainData } from './utils/utilities';
import etherContractAbi from './abi/etherContract.json';
import binanceContractAbi from './abi/binanceContract.json';

import { connectUser } from './redux/actions'

import './App.css';
import Terms from './pages/Terms/Terms';
import MyAccount from './pages/MyAccount/MyAccount';

function initWeb3(provider) {
  const web3 = new Web3(provider);

  web3.eth.extend({
    methods: [
      {
        name: "chainId",
        call: "eth_chainId",
        outputFormatter: web3.utils.hexToNumber
      }
    ]
  });

  return web3;
}

function App() {

  const dispatch = useDispatch();

  // const Web3Modal = window.Web3Modal.default;
  // const WalletConnectProvider = window.WalletConnectProvider.default;

  const [web3Modal, setWeb3Modal] = useState(null)
  const [provider, setProvider] = useState(null)
  const [networkId, setNetworkId] = useState(null)

  const { toggle_sticky, pending, chainId } = useSelector(state => state.connect);
  const [openMint, setOpenMint] = useState(false)

  useEffect(() => {
    const initWalletConnect = () => {

      const providerOptions = {
        disableInjectedProvider: true,
        cacheProvider: true,
        injected: {
          display: {
            name: "MetaMask",
            description: "For Desktop Web Wallets",
          },
          package: null,
        },
        walletconnect: {
          display: {
            name: "WalletConnect",
            description: "For Mobile App Wallets",
          },
          package: WalletConnectProvider,
          options: {
            // infuraId: process.env.REACT_APP_INFURA_ID,   //mainnet
            rpc: {
              1: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
              56: 'https://bsc-dataseed.binance.org/'
            }
          },
        }
      };
      setWeb3Modal(new Web3Modal({
        network: getNetwork(),
        cacheProvider: false,
        providerOptions,
      }))
    }
    initWalletConnect();
    // if (web3Modal.cachedProvider) {
    //   onConnect()
    // }
  }, [WalletConnectProvider, Web3Modal])

  // useEffect(() => {
  //   const getAccount = async () => {
  //     const chain = await window.ethereum.request({ method: 'eth_chainId' })
  //     const addressArray = await window.ethereum.request({
  //       method: "eth_accounts",
  //     })
  //     if (addressArray.length > 0 && String(chain) !== '') {
  //       onConnect()
  //     }
  //   }
  //   if (window.innerWidth >= 768) {
  //     getAccount()
  //   }
  // }, [])

  const getNetwork = () => getChainData(chainId).network;

  const fetchAccountData = async (providerObj) => {
    const web3 = initWeb3(providerObj);
    window.web3 = web3;

    const chain_id = await web3.eth.getChainId();

    const accounts = await web3.eth.getAccounts();

    const netId = await web3.eth.net.getId();

    if (chain_id === 3 || chain_id === 97 || chain_id === 1 || chain_id === 56) {
      setNetworkId(netId)
      dispatch({
        type: SET_CHAIN_ID,
        payload: chain_id
      })
      dispatch({
        type: SET_WALLET_ADDRESS,
        payload: accounts[0]
      })

      connectContract(accounts[0], chain_id, providerObj);
      dispatch({
        type: SET_CONNECTED,
        payload: true
      })
    } else {
      if (provider.close) {
        await provider.close();
        await web3Modal.clearCachedProvider();
        provider = null;
      }

      dispatch({
        type: SET_WALLET_ADDRESS,
        payload: null
      });
      dispatch({
        type: SET_CONNECTED,
        payload: false
      })
      toast.warning("Please connect with Ethereum or Binance Smart Chain net");
    }
  }

  const getContract = (chain_id, providerObj) => {
    const contractAddress = (chain_id === 1 || chain_id === 3) ? EthereumContractAddress : BinanceContractAddress
    const contractABI = (chain_id === 1 || chain_id === 3) ? etherContractAbi : binanceContractAbi

    const web3 = new Web3(providerObj)
    const contract = new web3.eth.Contract(contractABI, contractAddress);
    return contract;
  }

  const connectContract = async (accountID, chain_id, providerObj) => {
    const nftContract = getContract(chain_id, providerObj);
    const web3 = new Web3(providerObj)
    const userBalance = await web3.eth.getBalance(accountID);
    let userBalanceInEth;
    if (chain_id === 97 || chain_id === 56) {
      userBalanceInEth = await parseFloat(web3.utils.fromWei(userBalance, "ether")).toFixed(4).toString() + " BNB";
    } else {
      userBalanceInEth = await parseFloat(web3.utils.fromWei(userBalance, "ether")).toFixed(4).toString() + " ETH";
    }
    dispatch({
      type: SET_ACCOUNT_BALANCE,
      payload: userBalanceInEth
    })

    let nftPrice = await nftContract.methods.tokenPrice().call();
    nftPrice = await parseFloat(web3.utils.fromWei(nftPrice, "ether")).toFixed(4).toString();

    const data = {
      address: accountID
    }
    dispatch(connectUser(data))

    dispatch({
      type: SET_TOKEN_PRICE,
      payload: nftPrice
    })
  }

  const onConnect = async () => {
    try {
      const providerObj = await web3Modal.connect();
      setProvider(providerObj)

      await subscribeProvider(providerObj)

      await fetchAccountData(providerObj)
    }
    catch (err) {
      toast("Could not get a wallet connection");
      return;
    }
  }

  const subscribeProvider = async (providerObj) => {
    if (!providerObj.on) {
      return;
    }
    providerObj.on("close", () => this.resetApp());
    providerObj.on("accountsChanged", async (accounts) => {
      await fetchAccountData(providerObj)
    });
    providerObj.on("chainChanged", async (chain_id) => {
      await fetchAccountData(providerObj)
    });

    providerObj.on("networkChanged", async (networkId) => {
      await fetchAccountData(providerObj)
    });
  };

  const onDisconnect = async () => {

    if (provider.close) {
      await provider.close();
      await web3Modal.clearCachedProvider();
      setProvider(null);
    }

    dispatch({
      type: SET_WALLET_ADDRESS,
      payload: null
    });
    dispatch({
      type: SET_CONNECTED,
      payload: false
    })
  }

  const handleToggleSticky = (e) => {
    if (e.target.checked) {
      dispatch({
        type: SET_TOGGLE_STICKY
      })
    } else {
      dispatch({
        type: REMOVE_TOGGLE_STICKY
      })
    }
  }

  return (
    <Router>
      <div className="App position-relative">
        {
          pending && <div className="mask"></div>
        }
        <Header
          connectWallet={onConnect}
          onMintNFT={() => setOpenMint(true)}
          disconnectWallet={onDisconnect}
        />
        {
          pending && <div
            style={{
              position: 'absolute',
              width: "100%",
              height: "100%",
              minHeight: "600px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <Loader type="ThreeDots" color="green" height="100" width="100" />
          </div>
        }
        <Switch>

          <Route exact path="/" component={() =>
            <Landing
              handleConnect={onConnect}
              handleDisconnect={onDisconnect}
              handleMint={() => setOpenMint(true)}
            />
          } />

          <Route exact path="/mygolfpunks" component={() =>
            <MyCollections />
          } />

          <Route exact path="/marketplace" component={() => <MarketPlace handleExit={onDisconnect} />} />

          <Route exact path="/assets/:net/:contractAddress/:tokenId" component={TokenDetail} />

          <Route exact path="/users/:address" component={UserCollections} />

          <Route exact path="/terms" component={Terms} />

          <Route exact path="/account" component={MyAccount} />

        </Switch>

        <Footer
          openConnectMetaMaskModal={onConnect}
          onMintNFT={() => setOpenMint(true)}
          disconnectWallet={onDisconnect}
        />

        <div className="switch">
          <label>
            <input type="checkbox" checked={toggle_sticky} onChange={handleToggleSticky} />  - Toggle Sticky
          </label>
        </div>

        <ToastContainer />
        {
          openMint && <MintModal openModal={openMint} hideModal={() => setOpenMint(false)} />
        }


      </div>
    </Router>
  );
}

export default App;
