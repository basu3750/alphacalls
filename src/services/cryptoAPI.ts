import { request, gql } from 'graphql-request';
import axios from 'axios';

const BITQUERY_ENDPOINT = 'https://graphql.bitquery.io';
const BITQUERY_API_KEY = 'BQYvhnv04csZHaprIBZNwtpSzRGtqgPh';
const SOLSCAN_API_BASE = 'https://public-api.solscan.io';

// Define GraphQL queries
const TRENDING_TOKENS_QUERY = gql`
  query GetTrendingTokens($network: String!, $limit: Int!) {
    ethereum(network: $network) {
      dexTrades(options: {limit: $limit, desc: "tradeAmount"}) {
        token {
          address
          symbol
          name
        }
        price
        tradeAmount
        priceChange: maximum(of: price, window: {width: "24h"})
      }
    }
  }
`;

const NEW_TOKENS_QUERY = gql`
  query GetNewTokens($network: String!, $from: ISO8601DateTime) {
    ethereum(network: $network) {
      dexTrades(
        date: {after: $from}
        options: {desc: "block.timestamp.time", limit: 50}
      ) {
        token {
          address
          symbol
          name
        }
        price
        tradeAmount
        block {
          timestamp {
            time(format: "%Y-%m-%d %H:%M:%S")
          }
        }
      }
    }
  }
`;

const MARKET_STATS_QUERY = gql`
  query GetMarketStats($network: String!) {
    ethereum(network: $network) {
      dexTrades {
        tradeAmount(calculate: sum)
        price
        maximum_price: maximum(of: price, get: {bound: upper})
      }
    }
  }
`;

export interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  circulating_supply: number;
  market_cap_rank: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
  chain?: 'sol' | 'bsc';
}

class CryptoAPI {
  private static instance: CryptoAPI;
  private priceAlerts: Map<string, { price: number; condition: 'above' | 'below' }[]>;
  private ws: WebSocket | null = null;

  private constructor() {
    this.priceAlerts = new Map();
    this.startPriceAlertMonitoring();
  }

  static getInstance(): CryptoAPI {
    if (!CryptoAPI.instance) {
      CryptoAPI.instance = new CryptoAPI();
    }
    return CryptoAPI.instance;
  }

  private async queryBitQuery(query: string, variables: any) {
    const headers = {
      'X-API-KEY': BITQUERY_API_KEY
    };
    return request(BITQUERY_ENDPOINT, query, variables, headers);
  }

  private async fetchSolanaTokens(): Promise<CoinData[]> {
    try {
      const response = await axios.get(`${SOLSCAN_API_BASE}/market/token/list`, {
        params: {
          limit: 50,
          offset: 0,
          sortBy: 'volume',
          direction: 'desc'
        }
      });

      return response.data.data.map((token: any) => ({
        id: token.address,
        symbol: token.symbol.toLowerCase(),
        name: token.name || token.symbol,
        image: token.icon || `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${token.address}/logo.png`,
        current_price: token.priceUst || 0,
        market_cap: token.marketCapUst || 0,
        total_volume: token.volume24h || 0,
        price_change_percentage_24h: token.priceChange24h || 0,
        circulating_supply: token.supply || 0,
        market_cap_rank: 0,
        chain: 'sol' as const
      }));
    } catch (error) {
      console.warn('Error fetching Solana tokens:', error);
      return [];
    }
  }

  private async fetchSolanaTokenPrice(address: string): Promise<number> {
    try {
      const response = await axios.get(`${SOLSCAN_API_BASE}/market/token/${address}`);
      return response.data.priceUst || 0;
    } catch (error) {
      console.warn(`Error fetching Solana token price for ${address}:`, error);
      return 0;
    }
  }

  async getTrendingCoins(): Promise<CoinData[]> {
    try {
      const [bscTokens, solTokens] = await Promise.all([
        this.getTrendingBSCTokens(),
        this.fetchSolanaTokens()
      ]);

      return [...bscTokens, ...solTokens]
        .sort((a, b) => b.total_volume - a.total_volume)
        .slice(0, 10);
    } catch (error) {
      console.warn('Error fetching trending coins:', error);
      return [];
    }
  }

  private async getTrendingBSCTokens(): Promise<CoinData[]> {
    try {
      const data = await this.queryBitQuery(TRENDING_TOKENS_QUERY, {
        network: "bsc",
        limit: 10
      });

      return data.ethereum.dexTrades.map((trade: any) => ({
        id: trade.token.address.toLowerCase(),
        symbol: trade.token.symbol.toLowerCase(),
        name: trade.token.name,
        image: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${trade.token.symbol.toLowerCase()}.png`,
        current_price: trade.price,
        market_cap: trade.tradeAmount * trade.price,
        total_volume: trade.tradeAmount,
        price_change_percentage_24h: (trade.priceChange / trade.price) * 100,
        circulating_supply: 0,
        market_cap_rank: 0,
        chain: 'bsc' as const
      }));
    } catch (error) {
      console.warn('Error fetching BSC trending tokens:', error);
      return [];
    }
  }

  async getNewListings(): Promise<CoinData[]> {
    try {
      const [bscListings, solListings] = await Promise.all([
        this.getNewBSCListings(),
        this.getNewSolanaListings()
      ]);

      return [...bscListings, ...solListings]
        .sort((a, b) => b.total_volume - a.total_volume);
    } catch (error) {
      console.warn('Error fetching new listings:', error);
      return [];
    }
  }

  private async getNewSolanaListings(): Promise<CoinData[]> {
    try {
      const response = await axios.get(`${SOLSCAN_API_BASE}/token/list`, {
        params: {
          sortBy: 'createTime',
          direction: 'desc',
          limit: 20
        }
      });

      return response.data.data.map((token: any) => ({
        id: token.address,
        symbol: token.symbol.toLowerCase(),
        name: token.name || token.symbol,
        image: token.icon || `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${token.address}/logo.png`,
        current_price: token.priceUst || 0,
        market_cap: token.marketCapUst || 0,
        total_volume: token.volume24h || 0,
        price_change_percentage_24h: token.priceChange24h || 0,
        circulating_supply: token.supply || 0,
        market_cap_rank: 0,
        chain: 'sol' as const
      }));
    } catch (error) {
      console.warn('Error fetching new Solana listings:', error);
      return [];
    }
  }

  private async getNewBSCListings(): Promise<CoinData[]> {
    try {
      const from = new Date();
      from.setDate(from.getDate() - 7); // Get tokens from last 7 days

      const data = await this.queryBitQuery(NEW_TOKENS_QUERY, {
        network: "bsc",
        from: from.toISOString()
      });

      return data.ethereum.dexTrades.map((trade: any) => ({
        id: trade.token.address.toLowerCase(),
        symbol: trade.token.symbol.toLowerCase(),
        name: trade.token.name,
        image: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${trade.token.symbol.toLowerCase()}.png`,
        current_price: trade.price,
        market_cap: trade.tradeAmount * trade.price,
        total_volume: trade.tradeAmount,
        price_change_percentage_24h: 0, // New tokens won't have 24h change
        circulating_supply: 0,
        market_cap_rank: 0,
        chain: 'bsc' as const
      }));
    } catch (error) {
      console.warn('Error fetching new BSC listings:', error);
      return [];
    }
  }

  async getMarketTrends(): Promise<{
    total_market_cap: number;
    total_volume: number;
    btc_dominance: number;
    trending: CoinData[];
  }> {
    try {
      const [bscData, solData, trendingCoins] = await Promise.all([
        this.getBSCMarketStats(),
        this.getSolanaMarketStats(),
        this.getTrendingCoins()
      ]);

      return {
        total_market_cap: bscData.total_market_cap + solData.total_market_cap,
        total_volume: bscData.total_volume + solData.total_volume,
        btc_dominance: 40,
        trending: trendingCoins
      };
    } catch (error) {
      console.warn('Error fetching market trends:', error);
      return {
        total_market_cap: 0,
        total_volume: 0,
        btc_dominance: 0,
        trending: []
      };
    }
  }

  private async getSolanaMarketStats(): Promise<{ total_market_cap: number; total_volume: number }> {
    try {
      const response = await axios.get(`${SOLSCAN_API_BASE}/market/token/list`, {
        params: { limit: 100 }
      });

      const stats = response.data.data.reduce(
        (acc: any, token: any) => ({
          total_market_cap: acc.total_market_cap + (token.marketCapUst || 0),
          total_volume: acc.total_volume + (token.volume24h || 0)
        }),
        { total_market_cap: 0, total_volume: 0 }
      );

      return stats;
    } catch (error) {
      console.warn('Error fetching Solana market stats:', error);
      return { total_market_cap: 0, total_volume: 0 };
    }
  }

  private async getBSCMarketStats(): Promise<{ total_market_cap: number; total_volume: number }> {
    try {
      const data = await this.queryBitQuery(MARKET_STATS_QUERY, {
        network: "bsc"
      });

      const stats = data.ethereum.dexTrades[0];
      return {
        total_market_cap: stats.tradeAmount * stats.maximum_price,
        total_volume: stats.tradeAmount
      };
    } catch (error) {
      console.warn('Error fetching BSC market stats:', error);
      return { total_market_cap: 0, total_volume: 0 };
    }
  }

  setPriceAlert(coinId: string, price: number, condition: 'above' | 'below') {
    if (!this.priceAlerts.has(coinId)) {
      this.priceAlerts.set(coinId, []);
    }
    this.priceAlerts.get(coinId)?.push({ price, condition });
  }

  private startPriceAlertMonitoring() {
    setInterval(async () => {
      for (const [coinId, alerts] of this.priceAlerts.entries()) {
        try {
          const price = coinId.startsWith('sol:') 
            ? await this.fetchSolanaTokenPrice(coinId.slice(4))
            : (await this.getTrendingBSCTokens()).find(t => t.id === coinId)?.current_price || 0;

          alerts.forEach(alert => {
            if (
              (alert.condition === 'above' && price >= alert.price) ||
              (alert.condition === 'below' && price <= alert.price)
            ) {
              this.notifyPriceAlert(coinId, price, alert);
            }
          });
        } catch (error) {
          console.warn(`Error checking price for ${coinId}:`, error);
        }
      }
    }, 60000); // Check every minute
  }

  private notifyPriceAlert(coinId: string, currentPrice: number, alert: { price: number; condition: 'above' | 'below' }) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Price Alert', {
        body: `${coinId.toUpperCase()} is now ${alert.condition} $${alert.price} (Current: $${currentPrice})`,
        icon: '/favicon.ico'
      });
    }
  }
}

export const cryptoAPI = CryptoAPI.getInstance();