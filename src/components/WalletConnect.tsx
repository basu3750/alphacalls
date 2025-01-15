import React, { useState, useEffect } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { WalletNotReadyError } from '@solana/wallet-adapter-base';

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  adapter?: any;
}

const NETWORK = clusterApiUrl('mainnet-beta');

const walletOptions: WalletOption[] = [
  {
    id: 'phantom',
    name: 'Phantom',
    icon: '👻',
    description: 'Connect to your Phantom Wallet',
    adapter: new PhantomWalletAdapter()
  },
  {
    id: 'solflare',
    name: 'Solflare',
    icon: '🔥',
    description: 'Connect to your Solflare Wallet',
    adapter: new SolflareWalletAdapter()
  }
];

export function WalletConnect() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [balance, setBalance] = useState<number>(0);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);

  useEffect(() => {
    const checkConnection = async () => {
      for (const wallet of walletOptions) {
        try {
          if (wallet.adapter.connected) {
            setSelectedWallet(wallet.adapter);
            setConnected(true);
            const publicKey = wallet.adapter.publicKey?.toBase58();
            if (publicKey) {
              setAddress(publicKey.slice(0, 4) + '...' + publicKey.slice(-4));
              await checkBalance(publicKey);
            }
            break;
          }
        } catch (error) {
          console.log(`Error checking ${wallet.name} connection:`, error);
        }
      }
    };

    checkConnection();
  }, []);

  const checkBalance = async (publicKey: string) => {
    try {
      const connection = new Connection(NETWORK);
      const account = await connection.getAccountInfo(new PublicKey(publicKey));
      const lamports = account?.lamports || 0;
      const solBalance = lamports / 1e9;
      setBalance(solBalance);
      
      if (solBalance < 0.1) {
        setErrorMessage('You must hold at least 0.1 SOL to connect');
        await disconnectWallet();
        return false;
      }
      return true;
    } catch (error) {
      console.log('Error checking balance:', error);
      return false;
    }
  };

  const getErrorMessage = (error: any): string => {
    if (error instanceof WalletNotReadyError) {
      return 'Please unlock your wallet and try again';
    }
    if (error?.name === 'WalletNotInstalledError') {
      return `Please install the wallet extension first`;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Failed to connect wallet. Please try again.';
  };

  const connectWallet = async (wallet: WalletOption) => {
    try {
      setErrorMessage('');
      const adapter = wallet.adapter;
      
      if (!adapter.ready) {
        throw new WalletNotReadyError();
      }

      if (!adapter.connected) {
        await adapter.connect();
      }

      const publicKey = adapter.publicKey?.toBase58();
      if (!publicKey) {
        throw new Error('No public key found');
      }

      const hasBalance = await checkBalance(publicKey);
      if (!hasBalance) {
        return;
      }

      setSelectedWallet(adapter);
      setConnected(true);
      setAddress(publicKey.slice(0, 4) + '...' + publicKey.slice(-4));

    } catch (error) {
      const message = getErrorMessage(error);
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (selectedWallet?.disconnect) {
        await selectedWallet.disconnect();
      }
      setSelectedWallet(null);
      setConnected(false);
      setAddress('');
      setBalance(0);
      setErrorMessage('');
    } catch (error) {
      console.log('Error disconnecting wallet:', error);
    }
  };

  if (connected) {
    return (
      <div className="relative">
        <Menu as="div" className="relative inline-block text-left">
          <div className="relative">
            <div className="absolute -inset-[2px] bg-gradient-to-r from-purple-600 via-cyan-400 to-purple-600 rounded-lg opacity-75 blur-lg group-hover:opacity-100 animate-gradient-x"></div>
            <Menu.Button className="relative flex items-center gap-2 px-6 py-2.5 bg-[#0f1629] text-white rounded-lg border border-purple-500/50 transition-colors group">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-cyan-400 rounded-full shadow-[0_0_8px_2px_rgba(34,211,238,0.6)]"></div>
                <span className="text-sm font-medium bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  {address} • {balance.toFixed(2)} SOL
                </span>
              </div>
            </Menu.Button>
          </div>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-3 w-60 origin-top-right bg-[#0f1629]/95 backdrop-blur-xl border border-purple-500/20 rounded-lg shadow-[0_0_25px_rgba(139,92,246,0.3)]">
              <div className="p-2">
                <div className="px-3 py-2 text-sm text-purple-300">Connected Wallet</div>
                <div className="px-3 py-2 text-sm font-medium text-cyan-400">{address}</div>
              </div>
              <div className="p-2 border-t border-purple-500/20">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={disconnectWallet}
                      className={`${
                        active ? 'bg-purple-500/10' : ''
                      } group flex w-full items-center rounded-md px-3 py-2 text-sm text-purple-300 hover:text-cyan-400 transition-colors`}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Disconnect
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    );
  }

  return (
    <div className="relative">
      <Menu as="div" className="relative inline-block text-left">
        <div className="relative group">
          <div className="absolute -inset-[2px] bg-gradient-to-r from-purple-600 via-cyan-400 to-purple-600 rounded-lg opacity-75 blur-lg group-hover:opacity-100 animate-gradient-x"></div>
          <Menu.Button className="relative px-6 py-2.5 bg-[#0f1629] text-white rounded-lg border border-purple-500/50 transition-colors">
            <span className="font-medium text-sm bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Connect Wallet
            </span>
          </Menu.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 mt-3 w-80 origin-top-right bg-[#0f1629]/95 backdrop-blur-xl border border-purple-500/20 rounded-lg shadow-[0_0_25px_rgba(139,92,246,0.3)]">
            <div className="p-4">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-1">Connect a Wallet</h3>
              <p className="text-sm text-purple-300 mb-4">Choose your preferred Solana wallet</p>
              <div className="space-y-2">
                {walletOptions.map((wallet) => (
                  <Menu.Item key={wallet.id}>
                    {({ active }) => (
                      <button
                        onClick={() => connectWallet(wallet)}
                        className={`${
                          active ? 'bg-purple-500/10 border-purple-500/50' : 'border-purple-500/20'
                        } group flex w-full items-center justify-between rounded-lg p-3 text-left transition-all hover:border-purple-500/50 border`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 text-xl border border-purple-500/20">
                            {wallet.icon}
                          </div>
                          <div>
                            <div className="font-medium text-cyan-400">{wallet.name}</div>
                            <div className="text-sm text-purple-300">{wallet.description}</div>
                          </div>
                        </div>
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      {errorMessage && (
        <div className="absolute top-full mt-3 right-0 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.3)] text-sm backdrop-blur-xl">
          {errorMessage}
        </div>
      )}
    </div>
  );
}