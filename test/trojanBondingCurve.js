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

const buyTriangleArea = (x) => {
    return (x * x) /2;
}

const sellTriangleArea = (x, sellPercentage) => {
    return (x * x * sellPercentage) / 200;
}

const calcSpread = (x, sellPercentage) => {
    let buy = buyTriangleArea(x);
    let sell = sellTriangleArea(x, sellPercentage);
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
            purchaseReturn = buyTriangleArea(newSupply) - parseInt(_reserve);
            //calculate spread payout
            let spreadBefore = calcSpread(totalSupply.toNumber(), _sellPercentage);
            let spreadAfter = calcSpread(newSupply, _sellPercentage);
            spreadPayout = spreadAfter - spreadBefore;
            _reserve += purchaseReturn;
            _reserve -= spreadPayout;
        });

        it(`should buy ${tokenPurchaseNumber} tokens for member1`, async() => {
            let price = await trojanBondingCurve.calculatePurchaseReturn(tokenPurchaseNumber, { from: member1 });
            assert.equal(price.toNumber(), purchaseReturn);
            let buyTokensTx = await trojanBondingCurve.buy(tokenPurchaseNumber, { from: member1, value: price });
            let memberBalance = await trojanBondingCurve.balanceOf(member1);
            assert.equal(memberBalance, tokenPurchaseNumber);
            //check project reward equal to the calculated one
            assert.equal(buyTokensTx.logs[2].args.payout, spreadPayout);
            assert.equal((await trojanBondingCurve.reserve()).toNumber(), _reserve);
        });

        it(`should buy ${tokenPurchaseNumber} tokens for member2`, async() => {
            let price = await trojanBondingCurve.calculatePurchaseReturn(tokenPurchaseNumber, { from: member2 });
            assert.equal(price.toNumber(), purchaseReturn);
            let buyTokensTx = await trojanBondingCurve.buy(tokenPurchaseNumber, { from: member2, value: price });
            let memberBalance = await trojanBondingCurve.balanceOf(member2);
            assert.equal(memberBalance, tokenPurchaseNumber);
            //check project reward equal to the calculated one
            assert.equal(buyTokensTx.logs[2].args.payout, spreadPayout);
            assert.equal((await trojanBondingCurve.reserve()).toNumber(), _reserve);
        });

        it(`should buy ${tokenPurchaseNumber} tokens for member3`, async() => {
            let price = await trojanBondingCurve.calculatePurchaseReturn(tokenPurchaseNumber, { from: member3 });
            assert.equal(price.toNumber(), purchaseReturn);
            let buyTokensTx = await trojanBondingCurve.buy(tokenPurchaseNumber, { from: member3, value: price });
            let memberBalance = await trojanBondingCurve.balanceOf(member3);
            assert.equal(memberBalance, tokenPurchaseNumber);
            //check project reward equal to the calculated one
            assert.equal(buyTokensTx.logs[2].args.payout, spreadPayout);
            assert.equal((await trojanBondingCurve.reserve()).toNumber(), _reserve);
        });

        it("should revert when giving ether less than tokens price", async() => {
            return assertRevert(async () => {
                await trojanBondingCurve.buy(tokenPurchaseNumber, { from: member4, value: 0 })
                'sender does not have enough value'
            })
        });

    });

    describe("High volume tokens", async() => {
        let tokenPurchaseNumber = 50000;
        let purchaseReturn;
        let spreadPayout;

        describe("Buy", async() => {
            beforeEach(async() => {    
                let totalSupply = await trojanBondingCurve.totalSupply();
                let newSupply = parseInt(totalSupply) + parseInt(tokenPurchaseNumber);
                //calculate purchase price
                purchaseReturn = buyTriangleArea(newSupply) - parseInt(_reserve);
                //calculate spread payout
                let spreadBefore = calcSpread(totalSupply.toNumber(), _sellPercentage);
                let spreadAfter = calcSpread(newSupply, _sellPercentage);
                spreadPayout = spreadAfter - spreadBefore;
                _reserve += purchaseReturn;
                _reserve -= spreadPayout;
            });
    
            it(`should buy ${tokenPurchaseNumber} tokens for member4`, async() => {
                let price = await trojanBondingCurve.calculatePurchaseReturn(tokenPurchaseNumber, { from: member4 });
                assert.equal(price.toNumber(), purchaseReturn);
                let buyTokensTx = await trojanBondingCurve.buy(tokenPurchaseNumber, { from: member4, value: price });
                let memberBalance = await trojanBondingCurve.balanceOf(member4);
                assert.equal(memberBalance, tokenPurchaseNumber);
                //check project reward equal to the calculated one
                assert.equal(buyTokensTx.logs[2].args.payout, spreadPayout);
                assert.equal((await trojanBondingCurve.reserve()).toNumber(), _reserve);
            });
    
            it(`should buy ${tokenPurchaseNumber} tokens for member5`, async() => {
                let price = await trojanBondingCurve.calculatePurchaseReturn(tokenPurchaseNumber, { from: member5 });
                assert.equal(price.toNumber(), purchaseReturn);
                let buyTokensTx = await trojanBondingCurve.buy(tokenPurchaseNumber, { from: member5, value: price });
                let memberBalance = await trojanBondingCurve.balanceOf(member5);
                assert.equal(memberBalance, tokenPurchaseNumber);
                //check project reward equal to the calculated one
                assert.equal(buyTokensTx.logs[2].args.payout, spreadPayout);
                assert.equal((await trojanBondingCurve.reserve()).toNumber(), _reserve);
            });
        });

        describe("Sell", async() => {
            let sellReward;

            beforeEach(async() => {
                let totalSupply = await trojanBondingCurve.totalSupply();
                let newSupply = parseInt(totalSupply) - parseInt(tokenPurchaseNumber);
                //calculate sell reward
                sellReward = _reserve - sellTriangleArea(newSupply, _sellPercentage);
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