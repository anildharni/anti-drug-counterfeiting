const express = require("express");
const app = express();
const cors = require("cors");
const port = 3000;

// Import all function modules
const addToWallet_manufacturer = require('./1_addToWallet_manufacturer.js');
const addToWallet_distributor = require('./2_addToWallet_distributor.js');
const addToWallet_retailer = require('./4_addToWallet_retailer.js');
const addToWallet_consumer = require('./5_addToWallet_consumer.js');
const addToWallet_transporter = require('./3_addToWallet_transporter.js');
const registerCompanies = require("./6_register_companies");
const addDrug = require("./7_addDrug");
const createPO = require("./8_createPO");
const createShipment = require("./9_createShipment");
const updatedShipment = require("./10_updateShipment");
const retailDrug = require("./11_retailDrug");
const history = require("./12_history");
const currentState = require("./13_currentState");

// Define Express app settings
app.use(cors());
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.set("title", "Pharma App");

app.get("/", (req, res) => res.send("Welcome to the Pharmacy network"));

app.post('/addToWallet', (req, res) => {
	addToWallet_manufacturer.execute(req.body.certificatePath, req.body.privateKeyPath)
		.then(() => {
			console.log('User credentials successfully added to wallet');
			const result = {
				status: 'success',
				message: 'User credentials successfully added to wallet'
			};
			res.json(result);
		})
		.catch((e) => {
			const result = {
				status: 'error',
				message: 'Failed',
				error: e
			};
			res.status(500).send(result);
		});
});

app.post('/addToWallet', (req, res) => {
	addToWallet_distributor.execute(req.body.certificatePath, req.body.privateKeyPath)
		.then(() => {
			console.log('User credentials successfully added to wallet');
			const result = {
				status: 'success',
				message: 'User credentials successfully added to wallet'
			};
			res.json(result);
		})
		.catch((e) => {
			const result = {
				status: 'error',
				message: 'Failed',
				error: e
			};
			res.status(500).send(result);
		});
});

app.post('/addToWallet', (req, res) => {
	addToWallet_retailer.execute(req.body.certificatePath, req.body.privateKeyPath)
		.then(() => {
			console.log('User credentials successfully added to wallet');
			const result = {
				status: 'success',
				message: 'User credentials successfully added to wallet'
			};
			res.json(result);
		})
		.catch((e) => {
			const result = {
				status: 'error',
				message: 'Failed',
				error: e
			};
			res.status(500).send(result);
		});
});

app.post('/addToWallet', (req, res) => {
	addToWallet_consumer.execute(req.body.certificatePath, req.body.privateKeyPath)
		.then(() => {
			console.log('User credentials successfully added to wallet');
			const result = {
				status: 'success',
				message: 'User credentials successfully added to wallet'
			};
			res.json(result);
		})
		.catch((e) => {
			const result = {
				status: 'error',
				message: 'Failed',
				error: e
			};
			res.status(500).send(result);
		});
});

app.post('/addToWallet', (req, res) => {
	addToWallet_transporter.execute(req.body.certificatePath, req.body.privateKeyPath)
		.then(() => {
			console.log('User credentials successfully added to wallet');
			const result = {
				status: 'success',
				message: 'User credentials successfully added to wallet'
			};
			res.json(result);
		})
		.catch((e) => {
			const result = {
				status: 'error',
				message: 'Failed',
				error: e
			};
			res.status(500).send(result);
		});
});

app.post("/registerCompany", (req, res) => {
  console.log("Inside req=> " + JSON.stringify(req.body.companyCRN));
  registerCompanies
    .execute(
      req.body.nameOfOrg,
      req.body.companyCRN,
      req.body.companyName,
      req.body.location,
      req.body.organisationRole
    )
    .then((newCompany) => {
      console.log("New Company got registered");
      const result = {
        status: "success",
        message: "New Company got registered",
        newCompany: newCompany,
      };
      res.json(result);
    })
    .catch((e) => {
      const result = {
        status: "error",
        message: "Failed",
        error: e,
      };
      res.status(500).send(result);
    });
});

app.post("/addDrug", (req, res) => {
  console.log("Inside req=> " + JSON.stringify(req.body.companyCRN));
  addDrug
    .execute(
      req.body.nameOfOrg,
      req.body.drugName,
      req.body.serialNo,
      req.body.mfgDate,
      req.body.expDate,
      req.body.companyCRN
    )
    .then((newDrug) => {
      console.log("New Drug got registered");
      const result = {
        status: "success",
        message: "New Drug got registered",
        newDrug: newDrug,
      };
      res.json(result);
    })
    .catch((e) => {
      const result = {
        status: "error",
        message: "Failed",
        error: e,
      };
      res.status(500).send(result);
    });
});

app.post("/createPO", (req, res) => {
  console.log("Inside req=> " + JSON.stringify(req.body.companyCRN));
  createPO
    .execute(req.body.nameOfOrg, req.body.buyerCRN, req.body.sellerCRN, req.body.drugName, req.body.quantity)
    .then((newPurchaseOrder) => {
      console.log("New PO got registered");
      const result = {
        status: "success",
        message: "New PO got registered",
        newPurchaseOrder: newPurchaseOrder,
      };
      res.json(result);
    })
    .catch((e) => {
      const result = {
        status: "error",
        message: "Failed",
        error: e,
      };
      res.status(500).send(result);
    });
});

app.post("/createShipment", (req, res) => {
  console.log("Inside req=> " + JSON.stringify(req.body.companyCRN));
  createShipment
    .execute(req.body.nameOfOrg, req.body.buyerCRN, req.body.drugName, req.body.listOfAssets, req.body.transporterCRN)
    .then((newShipment) => {
      console.log("New Shipment got registered");
      const result = {
        status: "success",
        message: "New Shipment got registered",
        newShipment: newShipment,
      };
      res.json(result);
    })
    .catch((e) => {
      const result = {
        status: "error",
        message: "Failed",
        error: e,
      };
      res.status(500).send(result);
    });
});

app.post("/updateShipment", (req, res) => {
  console.log("Inside req=> " + JSON.stringify(req.body.companyCRN));
  updatedShipment
    .execute(req.body.nameOfOrg, req.body.buyerCRN, req.body.drugName, req.body.transporterCRN)
    .then((newUpdatedShipment) => {
      console.log("New Updated Shipment got registered");
      const result = {
        status: "success",
        message: "New Updated Shipment got registered",
        newUpdatedShipment: newUpdatedShipment,
      };
      res.json(result);
    })
    .catch((e) => {
      const result = {
        status: "error",
        message: "Failed",
        error: e,
      };
      res.status(500).send(result);
    });
});

//async retailDrug(ctx, drugName, serialNo, retailerCRN, customerAadhar)
app.post("/retailDrug", (req, res) => {
  console.log("Inside req=> " + JSON.stringify(req.body.companyCRN));
  retailDrug
    .execute(req.body.nameOfOrg, req.body.drugName, req.body.serialNo, req.body.retailerCRN, req.body.customerAadhar)
    .then((newPurchase) => {
      console.log("New Purchase from customer");
      const result = {
        status: "success",
        message: "New Purchase from customer",
        newPurchase: newPurchase,
      };
      res.json(result);
    })
    .catch((e) => {
      const result = {
        status: "error",
        message: "Failed",
        error: e,
      };
      res.status(500).send(result);
    });
});

//async viewHistory(ctx, drugName, serialNo)
app.post("/viewHistory", (req, res) => {
  console.log("Inside req=> " + JSON.stringify(req.body.companyCRN));
  history
    .execute(req.body.nameOfOrg, req.body.drugName, req.body.serialNo)
    .then((historyOfDrug) => {
      console.log("historyOfDrug");
      const result = {
        status: "success",
        message: "historyOfDrug",
        historyOfDrug: historyOfDrug,
      };
      res.json(result);
    })
    .catch((e) => {
      const result = {
        status: "error",
        message: "Failed",
        error: e,
      };
      res.status(500).send(result);
    });
});

//async viewDrugCurrentState(ctx, drugName, serialNo)
app.post("/viewCurrentState", (req, res) => {
  currentState
    .execute(req.body.nameOfOrg, req.body.drugName, req.body.serialNo)
    .then((currentState) => {
      console.log("currentState");
      const result = {
        status: "success",
        message: "currentState",
        currentState: currentState,
      };
      res.json(result);
    })
    .catch((e) => {
      const result = {
        status: "error",
        message: "Failed",
        error: e,
      };
      res.status(500).send(result);
    });
});

app.listen(port, () => console.log(`Distributed Pharma App listening on port ${port}!`));
