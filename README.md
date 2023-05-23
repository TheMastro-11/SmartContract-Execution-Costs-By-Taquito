# Contract Execution Costs
This script was realized to execute several SmartContract tests on Tezos Blockchain, as part of this [project](https://github.com/TheMastro-11/Evaluating-execution-and-development-costs-in-the-Tezos-blockchain).
For this purpose I copied the Taquito [boilerplate](https://github.com/ecadlabs/taquito-boilerplate) repository.
You can find installation guide also [here](#getting-started).

## How it works
The only two files modified were:
- [App.ts](src/app.ts) : This file contains the main script.
- [index.html](src/main.ts) : Allow user to interact with a simple web interface.

Once open the web page on http://localhost:1234 appears as: <br>
![alt text](https://github.com/TheMastro-11/SmartContract-Execution-Costs-By-Taquito/blob/master/webPage.png)

After pasting the contract address, this step is made at run-time as it can be generated multiple times otherwise you can add its address directly in the code, you can select to which type to refer.

Then open the *console log* on your browser to see the results. <br>
![alt text](https://github.com/TheMastro-11/SmartContract-Execution-Costs-By-Taquito/blob/master/console-log.png)


### Code Structure
1. First of all I imported 4 elements:
- MichelsonMap to create map readable by Michelson, in Token Transfer
- importKey to import wallet
- char2Bytes to convert string into bytes, in Token Transfer
- keccak256 to create an hash from a string, in HTLC
```
...
import { MichelsonMap } from "@taquito/taquito";
import { importKey } from "@taquito/signer";
import { char2Bytes } from "@taquito/utils"
import { keccak256 } from 'js-sha3';
```
2. I created two users to do transactions from different wallets, the links refers to the preferred chain explorer, I used the *smartpy* for *ghostnet*.
```
private admin: TezosToolkit;
private second: TezosToolkit;

constructor() {
this.admin = new TezosToolkit("https://ghostnet.smartpy.io");
this.second = new TezosToolkit("https://ghostnet.smartpy.io");
}
```
3. In `importKey` on `--privateKey--` you have to insert the private key of your wallet and below on `--address--` the public address.
```
public initUI() {
    //import wallet
    importKey(this.admin , "--privateKey--");
    importKey(this.second, "--privateKey--");
    //source and destination addresses
    const admin = "--address--"
    const receiver = "--address--"

    ...
  }
```
4. Every contract function is structured in the same way:
   1. Take contract data as entrpoints (saved into *methods*) from the explorer
   2. Call an entrypoint with parameters (if it has) and additonal info as *amount* (if is required) and *fee* (if you want to choose them otherwise they'll be chosen by explorer), `mutez : true` indicates the value is in mutez and not tez.
```
 private async simpleTransfer(receiver : string, contract : string) {
      //get contract information from rpc
      await this.admin.contract
        .at(contract)
        .then((c) => {
          entrypoints = c.parameterSchema.ExtractSignatures()
          console.log("Contract number = " + c.address)
          this.showEntryPoints(entrypoints)
          console.log(" ");
        })
        .catch((error) => console.log(`Error: ${error}`));


      //call deposit 
      await this.admin.contract
        .at(contract) 
        .then((c) => {
          let entrypoints = c.parameterSchema.ExtractSignatures()
          console.log(`Calling ${entrypoints[0][0]} for ` + receiver)
          return c.methods[entrypoints[0][0]](receiver).send({amount: 1000, mutez: true});
        })
        .then((op) =>{
          console.log(`Waiting for ${op.hash} to be confirmed...`);
          return op.confirmation(2).then(() => op.hash); 
        })
        .then((hash) => {
          hash_ = hash
          console.log(`Operation injected: https://ghost.tzstats.com/${hash}`)
          console.log(" ");
      })
      //get transaction info
      this.transactionInfo(hash_);
      ...
 }
```

Different contracts require different approaches, so why I coded a function for each one.

## Getting Started
1. Create a new repository by clicking "Use this template".
2. Clone your new repository: <br>
    `git clone <YOUR_REPOSITORY_URL>`
3. Change your current working directory to the newly cloned repository directory.
4. Install dependencies: <br>
    `npm install`
5. Start development server: <br>
    `npm run watch`
6. Open http://localhost:1234 in your browser to see this application.

