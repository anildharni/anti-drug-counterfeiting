The Drug Counterfeiting Problem
Welcome to this use case on detecting and preventing counterfeiting of drugs.
Detailed instructions are given in the instruction-doc with commands to execute and their results is attached.

Drug counterfeiting is a major business problem for pharmaceutical companies around the globe. By some estimates, the global market of counterfeit drugs is as large as 200 billion dollars, which makes it the largest fraud market in the world.


The folder structure inside pharma-net. Project is as follows:
1.	application — folder contains different connection profiles for each stakeholder of the organisation, wallet to store the identity of the Admin user of each organisation, node modules corresponding to every function defined in the smart contract and a node server for this application using the Express library and expose these node modules for application as server-side endpoints.
2.	chaincode — folder contains the smart contracts which are defined in the Smart Contract Architecture.
3.	network — folder contains the fabric network setup which are defined in the Network Architecture.
4.	test — folder contains the json files for postman.
Follow to see the network setup and execution of smart contracts from postman.
1.	Generating crypto-material and channel-artifacts for the network.
> cd pharma-net
> sudo ./fabricNetwork.sh generate

Generate Crypto Materials
2. Instantiate all the docker containers for each peer that are mentioned in the docker-compose.yaml file.
> sudo ./fabricNetwork.sh up

Fabric Network — Docker Container Set Up
3. Install and instantiate a basic chiancode on the hyperledger fabric network.
> sudo ./fabricNetwork.sh install

Chaincode Installation on Fabric Network
This process completes the fabric network setup.
4. These are the steps that has to be done before execution of the chain code using Postman.
> cd ../application
> sudo dpkg — configure -a
> sudo apt install npm
Keys have to be set every time we generate a new crypto material. Therefore change the certificatePath, privateKeyPath in the addToWallet files for all 5 files. Once the changes are done execute each file to add the keys to the wallet using which the user will authenticate himself to the network.
5. After this process you can import the all collection files to the postman.
Collection file named ‘initiation’ which contains the HTTP requests to perform the following functions:
1.	Create a manufacturer with the following details:
•	Name: ‘Sun Pharma’
•	CRN number: ‘MAN001’
•	Location: ‘Chennai’
2. Create a transporter with the following details:
•	Name: ‘FedEx’
•	CRN number: ‘TRA001’
•	Location: ‘Delhi’
3. Create another transporter with the following details:
•	Name: ‘Blue Dart’
•	CRN number: ‘TRA002’
•	Location: ‘Bangalore’
4. Create a distributor with the following details:
•	Name: ‘VG Pharma’
•	CRN number: ‘DIST001’
•	Location: ‘Vizag’
5. Create a retailer with the following details:
•	Name: ‘upgrad’
•	CRN number: ‘RET002’
•	Location: ‘Mumbai’
6. Create 4 strips of a drug named ‘Paracetamol’ with serial number starting from ‘001’ to ‘004’.
Expected Output: Each of the above requests should display the data corresponding to each new state being registered on the ledger.
Collection file named ‘Supply Chain’ which contains the HTTP requests to perform the following functions.
Part a:
1.	Purchase Order raised by ‘VG Pharma’ to purchase 3 strips of paracetamol from ‘Sun Pharma’.
Expected Output: Display the PO object created in the response body.
2.	Shipment created by ‘Sun Pharma’ in response to the raised purchase order. ‘FedEx’ acts as the transporter.
Expected Output: Display the Shipment object created in the response body.
3.	‘FedEx’ delivers the shipment to ‘VG pharma’.
Expected Output: Display the data of each asset of the shipment.
Part b:
1.	Purchase Order raised by ‘upgrad’ to purchase 2 strips of paracetamol from ‘VG Pharma’.
Expected Output: Display the PO object created in the response body.
2.	Shipment created by ‘VG Pharma’ in response to the raised purchase order. ‘Blue Dart’ acts as the transporter.
Expected Output: Display the Shipment object created in the response body.
3.	‘Blue Dart’ delivers the shipment to ‘upgrad’.
Expected Output: Display the data of each asset of the shipment in the response body.
Part c:
1.	A customer named ‘Akash’ with Aadhar Number ‘AAD001’ buys 1 paracetamol strip from the retailer ‘upgrad’.
Expected Output: Display the data of the asset bought by Akash in the response body.
Collection file named ‘History’ which contains the HTTP requests to perform the following functions.
1.	The customer ‘Akash’ wishes to check the history of the paracetamol that he bought from ‘upgrad’.
Expected Output: The response body should display the entire lifecycle of the asset.
2.	The customer ‘Akash’ wishes to check the current state of the paracetamol that he bought from ‘upgrad’.
Expected Output: The response body should display the current state of the asset.
This is how with Blockchain can be used in the drug supply chain for detecting counterfeit drugs and also track the history of a drug.
