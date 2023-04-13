import * as web3 from "@solana/web3.js";
import * as token from "@solana/spl-token";
import * as mpl from "@metaplex-foundation/mpl-token-metadata";
import * as anchor from "@project-serum/anchor";
import {
  Metaplex,
  UploadMetadataInput,
  bundlrStorage,
  keypairIdentity,
} from "@metaplex-foundation/js";
import {
  CreateMintAccount,
  CreateTokenAccount,
  MintTokensToAccount,
} from "./interfaces";

export async function createMintAccount({
  connection,
  payer,
  mintAuthority,
  freezeAuthority,
  decimals,
}: CreateMintAccount): Promise<web3.PublicKey> {
  const mintAccount = await token.createMint(
    connection,
    payer,
    mintAuthority,
    freezeAuthority,
    decimals
  );

  console.log(
    `Mint Account: https://explorer.solana.com/address/${mintAccount}?cluster=devnet`
  );

  return mintAccount;
}

export async function createTokenAccount({
  connection,
  payer,
  mint,
  owner,
}: CreateTokenAccount) {
  try {
    const tokenAccount = await token.getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      owner
    );
    console.log(
      `Token Account: https://explorer.solana.com/address/${tokenAccount.address}?cluster=devnet`
    );
    return tokenAccount;
  } catch (error: any) {
    console.log(error.message);
  }
}

export async function mintTokensToAccount({
  connection,
  payer,
  mint,
  destination,
  authority,
  amount,
}: MintTokensToAccount) {
  try {
    const transactionSignature = await token.mintTo(
      connection,
      payer,
      mint,
      destination,
      authority,
      amount
    );
    console.log(
      `Mint Token Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    );
  } catch (error: any) {
    console.log(error.message);
  }
}

export async function createUpdateMetadata(
  method: "create" | "update",
  connection: web3.Connection,
  signer: web3.Keypair,
  mint: web3.PublicKey,
  tokenMetaData: UploadMetadataInput
): Promise<void> {
  const seed1 = Buffer.from(anchor.utils.bytes.utf8.encode("metadata"));
  const seed2 = Buffer.from(mpl.PROGRAM_ID.toBytes());
  const seed3 = Buffer.from(mint.toBytes());

  const [metadataPDA, _bump] = web3.PublicKey.findProgramAddressSync(
    [seed1, seed2, seed3],
    mpl.PROGRAM_ID
  );

  const accounts = {
    metadata: metadataPDA,
    mint,
    mintAuthority: signer.publicKey,
    payer: signer.publicKey,
    updateAuthority: signer.publicKey,
  };

  const tokenMetadataV2 = {
    name: tokenMetaData.name,
    symbol: tokenMetaData.symbol,
    uri: "",
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  } as mpl.DataV2;

  const uri = await uploadMetadata(connection, signer, tokenMetaData);
  tokenMetadataV2.uri = uri;

  try {
    let ix: web3.TransactionInstruction;
    if (method == "create") {
      const args: mpl.CreateMetadataAccountV2InstructionArgs = {
        createMetadataAccountArgsV2: {
          data: tokenMetadataV2,
          isMutable: true,
        },
      };
      ix = mpl.createCreateMetadataAccountV2Instruction(accounts, args);
    }
    if (method == "update") {
      const args: mpl.UpdateMetadataAccountV2InstructionArgs = {
        updateMetadataAccountArgsV2: {
          data: tokenMetadataV2,
          isMutable: true,
          updateAuthority: signer.publicKey,
          primarySaleHappened: true,
        },
      };
      ix = mpl.createUpdateMetadataAccountV2Instruction(accounts, args);
    }

    const transaction = new web3.Transaction();
    transaction.add(ix!);
    const transactionSignature = await web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [signer]
    );
    console.log(
      `Metadata transaction:: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    );
  } catch (error: any) {
    console.log(error);
  }
}

async function uploadMetadata(
  connection: web3.Connection,
  signer: web3.Keypair,
  tokenMetadata: UploadMetadataInput
) {
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(signer))
    .use(
      bundlrStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: web3.clusterApiUrl("devnet"),
        timeout: 60000,
      })
    );

  //Upload to Arweave
  const { uri } = await metaplex.nfts().uploadMetadata(tokenMetadata);
  console.log(`Arweave URL: `, uri);
  return uri;
}
