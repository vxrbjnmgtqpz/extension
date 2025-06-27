export type LogMessage = {
  timestamp: string;
  sender: string;
  message: string;
};

// Cache for agent logs with timestamps to track changes
const logCache: Record<string, { data: LogMessage[]; lastFetch: number }> = {};
const CACHE_DURATION = 1000; // 1 second cache

export function readAgentLog(agent: string): Promise<LogMessage[]> {
  const now = Date.now();
  const cached = logCache[agent];

  // Return cached data if it's fresh
  if (cached && now - cached.lastFetch < CACHE_DURATION) {
    return Promise.resolve(cached.data);
  }

  const url = `/agent_logs/${agent}/log.json?t=${Date.now()}`;

  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      logCache[agent] = { data, lastFetch: Date.now() };
      return data;
    })
    .catch((error) => {
      console.warn(`Could not read log for agent ${agent}:`, error);
      return [];
    });
}

// Force refresh of a specific agent log
export function refreshAgentLog(agent: string): Promise<LogMessage[]> {
  const url = `/agent_logs/${agent}/log.json?t=${Date.now()}`;

  return fetch(url)
    .then((response) => response.json())
    .then((data) => {
      logCache[agent] = { data, lastFetch: Date.now() };
      return data;
    })
    .catch((error) => {
      console.warn(`Could not refresh log for agent ${agent}:`, error);
      return [];
    });
}
