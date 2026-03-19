import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Cluster {
  id: string;
  name: string;
  endpoint: string;
  region?: string;
}

interface ClusterStore {
  currentClusterId: string;
  clusters: Cluster[];
  setCluster: (id: string) => void;
  setClusters: (clusters: Cluster[]) => void;
}

export const useClusterStore = create<ClusterStore>()(
  devtools((set) => ({
    currentClusterId: 'default',
    clusters: [],
    setCluster: (id) => set({ currentClusterId: id }),
    setClusters: (clusters) => set({ clusters }),
  }))
);
