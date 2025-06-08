import { BrowserProvider, Contract, ethers } from 'ethers';

export interface WalletConnection {
  address: string;
  provider: BrowserProvider;
  signer: any;
}

export const connectWallet = async (): Promise<WalletConnection | null> => {
  try {
    if (!window.ethereum) {
      alert('MetaMask is not installed. Please install MetaMask to continue.');
      return null;
    }

    const provider = new BrowserProvider(window.ethereum);
    
    // Request account access
    await provider.send("eth_requestAccounts", []);
    
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    return {
      address,
      provider,
      signer
    };
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    return null;
  }
};

export const generateVoteHash = (studentId: string, candidateId: string, electionId: string, walletAddress: string): string => {
  const data = `${studentId}-${candidateId}-${electionId}-${walletAddress}-${Date.now()}`;
  return ethers.keccak256(ethers.toUtf8Bytes(data));
};

export const isWalletConnected = async (): Promise<string | null> => {
  try {
    if (!window.ethereum) return null;
    
    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.listAccounts();
    
    return accounts.length > 0 ? accounts[0].address : null;
  } catch (error) {
    console.error('Failed to check wallet connection:', error);
    return null;
  }
};

export const switchToPolygonNetwork = async (): Promise<boolean> => {
  try {
    if (!window.ethereum) return false;

    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x89' }], // Polygon Mainnet
    });
    
    return true;
  } catch (error: any) {
    // Chain doesn't exist, add it
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x89',
            chainName: 'Polygon Mainnet',
            nativeCurrency: {
              name: 'MATIC',
              symbol: 'MATIC',
              decimals: 18,
            },
            rpcUrls: ['https://polygon-rpc.com/'],
            blockExplorerUrls: ['https://polygonscan.com/'],
          }],
        });
        return true;
      } catch (addError) {
        console.error('Failed to add Polygon network:', addError);
        return false;
      }
    }
    console.error('Failed to switch to Polygon network:', error);
    return false;
  }
};

declare global {
  interface Window {
    ethereum?: any;
  }
}