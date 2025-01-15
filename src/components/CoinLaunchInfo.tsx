import { useState } from 'react';

interface WhaleAlert {
  address: string;
  amount: number;
  type: 'buy' | 'sell';
  timestamp: Date;
}

interface CoinLaunchInfoProps {
  name: string;
  price: number;
  marketCap: number;
  volume24h: number;
  whaleAlerts: WhaleAlert[];
  id: string;
  priceChange1h?: number;
  priceChange24h?: number;
  priceChange7d?: number;
}

export function CoinLaunchInfo({
  name,
  price,
  marketCap,
  volume24h,
  whaleAlerts,
  priceChange1h,
  priceChange24h,
  priceChange7d
}: CoinLaunchInfoProps) {
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertPrice, setAlertPrice] = useState(price);
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');

  const buyCount = whaleAlerts.filter(alert => alert.type === 'buy').length;
  const sellCount = whaleAlerts.filter(alert => alert.type === 'sell').length;
  const sentimentScore = buyCount + sellCount === 0 ? 50 : (buyCount / (buyCount + sellCount)) * 100;
  
  const getSentimentStatus = () => {
    if (sentimentScore >= 60) return { color: 'green' };
    if (sentimentScore >= 40) return { color: 'yellow' };
    return { color: 'red' };
  };

  const { color } = getSentimentStatus();

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  const formatPercentage = (value?: number) => {
    if (value === undefined) return 'N/A';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const handleSetAlert = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setShowAlertModal(false);
        }
      });
    }
  };

  return (
    <div className="relative group">
      {/* Rest of the component JSX remains the same */}
    </div>
  );
}