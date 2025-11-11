import { env } from "./env";
import network from "./network";
import chain from "./chain";

const configs = {
  env,
  network: network[env],
  mainChain: chain[env],
};

/**
 * Module exports
 */
export default configs;
