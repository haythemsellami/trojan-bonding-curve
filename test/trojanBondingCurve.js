const { TestHelper } = require('zos');
const { Contracts, ZWeb3 } = require('zos-lib');
const { assertRevert } = require('./helpers/assertThrow');

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

const buyTriangleArea = (base, height) => {
    return base * height * 0.5;
}

const sellTriangleArea = (base, height, sellPercentage) => {
    return base * height * sellPercentage * 0.005;
}

const calcSpread = (base, height, sellPercentage) => {
    let buy = buyTriangleArea(base, height);
    let sell = sellTriangleArea(base, height, sellPercentage);
    return buy - sell;
} 

require('chai').should();

contract('Trojan Bonding Curve', (accounts) => {

    const owner = accounts[0];
    const projectWallet = accounts[1];
    const member1 = accounts[2];
    const member2 = accounts[3];
    const member3 = accounts[4];
    const member4 = accounts[5];
    const member5 = accounts[6];

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

    describe("Buy tokens for member1", async() => {
        //number of token to buy
        let tokenPurchaseNumber = 1500;
        //price
        let height;
        //spread
        let spreadPayout;

        beforeEach(async() => {  
            let totalSupply = await trojanBondingCurve.totalSupply();
            //spread before
            height = await trojanBondingCurve.calculatePurchaseReturn(Number(totalSupply));
            let spreadBefore = calcSpread(Number(totalSupply), Number(height), _sellPercentage);
            //spread after
            let newSupply = Number(totalSupply) + Number(tokenPurchaseNumber);
            height = await trojanBondingCurve.calculatePurchaseReturn(Number(newSupply));
            let spreadAfter = calcSpread(newSupply, Number(height), _sellPercentage);
            //calculate spread payout
            spreadPayout = Number(spreadAfter) - Number(spreadBefore);
            _reserve += Number(height);
            _reserve -= Number(spreadPayout);
        });

        it(`should buy ${tokenPurchaseNumber} tokens for member1`, async() => {
            let buyTokensTx = await trojanBondingCurve.buy(tokenPurchaseNumber, { from: member1, value: height });
            let memberBalance = await trojanBondingCurve.balanceOf(member1);
            assert.equal(memberBalance, tokenPurchaseNumber);
            //check project reward equal to the calculated one
            assert.equal(buyTokensTx.logs[2].args.payout.toNumber(), spreadPayout);
            assert.equal((await trojanBondingCurve.reserve()).toNumber(), _reserve);
        });

        it(`should buy ${tokenPurchaseNumber} tokens for member2`, async() => {
            let buyTokensTx = await trojanBondingCurve.buy(tokenPurchaseNumber, { from: member2, value: height });
            let memberBalance = await trojanBondingCurve.balanceOf(member2);
            assert.equal(memberBalance, tokenPurchaseNumber);
            //check project reward equal to the calculated one
            assert.equal(buyTokensTx.logs[2].args.payout.toNumber(), spreadPayout);
            //assert.equal((await trojanBondingCurve.reserve()).toNumber(), _reserve);
        });

        it(`should buy ${tokenPurchaseNumber} tokens for member3`, async() => {
            let buyTokensTx = await trojanBondingCurve.buy(tokenPurchaseNumber, { from: member3, value: height });
            let memberBalance = await trojanBondingCurve.balanceOf(member3);
            assert.equal(memberBalance, tokenPurchaseNumber);
            //check project reward equal to the calculated one
            assert.equal(buyTokensTx.logs[2].args.payout.toNumber(), spreadPayout);
            assert.equal((await trojanBondingCurve.reserve()).toNumber(), _reserve);
        });
    });

    describe("High volume tokens buy/sell", async() => {
        let tokenPurchaseNumber = 50000;

        describe("Buy", async() => {
            let height;
            let spreadPayout;

            beforeEach(async() => {  
                let totalSupply = await trojanBondingCurve.totalSupply();
                //spread before
                height = await trojanBondingCurve.calculatePurchaseReturn(Number(totalSupply));
                let spreadBefore = calcSpread(Number(totalSupply), Number(height), _sellPercentage);
                //spread after
                let newSupply = Number(totalSupply) + Number(tokenPurchaseNumber);
                height = await trojanBondingCurve.calculatePurchaseReturn(Number(newSupply));
                let spreadAfter = calcSpread(newSupply, Number(height), _sellPercentage);
                //calculate spread payout
                spreadPayout = Number(spreadAfter) - Number(spreadBefore);
                _reserve += Number(height);
                _reserve -= Number(spreadPayout);
            });
    
            it(`should buy ${tokenPurchaseNumber} tokens for member4`, async() => {
                let buyTokensTx = await trojanBondingCurve.buy(tokenPurchaseNumber, { from: member4, value: height });
                let memberBalance = await trojanBondingCurve.balanceOf(member4);
                assert.equal(memberBalance, tokenPurchaseNumber);
                //check project reward equal to the calculated one
                assert.equal(buyTokensTx.logs[2].args.payout.toNumber(), spreadPayout);
                assert.equal((await trojanBondingCurve.reserve()).toNumber(), _reserve);
            });
        });

        describe("Sell", async() => {
            let sellReward;
            let height;

            beforeEach(async() => {
                let totalSupply = await trojanBondingCurve.totalSupply();
                let newSupply = Number(totalSupply) - Number(tokenPurchaseNumber);
                height = await trojanBondingCurve.calculateSaleReturn(Number(totalSupply));
                //calculate sell reward
                sellReward = Number(_reserve) - sellTriangleArea(tokenPurchaseNumber, height, _sellPercentage);
                _reserve -= sellReward;
            });

            it(`should sell ${tokenPurchaseNumber} tokens for member4`, async() => {
                let memberEthBalanceBefore = await web3.eth.getBalance(member4);
                let sellTokensTx = await trojanBondingCurve.sell(tokenPurchaseNumber, { from: member4 });
                let memberEthBalanceAfter = await web3.eth.getBalance(member4);
                let memberBalance = await trojanBondingCurve.balanceOf(member4);
                assert.equal(sellTokensTx.logs[1].args.rewarded, sellReward);
                assert.equal(sellTokensTx.logs[1].args.rewarded.toNumber(), memberEthBalanceAfter-memberEthBalanceBefore);
                assert.equal(memberBalance, 0);
                assert.equal((await trojanBondingCurve.reserve()).toNumber(), _reserve);
            });
        });

    });

});