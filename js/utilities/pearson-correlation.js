function getPearsonCorrelation(x, y) {
    let shortestArrayLength = 0;

    if (x.length === y.length) {
        shortestArrayLength = x.length;
    } else if (x.length > y.length) {
        shortestArrayLength = y.length;
    } else {
        shortestArrayLength = x.length;
    }

    let xy = [];
    let x2 = [];
    let y2 = [];

    for (let i = 0; i < shortestArrayLength; i++) {
        xy.push(x[i] * y[i]);
        x2.push(x[i] * x[i]);
        y2.push(y[i] * y[i]);
    }

    let sum_x = 0;
    let sum_y = 0;
    let sum_xy = 0;
    let sum_x2 = 0;
    let sum_y2 = 0;

    for (let i = 0; i < shortestArrayLength; i++) {
        sum_x += x[i];
        sum_y += y[i];
        sum_xy += xy[i];
        sum_x2 += x2[i];
        sum_y2 += y2[i];
    }

    let step1 = (shortestArrayLength * sum_xy) - (sum_x * sum_y);
    let step2 = (shortestArrayLength * sum_x2) - (sum_x * sum_x);
    let step3 = (shortestArrayLength * sum_y2) - (sum_y * sum_y);
    let step4 = Math.sqrt(step2 * step3);

    return step1 / step4;
}