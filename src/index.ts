import * as algokit from '@algorandfoundation/algokit-utils';
// algokit localnet start
// npx tsx ./src/index.ts

async function main() {
    // use default localnet in VS Code codespace, not mainnet or testnet
    const algorand = algokit.AlgorandClient.defaultLocalNet()

    // Create some accounts
    const alice = algorand.account.random()
    const bob = algorand.account.random()

    // alice's address will be different each time because of .random
    console.log("Alice's address", alice.addr)
    
    // show information about alice's address
    console.log("Alice's Account", await algorand.account.getInformation(alice.addr))

    // create dispenser account
    const dispenser = await algorand.account.dispenser()

    // send 10 algos to alice's account
    await algorand.send.payment({
        sender: dispenser.addr,
        receiver: alice.addr,
        amount: algokit.algos(10)
    })

    console.log("Alice's Account", await algorand.account.getInformation(alice.addr))

    // create 100 assets for alice
    const createResult = await algorand.send.assetCreate({
        sender: alice.addr,
        total: 100n,
    })

    // get assetID
    const assetId = BigInt(createResult.confirmation.assetIndex!)
    console.log('assettID', assetId)

    // send 10 algos to bob's account
    await algorand.send.payment({
        sender: dispenser.addr,
        receiver: bob.addr,
        amount: algokit.algos(10)
    })

    console.log("Bob's MBR pre opt-in", (await algorand.account.getInformation(bob.addr)).minBalance)

    // opt in
    await algorand.send.assetOptIn({
        sender: bob.addr,
        assetId
    })

    console.log("Bob's MBR post opt-in", (await algorand.account.getInformation(bob.addr)).minBalance)

    // send asset from alice to bob
    await algorand.send.assetTransfer({
        sender: alice.addr,
        receiver: bob.addr,
        amount: 2n,
        assetId
    })

    console.log("Alice's Asset Balance", (await algorand.account.getAssetInformation(alice.addr, assetId)))
    console.log("Bob's Asset Balance", (await algorand.account.getAssetInformation(bob.addr, assetId)))

    // Bob to send Alice the asset
    // Alice to send Bob some ALGO

    /*
    await algorand.send.payment({
        sender: alice.addr,
        receiver: bob.addr,
        amount: algokit.algos(1)
    })

    await algorand.send.assetTransfer({
        sender: bob.addr,
        assetId,
        receiver: alice.addr,
        amount: 1n
    })
    */

    // atomic transfer for payment & asset transfer
    await algorand.newGroup().addPayment({
        sender: alice.addr,
        receiver: bob.addr,
        amount: algokit.algos(1)
    }).addAssetTransfer({
        sender: bob.addr,
        assetId,
        receiver: alice.addr,
        amount: 1n
    }).execute()

    console.log("Alice's Asset Balance", (await algorand.account.getAssetInformation(alice.addr, assetId)))
    console.log("Bob's Asset Balance", (await algorand.account.getAssetInformation(bob.addr, assetId)))
    console.log("Bob's MBR post transfer", (await algorand.account.getInformation(bob.addr)).minBalance)

    // opt out
    await algorand.send.assetTransfer({
        sender: bob.addr,
        receiver: alice.addr,
        assetId,
        amount: 0n,
        closeAssetTo: alice.addr
    })

    console.log("Alice's Asset Balance post opt-out", (await algorand.account.getAssetInformation(alice.addr, assetId)))
    console.log("Bob's MBR post opt-out", (await algorand.account.getInformation(bob.addr)).minBalance)}

main();