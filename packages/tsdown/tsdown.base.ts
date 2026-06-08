import type { UserConfig } from 'tsdown';
import { defineConfig as _defineConfig } from 'tsdown';

type Options = {
  browser?: boolean;
  node?: boolean;
};

export const defineConfig = (cfg: UserConfig, opts?: Options) => {
  const browserCfg: UserConfig[] = opts?.browser === false ? [] : [{ ...cfg, platform: 'browser' }];
  const nodeCfg: UserConfig[] = opts?.node === false ? [] : [{ ...cfg, platform: 'node' }];

  return _defineConfig(browserCfg.concat(nodeCfg));
};
