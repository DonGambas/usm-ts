import util from 'util';
import { exec as baseExec } from "child_process";

import { loadKeypair } from './utils';

const exec = util.promisify(baseExec);

export const getActiveKeypairPath = async () => {
  const { stdout, stderr} = await exec("solana config get keypair");
  if (stderr) {
    console.error(stderr);
    return;
  }

  const startIndex = stdout.indexOf(': ') + 2;
  return stdout.slice(startIndex).trim();
}

export const getKeypair = async (pathToKeypair?: string) => {
  return loadKeypair(pathToKeypair ? pathToKeypair : await getActiveKeypairPath());
}