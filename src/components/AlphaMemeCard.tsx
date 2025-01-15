import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';

interface WhaleAlert {
  address: string;
  amount: number;
  type: 'buy' | 'sell';
  timestamp: Date;
}

interface SocialMetrics {
  telegram: number;
  twitter: number;
  discord?: number;
}

interface AIPrediction {
  priceTarget: number;
  confidence: number;
  timeframe: string;
  recommendation: {
    action: 'BUY' | 'SELL' | 'HOLD' | 'PARTIAL_SELL';
    reason: string;
    confidence: number;
    allocation?: {
      hold: number;
      sell: number;
    };
  };
}

interface AlphaMemeCardProps {
  name: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  aiPrediction: AIPrediction;
  whaleAlerts: WhaleAlert[];
  socialMetrics?: SocialMetrics;
}

export function AlphaMemeCard({
  name,
  symbol,
  price,
  priceChange24h,
  marketCap,
  volume24h,
  aiPrediction,
  whaleAlerts,
  socialMetrics = { telegram: 0, twitter: 0 }
}: AlphaMemeCardProps) {
  const [isLive, setIsLive] = useState(true);
  const [currentPrediction, setCurrentPrediction] = useState<AIPrediction['recommendation']>({
    action: 'HOLD',
    reason: 'Initializing analysis...',
    confidence: 50,
    allocation: { hold: 100, sell: 0 }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setIsLive(prev => !prev);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getSentimentClass = () => {
    if (priceChange24h >= 3) return 'bg-green-500/30';
    if (priceChange24h <= -3) return 'bg-red-500/30';
    return 'bg-yellow-500/30';
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BUY':
        return '🚀';
      case 'SELL':
        return '🔻';
      case 'PARTIAL_SELL':
        return '⚖️';
      case 'HOLD':
        return '🔒';
      default:
        return '⏳';
    }
  };

  const getAIPrediction = (
    price: number,
    priceChange24h: number,
    whaleAlerts: WhaleAlert[]
  ): AIPrediction['recommendation'] => {
    const recentWhales = whaleAlerts.slice(0, 3);
    const buyCount = recentWhales.filter(alert => alert.type === 'buy').length;
    const sellCount = recentWhales.filter(alert => alert.type === 'sell').length;
    const whaleSignal = buyCount - sellCount;
    const momentum = priceChange24h > 0 ? 1 : priceChange24h < 0 ? -1 : 0;
    const totalSignal = whaleSignal + momentum;

    if (totalSignal >= 2) {
      return {
        action: 'BUY',
        reason: '🐋 Strong whale accumulation\n📈 Positive momentum\n💫 High potential',
        confidence: 85,
        allocation: { hold: 100, sell: 0 }
      };
    } else if (totalSignal === 1) {
      return {
        action: 'HOLD',
        reason: '📊 Moderate whale activity\n⚡ Stable price action\n🔄 Accumulation phase',
        confidence: 70,
        allocation: { hold: 100, sell: 0 }
      };
    } else if (totalSignal === 0) {
      return {
        action: 'PARTIAL_SELL',
        reason: '⚖️ Mixed market signals\n💰 Take partial profits\n🎯 Risk management',
        confidence: 65,
        allocation: { hold: 70, sell: 30 }
      };
    } else {
      return {
        action: 'SELL',
        reason: '📉 Increasing sell pressure\n🚨 Negative momentum\n💫 Better opportunities ahead',
        confidence: 80,
        allocation: { hold: 0, sell: 100 }
      };
    }
  };

  useEffect(() => {
    const updatePrediction = () => {
      const newPrediction = getAIPrediction(price, priceChange24h, whaleAlerts);
      setCurrentPrediction(newPrediction);
    };

    updatePrediction();
    const interval = setInterval(updatePrediction, 5000);
    return () => clearInterval(interval);
  }, [price, priceChange24h, whaleAlerts]);

  const prediction = useMemo(() => ({
    priceTarget: price * 1.5,
    confidence: 75 + Math.random() * 20,
    timeframe: '24H',
    recommendation: currentPrediction
  }), [price, currentPrediction]);

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  return (
    <div className="relative group">
      <div className={`absolute -inset-1 rounded-2xl blur-xl ${getSentimentClass()}`}></div>
      <div className="relative bg-[#0A0F29] rounded-2xl p-4 flex flex-col gap-3 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative h-10 w-10 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/20">
              <span className="text-xl">🚀</span>
              <div className={`absolute top-0 right-0 h-3 w-3 rounded-full ${isLive ? 'bg-green-500' : 'bg-gray-500'} border-2 border-[#0A0F29]`}></div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{name}</h2>
              <p className="text-sm text-gray-400">{symbol}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm ${
            priceChange24h > 0 ? 'bg-green-500/20 text-green-300' :
            priceChange24h < 0 ? 'bg-red-500/20 text-red-300' :
            'bg-yellow-500/20 text-yellow-300'
          }`}>
            {priceChange24h > 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#111C44] rounded-lg p-2">
            <p className="text-xs text-gray-400">Price</p>
            <p className="text-sm font-bold">${price.toFixed(8)}</p>
          </div>
          <div className="bg-[#111C44] rounded-lg p-2">
            <p className="text-xs text-gray-400">Market Cap</p>
            <p className="text-sm font-bold">${formatNumber(marketCap)}</p>
          </div>
        </div>

        <div className="bg-[#111C44] rounded-lg p-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">24h Volume</span>
            <span className="text-sm font-bold">${formatNumber(volume24h)}</span>
          </div>
        </div>

        {/* Social Metrics */}
        <div className="bg-[#111C44] rounded-lg p-3">
          <h4 className="text-sm font-semibold text-purple-300 mb-2">Social Metrics</h4>
          <div className="flex justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-blue-400">📱</span>
              <span className="text-sm text-gray-300">
                {formatNumber(socialMetrics.telegram)} TG
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400">🐦</span>
              <span className="text-sm text-gray-300">
                {formatNumber(socialMetrics.twitter)} Twitter
              </span>
            </div>
          </div>
        </div>

        <div className="bg-purple-500/10 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-purple-300 mb-2">
            <span className="mr-2">🤖</span>
            AI Prediction
          </h4>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">
              <span className="mr-1">🎯</span>
              Target Price ({prediction.timeframe})
            </span>
            <span className="text-sm font-bold text-green-400">${prediction.priceTarget.toFixed(8)}</span>
          </div>
          
          <div className="mb-3 p-2 rounded bg-[#111C44]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">
                <span className="mr-1">📊</span>
                AI Recommendation
              </span>
              <span className={`text-sm font-bold flex items-center gap-1 ${
                prediction.recommendation.action === 'BUY' ? 'text-green-400' :
                prediction.recommendation.action === 'SELL' ? 'text-red-400' :
                prediction.recommendation.action === 'PARTIAL_SELL' ? 'text-yellow-400' :
                'text-blue-400'
              }`}>
                {getActionIcon(prediction.recommendation.action)}
                {prediction.recommendation.action.replace('_', ' ')}
              </span>
            </div>
            <div className="text-xs text-gray-400 mb-2 whitespace-pre-line">
              {prediction.recommendation.reason}
            </div>
            
            {/* Position Allocation */}
            {prediction.recommendation.allocation && (
              <div className="flex items-center gap-2 text-xs">
                <div className="flex-1 bg-[#0A0F29] rounded p-1">
                  <div className="flex justify-between items-center">
                    <span className="text-green-400 flex items-center gap-1">
                      🔒 HOLD
                    </span>
                    <span className="text-green-400">{prediction.recommendation.allocation.hold}%</span>
                  </div>
                </div>
                <div className="flex-1 bg-[#0A0F29] rounded p-1">
                  <div className="flex justify-between items-center">
                    <span className="text-red-400 flex items-center gap-1">
                      💰 SELL
                    </span>
                    <span className="text-red-400">{prediction.recommendation.allocation.sell}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-full bg-purple-500/20 rounded-full h-2">
            <div
              className="bg-purple-500 rounded-full h-2 transition-all duration-500"
              style={{ width: `${prediction.recommendation.confidence}%` }}
            ></div>
          </div>
          <div className="text-right text-xs text-gray-400 mt-1">
            <span className="mr-1">🎯</span>
            {prediction.recommendation.confidence}% confidence
          </div>
        </div>

        <div className="space-y-2">
          {whaleAlerts.slice(0, 2).map((alert, index) => (
            <div key={index} className="bg-[#111C44] rounded-lg p-2 text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className={alert.type === 'buy' ? 'text-green-400' : 'text-red-400'}>
                  {alert.type === 'buy' ? '🐋 Whale Buy' : '🐋 Whale Sell'}
                </span>
                <span className="text-gray-400 text-xs">
                  {format(alert.timestamp, 'HH:mm:ss')}
                </span>
              </div>
              <div className="text-xs text-gray-400 truncate">
                {alert.address}
              </div>
              <div className="text-right text-xs font-medium">
                ${formatNumber(alert.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}