import * as web3 from "@solana/web3.js";
import * as token from "@solana/spl-token";
import { initializeKeypair } from "./initializeKeypair";
import {
  createMintAccount,
  createTokenAccount,
  createUpdateMetadata,
  mintTokensToAccount,
} from "./helpers";
import { UploadMetadataInput } from "@metaplex-foundation/js";

async function main() {
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"));
  const signer = await initializeKeypair(connection);
  console.log("Signer: ", signer.publicKey.toString());

  //const mintAccount = await createMintAccount({
  //   connection,
  //   payer: signer,
  //   mintAuthority: signer.publicKey,
  //   freezeAuthority: signer.publicKey,
  //   decimals: 9,
  // });

  const mintAccount = new web3.PublicKey(
    "7NE6EbbH4GQojJuXD8g1nCnZ4rfFnmhyk2BjbdaVijKC"
  );
  const mintAccountInfo: token.Mint = await token.getMint(
    connection,
    mintAccount
  );
  console.log("Mint Account: ", mintAccountInfo.address.toString());

  const tokenAccount = await createTokenAccount({
    connection,
    payer: signer,
    mint: mintAccount,
    owner: signer.publicKey,
  });

  await mintTokensToAccount({
    connection,
    payer: signer,
    mint: mintAccount,
    authority: signer,
    amount: 100 * 10 ** mintAccountInfo.decimals,
    destination: tokenAccount?.address!,
  });

  const MY_TOKEN_METADATA: UploadMetadataInput = {
    name: "Mooner",
    symbol: "MOONER",
    description: "Get ready to blast off! 🚀🌕 #Mooner",
    image:
      "https://res.cloudinary.com/n3v3rg1v3up/image/upload/v1681359905/mooner-no-bg-upload_k7wgum.png",
  };

  await createUpdateMetadata(
    "update",
    connection,
    signer,
    mintAccount,
    MY_TOKEN_METADATA
  );
}

main()
  .then(() => {
    console.log("Succesfully done!");
    process.exit(0);
  })
  .catch((error) => {
    console.log("Error:", error.message);
    process.exit(1);
  });
