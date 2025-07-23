
// BDAG Token Transfer Test Utility
import Web3 from 'web3';

const BDAG_TOKEN_ADDRESS = "0x32307adfFE088e383AFAa721b06436aDaBA47DBE";
const RPC_URL = "https://rpc.primordial.bdagscan.com";
const EXPLORER_URL = "https://primordial.bdagscan.com";

const BDAG_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "_to", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "name": "success", "type": "bool" }],
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "from", "type": "address" },
      { "indexed": true, "name": "to", "type": "address" },
      { "indexed": false, "name": "value", "type": "uint256" }
    ],
    "name": "Transfer",
    "type": "event"
  }
];

export const testBDAGTransfer = {
  // Check BDAG balance for an address
  async getBalance(address: string): Promise<string> {
    const web3 = new Web3(RPC_URL);
    const contract = new web3.eth.Contract(BDAG_ABI, BDAG_TOKEN_ADDRESS);
    const balance = await contract.methods.balanceOf(address).call();
    return web3.utils.fromWei(balance.toString(), 'ether');
  },

  // Verify transaction on blockchain
  async verifyTransaction(txHash: string) {
    const web3 = new Web3(RPC_URL);
    try {
      const receipt = await web3.eth.getTransactionReceipt(txHash);
      const transaction = await web3.eth.getTransaction(txHash);
      
      console.log('=== TRANSACTION VERIFICATION ===');
      console.log('Hash:', txHash);
      console.log('Status:', receipt?.status ? 'SUCCESS' : 'FAILED');
      console.log('Block:', receipt?.blockNumber);
      console.log('Gas Used:', receipt?.gasUsed);
      console.log('From:', transaction?.from);
      console.log('To:', transaction?.to);
      console.log('Explorer URL:', `${EXPLORER_URL}/tx/${txHash}`);
      
      if (receipt?.logs && receipt.logs.length > 0) {
        console.log('✅ Transfer event detected in logs');
        return {
          success: true,
          receipt,
          transaction,
          explorerUrl: `${EXPLORER_URL}/tx/${txHash}`
        };
      }
      
      return {
        success: false,
        receipt,
        transaction,
        explorerUrl: `${EXPLORER_URL}/tx/${txHash}`
      };
    } catch (error) {
      console.error('Transaction verification failed:', error);
      return {
        success: false,
        error: error.message,
        explorerUrl: `${EXPLORER_URL}/tx/${txHash}`
      };
    }
  },

  // Get transfer events between two addresses
  async getTransferEvents(fromAddress: string, toAddress: string) {
    const web3 = new Web3(RPC_URL);
    const contract = new web3.eth.Contract(BDAG_ABI, BDAG_TOKEN_ADDRESS);
    
    try {
      const events = await contract.getPastEvents('Transfer', {
        filter: { 
          from: fromAddress, 
          to: toAddress 
        },
        fromBlock: 0,
        toBlock: 'latest'
      });
      
      console.log(`=== TRANSFER EVENTS: ${fromAddress} → ${toAddress} ===`);
      console.log(`Found ${events.length} transfer(s)`);
      
      events.forEach((event, index) => {
        const value = web3.utils.fromWei(event.returnValues.value.toString(), 'ether');
        console.log(`Transfer ${index + 1}:`, {
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          amount: `${value} BDAG`,
          explorerUrl: `${EXPLORER_URL}/tx/${event.transactionHash}`
        });
      });
      
      return events;
    } catch (error) {
      console.error('Error fetching transfer events:', error);
      return [];
    }
  }
};

// Test addresses from your setup
export const TEST_ADDRESSES = {
  SENDER: "0x1aBdFBe88fC893951624CbdC7eD19DDb0fAF5bc1", // Your account
  RECIPIENT: "0xc25857C2dDC881ccA00DBEc8AD96E6F71d37815b", // Friend's account
  CONTRACT: BDAG_TOKEN_ADDRESS,
  EXPLORER_SENDER: `${EXPLORER_URL}/address/0x1aBdFBe88fC893951624CbdC7eD19DDb0fAF5bc1`,
  EXPLORER_RECIPIENT: `${EXPLORER_URL}/address/0xc25857C2dDC881ccA00DBEc8AD96E6F71d37815b`
};

// Quick test function you can run in console
(window as any).testBDAG = testBDAGTransfer;
(window as any).TEST_ADDRESSES = TEST_ADDRESSES;

console.log('🔧 BDAG Test Utility Loaded!');
console.log('Available in console: window.testBDAG and window.TEST_ADDRESSES');
console.log('Example: testBDAG.getBalance("0x1aBdFBe88fC893951624CbdC7eD19DDb0fAF5bc1")');
