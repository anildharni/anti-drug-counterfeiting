"use strict";

/**
 * This is a Node.JS module to load a user's Identity to his wallet.
 * This Identity will be used to sign transactions initiated by this user.
 * Defaults:
 *  User Name: CONSUMER_ADMIN
 *  User Organization: CONSUMER
 *  User Role: Admin
 *
 */

const fs = require("fs"); // FileSystem Library
const { FileSystemWallet, X509WalletMixin } = require("fabric-network"); // Wallet Library provided by Fabric
const path = require("path"); // Support library to build filesystem paths in NodeJs

const crypto_materials = path.resolve(__dirname, "../network/crypto-config"); // Directory where all Network artifacts are stored

// A wallet is a filesystem path that stores a collection of Identities
const wallet = new FileSystemWallet("./identity/consumer");

async function main(certificatePath, privateKeyPath) {
  // Main try/catch block
  try {
    // Fetch the credentials from our previously generated Crypto Materials required to create this user's identity
    const certificate = fs.readFileSync(certificatePath).toString();
    // IMPORTANT: Change the private key name to the key generated on your computer
    const privatekey = fs.readFileSync(privateKeyPath).toString();

    // Load credentials into wallet
    const identityLabel = "CONSUMER_ADMIN";
    const identity = X509WalletMixin.createIdentity("consumerMSP", certificate, privatekey);

    await wallet.import(identityLabel, identity);
  } catch (error) {
    console.log(`Error adding to wallet. ${error}`);
    console.log(error.stack);
    throw new Error(error);
  }
}

main(
  "/home/upgrad/Desktop/pharma-net/network/crypto-config/peerOrganizations/consumer.pharma-supply-network.com/users/Admin@consumer.pharma-supply-network.com/msp/signcerts/Admin@consumer.pharma-supply-network.com-cert.pem",
  "/home/upgrad/Desktop/pharma-net/network/crypto-config/peerOrganizations/consumer.pharma-supply-network.com/users/Admin@consumer.pharma-supply-network.com/msp/keystore/d1b1241762c735f9577666e138881e1ec153ab0e0dcbfa6b3569ed837ff362ae_sk"
).then(() => {
  console.log("Consumer identity added to wallet.");
});

module.exports.execute = main;
