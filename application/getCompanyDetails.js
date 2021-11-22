"use strict";

/**
 * This is a Node.JS application to add a new student on the network.
 */

const fs = require("fs");
const yaml = require("js-yaml");
const { FileSystemWallet, Gateway } = require("fabric-network");
let gateway;

async function getCompanyDetails(companyCRN) {
  try {
    const pharmanetContract = await getContractInstance();

    // register new company
    console.log(".....Get details of the Resistered New Company");
    const getRegisteredCompanyBuffer = await pharmanetContract.submitTransaction("getCompanyDetails", companyCRN);

    // process response
    console.log(".....Processing Register New Comapny Transaction Response \n\n");
    let newCompany = JSON.parse(getRegisteredCompanyBuffer.toString());
    console.log(newCompany);
    console.log("\n\n.....Register New Company Transaction Complete!");
    return newCompany;
  } catch (error) {
    console.log(`\n\n ${error} \n\n`);
    throw new Error(error);
  } finally {
    // Disconnect from the fabric gateway
    console.log(".....Disconnecting from Fabric Gateway");
    gateway.disconnect();
  }
}

async function getContractInstance() {
  // A gateway defines which peer is used to access Fabric network
  // It uses a common connection profile (CCP) to connect to a Fabric Peer
  // A CCP is defined manually in file connection-profile-mhrd.yaml
  gateway = new Gateway();

  // A wallet is where the credentials to be used for this transaction exist
  // Credentials for user MHRD_ADMIN was initially added to this wallet.
  const wallet = new FileSystemWallet("./identity/manufacturer");

  // What is the username of this Client user accessing the network?
  const fabricUserName = "MANUFACTURER_ADMIN";

  // Load connection profile; will be used to locate a gateway; The CCP is converted from YAML to JSON.
  let connectionProfile = yaml.safeLoad(fs.readFileSync("./connection-profile-manufacturer.yaml", "utf8"));

  // Set connection options; identity and wallet
  let connectionOptions = {
    wallet: wallet,
    identity: fabricUserName,
    discovery: { enabled: false, asLocalhost: true },
  };

  // Connect to gateway using specified parameters
  console.log(".....Connecting to Fabric Gateway");
  await gateway.connect(connectionProfile, connectionOptions);

  // Access certification channel
  console.log(".....Connecting to channel - pharmachannel");
  const channel = await gateway.getNetwork("pharmachannel");

  // Get instance of deployed Certnet contract
  // @param Name of chaincode
  // @param Name of smart contract
  console.log(".....Connecting to Certnet Smart Contract");
  return channel.getContract("pharmanet", "org.pharma-network.pharmanet");
}

getCompanyDetails("COMPANYCRN001").then(() => {
  console.log("Getting Details of Registered New Company created");
});

module.exports.execute = getCompanyDetails;
//"registerCompany",companyCRN, companyName, location, organisationRole;
