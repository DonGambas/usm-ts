import { PublicKey, clusterApiUrl, Connection, Commitment, Cluster } from '@solana/web3.js';
import { AuctionProgram } from '@metaplex-foundation/mpl-auction';


export const getBidderPotTokenPDA = async (bidderPotPubKey: PublicKey) => {
  return AuctionProgram.findProgramAddress([
    Buffer.from(AuctionProgram.PREFIX),
    bidderPotPubKey.toBuffer(),
    Buffer.from('bidder_pot_token')
  ]);
};

// Taken from governance-ui
export function chunks<T>(array: T[], size: number): T[][] {
  const result: Array<T[]> = [];
  let i, j;
  for (i = 0, j = array.length; i < j; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export type RpcEndpoint = Cluster | string;
export type ConnectionConfig = {
  rpcEndpoint: RpcEndpoint;
  commitment?: Commitment;
};

export type ConnectionConfigOrEndpoint = RpcEndpoint | ConnectionConfig;

export function createRpcConnection(config: ConnectionConfigOrEndpoint): Connection {
  const { rpcEndpoint, commitment = 'processed' }: ConnectionConfig =
    typeof config === 'string' ? { rpcEndpoint: config } : config;
  const endpoint = rpcEndpoint?.startsWith('http')
    ? rpcEndpoint
    : clusterApiUrl(rpcEndpoint as Cluster);

  return new Connection(endpoint, commitment);
}