import { TezosToolkit } from "@taquito/taquito";
import $ from "jquery";
import { MichelsonMap } from "@taquito/taquito";
import { importKey } from "@taquito/signer";
import { char2Bytes } from "@taquito/utils"
import { keccak256 } from 'js-sha3';

//variables and constants
var entrypoints : any
var hash_ : string
const mutezToTez = 1000000

export class App {
  private admin: TezosToolkit;
  private second: TezosToolkit;

  constructor() {
    this.admin = new TezosToolkit("https://ghostnet.smartpy.io");
    this.second = new TezosToolkit("https://ghostnet.smartpy.io");
  }

  public initUI() {
    //import wallet
    importKey(this.admin , "");
    importKey(this.second, "");
    //source and destination addresses
    const admin = ""
    const receiver = ""

    $("#st-contract-button").bind("click", () =>
      this.simpleTransfer(receiver, $("#address-input").val())
    );

    $("#htlc-contract-button").bind("click", () =>
      this.hashTimedLockedContract(receiver, $("#address-input").val())
    );

    $("#tt-contract-button").bind("click", () =>
      this.tokenTransfer(admin, receiver, $("#address-input").val())
    );
    
    $("#ba-contract-button").bind("click", () =>
      this.blindAuction($("#address-input").val())
    );

    $("#cf-contract-button").bind("click", () =>
      this.crowdFunding($("#address-input").val())
    );
    
    $("#kt-contract-button").bind("click", () =>
      this.kingOfTezos($("#address-input").val())
    );
  }


  //Shows contract's entrypoints
  private showEntryPoints(entrypoints: any){
    //$("#error-message").removeClass().addClass("hide");
    //$("#contract-output").removeClass().addClass("show");
    console.log("EntryPoints :");
    for (let i = 0; i < entrypoints.length; i++){
      console.log(`${(i)}`)
      console.log("Name = " + entrypoints[i][0])
      for (let j = 1; j < entrypoints[i].length; j++){
        console.log("Parameter = " + entrypoints[i][j])
      }
    }
  }
  
  //Shows transaction information
  private async transactionInfo(hash : string){
    var api_url = `https://api.ghostnet.tzkt.io/v1/operations/transactions/${hash}`
    var response = await fetch(api_url);
    if(!response.ok){
      throw new Error (`HTTP error ${response.status}`);
    }
    var data = await response.json()
    var allocationFee = data[0].allocationFee / mutezToTez
    var storageFee = data[0].storageFee / mutezToTez
    var bakerFee = data[0].bakerFee / mutezToTez
    var totalFee = allocationFee + storageFee + bakerFee
    console.log(data)
    console.log("Allocation fee = " + allocationFee)
    console.log("Storage Fee = " + storageFee)
    console.log("Baker Fee = " + bakerFee)
    console.log("Gas Used = " + data[0].gasUsed)
    console.log("Storage Used = " + data[0].storageUsed)
    console.log("Total Fee: " + totalFee)
    console.log(" ");
  }

  private hexToString(hex : any) {
    if (!hex.match(/^[0-9a-fA-F]+$/)) {
      throw new Error('is not a hex string.');
    }
    if (hex.length % 2 !== 0) {
      hex = '0' + hex;
    }
    var bytes = [];
    for (var n = 0; n < hex.length; n += 2) {
      var code = parseInt(hex.substr(n, 2), 16)
      bytes.push(code);
    }
    return bytes;
  }

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


      //call withdraw
      await this.second.contract
      .at(contract) 
      .then((c) => {
        let entrypoints = c.parameterSchema.ExtractSignatures()
        console.log(`Calling ${entrypoints[1][0]} for ` + receiver)
        return c.methods[entrypoints[1][0]]().send();
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
        
  }

  private async hashTimedLockedContract(receiver : string, contract : string){
      //variable and const
      let deadline = 10;
      const word = "0501000000046369616f"; //obtained by sp.pack("ciao")
      let hexString = this.hexToString(word)
      let secret = keccak256(hexString)
      

      //get contract information from rpc
      await this.admin.contract
        .at(contract)
        .then((c) => {
          entrypoints = c.parameterSchema.ExtractSignatures()
          console.log("Contract number = " + c.address);
          this.showEntryPoints(entrypoints)
          console.log(" ");
        })
        .catch((error) => console.log(`Error: ${error}`));


      //call commit
      await this.admin.contract
        .at(contract) 
        .then((c) => {
          let entrypoints = c.parameterSchema.ExtractSignatures()
          console.log(`Calling ${entrypoints[0][0]} for ` + receiver)
          return c.methods[entrypoints[0][0]](deadline, secret, receiver).send({fee : 2000, amount: 1000, mutez: true});
        })
        .then((op) =>{
          console.log(`Waiting for ${op.hash} to be confirmed...`);
          return op.confirmation(2).then(() => op.hash); 
        })
        .then((hash) => {
          hash_ = hash
          console.log(`Operation injected: https://ghost.tzstats.com/${hash}`)
        })
      //get transaction info
      this.transactionInfo(hash_);


      //call reveal
      await this.admin.contract
        .at(contract) 
        .then((c) => {
          let entrypoints = c.parameterSchema.ExtractSignatures()
          console.log(`Calling ${entrypoints[1][0]}`)
          return c.methods[entrypoints[1][0]]("ciao").send();
        })
        .then((op) =>{
          console.log(`Waiting for ${op.hash} to be confirmed...`);
          return op.confirmation(2).then(() => op.hash); 
        })
        .then((hash) => {
          hash_ = hash
          console.log(`Operation injected: https://ghost.tzstats.com/${hash}`)
        })
      //get transaction info
      this.transactionInfo(hash_);


      /*//call timeout
      await this.second.contract
      .at(contract) 
      .then((c) => {
        let entrypoints = c.parameterSchema.ExtractSignatures()
        console.log(`Calling ${entrypoints[2][0]}`)
        return c.methods[entrypoints[2][0]]().send();
      })
      .then((op) =>{
        console.log(`Waiting for ${op.hash} to be confirmed...`);
        return op.confirmation(2).then(() => op.hash); 
      })
      .then((hash) => {
        hash_ = hash
        console.log(`Operation injected: https://ghost.tzstats.com/${hash}`)
      })
      //get transaction info
      this.transactionInfo(hash_);*/

    }

  private async tokenTransfer(owner : string, receiver : string, contract : string){
    //variable and const
    let utf8Encode = new TextEncoder();
    utf8Encode.encode("0x697066733a2f2f516d52627863643279664e566467484c376f59575332796433747a7472324e5a697150324c46757733766f5057")
    const tokenInfo = new MichelsonMap();
    tokenInfo.set(" ", {value: char2Bytes("0x697066733a2f2f516d52627863643279664e566467484c376f59575332796433747a7472324e5a697150324c46757733766f5057")});

    //get contract information from rpc
    await this.admin.contract
    .at(contract)
    .then((c) => {
      entrypoints = c.parameterSchema.ExtractSignatures()
      console.log(c.address)
      this.showEntryPoints(entrypoints)
    })
    .catch((error) => console.log(`Error: ${error}`));


   //call mint
    await this.admin.contract
      .at(contract) 
      .then((c) => {
        let entrypoints = c.parameterSchema.ExtractSignatures()
        console.log(`Calling ${entrypoints[1][0]} for ` + owner)
        return c.methods[entrypoints[1][0]](owner, tokenInfo).send();
      })
      .then((op) =>{
        console.log(`Waiting for ${op.hash} to be confirmed...`);
        return op.confirmation(2).then(() => op.hash); 
      })
      .then((hash) => {
        hash_ = hash
        console.log(`Operation injected: https://ghost.tzstats.com/${hash}`)
    })
    //get transaction info
    this.transactionInfo(hash_);


    //call transfer
    let param = [
      {from_ : owner, txs : [
        {
          to_ : receiver, token_id : 1, amount : 1
        }
      ]}
    ]
    await this.admin.contract
    .at(contract) 
    .then((c) => {
      let entrypoints = c.parameterSchema.ExtractSignatures()
      console.log(`Calling ${entrypoints[2][0]}`)
      return c.methods[entrypoints[2][0]](param).send();
    })
    .then((op) =>{
      console.log(`Waiting for ${op.hash} to be confirmed...`);
      return op.confirmation(2).then(() => op.hash); 
    })
    .then((hash) => {
      hash_ = hash
      console.log(`Operation injected: https://ghost.tzstats.com/${hash}`)
    })
    //get transaction info
    this.transactionInfo(hash_);

    //call update_operators
    let param2 = [
      {add_operator : 
        {
          owner : owner, operator : owner, token_id : 1
        }
      }
    ]
    await this.admin.contract
    .at(contract) 
    .then((c) => {
      let entrypoints = c.parameterSchema.ExtractSignatures()
      console.log(`Calling ${entrypoints[3][0]}`)
      return c.methods[entrypoints[3][0]](param2).send();
    })
    .then((op) =>{
      console.log(`Waiting for ${op.hash} to be confirmed...`);
      return op.confirmation(2).then(() => op.hash); 
    })
    .then((hash) => {
      hash_ = hash
      console.log(`Operation injected: https://ghost.tzstats.com/${hash}`)
    })
    //get transaction info
    this.transactionInfo(hash_);
  
  }

  private async blindAuction(contract : string) {
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


      //call bid 
      await this.admin.contract
        .at(contract) 
        .then((c) => {
          let entrypoints = c.parameterSchema.ExtractSignatures()
          console.log(`Calling ${entrypoints[0][0]}`)
          return c.methods[entrypoints[0][0]]().send({amount: 100, mutez: true});
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


      //call getWinner
      await this.admin.contract
      .at(contract) 
      .then((c) => {
        let entrypoints = c.parameterSchema.ExtractSignatures()
        console.log(`Calling ${entrypoints[1][0]} `)
        return c.methods[entrypoints[1][0]]().send();
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
      
  } 

  private async crowdFunding(contract : string) {
    var currentDate = new Date().toISOString() //current timestamp

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


    //call contribute
    await this.second.contract
      .at(contract) 
      .then((c) => {
        let entrypoints = c.parameterSchema.ExtractSignatures()
        console.log(`Calling ${entrypoints[1][0]}`)
        return c.methods[entrypoints[1][0]]().send({amount: 100000, mutez: true});
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
    this.transactionInfo(hash_);/**/


    //call checkResult
    await this.admin.contract
    .at(contract) 
    .then((c) => {
      let entrypoints = c.parameterSchema.ExtractSignatures()
      console.log(`Calling ${entrypoints[0][0]} `)
      return c.methods[entrypoints[0][0]](currentDate).send();
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
/*
    //call refund
    await this.second.contract
    .at(contract) 
    .then((c) => {
      let entrypoints = c.parameterSchema.ExtractSignatures()
      console.log(`Calling ${entrypoints[2][0]} `)
      return c.methods[entrypoints[2][0]]().send();
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
      */
  } 

  private async kingOfTezos(contract : string) {
    var currentDate = new Date().toISOString() //current timestamp

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


    //call newKing
    await this.admin.contract
      .at(contract) 
      .then((c) => {
        let entrypoints = c.parameterSchema.ExtractSignatures()
        console.log(`Calling ${entrypoints[1][0]}`)
        return c.methods[entrypoints[1][0]]().send({amount: 5000, mutez: true});
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
    this.transactionInfo(hash_);/**/


    //call killKing
    await this.admin.contract
    .at(contract) 
    .then((c) => {
      let entrypoints = c.parameterSchema.ExtractSignatures()
      console.log(`Calling ${entrypoints[0][0]} `)
      return c.methods[entrypoints[0][0]]().send();
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

  } 
}
