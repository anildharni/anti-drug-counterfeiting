"use strict";

/**
 * This is a Node.JS module to load a user's Identity to his wallet.
 * This Identity will be used to sign transactions initiated by this user.
 * Defaults:
 *  User Name: MANUFACTURER_ADMIN
 *  User Organization: MANUFACTURER
 *  User Role: Admin
 *
 */

const fs = require("fs"); // FileSystem Library
const { FileSystemWallet, X509WalletMixin } = require("fabric-network"); // Wallet Library provided by Fabric
const path = require("path"); // Support library to build filesystem paths in NodeJs

const crypto_materials = path.resolve(__dirname, "../network/crypto-config"); // Directory where all Network artifacts are stored

// A wallet is a filesystem path that stores a collection of Identities
const wallet = new FileSystemWallet("./identity/manufacturer");

async function main(certificatePath, privateKeyPath) {
  // Main try/catch block
  try {
    // Fetch the credentials from our previously generated Crypto Materials required to create this user's identity
    const certificate = fs.readFileSync(certificatePath).toString();
    // IMPORTANT: Change the private key name to the key generated on your computer
    const privatekey = fs.readFileSync(privateKeyPath).toString();

    // Load credentials into wallet
    const identityLabel = "MANUFACTURER_ADMIN";
    const identity = X509WalletMixin.createIdentity("manufacturerMSP", certificate, privatekey);

    await wallet.import(identityLabel, identity);
  } catch (error) {
    console.log(`Error adding to wallet. ${error}`);
    console.log(error.stack);
    throw new Error(error);
  }
}

main(
  "/home/upgrad/Desktop/pharma-net/network/crypto-config/peerOrganizations/manufacturer.pharma-supply-network.com/users/Admin@manufacturer.pharma-supply-network.com/msp/signcerts/Admin@manufacturer.pharma-supply-network.com-cert.pem",
  "/home/upgrad/Desktop/pharma-net/network/crypto-config/peerOrganizations/manufacturer.pharma-supply-network.com/users/Admin@manufacturer.pharma-supply-network.com/msp/keystore/d5acafdeef4d074820c5f548140484388ed44b7bb9f8ff5415ea050d883d08c4_sk"
).then(() => {
  console.log("Manufacturer identity added to wallet.");
});

module.exports.execute = main;
