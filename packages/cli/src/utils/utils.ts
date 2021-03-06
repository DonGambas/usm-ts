import { PublicKey, Keypair } from '@solana/web3.js';
import Arweave from 'arweave';
import fs from 'fs';
import path from 'path';
import { MetaplexProgram } from '@metaplex-foundation/mpl-metaplex';
import { AuctionData } from '@metaplex-foundation/mpl-auction';

export const loadKeypair = (keypair: string) => {
    if (!keypair || keypair == '') {
        throw new Error('Keypair is required!');
    }
    const keypairPath = keypair.startsWith("~/") ? path.resolve(process.env.HOME, keypair.slice(2)) : path.resolve(keypair);
    const loaded = Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(fs.readFileSync(keypairPath).toString())),
    );
    return loaded;
}

export const uploadImage = async ({arweaveWallet, imagePath}) => {

    // need to save prod key in .env variable 

    //const wallet = await arweave.wallets.generate();

    const host = "arweave.net";
    const port = "443";
    const protocol = "https";

    const arweave = Arweave.init({
      host,
      port,
      protocol,
      timeout: 20000,
  });

    const arPath = arweaveWallet.startsWith("~/") ? path.resolve(process.env.HOME, arweaveWallet.slice(2)) : path.resolve(arweaveWallet)

    const arWallet = JSON.parse(fs.readFileSync(arPath).toString())
    const address = await arweave.wallets.jwkToAddress(arWallet);
    const winston = await arweave.wallets.getBalance(address);

    console.log("ar address = ", address)
    console.log("ar balance winstons =", winston)


     // image to upload

    let data = fs.readFileSync(path.resolve(__dirname, imagePath));

    const imgTx = await arweave.createTransaction(
        {
            data,
        },
        arWallet,
    );
    imgTx.addTag('App-Name', 'dfs');
    imgTx.addTag('Content-Type', 'image/jpeg');

    await arweave.transactions.sign(imgTx, arWallet);
    await arweave.transactions.post(imgTx);

    const imageUri = `${protocol}://${host}:${port}/${imgTx.id}`

    console.log("image uploaded successfully");
    console.log("image url =", imageUri)
}

export const createMetadataUri = async ({arweaveWallet, metadataPath}) => {

    // need to save prod key in .env variable 

    //const wallet = await arweave.wallets.generate();

    const host = "arweave.net";
    const port = "443";
    const protocol = "https";

    /*const host = '127.0.0.1';
    const port = "1984";
    const protocol = "http";*/

    const arweave = Arweave.init({
      host,
      port,
      protocol,
      timeout: 20000,
  });


    const arPath = arweaveWallet.startsWith("~/") ? path.resolve(process.env.HOME, arweaveWallet.slice(2)) : path.resolve(arweaveWallet)

    const arWallet = JSON.parse(fs.readFileSync(arPath).toString())
    const address = await arweave.wallets.jwkToAddress(arWallet);
    const winston = await arweave.wallets.getBalance(address);

    const metadata = JSON.parse(fs.readFileSync(path.resolve(__dirname, metadataPath)).toString())


    console.log("address = ", address)
    console.log("balance winstons =", winston)


    const arTx = await arweave.createTransaction(
        {
            data: JSON.stringify(metadata),
        },
        arWallet,
    );
    arTx.addTag('App-Name', 'dfs');
    arTx.addTag('Content-Type', 'application/json');

    try {
        await arweave.transactions.sign(arTx, arWallet);
        const result = await arweave.transactions.post(arTx);

        console.log(result)
    } catch (error) {
        console.log(error)
    }

   
    const metadataUri = `${protocol}://${host}:${port}/${arTx.id}`
    console.log(`metadata URI = ${metadataUri}`)

}



 

export const getOriginalLookupPDA =  async(auctionKey, metadataKey) => {
    return MetaplexProgram.findProgramAddress([
      Buffer.from(MetaplexProgram.PREFIX),
      auctionKey.toBuffer(),
      metadataKey.toBuffer(),
    ]);
  }

export function isWinner(auctionData: AuctionData, bidderPk: PublicKey) {
    return auctionData.bidState.bids
        .reverse()
        .slice(0, auctionData.bidState.max.toNumber())
        .some(b => b.key === bidderPk.toString());
}