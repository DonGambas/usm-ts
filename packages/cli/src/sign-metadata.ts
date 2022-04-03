#! /usr/bin/env node

import { program } from 'commander';


import { serializeInstructionToBase64 } from '@solana/spl-governance'
import { PublicKey } from '@solana/web3.js';

import {
  Metadata,
  SignMetadata
} from '@metaplex-foundation/mpl-token-metadata';
import { getKeypair } from './utils';

program.version('1.0.0');

export type IAddress = string;

export async function signMetadata(nft: IAddress, creator: IAddress) {
  const metadataPDA = await Metadata.getPDA(nft);

  return new SignMetadata({}, {
      metadata: metadataPDA,
      creator: new PublicKey(creator)
  });
}

program
  .command('sign-metadata')
  .argument('<nft>', 'nft pubkey')
  .argument('[creator]', 'creator pubkey (uses the default wallet if left empty)')
  .option(
    '-I, --instructions-only',
    `Solana wallet location (uses the default wallet if left empty)`
  )  
  .option(
    '-e, --env <string>',
    'Solana cluster env name',
    'devnet',
  )
  .option(
    '-k, --keypair <path>',
    `Solana wallet location (uses the default wallet if left empty)`
  )  
  .action(async (nft, creator, options) => {
    const { instructionsOnly, env, keypair: pathToKeypair } = options;
    const keypair = await getKeypair(pathToKeypair);

    creator = creator ? creator : keypair.publicKey;

    const signedTransaction = await signMetadata(nft, creator);
    if (instructionsOnly) {
      console.log('base64 encoded instruction:');
      console.log(serializeInstructionToBase64(signedTransaction.instructions[0]))
      return;
    }

    // @TODO submit transaction
  });      
