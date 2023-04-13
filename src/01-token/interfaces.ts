import * as web3 from "@solana/web3.js";

export interface CreateMintAccount {
  connection: web3.Connection;
  payer: web3.Keypair;
  mintAuthority: web3.PublicKey;
  freezeAuthority: web3.PublicKey;
  decimals: number;
}

export interface CreateTokenAccount {
  connection: web3.Connection;
  payer: web3.Keypair;
  mint: web3.PublicKey;
  owner: web3.PublicKey;
}

export interface MintTokensToAccount {
  connection: web3.Connection;
  payer: web3.Keypair;
  mint: web3.PublicKey;
  destination: web3.PublicKey;
  authority: web3.Keypair | web3.PublicKey;
  amount: number;
}

export interface MetadataAccount {
  name: string;
  symbol: string;
  description: string;
  image: string;
}
