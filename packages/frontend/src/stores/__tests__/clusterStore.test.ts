import { describe, expect, it, beforeEach } from 'vitest';
import { useClusterStore } from '../clusterStore';

describe('clusterStore', () => {
  beforeEach(() => {
    useClusterStore.setState({
      currentClusterId: 'default',
      clusters: [],
    });
  });

  it('has correct initial state', () => {
    const state = useClusterStore.getState();
    expect(state.currentClusterId).toBe('default');
    expect(state.clusters).toEqual([]);
  });

  it('setCluster updates currentClusterId', () => {
    useClusterStore.getState().setCluster('prod-cluster');
    expect(useClusterStore.getState().currentClusterId).toBe('prod-cluster');
  });

  it('setClusters updates cluster list', () => {
    const clusters = [
      { id: 'c1', name: 'Cluster 1', endpoint: 'https://c1.example.com' },
      { id: 'c2', name: 'Cluster 2', endpoint: 'https://c2.example.com', region: 'us-east-1' },
    ];
    useClusterStore.getState().setClusters(clusters);
    expect(useClusterStore.getState().clusters).toEqual(clusters);
    expect(useClusterStore.getState().clusters).toHaveLength(2);
  });

  it('setClusters replaces existing clusters', () => {
    useClusterStore.getState().setClusters([
      { id: 'old', name: 'Old', endpoint: 'https://old.example.com' },
    ]);
    useClusterStore.getState().setClusters([
      { id: 'new', name: 'New', endpoint: 'https://new.example.com' },
    ]);
    expect(useClusterStore.getState().clusters).toHaveLength(1);
    expect(useClusterStore.getState().clusters[0].id).toBe('new');
  });
});
