const { readFile } = require('fs');

const filterEligibleCarriers = ({ order, carriers }) => ({
  order,
  carriers: carriers.filter(
    ({ address, fleet }) =>
      !!fleet.find(({ type }) => type === order.loadType) &&
      [order.from, order.to].includes(address)
  )
});

const scoreCarrier = (carrier, order) => {
  let score = 0;
  if (carrier.address === order.to) {
    score += 20;
  }
  score += carrier.fleet.find(({ type }) => type === order.loadType).count;
  return score;
};

const scoreCarriers = ({ order, carriers }) => ({
  order,
  carriers: carriers.map(carrier => ({
    carrier,
    score: scoreCarrier(carrier, order)
  }))
});

const sortCarriersOnScore = ({ order, carriers }) => ({
  order,
  carriers: carriers.sort((a, b) => b.score - a.score)
});

const toMatch = ({ order: { number, truckCount, loadType, from, to }, carriers }) => ({
  order: `[${number}] ${truckCount} ${loadType} de ${from} à ${to}`,
  carriers: carriers
    .map(
      ({ carrier: { name }, score }, index) =>
        `${index + 1} - ${name} (${score})`
    )
});

const toString = ({ order, carriers }) => `${order} : [${carriers.join(", ")}]`;

const pipe = (...functions) =>
    functions.reduce(
        (composite, func) => value => func(composite(value)),
        value => value
    );

const findMatch = pipe(filterEligibleCarriers, scoreCarriers, sortCarriersOnScore, toMatch, toString);

const matchOrders = ({ orders, carriers }) =>
  orders.map(order => findMatch({ order, carriers }));

async function main() {
  const orders = await readJSON("./exemple/orders.json");
  const carriers = await readJSON("./exemple/carriers.json");

  const matches = matchOrders({ orders, carriers });
  console.log("Match potentiels :");
  matches.forEach(match => console.log(match));
}

main().catch(error => console.error(error));

function readJSON(path) {
  return new Promise((resolve, reject) => {
    readFile(path, "utf-8", (error, data) => {
      if (error) {
        return reject(error);
      }
      resolve(JSON.parse(data));
    });
  });
}
