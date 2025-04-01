// Configuration
const MIN_ETH_BALANCE = 0.001; // Minimum ETH balance to transfer (adjust as needed)
const GAS_BUFFER = 1.5; // Buffer for gas estimation (1.5x estimated gas)

// State
let web3;
let mainWallet = null;
let otherWallets = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);
        setupEventListeners();
    } else {
        showStatus("Please install MetaMask or a Web3 wallet!", "error");
    }
});

// Event Listeners
function setupEventListeners() {
    document.getElementById('connectMain').addEventListener('click', connectMainWallet);
    document.getElementById('connectOther').addEventListener('click', connectOtherWallet);
    document.getElementById('transferAll').addEventListener('click', transferAllToMain);
}

// Connect Main Wallet
async function connectMainWallet() {
    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        mainWallet = accounts[0];
        
        document.getElementById('mainWallet').style.display = 'block';
        document.getElementById('mainAddress').textContent = shortenAddress(mainWallet);
        showStatus(`Main wallet connected: ${shortenAddress(mainWallet)}`, "success");
        
        if (otherWallets.length > 0) {
            document.getElementById('transferAll').disabled = false;
        }
    } catch (error) {
        showStatus("Error connecting main wallet: " + error.message, "error");
    }
}

// Connect Other Wallet
async function connectOtherWallet() {
    try {
        const accounts = await window.ethereum.request({ 
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }]
        }).then(() => window.ethereum.request({ method: 'eth_accounts' }));
        
        const wallet = accounts[0];
        
        if (!otherWallets.includes(wallet) {
            otherWallets.push(wallet);
            renderOtherWallets();
            showStatus(`Wallet connected: ${shortenAddress(wallet)}`, "success");
            
            if (mainWallet) {
                document.getElementById('transferAll').disabled = false;
            }
        }
    } catch (error) {
        showStatus("Error connecting wallet: " + error.message, "error");
    }
}

// Transfer All Funds
async function transferAllToMain() {
    if (!mainWallet || otherWallets.length === 0) return;
    
    showStatus("Starting transfers...", "");
    
    try {
        for (const wallet of otherWallets) {
            await transferWalletFunds(wallet);
        }
        showStatus("All transfers completed!", "success");
    } catch (error) {
        showStatus("Transfer error: " + error.message, "error");
    }
}

// Transfer Funds from Single Wallet
async function transferWalletFunds(wallet) {
    const balance = await web3.eth.getBalance(wallet);
    const ethBalance = web3.utils.fromWei(balance, 'ether');
    
    if (ethBalance < MIN_ETH_BALANCE) {
        showStatus(`Skipping ${shortenAddress(wallet)} (balance too low)`, "");
        return;
    }
    
    showStatus(`Preparing transfer from ${shortenAddress(wallet)}...`, "");
    
    try {
        // Estimate gas
        const gasPrice = await web3.eth.getGasPrice();
        const gasEstimate = 21000; // Base gas for simple transfer
        
        // Calculate max amount we can send (balance - gas costs)
        const gasCost = web3.utils.toBN(gasPrice).mul(web3.utils.toBN(gasEstimate));
        const amountToSend = web3.utils.toBN(balance).sub(gasCost);
        
        if (amountToSend <= 0) {
            showStatus(`Insufficient balance in ${shortenAddress(wallet)} to cover gas`, "error");
            return;
        }
        
        // Send transaction
        const tx = {
            from: wallet,
            to: mainWallet,
            value: amountToSend,
            gas: Math.floor(gasEstimate * GAS_BUFFER),
            gasPrice: gasPrice
        };
        
        showStatus(`Sending ${web3.utils.fromWei(amountToSend, 'ether')} ETH from ${shortenAddress(wallet)}...`, "");
        
        const receipt = await web3.eth.sendTransaction(tx);
        showStatus(`Success! Tx hash: ${shortenAddress(receipt.transactionHash)}`, "success");
        
    } catch (error) {
        showStatus(`Failed to transfer from ${shortenAddress(wallet)}: ${error.message}`, "error");
        throw error;
    }
}

// Helper Functions
function renderOtherWallets() {
    const container = document.getElementById('otherWallets');
    container.innerHTML = '<h3>Other Wallets</h3>';
    
    otherWallets.forEach(wallet => {
        const div = document.createElement('div');
        div.className = 'wallet';
        div.textContent = shortenAddress(wallet);
        container.appendChild(div);
    });
}

function shortenAddress(address) {
    return address ? `${address.substring(0, 6)}...${address.substring(38)}` : '';
}

function showStatus(message, type) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = type ? type : '';
    
    console.log(`Status: ${message}`);
}
