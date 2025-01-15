import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

interface TokenLaunch {
  name: string;
  symbol: string;
  launchTime: string;
  platform: string;
  initialMarketCap: number;
  description: string;
  socialMetrics: {
    telegram: number;
    twitter: number;
  };
  auditStatus: boolean;
  kycStatus: boolean;
  potentialScore: number;
}

export class LaunchTracker {
  private static instance: LaunchTracker;
  private interval: NodeJS.Timer | null = null;
  private supabase;
  private readonly API_BASE_URL = 'https://api.pump.fun/v1';

  private constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
  }

  static getInstance(): LaunchTracker {
    if (!LaunchTracker.instance) {
      LaunchTracker.instance = new LaunchTracker();
    }
    return LaunchTracker.instance;
  }

  // ... keep existing methods like calculatePotentialScore and fetchUpcomingLaunches ...

  private async storeLaunchData(launches: TokenLaunch[]) {
    try {
      // Get the current user
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found, skipping database storage');
        return;
      }

      for (const launch of launches) {
        const { error } = await this.supabase
          .from('coin_launches')
          .upsert({
            name: launch.name,
            launch_time: launch.launchTime,
            potential_gain: launch.potentialScore,
            platform: launch.platform,
            description: launch.description,
            user_id: user.id // Add the user_id
          });

        if (error) {
          console.error(`Error storing launch ${launch.name}:`, error);
        }
      }
    } catch (error) {
      console.error('Error storing launches:', error);
    }
  }

  async startTracking(intervalMs: number = 300000) {
    if (this.interval) return;

    const trackLaunches = async () => {
      try {
        const launches = await this.fetchUpcomingLaunches();
        const highPotentialLaunches = launches.filter(launch => launch.potentialScore >= 70);
        
        // Only try to store data if we have an authenticated session
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session) {
          await this.storeLaunchData(highPotentialLaunches);
        }
        
        document.dispatchEvent(new CustomEvent('launchUpdate', { 
          detail: highPotentialLaunches
        }));
      } catch (error) {
        console.error('Error in launch tracking:', error);
      }
    };

    await trackLaunches();
    this.interval = setInterval(trackLaunches, intervalMs);
  }

  stopTracking() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export const launchTracker = LaunchTracker.getInstance();