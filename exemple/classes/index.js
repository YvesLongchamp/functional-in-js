const { readFile } = require("fs");

class FreightSolver {
  constructor(ordersFilePath, carriersFilePath) {
    this.ordersFilePath = ordersFilePath;
    this.carriersFilePath = carriersFilePath;
  }

  async matchOrders() {
    const orders = await this.loadOrders();
    this.carriers = await this.loadCarriers();

    var matches = [];
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      matches.push(this.findMatch(order));
    }
    return matches;
  }

  findMatch(order) {
    const eligibleCarriers = [];
    for (let i = 0; i < this.carriers.length; i++) {
      const carrier = this.carriers[i];
      if (this.carrierIsEligible(carrier, order)) {
        const score = this.scoreCarrier(carrier, order);
        eligibleCarriers.push({ carrier, score });
      }
    }
    const sortedCarriers = eligibleCarriers.sort((a, b) => b.score - a.score);

    const match = new Match(order);
    sortedCarriers.forEach(carrier => {
      match.appendCarrier(carrier);
    });

    return match;
  }

  carrierIsEligible(carrier, order) {
    return (
      !!carrier.fleet.find(({ type }) => type === order.loadType) &&
      [order.from, order.to].includes(carrier.address)
    );
  }

  scoreCarrier(carrier, order) {
    let score = 0;
    if (carrier.address === order.to) {
      score += 20;
    }
    score += carrier.fleet.find(({ type }) => type === order.loadType).count;
    return score;
  }

  loadOrders() {
    return this.readJSON(this.ordersFilePath);
  }

  loadCarriers() {
    return this.readJSON(this.carriersFilePath);
  }

  readJSON(path) {
    return new Promise((resolve, reject) => {
      readFile(path, "utf-8", (error, data) => {
        if (error) {
          return reject(error);
        }
        resolve(JSON.parse(data));
      });
    });
  }
}

class Match {
  constructor(order) {
    this.order = order;
    this.carriers = [];
  }

  appendCarrier(carrier) {
    this.carriers.push(carrier);
  }

  toString() {
    const carriers = this.carriers
      .map(
        ({ carrier: { name }, score }, index) =>
          `${index + 1} - ${name} (${score})`
      )
      .join(", ");
    const { number, truckCount, loadType, from, to } = this.order;
    return `[${number}] ${truckCount} ${loadType} de ${from} à ${to} : [${carriers}]`;
  }
}

async function main() {
  const solver = new FreightSolver(
    "./exemple/orders.json",
    "./exemple/carriers.json"
  );
  const matches = await solver.matchOrders();
  console.log("Match potentiels :");
  matches.forEach(match => {
    console.log(match.toString());
  });
}

main().catch(error => console.error(error));
