// https://github.com/kamukrass/Bitburner/blob/develop/stock-trader.js
// requires TIX API Access and 4s Market Data

import { NS } from "@ns";
import { getServerFromStockSymbol } from 'helpers'

// defines if stocks can be shorted (see BitNode 8)
const shortAvailable = false;

const commission = 100000;

export async function main(ns: NS) {
    ns.disableLog("ALL");

    while (true) {
        tendStocks(ns);
        await ns.sleep(5 * 1000);
    }
}

function tendStocks(ns: NS) {
    ns.print("");
    var stocks = getAllStocks(ns);

    stocks.sort((a, b) => b.profitPotential - a.profitPotential);

    var longStocks = new Set<string>();
    var shortStocks = new Set<string>();
    var overallValue = 0;

    for (const stock of stocks) {
        if (stock.longShares > 0) {
            if (stock.forecast > 0.5) {
                longStocks.add(stock.sym);
                ns.print(`INFO ${stock.summary} LONG ${ns.nFormat(stock.cost + stock.profit, "0.0a")} ${ns.nFormat(100 * stock.profit / stock.cost, "0.00")}%`);
                overallValue += (stock.cost + stock.profit);
            }
            else {

                const salePrice = ns.stock.sellStock(stock.sym, stock.longShares);
                const saleTotal = salePrice * stock.longShares;
                const saleCost = stock.longPrice * stock.longShares;
                const saleProfit = saleTotal - saleCost - 2 * commission;
                stock.shares = 0;
                shortStocks.add(stock.sym);
                ns.print(`WARN ${stock.summary} SOLD for ${ns.nFormat(saleProfit, "$0.0a")} profit`);
            }
        }
        if (stock.shortShares > 0) {
            if (stock.forecast < 0.5) {
                shortStocks.add(stock.sym);
                ns.print(`INFO ${stock.summary} SHORT ${ns.nFormat(stock.cost + stock.profit, "0.0a")} ${ns.nFormat(100 * stock.profit / stock.cost, "0.00")}%`);
                overallValue += (stock.cost + stock.profit);
            }
            else {
                const salePrice = ns.stock.sellShort(stock.sym, stock.shortShares);
                const saleTotal = salePrice * stock.shortShares;
                const saleCost = stock.shortPrice * stock.shortShares;
                const saleProfit = saleTotal - saleCost - 2 * commission;
                stock.shares = 0;
                longStocks.add(stock.sym);
                ns.print(`WARN ${stock.summary} SHORT SOLD for ${ns.nFormat(saleProfit, "$0.0a")} profit`);
            }
        }
    }

    for (const stock of stocks) {
        var money = ns.getServerMoneyAvailable("home");
        //ns.print(`INFO ${stock.summary}`);
        if (stock.forecast > 0.55) {
            longStocks.add(stock.sym);
            //ns.print(`INFO ${stock.summary}`);
            if (money > 500 * commission) {
                const sharesToBuy = Math.min(stock.maxShares, Math.floor((money - commission) / stock.askPrice));
                if (ns.stock.buyStock(stock.sym, sharesToBuy) > 0) {
                    ns.print(`WARN ${stock.summary} LONG BOUGHT ${ns.nFormat(sharesToBuy, "$0.0a")}`);
                }
            }
        }
        else if (stock.forecast < 0.45 && shortAvailable) {
            shortStocks.add(stock.sym);
            //ns.print(`INFO ${stock.summary}`);
            if (money > 500 * commission) {
                const sharesToBuy = Math.min(stock.maxShares, Math.floor((money - commission) / stock.bidPrice));
                if (ns.stock.buyShort(stock.sym, sharesToBuy) > 0) {
                    ns.print(`WARN ${stock.summary} SHORT BOUGHT ${ns.nFormat(sharesToBuy, "$0.0a")}`);
                }
            }
        }
    }
    ns.print("Stock value: $" + ns.formatNumber(overallValue, 0));

    // send stock market manipulation orders to hack manager
    var growStockPort = ns.getPortHandle(1); // port 1 is grow
    var hackStockPort = ns.getPortHandle(2); // port 2 is hack
    if (growStockPort.empty() && hackStockPort.empty()) {
        // only write to ports if empty
        for (const sym of longStocks) {
            //ns.print("INFO grow " + sym);
            growStockPort.write(getServerFromStockSymbol(sym));
        }
        for (const sym of shortStocks) {
            //ns.print("INFO hack " + sym);
            hackStockPort.write(getServerFromStockSymbol(sym));
        }
    }
}

export function getAllStocks(ns: NS) {
    // make a lookup table of all stocks and all their properties
    const stockSymbols = ns.stock.getSymbols();
    const stocks = [];
    for (const sym of stockSymbols) {

        const pos = ns.stock.getPosition(sym);
        const stock = {
            sym: sym,
            longShares: pos[0],
            longPrice: pos[1],
            shortShares: pos[2],
            shortPrice: pos[3],
            forecast: ns.stock.getForecast(sym),
            volatility: ns.stock.getVolatility(sym),
            askPrice: ns.stock.getAskPrice(sym),
            bidPrice: ns.stock.getBidPrice(sym),
            maxShares: ns.stock.getMaxShares(sym),
            profit: Number(0),
            cost: Number(0),
            profitPotential: Number(0),
            summary: String(""),
            shares: Number(0),
        };

        var longProfit = stock.longShares * (stock.bidPrice - stock.longPrice) - 2 * commission;
        var shortProfit = stock.shortShares * (stock.shortPrice - stock.askPrice) - 2 * commission;
        stock.profit = longProfit + shortProfit;
        stock.cost = (stock.longShares * stock.longPrice) + (stock.shortShares * stock.shortPrice)

        // profit potential as chance for profit * effect of profit
        var profitChance = 2 * Math.abs(stock.forecast - 0.5);
        var profitPotential = profitChance * (stock.volatility);
        stock.profitPotential = profitPotential;

        stock.summary = `${stock.sym}: ${stock.forecast.toFixed(3)} ± ${stock.volatility.toFixed(3)}`;
        stocks.push(stock);
    }
    return stocks;
}
