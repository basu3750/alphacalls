import { useState, useEffect } from 'react';

interface DataSource {
  name: string;
  status: 'scanning' | 'connected' | 'error';
  latency: number;
}

export function ScannerStatus() {
  const [dataSources, setDataSources] = useState<DataSource[]>([
    { name: 'Xelion Terminal', status: 'scanning', latency: 0 },
    { name: 'PUMP.FUN', status: 'scanning', latency: 0 },
    { name: 'DexScreener', status: 'scanning', latency: 0 }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDataSources(prev => prev.map(source => ({
        ...source,
        status: 'connected',
        latency: Math.floor(Math.random() * 100) + 20
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mb-8 bg-gradient-to-r from-[#00ff00]/20 via-[#00ff00]/10 to-[#00ff00]/20 p-0.5 rounded-lg animate-gradient-x">
      {/* Rest of the component JSX remains the same */}
    </div>
  );
}