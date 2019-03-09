const { TestHelper } = require('zos');
const { Contracts, ZWeb3 } = require('zos-lib');

ZWeb3.initialize(web3.currentProvider);
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

const log = (name, value) => {
    console.log(
        `
        ${name}
        ---------------
        ${value}
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

    describe("init smart contract", async() => {

        it('should init contract', async() => {
            trojanBondingCurve = await TrojanBondingCurve.new();
            await trojanBondingCurve.initialize(
                'Trojan Foundation',
                'TF',
                18,
                projectWallet,
                1,
                1,
                90
            );

            assert.notEqual(trojanBondingCurve, undefined);
        });
    });

    describe("Buy tokens", async() => {
        let spreadPayout;
        let tokenPurchaseNumber = 250;

        beforeEach(async() => {    
            let totalSupply = await trojanBondingCurve.totalSupply();
            let spreadBefore = await trojanBondingCurve.spread(totalSupply.toNumber());
            log("Calculated spread before buying", spreadBefore.toNumber());
            let spreadAfter = await trojanBondingCurve.spread((totalSupply.toNumber() + tokenPurchaseNumber));
            log("Calculated spread after buying", spreadAfter.toNumber());
            spreadPayout = spreadAfter.toNumber() - spreadBefore.toNumber();
            log("Calculated project reward", spreadPayout);
        });

        it(`should buy ${tokenPurchaseNumber} tokens for member1`, async() => {
            let price = await trojanBondingCurve.calculatePurchaseReturn(tokenPurchaseNumber, { from: member1 });
            log("Tokens price", price);
            let buyTokensTx = await trojanBondingCurve.buy(tokenPurchaseNumber, { from: member1, value: price });
            let memberBalance = await trojanBondingCurve.balanceOf(member1);
            assert.equal(memberBalance, tokenPurchaseNumber);
            //check project reward equal to the calculated one
            assert.equal(buyTokensTx.logs[2].args.payout, spreadPayout);
            logProjectReward(buyTokensTx, "TrojanBondingCurve::Payout()");
        });

        it(`should buy ${tokenPurchaseNumber} tokens for member2`, async() => {
            let price = await trojanBondingCurve.calculatePurchaseReturn(tokenPurchaseNumber, { from: member2 });
            log("Tokens price", price);
            let buyTokensTx = await trojanBondingCurve.buy(tokenPurchaseNumber, { from: member2, value: price });
            let memberBalance = await trojanBondingCurve.balanceOf(member2);
            assert.equal(memberBalance, tokenPurchaseNumber);
            //check project reward equal to the calculated one
            assert.equal(buyTokensTx.logs[2].args.payout, spreadPayout);
            logProjectReward(buyTokensTx, "TrojanBondingCurve::Payout()");
        });

        it(`should buy ${tokenPurchaseNumber} tokens for member3`, async() => {
            let price = await trojanBondingCurve.calculatePurchaseReturn(tokenPurchaseNumber, { from: member3 });
            log("Tokens price", price);
            let buyTokensTx = await trojanBondingCurve.buy(tokenPurchaseNumber, { from: member3, value: price });
            let memberBalance = await trojanBondingCurve.balanceOf(member3);
            assert.equal(memberBalance, tokenPurchaseNumber);
            //check project reward equal to the calculated one
            assert.equal(buyTokensTx.logs[2].args.payout, spreadPayout);
            logProjectReward(buyTokensTx, "TrojanBondingCurve::Payout()");
        });

    });

});