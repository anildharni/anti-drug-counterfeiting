"use strict";

// Importing the necessary packages
const { Contract } = require("fabric-contract-api");
const ClientIdentity = require("fabric-shim").ClientIdentity;
const util = require("util");

class PharmanetContract extends Contract {
  // Default constructor method
  constructor() {
    // Provide a custom name to refer to this smart contract
    super("org.pharma-network.pharmanet");
  }

  // This is a basic user defined function used at the time of instantiating the smart contract
  // to print the success message on console
  async instantiate(ctx) {
    console.log("Pharmanet Smart Contract Instantiated Super successful");
  }

  // Used to register the company with the network
  // @params companyCRN - unique CRN for each company
  //         companyName - Name of the company
  //         location - Location of the company
  //         organisationRole - Has 4 values (Manufacturer, Distributor, Retailer, Transporter)
  // @return companyObject
  async registerCompany(ctx, companyCRN, companyName, location, organisationRole) {
    console.log("Registering the company " + companyName);

    let cid = new ClientIdentity(ctx.stub);
    let mspID = cid.getMSPID();

    console.log("MSPID of the transaction initiator is=> " + mspID);

    // All participants other than consumer can register the company
    if ("consumerMSP" !== mspID) {
      const companyID = ctx.stub.createCompositeKey("org.pharma-network.pharmanet.company", [companyCRN, companyName]);

      //Check for the role and assaign hierarchyKey accordingly
      if (
        organisationRole !== "Manufacturer" &&
        organisationRole !== "Distributor" &&
        organisationRole !== "Retailer" &&
        organisationRole !== "Transporter"
      ) {
        return "Invalid Organisation Role";
      } else {
        let hierarchyKey;
        if (organisationRole === "Manufacturer") {
          hierarchyKey = "1";
        } else if (organisationRole === "Distributor") {
          hierarchyKey = "2";
        } else if (organisationRole === "Retailer") {
          hierarchyKey = "3";
        } else if (organisationRole === "Transporter") {
          hierarchyKey = "";
        }

        let companyObject = {
          companyID: companyID,
          name: companyName,
          location: location,
          organisationRole: organisationRole,
          hierarchyKey: hierarchyKey,
          createdAt: new Date(),
        };

        let companyDataBuffer = Buffer.from(JSON.stringify(companyObject));
        await ctx.stub.putState(companyID, companyDataBuffer);

        return companyObject;
      }
    }
  }

  // Used by organisation registered as a 'manufacturer' to register new drug on the ledger
  // @params drugName - Name of the drug
  //         serialNo - serial number of the drug
  //         mfgDate - Date of manufacturer of the drug
  //         expDate - Expiry date of the drug
  //         companyCRN - Unique CRN number of the manufacturer
  //@returns drugObject that's saved to the ledger
  async addDrug(ctx, drugName, serialNo, mfgDate, expDate, companyCRN) {
    let companyResultsIterator = await ctx.stub.getStateByPartialCompositeKey("org.pharma-network.pharmanet.company", [
      companyCRN,
    ]);

    // Iterate through result set and for each company found.
    var manufacturerFound = false;
    while (!manufacturerFound) {
      let responseRange = await companyResultsIterator.next();

      if (!responseRange || !responseRange.value || !responseRange.value.key) {
        return "Invalid companyCRN";
      }

      manufacturerFound = true;
      let objectType;
      let attributes;
      ({ objectType, attributes } = await ctx.stub.splitCompositeKey(responseRange.value.key));

      let returnedCompanyName = attributes[1];
      let returnedCompanyCRN = attributes[0];

      //generate key of the drug owner
      const generateKeyDrugOwner = await ctx.stub.createCompositeKey("org.pharma-network.pharmanet.company", [
        returnedCompanyCRN,
        returnedCompanyName,
      ]);

      let cid = new ClientIdentity(ctx.stub);
      let mspID = cid.getMSPID();

      if ("manufacturerMSP" === mspID) {
        const productID = ctx.stub.createCompositeKey("org.pharma-network.pharmanet.drug", [drugName, serialNo]);

        //create the drug object to store on the ledger
        let drugObject = {
          productID: productID,
          name: drugName,
          manufacturer: generateKeyDrugOwner,
          manufacturingDate: mfgDate,
          expiryDate: expDate,
          owner: generateKeyDrugOwner,
          shipment: "",
        };

        let drugDataBuffer = Buffer.from(JSON.stringify(drugObject));
        await ctx.stub.putState(productID, drugDataBuffer);
        return drugObject;
      } else {
        return "No one can add a drug but Manufacturer.";
      }
    }
  }

  // Used to create a Purchase Order (PO) to buy drugs by companies belonging to ‘Distributor’ or ‘Retailer’ organisation.
  // @params buyerCRN - drug buyers CRN
  //         sellerCRN - drug sellers CRN
  //         drugName - name of the drug
  //         quantity - quantity of the drug
  // @returns purchaseOrderObject - purchase order created
  // async createPO(ctx, buyerCRN, sellerCRN, drugName, quantity) {
  //   //Check the initiator of the transaction is ‘Distributor’ or ‘Retailer’
  //   let cid = new ClientIdentity(ctx.stub);

  //   //Uncomment me
  //   //let mspID = cid.getMSPID();

  //   //remove me
  //   let mspID = "distributorMSP";
  //   console.log(
  //     "buyerCRN is=>" + buyerCRN + "sellerCRN=> " + sellerCRN + "drugName=> " + drugName + "quantity=>" + quantity
  //   );
  //   //Create PO to buy drugs, by the comapnies belonging to "Distributor" or "Retailer" organisation.
  //   if ("retailerMSP" !== mspID && "distributorMSP" !== mspID) {
  //     return "Sorry! Only Distributor and Retailer can create a purchase request!";
  //   } else {
  //     // Go ahead and check the hierarchy
  //     let sellerCRNResultsIterator = await ctx.stub.getStateByPartialCompositeKey(
  //       "org.pharma-network.pharmanet.company",
  //       [sellerCRN]
  //     );

  //     var sellerCRNFound = false;
  //     while (!sellerCRNFound) {
  //       let sellerCRNResponseRange = await sellerCRNResultsIterator.next();

  //       if (!sellerCRNResponseRange || !sellerCRNResponseRange || !sellerCRNResponseRange.value.key) {
  //         return "Invalid Seller CompanyCRN";
  //       } else {
  //         sellerCRNFound = true;
  //         let objectType;
  //         let attributes;
  //         ({ objectType, attributes } = await ctx.stub.splitCompositeKey(sellerCRNResponseRange.value.key));

  //         let returnedSellerCompanyName = attributes[1];
  //         let returnedSellerCompanyCRN = attributes[0];

  //         console.log("returnedSellerCompanyName=> " + returnedSellerCompanyName);
  //         console.log("returnedSellerCompanyCRN=> " + returnedSellerCompanyCRN);

  //         var generateSellerCompanyID = await ctx.stub.createCompositeKey("org.pharma-network.pharmanet.company", [
  //           returnedSellerCompanyCRN,
  //           returnedSellerCompanyName,
  //         ]);

  //         var sellerCompanyBuffer = await ctx.stub.getState(generateSellerCompanyID).catch((err) => console.log(err));
  //         console.log("Seller Company Details are=> " + sellerCompanyBuffer.toString());
  //       }
  //     }

  //     let buyerCRNResultsIterator = await ctx.stub.getStateByPartialCompositeKey(
  //       "org.pharma-network.pharmanet.company",
  //       [buyerCRN]
  //     );

  //     var buyerCRNFound = false;
  //     while (!buyerCRNFound) {
  //       let buyerCRNResponseRange = await buyerCRNResultsIterator.next();

  //       if (!buyerCRNResponseRange || !buyerCRNResponseRange || !buyerCRNResponseRange.value.key) {
  //         return "Invalid Seller CompanyCRN";
  //       } else {
  //         buyerCRNFound = true;
  //         let objectType;
  //         let attributes;
  //         ({ objectType, attributes } = await ctx.stub.splitCompositeKey(buyerCRNResponseRange.value.key));

  //         let returnedBuyerCompanyName = attributes[1];
  //         let returnedBuyerCompanyCRN = attributes[0];

  //         console.log("returnedBuyerCompanyName=> " + returnedBuyerCompanyName);
  //         console.log("returnedBuyerCompanyCRN=> " + returnedBuyerCompanyCRN);

  //         var generateBuyerCompanyID = await ctx.stub.createCompositeKey("org.pharma-network.pharmanet.company", [
  //           returnedBuyerCompanyCRN,
  //           returnedBuyerCompanyName,
  //         ]);

  //         var buyerCompanyBuffer = await ctx.stub.getState(generateBuyerCompanyID).catch((err) => console.log(err));
  //         console.log("Buyer Company Details are=> " + buyerCompanyBuffer.toString());
  //       }
  //     }
  //   }

  //   console.log("I am the Buyer=> " + buyerCompanyBuffer);
  //   console.log("I am the seller=> " + sellerCompanyBuffer);
  //   let buyerData = JSON.parse(buyerCompanyBuffer.toString());
  //   console.log("buyerData=> " + buyerData);
  //   let sellerData = JSON.parse(sellerCompanyBuffer.toString());
  //   console.log("sellerData=> " + sellerData.organisationRole);

  //   //Check hierachy
  //   if (buyerData.organisationRole === "Retailer") {
  //     console.log("Retailer can purchase only from Distributor");
  //     if (sellerData.organisationRole === "Distributor") {
  //       //All Good, Create a purchase request
  //       console.log("All Good, Create a purchase request");
  //       // CRN number of the buyer and Drug Name, along with an appropriate namespace.
  //       const poID = ctx.stub.createCompositeKey("org.pharma-network.pharmanet.productOrders", [buyerCRN, drugName]);

  //       //create the drug object to store on the ledger
  //       let purchaseOrderObject = {
  //         poID: poID,
  //         drugName: drugName,
  //         quantity: quantity,
  //         buyer: generateBuyerCompanyID,
  //         seller: generateSellerCompanyID,
  //       };

  //       console.log("purchaseOrderObject created is==> " + purchaseOrderObject);

  //       let purchaseOrderDataBuffer = Buffer.from(JSON.stringify(purchaseOrderObject));
  //       await ctx.stub.putState(poID, purchaseOrderDataBuffer);
  //       return purchaseOrderObject;
  //     } else {
  //       let returnValue = "Sorry!" + buyerData.organisationRole + " can't purchase from " + sellerData.organisationRole;
  //       console.log("Sorry!" + buyerData.organisationRole + " can't purchase from " + sellerData.organisationRole);
  //       return returnValue;
  //     }
  //   } else if (buyerData.organisationRole === "Distributor") {
  //     console.log("Distributor can purchase only from Manufacturer");
  //     if (sellerData.organisationRole === "Manufacturer") {
  //       //All Good, Create a purchase request
  //       console.log("All Good, Create a purchase request");
  //       const poID = ctx.stub.createCompositeKey("org.pharma-network.pharmanet.productOrders", [buyerCRN, drugName]);

  //       //create the drug object to store on the ledger
  //       let purchaseOrderObject = {
  //         poID: poID,
  //         drugName: drugName,
  //         quantity: quantity,
  //         buyer: generateBuyerCompanyID,
  //         seller: generateSellerCompanyID,
  //       };

  //       console.log("purchaseOrderObject created is==> " + purchaseOrderObject);

  //       let purchaseOrderDataBuffer = Buffer.from(JSON.stringify(purchaseOrderObject));
  //       await ctx.stub.putState(poID, purchaseOrderDataBuffer);
  //       return purchaseOrderObject;
  //     } else {
  //       let returnValue = "Sorry!" + buyerData.organisationRole + " can't purchase from " + sellerData.organisationRole;
  //       console.log("Sorry!" + buyerData.organisationRole + " can't purchase from " + sellerData.organisationRole);
  //       return returnValue;
  //     }
  //   } else {
  //     console.log(buyerData.organisationRole + " can't purchase from " + sellerData.organisationRole);
  //     let returnValue = buyerData.organisationRole + " can't purchase from " + sellerData.organisationRole;
  //     return returnValue;
  //   }
  // }

  async createPO(ctx, buyerCRN, sellerCRN, drugName, quantity) {
    //Check the initiator of the transaction is ‘Distributor’ or ‘Retailer’
    let cid = new ClientIdentity(ctx.stub);

    //Uncomment me
    // let mspID = cid.getMSPID();

    //remove me
    let mspID = "distributorMSP";
    console.log(
      "buyerCRN is=>" + buyerCRN + "sellerCRN=> " + sellerCRN + "drugName=> " + drugName + "quantity=>" + quantity
    );
    //Create PO to buy drugs, by the comapnies belonging to "Distributor" or "Retailer" organisation.
    if ("retailerMSP" !== mspID && "distributorMSP" !== mspID) {
      return "Sorry! Only Distributor and Retailer can create a purchase request!";
    } else {
      // Go ahead and check the hierarchy
      let sellerCRNResultsIterator = await ctx.stub.getStateByPartialCompositeKey(
        "org.pharma-network.pharmanet.company",
        [sellerCRN]
      );

      var sellerCRNFound = false;
      while (!sellerCRNFound) {
        let sellerCRNResponseRange = await sellerCRNResultsIterator.next();

        if (!sellerCRNResponseRange || !sellerCRNResponseRange || !sellerCRNResponseRange.value.key) {
          return "Invalid Seller CompanyCRN";
        } else {
          sellerCRNFound = true;
          let objectType;
          let attributes;
          ({ objectType, attributes } = await ctx.stub.splitCompositeKey(sellerCRNResponseRange.value.key));

          let returnedSellerCompanyName = attributes[0];
          let returnedSellerCompanyCRN = attributes[1];

          console.info(
            util.format(
              "- found a company from namespace:%s companyname:%s companycrn:%s\n",
              objectType,
              returnedSellerCompanyName,
              returnedSellerCompanyCRN
            )
          );

          var generateSellerCompanyID = await ctx.stub.createCompositeKey("org.pharma-network.pharmanet.company", [
            returnedSellerCompanyName,
            returnedSellerCompanyCRN,
          ]);

          var sellerCompanyBuffer = await ctx.stub.getState(generateSellerCompanyID).catch((err) => console.log(err));
          console.log("Seller Company Details are=> " + sellerCompanyBuffer.toString());
        }
      }

      let buyerCRNResultsIterator = await ctx.stub.getStateByPartialCompositeKey(
        "org.pharma-network.pharmanet.company",
        [buyerCRN]
      );

      var buyerCRNFound = false;
      while (!buyerCRNFound) {
        let buyerCRNResponseRange = await buyerCRNResultsIterator.next();

        if (!buyerCRNResponseRange || !buyerCRNResponseRange || !buyerCRNResponseRange.value.key) {
          return "Invalid Seller CompanyCRN";
        } else {
          buyerCRNFound = true;
          let objectType;
          let attributes;
          ({ objectType, attributes } = await ctx.stub.splitCompositeKey(buyerCRNResponseRange.value.key));

          let returnedBuyerCompanyName = attributes[0];
          let returnedBuyerCompanyCRN = attributes[1];

          console.info(
            util.format(
              "- found a company from namespace:%s companyname:%s companycrn:%s\n",
              objectType,
              returnedBuyerCompanyName,
              returnedBuyerCompanyCRN
            )
          );

          var generateBuyerCompanyID = await ctx.stub.createCompositeKey("org.pharma-network.pharmanet.company", [
            returnedBuyerCompanyName,
            returnedBuyerCompanyCRN,
          ]);

          var buyerCompanyBuffer = await ctx.stub.getState(generateBuyerCompanyID).catch((err) => console.log(err));
          console.log("Buyer Company Details are=> " + buyerCompanyBuffer.toString());
        }
      }
    }

    console.log("I am the Buyer=> " + buyerCompanyBuffer);
    console.log("I am the seller=> " + sellerCompanyBuffer);
    let buyerData = JSON.parse(buyerCompanyBuffer.toString());
    console.log("buyerData=> " + buyerData);
    let sellerData = JSON.parse(sellerCompanyBuffer.toString());
    console.log("sellerData=> " + sellerData.organisationRole);

    //Check hierachy
    if (buyerData.organisationRole === "Retailer") {
      console.log("Retailer can purchase only from Distributor");
      if (sellerData.organisationRole === "Distributor") {
        //All Good, Create a purchase request
        console.log("All Good, Create a purchase request");
        // CRN number of the buyer and Drug Name, along with an appropriate namespace.
        const poID = ctx.stub.createCompositeKey("org.pharma-network.pharmanet.productOrders", [buyerCRN, drugName]);

        //create the drug object to store on the ledger
        let purchaseOrderObject = {
          poID: poID,
          drugName: drugName,
          quantity: quantity,
          buyer: generateBuyerCompanyID,
          seller: generateSellerCompanyID,
        };

        console.log("purchaseOrderObject created is==> " + purchaseOrderObject);

        let purchaseOrderDataBuffer = Buffer.from(JSON.stringify(purchaseOrderObject));
        await ctx.stub.putState(poID, purchaseOrderDataBuffer);
        return purchaseOrderObject;
      } else {
        let returnValue = "Sorry!" + buyerData.organisationRole + " can't purchase from " + sellerData.organisationRole;
        console.log("Sorry!" + buyerData.organisationRole + " can't purchase from " + sellerData.organisationRole);
        return returnValue;
      }
    } else if (buyerData.organisationRole === "Distributor") {
      console.log("Distributor can purchase only from Manufacturer");
      if (sellerData.organisationRole === "Manufacturer") {
        //All Good, Create a purchase request
        console.log("All Good, Create a purchase request");
        const poID = ctx.stub.createCompositeKey("org.pharma-network.pharmanet.productOrders", [buyerCRN, drugName]);

        //create the drug object to store on the ledger
        let purchaseOrderObject = {
          poID: poID,
          drugName: drugName,
          quantity: quantity,
          buyer: generateBuyerCompanyID,
          seller: generateSellerCompanyID,
        };

        console.log("purchaseOrderObject created is==> " + purchaseOrderObject);

        let purchaseOrderDataBuffer = Buffer.from(JSON.stringify(purchaseOrderObject));
        await ctx.stub.putState(poID, purchaseOrderDataBuffer);
        return purchaseOrderObject;
      } else {
        let returnValue = "Sorry!" + buyerData.organisationRole + " can't purchase from " + sellerData.organisationRole;
        console.log("Sorry!" + buyerData.organisationRole + " can't purchase from " + sellerData.organisationRole);
        return returnValue;
      }
    } else {
      console.log(buyerData.organisationRole + " can't purchase from " + sellerData.organisationRole);
      let returnValue = buyerData.organisationRole + " can't purchase from " + sellerData.organisationRole;
      return returnValue;
    }
  }

  // Seller invokes to transport the consignment via a transporter corresponding to each PO.
  // @params buyerCRN - Drug's buyer CRN
  //         drugName - Name of the drug
  //         listOfAssets - list of drug
  //         transporterCRN - CRN of the transporter who delivers the drug
  // @returns shipmentObject - in response to the Purchase order
  async createShipment(ctx, buyerCRN, drugName, listOfAssets, transporterCRN) {
    let listFromCommandLine = listOfAssets.split(",");
    let listOfAssetsLength = listFromCommandLine.length;

    //Get the PO associated with the buyerCRN
    let buyerCRNResultsIterator = await ctx.stub.getStateByPartialCompositeKey(
      "org.pharma-network.pharmanet.productOrders",
      [buyerCRN]
    );

    var buyerCRNFound = false;
    while (!buyerCRNFound) {
      let buyerCRNResponseRange = await buyerCRNResultsIterator.next();

      if (!buyerCRNResponseRange || !buyerCRNResponseRange || !buyerCRNResponseRange.value.key) {
        return "Invalid Buyer CompanyCRN";
      } else {
        buyerCRNFound = true;
        let objectType;
        let attributes;
        ({ objectType, attributes } = await ctx.stub.splitCompositeKey(buyerCRNResponseRange.value.key));

        let returnedBuyerCRN = attributes[0];
        let returnedBuyerDrugName = attributes[1];

        //From buyerCRN and drugName get the purchase order associated with that buyer
        let generatePOID = await ctx.stub.createCompositeKey("org.pharma-network.pharmanet.productOrders", [
          returnedBuyerCRN,
          returnedBuyerDrugName,
        ]);

        //Get the purchase order
        let buyerPurchaseBuffer = await ctx.stub.getState(generatePOID).catch((err) => console.log(err));
        let parsedPurchaseOrder = JSON.parse(buyerPurchaseBuffer.toString());

        //Check Validation 1-listOfAssets should be exactly equal to the quantity speified in the PO
        if (listOfAssetsLength == parsedPurchaseOrder.quantity) {
          //Check Validation 2
          //The IDs of the asset should be valid ID which are registered on the network.
          var validDrugId = true;
          var listOfCompositeKeysForDrugs = [];
          for (let i = 0; i <= listFromCommandLine.length - 1; i++) {
            if (validDrugId) {
              //Using the serialnumber and drugName get the details of the drug.
              let serialnumberOfTheDrug = listFromCommandLine[i];
              const productDrugID = ctx.stub.createCompositeKey("org.pharma-network.pharmanet.drug", [
                drugName,
                serialnumberOfTheDrug,
              ]);

              let drugDetailsBuffer = await ctx.stub.getState(productDrugID).catch((err) => console.log(err));
              try {
                let json = JSON.parse(drugDetailsBuffer.toString());
                validDrugId = true;
                listOfCompositeKeysForDrugs.push(productDrugID);
              } catch (err) {
                validDrugId = false;
                return "Sorry the drug is not registered with the network";
              }
            }
          }
          if (validDrugId) {
            const shipmentID = ctx.stub.createCompositeKey("org.pharma-network.pharmanet.shipment", [
              buyerCRN,
              drugName,
            ]);

            //Transporter compositeKey
            let transporterCRNResultsIterator = await ctx.stub.getStateByPartialCompositeKey(
              "org.pharma-network.pharmanet.company",
              [transporterCRN]
            );

            var transporterCRNFound = false;
            while (!transporterCRNFound) {
              let transporterCRNResponseRange = await transporterCRNResultsIterator.next();

              if (
                !transporterCRNResponseRange ||
                !transporterCRNResponseRange ||
                !transporterCRNResponseRange.value.key
              ) {
                return "Invalid transporterCRN";
              } else {
                transporterCRNFound = true;
                let objectType;
                let attributes;
                ({ objectType, attributes } = await ctx.stub.splitCompositeKey(transporterCRNResponseRange.value.key));

                let returnedTransporterCompanyName = attributes[1];
                let returnedTransporterCompanyCRN = attributes[0];

                console.log("returnedTransporterCompanyName=> " + returnedTransporterCompanyName);
                console.log("returnedTransporterCompanyCRN=> " + returnedTransporterCompanyCRN);

                var generateTransporterCompanyID = await ctx.stub.createCompositeKey(
                  "org.pharma-network.pharmanet.company",
                  [returnedTransporterCompanyCRN, returnedTransporterCompanyName]
                );

                console.log("Transporter composite key created=> " + generateTransporterCompanyID);
              }
            }

            //Update the status as "in-transit"
            let shipmentObject = {
              shipmentID: shipmentID,
              creator: ctx.clientIdentity.getID(),
              assets: listOfCompositeKeysForDrugs,
              transporter: generateTransporterCompanyID,
              status: "in-transit",
            };

            let shipmentDataBuffer = Buffer.from(JSON.stringify(shipmentObject));
            await ctx.stub.putState(shipmentID, shipmentDataBuffer);

            //Owner of each batch should be updated
            for (let i = 0; i <= listOfCompositeKeysForDrugs.length - 1; i++) {
              //Find the drug details using composite key
              let drugCompositeKey = listOfCompositeKeysForDrugs[i];
              let drugDataBuffer = await ctx.stub.getState(drugCompositeKey).catch((err) => console.log(err));
              let jsonDrugDetail = JSON.parse(drugDataBuffer.toString());
              console.log("jsonDrugDetail=> " + jsonDrugDetail.owner);
              console.log("jsonDrugDetail=> " + jsonDrugDetail.manufacturer);
              //Owner is now transporter, so transporter composite key is the owner
              jsonDrugDetail.owner = generateTransporterCompanyID;

              //Once you have updated the owner of the drug put the state back to the drug
              let drugJSONdate = Buffer.from(JSON.stringify(jsonDrugDetail));
              await ctx.stub.putState(drugCompositeKey, drugJSONdate);
            }
            return shipmentObject;
          }
        } else {
          console.log(
            "listOfAssetsLength is " +
              listOfAssetsLength +
              " and " +
              "parsedPurchaseOrder.quantity " +
              parsedPurchaseOrder.quantity +
              " length DOES NOT matches"
          );
          console.log("Sorry! Can'tProceed!");
        }
      }
    }
  }

  //This transaction is used to update the status of the shipment to "Delivered" when consignment gets delivered to the destination
  // async updateShipment(ctx, buyerCRN, drugName, transporterCRN) {
  async updateShipment(ctx, buyerCRN, drugName, transporterCRN) {
    //Validation1 - Should be invoked only by the transporter of the shipment
    //Using transporterCRN get shipmentObject object. If the shipmentObject exists then it's a valid transporter else he is not valid transporter
    let transporterResultsIterator = await ctx.stub.getStateByPartialCompositeKey(
      "org.pharma-network.pharmanet.company",
      [transporterCRN]
    );

    let transporterResponseRange = await transporterResultsIterator.next();
    console.log("responseRange=> " + transporterResponseRange);
    if (!transporterResponseRange || !transporterResponseRange || !transporterResponseRange.value.key) {
      return "Invalid transporterCRN";
    }
    console.log("ResponseRange.value.key=>" + transporterResponseRange.value.key);

    let objectType;
    let attributes;
    ({ objectType, attributes } = await ctx.stub.splitCompositeKey(transporterResponseRange.value.key));

    let transportForUpdateShipmentName = attributes[1];
    let transportForUpdateShipmentCRN = attributes[0];

    //create transporter composite key
    var generateTransporterForShipmentUpdation = await ctx.stub.createCompositeKey(
      "org.pharma-network.pharmanet.company",
      [transportForUpdateShipmentCRN, transportForUpdateShipmentName]
    );

    console.log("this is the generated transporter composite key=>" + generateTransporterForShipmentUpdation);

    if (transportForUpdateShipmentCRN === transporterCRN) {
      console.log("Registered transporter");
      //create the composite key of the shipment using buyerCRN and drugName
      let generatedShipmentCompositeKey = await ctx.stub.createCompositeKey("org.pharma-network.pharmanet.shipment", [
        buyerCRN,
        drugName,
      ]);

      let shipmentDataBuffer = await ctx.stub.getState(generatedShipmentCompositeKey).catch((err) => console.log(err));
      console.log("This is the shipment details" + shipmentDataBuffer);
      let parsedShipmentData = JSON.parse(shipmentDataBuffer.toString());
      console.log("transporter composite key what sin shipment=> " + parsedShipmentData.transporter);
      console.log("generated transporter=>" + generateTransporterForShipmentUpdation);
      if (parsedShipmentData.transporter === generateTransporterForShipmentUpdation) {
        console.log("All good!transporter match");

        //status of the shipment changed to delivered.
        parsedShipmentData.status = "delivered";

        //Once you have updated the owner of the drug put the state back to the drug
        let statusChangeShipmentBuffer = Buffer.from(JSON.stringify(parsedShipmentData));
        //Wait untill you get the successfully delivered response, then display. Else the status will be in still "in-transit"
        await ctx.stub.putState(generatedShipmentCompositeKey, statusChangeShipmentBuffer);
        console.log("Shipment object's status has been changed");

        //shipment field in the add drug method should be changed.
        //shipment field will have a value "generatedShipmentCompositeKey"-vmpharmaParacematamol

        //Buyer compositeKey
        let buyerCRNResultsIteratorForOwner = await ctx.stub.getStateByPartialCompositeKey(
          "org.pharma-network.pharmanet.company",
          [buyerCRN]
        );

        var buyerCRNFoundForOwner = false;
        while (!buyerCRNFoundForOwner) {
          let buyerCRNFoundForOwnerResponseRange = await buyerCRNResultsIteratorForOwner.next();

          if (
            !buyerCRNFoundForOwnerResponseRange ||
            !buyerCRNFoundForOwnerResponseRange ||
            !buyerCRNFoundForOwnerResponseRange.value.key
          ) {
            return "Invalid transporterCRN";
          } else {
            buyerCRNFoundForOwner = true;
            let objectType;
            let attributes;
            ({ objectType, attributes } = await ctx.stub.splitCompositeKey(
              buyerCRNFoundForOwnerResponseRange.value.key
            ));

            let returnedBuyerCompanyNameForOwner = attributes[1];
            let returnedBuyerCompanyCRNForOwner = attributes[0];

            console.log("returnedBuyerCompanyNameForOwner=> " + returnedBuyerCompanyNameForOwner);
            console.log("returnedBuyerCompanyCRNForOwner=> " + returnedBuyerCompanyCRNForOwner);

            var generateBuyerCompanyIDForOwner = await ctx.stub.createCompositeKey(
              "org.pharma-network.pharmanet.company",
              [returnedBuyerCompanyCRNForOwner, returnedBuyerCompanyNameForOwner]
            );

            console.log("Transporter composite key created=> " + generateBuyerCompanyIDForOwner);
          }
        }
        //Iterate through the drug list in the shipment and
        let drugsInShipment = parsedShipmentData.assets;
        for (let i = 0; i <= drugsInShipment.length - 1; i++) {
          console.log(drugsInShipment[i]);
          let drugCompositeKeyID = drugsInShipment[i];

          //For each drug get the drugObject and update the shipment with

          //The below is the drug object for which you have to change the shipemnt field with the composite key generatedShipmentCompositeKey

          //change the owner of the drug - buyerCRN
          console.log("drugCompositeKeyID is=> " + drugCompositeKeyID);
          let drugDataFromAddDrugBuffer = await ctx.stub.getState(drugCompositeKeyID).catch((err) => console.log(err));
          let JSONDrugDetailsForUpdation = JSON.parse(drugDataFromAddDrugBuffer.toString());

          console.log("JSONDrugDetailsForUpdation=>" + JSONDrugDetailsForUpdation);
          console.log("The shipment field for " + drugCompositeKeyID + " is " + JSONDrugDetailsForUpdation.shipment);
          console.log("The owner field for " + drugCompositeKeyID + " is " + JSONDrugDetailsForUpdation.owner);

          //To-DO-Update the owner and shipping, Owner should be the composite key of buyer not CRN
          JSONDrugDetailsForUpdation.owner = generateBuyerCompanyIDForOwner;
          JSONDrugDetailsForUpdation.shipment = generatedShipmentCompositeKey;

          //Once you have updated the owner of the drug put the state back to the drug
          let modifiedDrugDetailsObject = Buffer.from(JSON.stringify(JSONDrugDetailsForUpdation));
          await ctx.stub.putState(drugCompositeKeyID, modifiedDrugDetailsObject);
          return modifiedDrugDetailsObject;
        }
      }
      return JSON.parse(shipmentDataBuffer.toString());
    } else {
      console.log("Transporter is not registered to the network");
    }
  }

  //This transaction is called by the retailer while selling the drug to a consumer
  async retailDrug(ctx, drugName, serialNo, retailerCRN, customerAadhar) {
    //Validation1 - Should be invoked only by retailer, who is the owner of the drug
    //check retailerCRN is equal to the owner of the drug in drug object
    const drugCompositeKeyForSearch = ctx.stub.createCompositeKey("org.pharma-network.pharmanet.drug", [
      drugName,
      serialNo,
    ]);
    let drugCompositeKeyForSearchBuffer = await ctx.stub
      .getState(drugCompositeKeyForSearch)
      .catch((err) => console.log(err));
    let JSONDrugCompositeKeyForSearch = JSON.parse(drugCompositeKeyForSearchBuffer.toString());

    //Find retailers composite key
    console.log("JSONDrugCompositeKeyForSearch.owner=> " + JSONDrugCompositeKeyForSearch.owner);
    console.log("retailerCRN=> " + retailerCRN);

    //Buyer compositeKey
    let retailerCRNResultsIteratorForComparision = await ctx.stub.getStateByPartialCompositeKey(
      "org.pharma-network.pharmanet.company",
      [retailerCRN]
    );

    var retailerCRNFoundForComparision = false;
    while (!retailerCRNFoundForComparision) {
      let retailerCRNResultsIteratorForComparisionResponseRange = await retailerCRNResultsIteratorForComparision.next();

      if (
        !retailerCRNResultsIteratorForComparisionResponseRange ||
        !retailerCRNResultsIteratorForComparisionResponseRange ||
        !retailerCRNResultsIteratorForComparisionResponseRange.value.key
      ) {
        return "Invalid transporterCRN";
      } else {
        retailerCRNFoundForComparision = true;
        let objectType;
        let attributes;
        ({ objectType, attributes } = await ctx.stub.splitCompositeKey(
          retailerCRNResultsIteratorForComparisionResponseRange.value.key
        ));

        let returnedRetailerCompanyNameForComparision = attributes[1];
        let returnedRetailerCompanyCRNForComparision = attributes[0];

        console.log("returnedBuyerCompanyNameForOwner=> " + returnedRetailerCompanyNameForComparision);
        console.log("returnedRetailerCompanyCRNForComparision=> " + returnedRetailerCompanyCRNForComparision);

        var generateRetailerCompanyIDForOwner = await ctx.stub.createCompositeKey(
          "org.pharma-network.pharmanet.company",
          [returnedRetailerCompanyCRNForComparision, returnedRetailerCompanyNameForComparision]
        );

        console.log("A=> " + generateRetailerCompanyIDForOwner);
        console.log("B=> " + JSONDrugCompositeKeyForSearch.owner);
      }
    }

    if (JSONDrugCompositeKeyForSearch.owner === generateRetailerCompanyIDForOwner) {
      console.log("Yes he is the owner of the drug");
      //To-DO-Update the owner not CRN but composite key
      JSONDrugCompositeKeyForSearch.owner = customerAadhar;

      //Once you have updated the owner of the drug put the state back to the drug
      let modifiedDrugDetailsObjectForCustomer = Buffer.from(JSON.stringify(JSONDrugCompositeKeyForSearch));
      await ctx.stub.putState(drugCompositeKeyForSearch, modifiedDrugDetailsObjectForCustomer);
      console.log("Hello" + JSONDrugCompositeKeyForSearch);
      return JSONDrugCompositeKeyForSearch;
    } else {
      console.log("Sorry you are not the owner of this drug");
    }

    //ownership of the drug is changed to the adhar number of the customer
    //change owner in drugobject to and put the state of the drug in drugobject
  }

  // Used to view the current state of the drug asset.
  // @params drugName - Name of the drug
  //         serialNo - Serial number of the drug
  // @returns drugJSON - current state of the drug
  async viewDrugCurrentState(ctx, drugName, serialNo) {
    const productID = ctx.stub.createCompositeKey("org.pharma-network.pharmanet.drug", [drugName, serialNo]);
    let drugDataBuffer = await ctx.stub.getState(productID).catch((err) => console.log(err));
    return JSON.parse(drugDataBuffer.toString());
  }

  // Used to view the lifecycle of the product by fetching trasactions from blockchain
  // @params drugName - name of the drug
  //         serialNo - serial number of the drug
  // @returns result - Transaction history of the drug
  async viewHistory(ctx, drugName, serialNo) {
    const productID = ctx.stub.createCompositeKey("org.pharma-network.pharmanet.drug", [drugName, serialNo]);

    let iterator = await ctx.stub.getHistoryForKey(productID);
    let result = [];
    let res = await iterator.next();
    while (!res.done) {
      if (res.value) {
        const obj = JSON.parse(res.value.value.toString("utf8"));
        result.push(obj);
      }
      res = await iterator.next();
    }
    await iterator.close();
    return result;
  }

  //NOT FOR SUBMISSION - Just for better understanding
  async getCompanyDetails(ctx, companyCRN) {
    let companyResultsIterator = await ctx.stub.getStateByPartialCompositeKey("org.pharma-network.pharmanet.company", [
      companyCRN,
    ]);

    let responseRange = await companyResultsIterator.next();
    console.log("responseRange=> " + responseRange);
    if (!responseRange || !responseRange.value || !responseRange.value.key) {
      return "Invalid companyCRN";
    }
    console.log("ResponseRange.value.key=>" + responseRange.value.key);

    let objectType;
    let attributes;
    ({ objectType, attributes } = await ctx.stub.splitCompositeKey(responseRange.value.key));

    let returnedCompanyCRN = attributes[0];
    console.log("returnedCompanyCRN=> " + returnedCompanyCRN);
    let returnedCompanyName = attributes[1];
    console.log("returnedCompanyName=> " + returnedCompanyName);

    const generateCompanyID = await ctx.stub.createCompositeKey("org.pharma-network.pharmanet.company", [
      returnedCompanyCRN,
      returnedCompanyName,
    ]);

    console.log("generated company ID is=> " + JSON.stringify(generateCompanyID));

    let comapnyBuffer = await ctx.stub.getState(generateCompanyID).catch((err) => console.log(err));
    console.log("comapnyBuffer=> " + comapnyBuffer.toString());
    let parsedData = JSON.parse(comapnyBuffer.toString());
    return parsedData;
  }

  //NOT FOR SUBMISSION - Just for better understanding
  async getShipmentDetails(ctx, buyerCRN, drugName) {
    const shipmentCompositeKeyID = ctx.stub.createCompositeKey("org.pharma-network.pharmanet.shipment", [
      buyerCRN,
      drugName,
    ]);

    let shipmentDetailsBuffer = await ctx.stub.getState(shipmentCompositeKeyID).catch((err) => console.log(err));
    let shipmentJSONData = JSON.parse(shipmentDetailsBuffer.toString());
    return shipmentJSONData;
  }
}

module.exports = PharmanetContract;
