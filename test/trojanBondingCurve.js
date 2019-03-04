const { TestHelper } = require('zos');
const { Contracts, ZWeb3 } = require('zos-lib');

ZWeb3.initialize(web3.currentProvider);
//const TrojanBondingCurve = Contracts.getFromLocal('TrojanBondingCurve');
const TrojanBondingCurve = artifacts.require("TrojanBondingCurve.sol");

const BigNumber = require('bignumber.js');

const logProjectReward = (tx, name) => {
    console.log(
        `
        ${name}
        ---------------
        Project reward - ${tx.logs[2].args.payout}
        `
    );
}

require('chai').should();

contract('Trojan Bonding Curve', (accounts) => {

    const owner = accounts[0];
    const projectWallet = accounts[1];
    const member1 = accounts[2];
    const member2 = accounts[3];
    const member3 = accounts[4];

    let trojanBondingCurve;

    /*
    beforeEach(async() =>  {
        this.project = await TestHelper();
    })
    */

    describe("init smart contract", async() => {

        it('should init contract', async() => {
            trojanBondingCurve = await TrojanBondingCurve.new();
            await trojanBondingCurve.initialize(
                'Trojan Foundation',
                'TF',
                18,
                projectWallet,
                1,
                1000,
                1000,
                1
            );
    
            assert.notEqual(trojanBondingCurve, undefined);
        })

    });

    describe("Buy tokens", async() => {
        let tokenPurchaseNumber = 3500;

        describe(`buy ${tokenPurchaseNumber} tokens`, async() => {
            it("should calculate project reward", async() => {
                let totalSupply = await trojanBondingCurve.totalSupply();
                console.log(totalSupply.toNumber());
                let spreadBefore = await trojanBondingCurve.spread(totalSupply.toNumber());
                console.log(spreadBefore.toNumber());
                let spreadAfter = await trojanBondingCurve.spread((totalSupply.toNumber() + 100000));
                console.log(spreadAfter.toNumber());
                let spreadPayout = spreadBefore.toNumber() - spreadAfter.toNumber();
                console.log(spreadPayout);
            });

            it(`should buy ${tokenPurchaseNumber} tokens for member1`, async() => {
                let price = await trojanBondingCurve.calculatePurchaseReturn(tokenPurchaseNumber, { from: member1 });
                console.log("Price of tokens: " + web3.utils.fromWei(price, 'ether'));
                let buyTokensTx = await trojanBondingCurve.buy(tokenPurchaseNumber, { from: member1, value: price });
                let memberBalance = await trojanBondingCurve.balanceOf(member1);
                assert.equal(memberBalance, tokenPurchaseNumber);
                logProjectReward(buyTokensTx, "TrojanBondingCurve::Payout()");
            })
    
        });
    });

});