import { useCallback } from 'react';
import { Button, Modal } from 'react-bootstrap';
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import MetaMaskImg from '../../assets/images/w1.svg';
import WalletConnectImg from '../../assets/images/w2.svg';

export default function WalletConnectModal({
  openModal,
  hideModal,
  activateBrowserWallet,
}) {

  const isMetaMaskInstalled = () => {
    const { ethereum } = window;
    return Boolean(ethereum && ethereum.isMetaMask);
  };

  const handleConnectMetaMask = (e) => {
    if(isMetaMaskInstalled()) {
      activateBrowserWallet();
      hideModal(e);
    } else {
      alert("Please install MetaMask extension");
    }
  }

  const onClickWalletConnect = useCallback(() => {
    const bridgeUrl = "https://bridge.walletconnect.org";

    // Create a connector
    const connector = new WalletConnect({
      bridge: "https://bridge.walletconnect.org", // Required
      qrcodeModal: QRCodeModal,
    });
    // Check if connection is already established
    if (!connector.connected) {
      // create new session
      
      connector.createSession({chainId: 56});
        
    }
    
    connector.on("connect", handleQRCode(this, bridgeUrl));
  }, []);

  const handleQRCode = (bridgeUrl, error, payload) => {

    if (error) {
      throw error;
    }
    console.log("Event: ", payload.event);
    console.log('aa', payload)
    console.log('bb', payload.params[0])
    // setAccountAddress(payload.params[0].accounts[0]);
    // setTrustConnect(payload.event)

    // Get provided accounts and chainId
    // const { accounts, chainId } = payload.params[0];
  
    // Draft transaction
    // const tx = {
    //   from: accounts, // Required
    //   to: "0xf5A07f885B9C2BC30e3766F5727E05bCE8b2B549", // Required (for non contract deployments)
    //   data: "0x", // Required
    //   gasPrice: "0x02540be400", // Optional
    //   gas: "0x9c40", // Optional
    //   value: "0x00", // Optional
    //   nonce: "0x0114" // Optional
    // };
  
    // Send transaction
    /*connector
      .sendTransaction(tx)
      .then((result) => {
        // Returns transaction id (hash)
        console.log(result);
      })
      .catch((error) => {
        // Error returned when rejected
        console.error(error);
      });
  */
  }

  return (
    <Modal show={ openModal } onHide={hideModal}>
      <Modal.Body>
        <div className="text-center p-3">
          <Button variant="secondary" className="w-100 btn-connect-metamask" onClick={handleConnectMetaMask}>
            <div className="metamask text-center">
              <img width="48px" className="metamask-img my-2" src={MetaMaskImg} alt="img" />
              <p className="mb-0 metamask-title Tanker p-1">MetaMask</p>
              <p className="mb-0 metamask-txt pb-1">Connect to MetaMask Wallet</p>
            </div>
          </Button>
          <Button variant="secondary" className="mt-3 w-100 btn-connect-metamask" onClick={onClickWalletConnect}>
            <div className="walletconnect text-center">
              <img width="48px" className="walletconnect-img my-2" src={WalletConnectImg} alt="img" />
              <p className="mb-0 walletconnect-title Tanker p-1">WalletConnect</p>
              <p className="mb-0 walletconnect-txt pb-1"> Scan and Connect to Trust Wallet</p>
            </div>
          </Button>
        </div> 
      </Modal.Body>
    </Modal>
  )
}