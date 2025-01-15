import { useEffect, useState } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { AlphaMemeCard } from './components/AlphaMemeCard';
import { ScannerStatus } from './components/ScannerStatus';
import { marketTracker } from './services/marketTracker';

interface TokenData {
  name: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  whaleAlerts: Array<{
    address: string;
    amount: number;
    type: 'buy' | 'sell';
    timestamp: Date;
  }>;
  timestamp: Date;
}

function App() {
  const [marketData, setMarketData] = useState<TokenData[]>([]);
  const [isBlinking, setIsBlinking] = useState(true);
  const [statusPhase, setStatusPhase] = useState(0);
  const [packetCount, setPacketCount] = useState(0);

  const statusTexts = [
    'ACTIVE',
    'SCANNING',
    'PROCESSING',
    'ANALYZING'
  ];

  useEffect(() => {
    const initializeMarketData = async () => {
      const data = await marketTracker.fetchPumpFunData();
      setMarketData(data as TokenData[]);
      marketTracker.startTracking(1000); // Update every second
    };

    initializeMarketData();

    const handleMarketUpdate = (event: CustomEvent<TokenData[]>) => {
      if (event.detail && event.detail.length > 0) {
        setMarketData(event.detail);
      }
    };

    document.addEventListener('marketUpdate', handleMarketUpdate as EventListener);
    return () => {
      document.removeEventListener('marketUpdate', handleMarketUpdate as EventListener);
      marketTracker.stopTracking();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusPhase(prev => (prev + 1) % statusTexts.length);
      setPacketCount(prev => prev + Math.floor(Math.random() * 50 + 20));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsBlinking(prev => !prev);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1437] text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">X</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Xelion</h1>
          </div>
          <WalletConnect />
        </header>

        <div className="mb-8 bg-[#111C44]/50 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-green-400 font-mono">XELION TERMINAL v1.0</span>
              </div>
              <div className="text-green-400/60 font-mono text-sm">
                SOLANA MEME SCANNER
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-green-400/60 font-mono">
              <div className="flex items-center gap-2">
                <div className={`relative w-5 h-5 transition-opacity duration-300 ${isBlinking ? 'opacity-100' : 'opacity-50'}`}>
                  <svg className="w-full h-full" viewBox="0 0 128 128" fill="none">
                    <defs>
                      <linearGradient id="solanaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#9945FF' }} />
                        <stop offset="100%" style={{ stopColor: '#14F195' }} />
                      </linearGradient>
                    </defs>
                    <path
                      d="M93.94 42.86H27.48l19.91-19.91h66.46L93.94 42.86zM93.94 105.05H27.48l19.91-19.91h66.46l-19.91 19.91zM47.39 73.96H27.48l19.91-19.91h66.46L93.94 73.96H47.39z"
                      fill="url(#solanaGradient)"
                    />
                  </svg>
                </div>
                <span>NETWORK: SOLANA</span>
              </div>
              <span>|</span>
              <div className="flex items-center gap-2">
                <div className="relative flex items-center gap-2">
                  <div className="relative h-2 w-2">
                    <div className="absolute inset-0 rounded-full bg-green-500 animate-ping"></div>
                    <div className="relative rounded-full h-2 w-2 bg-green-500"></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-green-400 font-mono">STATUS:</span>
                    <div className="relative">
                      <span className="terminal-text">{statusTexts[statusPhase]}</span>
                      <div className="absolute -bottom-4 left-0 right-0 flex justify-between">
                        <span className="text-[10px] text-green-400/60">PKT: {packetCount}</span>
                        <span className="text-[10px] text-green-400/60 animate-pulse">⚡</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ScannerStatus />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketData.map((token, index) => (
            <AlphaMemeCard
              key={index}
              name={token.name}
              symbol={token.symbol}
              price={token.price}
              priceChange24h={token.priceChange24h}
              marketCap={token.marketCap}
              volume24h={token.volume24h}
              aiPrediction={{
                priceTarget: token.price * 1.5,
                confidence: 75 + Math.random() * 20,
                timeframe: '24H',
                recommendation: {
                  action: 'BUY',
                  reason: '🐋 Strong whale accumulation\n📈 Positive momentum\n💫 High potential',
                  confidence: 85,
                  allocation: { hold: 100, sell: 0 }
                }
              }}
              whaleAlerts={token.whaleAlerts}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;