require('dotenv').config();

const csv = require('csvtojson');
const fs = require('fs');
const path = require('path');
const Web3 = require('web3');

const DISPERSE_APP_ABI = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'abi', 'disperse-app.abi.json'))
);
const BEP_20_ABI = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, 'abi', 'bep-20.abi.json'))
);
const DISPERSE_APP_ADDRESS = process.env.DISPERSE_APP_ADDRESS;
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
const AMOUNT_SUFFIX = process.env.AMOUNT_SUFFIX;
const TOTAL_AMOUNT = process.env.TOTAL_AMOUNT + AMOUNT_SUFFIX;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const web3 = new Web3(process.env.WEB3_PROVIDER_ENDPOINT);
const testFileName = 'test.csv';
const testFilePath = path.resolve(__dirname, 'csv', testFileName);
const isApprovalNeeded = true;

const main = async () => {
  const addressList = [];
  const amountList = [];

  const data = await csv().fromFile(testFilePath);

  data.forEach((row) => {
    addressList.push(row['Address']);
    amountList.push(row['Amount'] + AMOUNT_SUFFIX);
  });

  const gasPrice = await web3.eth.getGasPrice();

  const topContract = new web3.eth.Contract(BEP_20_ABI, TOKEN_ADDRESS);
  const disperseContract = new web3.eth.Contract(
    DISPERSE_APP_ABI,
    DISPERSE_APP_ADDRESS
  );

  let method, tx, signed;

  // Approve
  if (isApprovalNeeded) {
    method = topContract.methods.approve(DISPERSE_APP_ADDRESS, TOTAL_AMOUNT);

    tx = {
      to: TOKEN_ADDRESS,
      value: 0,
      gas: 3000000,
      gasPrice: gasPrice,
      data: method.encodeABI(),
    };

    signed = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);

    await web3.eth
      .sendSignedTransaction(signed.rawTransaction)
      .on('transactionHash', function (hash) {
        console.log(`hash: ${hash}`);
      })
      .on('error', async (err) => {
        console.log(`err: ${err}`);
      })
      .then(async (receipt) => {
        if (receipt.status === true) {
          console.log(`success: ${receipt.transactionHash}`);
        } else {
          console.log(`fail: ${receipt.transactionHash}`);
        }
      });
  }

  // Disperse
  method = disperseContract.methods.disperseToken(
    TOKEN_ADDRESS,
    addressList,
    amountList
  );

  tx = {
    to: DISPERSE_APP_ADDRESS,
    value: 0,
    gas: 20000000,
    gasPrice: gasPrice,
    data: method.encodeABI(),
  };

  signed = await web3.eth.accounts.signTransaction(tx, PRIVATE_KEY);

  await web3.eth
    .sendSignedTransaction(signed.rawTransaction)
    .on('transactionHash', function (hash) {
      console.log(`hash: ${hash}`);
    })
    .on('error', async (err) => {
      console.log(`err: ${err}`);
    })
    .then(async (receipt) => {
      if (receipt.status === true) {
        console.log(`success: ${receipt.transactionHash}`);
      } else {
        console.log(`fail: ${receipt.transactionHash}`);
      }
    });
};

main();
