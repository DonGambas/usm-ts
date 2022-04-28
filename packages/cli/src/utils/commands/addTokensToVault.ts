import BN from 'bn.js';
import { AccountLayout } from '@solana/spl-token';

import {
  Vault,
  SafetyDepositBox,
  AddTokenToInactiveVault,
} from '@metaplex-foundation/mpl-token-vault';
import { Connection, TransactionSignature, PublicKey, Keypair,sendAndConfirmTransaction, Transaction } from '@solana/web3.js';

import { Wallet, NodeWallet, actions, transactions} from '@metaplex/js';


const {createApproveTxs} = actions;
const { CreateTokenAccount } = transactions;

import { TransactionsBatch } from '../../../../ts/src/utils/utils';
import { Signer } from '@solana/web3.js';


interface Token2Add {
  tokenAccount: PublicKey;
  tokenMint: PublicKey;
  amount: BN;
}

interface SafetyDepositTokenStore {
  tokenAccount: PublicKey;
  tokenStoreAccount: PublicKey;
  tokenMint: PublicKey;
}

interface AddTokensToVaultParams {
  connection: Connection;
  wallet: NodeWallet;
  tokenOwnerKey: PublicKey | null;
  vault: PublicKey;
  nft: Token2Add;
}

interface AddTokensToVaultResponse {
  tokenStore: SafetyDepositTokenStore;
  tx: Transaction;
  signers: Signer[];
}

export const addTokensToVault = async ({
  connection,
  wallet,
  tokenOwnerKey,
  vault,
  nft,
}: AddTokensToVaultParams): Promise<AddTokensToVaultResponse> => {
  const txOptions = { feePayer: wallet.publicKey };

  const vaultAuthority = await Vault.getPDA(vault);
  const accountRent = await connection.getMinimumBalanceForRentExemption(AccountLayout.span);

    const tokenTxBatch = new TransactionsBatch({ transactions: [] });
    const safetyDepositBox = await SafetyDepositBox.getPDA(vault, nft.tokenMint);

    const tokenStoreAccount = Keypair.generate();
    const tokenStoreAccountTx = new CreateTokenAccount(txOptions, {
      newAccountPubkey: tokenStoreAccount.publicKey,
      lamports: accountRent,
      mint: nft.tokenMint,
      owner: vaultAuthority,
    });
    tokenTxBatch.addTransaction(tokenStoreAccountTx);

    const { authority: transferAuthority, createApproveTx } = createApproveTxs({
      account: nft.tokenAccount,
      owner: tokenOwnerKey,
      amount: nft.amount.toNumber(),
    });
    tokenTxBatch.addTransaction(createApproveTx);
    
    const addTokenTx = new AddTokenToInactiveVault(txOptions, {
      vault,
      vaultAuthority: wallet.publicKey,
      tokenAccount: nft.tokenAccount,
      tokenStoreAccount: tokenStoreAccount.publicKey,
      transferAuthority: transferAuthority.publicKey,
      safetyDepositBox: safetyDepositBox,
      amount: nft.amount,
    });
    tokenTxBatch.addTransaction(addTokenTx);

    const tx = new Transaction()
    tx.add(...tokenTxBatch.toTransactions())

    //const txId = await sendAndConfirmTransaction(connection, tx, [wallet.payer, tokenStoreAccount, transferAuthority], {commitment:"finalized"})

    const tokenStore = {
      tokenStoreAccount: tokenStoreAccount.publicKey,
      tokenMint: nft.tokenMint,
      tokenAccount: nft.tokenAccount,
    }

  return { tokenStore, tx, signers: [wallet.payer, tokenStoreAccount, transferAuthority]};
};