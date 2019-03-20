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

const buyIntegral = (x, slopeNumerator, slopeDenominator) => {
    return (slopeNumerator * x * x) / (2 * slopeDenominator);
}

const sellIntegral = (x, slopeNumerator, slopeDenominator, sellPercentage) => {
    return (slopeNumerator * x * x * sellPercentage) / (200 * slopeDenominator);
}

const spread = (toX, slopeNumerator, slopeDenominator, sellPercentage) => {
    let buy = buyIntegral(toX, slopeNumerator, slopeDenominator);
    let sell = sellIntegral(toX, slopeNumerator, slopeDenominator, sellPercentage);
    return parseInt(buy) - parseInt(sell);
}

require('chai').should();

contract('Trojan Bonding Curve', (accounts) => {

    const owner = accounts[0];
    const projectWallet = accounts[1];
    const member1 = accounts[2];
    const member2 = accounts[3];
    const member3 = accounts[4];

    let trojanBondingCurve;
    let _slopeNumerator = 1;
    let _slopeDenominator = 1;
    let _sellPercentage = 90;
    let _reserve = 0;

    describe("init smart contract", async() => {

        it('should init contract', async() => {
            trojanBondingCurve = await TrojanBondingCurve.new();
            await trojanBondingCurve.initialize(
                'Trojan Foundation',
                'TF',
                18,
                projectWallet,
                _slopeNumerator,
                _slopeDenominator,
                _sellPercentage
            );

            assert.notEqual(trojanBondingCurve, undefined);
        });
    });

    describe("Buy tokens", async() => {
        //number of token to buy
        let tokenPurchaseNumber = 250;
        //price
        let purchaseReturn;
        //spread
        let spreadPayout;

        beforeEach(async() => {    
            let totalSupply = await trojanBondingCurve.totalSupply();
            let newSupply = parseInt(totalSupply) + parseInt(tokenPurchaseNumber);
            //calculate purchase price
            purchaseReturn = buyIntegral(newSupply, _slopeNumerator, _slopeDenominator) - parseInt(_reserve);
            //calculate spread payout
            let spreadBefore = spread(totalSupply.toNumber(), _slopeNumerator, _slopeDenominator, _sellPercentage);
            let spreadAfter = spread(newSupply, _slopeNumerator, _slopeDenominator, _sellPercentage);
            spreadPayout = spreadAfter - spreadBefore;
            _reserve += spreadPayout;
        });

        it(`should buy ${tokenPurchaseNumber} tokens for member1`, async() => {
            let price = await trojanBondingCurve.calculatePurchaseReturn(tokenPurchaseNumber, { from: member1 });
            assert.equal(price.toNumber(), purchaseReturn);
            let buyTokensTx = await trojanBondingCurve.buy(tokenPurchaseNumber, { from: member1, value: price });
            let memberBalance = await trojanBondingCurve.balanceOf(member1);
            assert.equal(memberBalance, tokenPurchaseNumber);
            //check project reward equal to the calculated one
            assert.equal(buyTokensTx.logs[2].args.payout, spreadPayout);
        });

        it(`should buy ${tokenPurchaseNumber} tokens for member2`, async() => {
            let price = await trojanBondingCurve.calculatePurchaseReturn(tokenPurchaseNumber, { from: member2 });
            assert.equal(price.toNumber(), purchaseReturn);
            let buyTokensTx = await trojanBondingCurve.buy(tokenPurchaseNumber, { from: member2, value: price });
            let memberBalance = await trojanBondingCurve.balanceOf(member2);
            assert.equal(memberBalance, tokenPurchaseNumber);
            //check project reward equal to the calculated one
            assert.equal(buyTokensTx.logs[2].args.payout, spreadPayout);
        });

        it(`should buy ${tokenPurchaseNumber} tokens for member3`, async() => {
            let price = await trojanBondingCurve.calculatePurchaseReturn(tokenPurchaseNumber, { from: member3 });
            assert.equal(price.toNumber(), purchaseReturn);
            let buyTokensTx = await trojanBondingCurve.buy(tokenPurchaseNumber, { from: member3, value: price });
            let memberBalance = await trojanBondingCurve.balanceOf(member3);
            assert.equal(memberBalance, tokenPurchaseNumber);
            //check project reward equal to the calculated one
            assert.equal(buyTokensTx.logs[2].args.payout, spreadPayout);
        });

    });
/*
    describe("Sell tokens", async() => {

        it('');
    });
*/
});