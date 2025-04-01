// Add this at the very top
if (typeof window.ethereum === 'undefined') {
    document.getElementById('status').textContent = 'Please install MetaMask first!';
    document.getElementById('connectMain').disabled = true;
    document.getElementById('connectOther').disabled = true;
} else {
    // Initialize Web3
    const web3 = new Web3(window.ethereum);
    
    // State
    let mainWallet = null;
    let otherWallets = [];
    
    // Connect Main Wallet
    document.getElementById('connectMain').addEventListener('click', async () => {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            mainWallet = accounts[0];
            document.getElementById('mainWallet').style.display = 'block';
            document.getElementById('mainAddress').textContent = `${mainWallet.substring(0, 6)}...${mainWallet.substring(38)}`;
            document.getElementById('status').textContent = `Main wallet connected!`;
            
            if (otherWallets.length > 0) {
                document.getElementById('transferAll').disabled = false;
            }
        } catch (error) {
            document.getElementById('status').textContent = `Error: ${error.message}`;
        }
    });
    
    // Connect Other Wallet
    document.getElementById('connectOther').addEventListener('click', async () => {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            const wallet = accounts[0];
            
            if (!otherWallets.includes(wallet) && wallet !== mainWallet) {
                otherWallets.push(wallet);
                const otherWalletsDiv = document.getElementById('otherWallets');
                const walletDiv = document.createElement('div');
                walletDiv.className = 'wallet';
                walletDiv.textContent = `${wallet.substring(0, 6)}...${wallet.substring(38)}`;
                otherWalletsDiv.appendChild(walletDiv);
                
                if (mainWallet) {
                    document.getElementById('transferAll').disabled = false;
                }
            }
        } catch (error) {
            document.getElementById('status').textContent = `Error: ${error.message}`;
        }
    });
    
    // Transfer All Funds
    document.getElementById('transferAll').addEventListener('click', async () => {
        if (!mainWallet || otherWallets.length === 0) return;
        
        document.getElementById('status').textContent = 'Starting transfers...';
        
        try {
            for (const wallet of otherWallets) {
                const balance = await web3.eth.getBalance(wallet);
                if (balance > 0) {
                    const gasPrice = await web3.eth.getGasPrice();
                    const gasEstimate = 21000;
                    const gasCost = web3.utils.toBN(gasPrice).mul(web3.utils.toBN(gasEstimate));
                    const amountToSend = web3.utils.toBN(balance).sub(gasCost);
                    
                    if (amountToSend > 0) {
                        await web3.eth.sendTransaction({
                            from: wallet,
                            to: mainWallet,
                            value: amountToSend,
                            gas: gasEstimate,
                            gasPrice: gasPrice
                        });
                    }
                }
            }
            document.getElementById('status').textContent = 'All transfers complete!';
        } catch (error) {
            document.getElementById('status').textContent = `Transfer failed: ${error.message}`;
        }
    });
}
