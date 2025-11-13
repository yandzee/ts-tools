import { defineConfig as _defineConfig } from 'tsdown';
import type { UserConfig } from 'tsdown';

export const defineConfig = (cfg: UserConfig) => {
  return _defineConfig([
    { ...cfg, platform: 'browser' },
    { ...cfg, platform: 'node' },
  ]);
};
