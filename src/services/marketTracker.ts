// Mock market data for development
const mockMarketData = [
  {
    name: 'SOLAI FLASH',
    symbol: 'SOLF',
    price: 0.00001234,
    priceChange24h: 5.8,
    volume24h: 1500000,
    marketCap: 12500000,
    whaleAlerts: [
      {
        address: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
        amount: 250000,
        type: 'buy',
        timestamp: new Date(Date.now() - 1000 * 60 * 15)
      }
    ],
    timestamp: new Date()
  },
  {
    name: 'LIGHTNING BOT',
    symbol: 'LBOT',
    price: 0.00000789,
    priceChange24h: -4.2,
    volume24h: 2100000,
    marketCap: 7890000,
    whaleAlerts: [
      {
        address: '9W959DhEoH8C8Wy5DgXBSvVqppxdJkmNCH7nZCne2YyA',
        amount: 320000,
        type: 'sell',
        timestamp: new Date(Date.now() - 1000 * 60 * 5)
      }
    ],
    timestamp: new Date()
  },
  {
    name: 'NEURAL SOL',
    symbol: 'NSOL',
    price: 0.00002345,
    priceChange24h: 1.2,
    volume24h: 980000,
    marketCap: 4560000,
    whaleAlerts: [
      {
        address: 'BKWPHuHkCCzEFoqHhPW8hHGDmviGKvSpGZXdKwpsgvdM',
        amount: 150000,
        type: 'buy',
        timestamp: new Date(Date.now() - 1000 * 60 * 30)
      }
    ],
    timestamp: new Date()
  }
];

export class MarketTracker {
  private static instance: MarketTracker;
  private interval: NodeJS.Timer | null = null;

  private constructor() {}

  static getInstance(): MarketTracker {
    if (!MarketTracker.instance) {
      MarketTracker.instance = new MarketTracker();
    }
    return MarketTracker.instance;
  }

  async fetchPumpFunData() {
    return mockMarketData;
  }

  private generateSolanaAddress(): string {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let address = '';
    for (let i = 0; i < 44; i++) {
      address += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return address;
  }

  private generateWhaleAlert(price: number) {
    const multiplier = Math.floor(Math.random() * 10) + 5; // 5x to 15x prediction
    const amount = price * multiplier * (Math.random() * 1000000 + 500000); // Large whale amounts
    return {
      address: this.generateSolanaAddress(),
      amount,
      type: Math.random() > 0.5 ? 'buy' : 'sell' as 'buy' | 'sell',
      timestamp: new Date()
    };
  }

  async startTracking(intervalMs: number = 1000) {
    if (this.interval) {
      return;
    }

    const updateData = async () => {
      try {
        // Update mock data with random changes
        mockMarketData.forEach(data => {
          // Update price changes
          data.priceChange24h += (Math.random() - 0.5) * 4; // More volatile price changes
          data.price *= (1 + data.priceChange24h / 100);
          data.volume24h *= (1 + (Math.random() - 0.5) * 0.2);
          data.marketCap = data.price * (data.marketCap / (data.price / (1 + data.priceChange24h / 100)));
          
          // Generate new whale alerts more frequently
          if (Math.random() < 0.3) { // 30% chance each second
            const whaleAlert = this.generateWhaleAlert(data.price);
            data.whaleAlerts.unshift(whaleAlert);
            data.whaleAlerts = data.whaleAlerts.slice(0, 5); // Keep last 5 alerts
          }
          
          data.timestamp = new Date();
        });

        // Dispatch event with updated data
        document.dispatchEvent(new CustomEvent('marketUpdate', { detail: mockMarketData }));
      } catch (error) {
        console.error('Error updating market data:', error);
      }
    };

    // Initial update
    await updateData();
    this.interval = setInterval(updateData, intervalMs);
  }

  stopTracking() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export const marketTracker = MarketTracker.getInstance();