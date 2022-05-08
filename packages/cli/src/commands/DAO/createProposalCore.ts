
import { PublicKey, Transaction, Connection } from '@solana/web3.js';
import {  NodeWallet } from '@metaplex/js';

import {
  getGovernance,
  getTokenOwnerRecordAddress,
  getGovernanceProgramVersion,
  RpcContext,
  getRealm,
  serializeInstructionToBase64,
  ProgramAccount,
  Governance
} from '@solana/spl-governance';

import { TransactionsBatch } from '../../utils/transactionsBatch';

import {
  createProposal as coreCreateProposal,
  InstructionDataWithHoldUpTime,
  RpcConnection

} from './createProposal'

export interface CreateProposalArgs {
  owner: PublicKey;
  transaction: Transaction | TransactionsBatch;
  name: string;
  description: string;
  connection: Connection;
  wallet: NodeWallet;
  env: string
}

export async function createProposal({
  owner,
  transaction,
  name,
  description,
  connection,
  wallet,
  env
}: CreateProposalArgs) {
 
  if (wallet.publicKey === null) {
    return;
  }

  const walletPk = wallet.publicKey;
  const governance = await getGovernance(connection, owner);
  const realmPk = governance.account.realm;

  const realm = await getRealm(connection, realmPk);
  const governanceProgramPk = realm.owner;
  const councilTokenPk = realm.account.config.councilMint;

  const tokenOwnerRecordPk = await getTokenOwnerRecordAddress(
    governanceProgramPk,
    realmPk,
    councilTokenPk as PublicKey,
    walletPk
  );

  const isDraft = false;
  const instructionsData = isBatchedTransaction(transaction)
    ? parseBatchToInstructions(transaction, governance)
    : undefined; // @TODO

  if (!instructionsData) {
    return;
  }

  const signers = isBatchedTransaction(transaction) ? transaction.signers : []; // @TODO

  const governanceProgramVersion = await getGovernanceProgramVersion(
    connection,
    governanceProgramPk
  );
  const rpcContext = new RpcContext(
    governanceProgramPk,
    governanceProgramVersion,
    wallet,
    connection,
    env
  ) as RpcConnection;

  return coreCreateProposal(
    rpcContext,
    realm,
    owner,
    tokenOwnerRecordPk,
    name,
    description,
    councilTokenPk as PublicKey,
    governance.account.proposalCount,
    instructionsData,
    signers,
    isDraft
  );
}

function parseBatchToInstructions(
  txBatch: TransactionsBatch,
  governance: ProgramAccount<Governance>
): InstructionDataWithHoldUpTime[] | undefined {
  const isValid = true; // @TODO validate the instruction
  const instructions = txBatch.toInstructions();
  return instructions.map((ix) => {
    const instruction = new InstructionDataWithHoldUpTime({
      instruction: {
        serializedInstruction: serializeInstructionToBase64(ix),
        isValid,
        governance
      },
      governance
    });

    instruction.signers = txBatch.signers;
    return instruction;
  });
}

export function isBatchedTransaction(tx: TransactionsBatch | Transaction): tx is TransactionsBatch {
  return !!(tx as TransactionsBatch).transactions;
}