const { readFile } = require('fs');

class FreightSolver {
    constructor(ordersFilePath, carriersFilePath) {
        this.ordersFilePath = ordersFilePath;
        this.carriersFilePath = carriersFilePath;
    }

    async matchOrders() {
        const orders = await this.loadOrders();
        this.carriers = await this.loadCarriers();

        return orders.map(order => this.findMatch(order));
    }

    findMatch(order) {
        const eligibleCarriers = this.carriers
            .filter(({ address, fleet }) => 
                !!fleet.find(({ type }) => type === order.loadType)
                    && [order.from, order.to].includes(address))
            .map(carrier => ({
                carrier,
                score: this.scoreCarrier(carrier, order) 
            }))
            .sort((a, b) => b.score - a.score)
        
        const match = new Match(order);
        eligibleCarriers.forEach(carrier => {
            match.appendCarrier(carrier);
        });

        return match;
    }

    scoreCarrier(carrier, order) {
        let score = 0
        if (carrier.address === order.to) {
            score += 20
        }
        score += carrier
            .fleet
            .find(({ type }) => type === order.loadType)
            .count;
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
            readFile(path, 'utf-8', (error, data) => {
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
            .map(({ carrier: { name }, score }, index) => `${index + 1} - ${name} (${score})`)
            .join(', ');
        const { number, truckCount, loadType, from, to } = this.order;
        return `[${number}] ${truckCount} ${loadType} de ${from} à ${to} : [${carriers}]`;
    }
}

async function main () {
    const solver = new FreightSolver('./exemple/orders.json', './exemple/carriers.json');
    const matches = await solver.matchOrders();
    console.log('Match potentiels :');
    matches.forEach(match => {
        console.log(match.toString());
    });
}

main()
    .catch(error => console.error(error));
