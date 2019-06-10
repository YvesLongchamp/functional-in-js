const { readFile } = require("fs");

const R = require("ramda");

const filterEligibleCarriers = ({ order, carriers }) => ({
  order,
  carriers: R.filter(
    ({ address, fleet }) =>
      !!fleet.find(({ type }) => type === order.loadType) &&
      [order.from, order.to].includes(address)
  )(carriers)
});

const scoreCarrier = (carrier, order) => R.pipe(
  R.cond([
    [() => carrier.address === order.to, R.always(20)],
    [R.T, R.always(0)]
  ]),
  R.add(carrier.fleet.find(({ type }) => type === order.loadType).count)
)();

const scoreCarriers = ({ carriers, order }) => ({
  order: order,
  carriers: R.map(carrier => ({
    carrier,
    score: scoreCarrier(carrier, order)
  }))(carriers)
});

const sortCarriersOnScore = R.over(R.lensProp("carriers"), R.sort((a, b) => b.score - a.score));

const formatOrder = R.over(
  R.lensProp("order"), 
  ({ number, truckCount, loadType, from, to }) => `[${number}] ${truckCount} ${loadType} de ${from} à ${to}`
);

const formatCarriers = R.over(
  R.lensProp("carriers"),
  R.addIndex(R.map)(({ carrier: { name }, score }, index) =>
    `${index + 1} - ${name} (${score})`
  )
);

R.pipe(
  formatOrder,
  formatCarriers
);

const toMatch = R.pipe(
  formatOrder,
  formatCarriers
);

const toString = ({ order, carriers }) => `${order} : [${carriers.join(", ")}]`;

const findMatch = R.pipe(
  filterEligibleCarriers,
  scoreCarriers,
  sortCarriersOnScore,
  toMatch,
  toString
);


const matchOrders = ({ orders, carriers }) =>
  R.map(order => findMatch({ order, carriers }))(orders);

async function main() {
  const orders = await readJSON("./exemple/orders.json");
  const carriers = await readJSON("./exemple/carriers.json");

  const matches = matchOrders({ orders, carriers });
  console.log("Match potentiels :");
  R.forEach(console.log)(matches);
}

main().catch(console.error);

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
