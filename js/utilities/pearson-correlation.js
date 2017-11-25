function getPearsonCorrelation(x, y) {
    let length = (x.length === y.length) ? x.length :
        (x.length > y.length ? y.length : x.length); // The arrays should have the same length to calculate the correlation

    let xy = [];
    let xx = [];
    let yy = [];

    for (let i = 0; i < length; i++) { // Calculate the product of arrays x*y, x*x, y*y
        xy.push(x[i] * y[i]);
        xx.push(x[i] * x[i]);
        yy.push(y[i] * y[i]);
    }

    let sumx = 0;
    let sumy = 0;
    let sumxy = 0;
    let sumxx = 0;
    let sumyy = 0;

    for (let i = 0; i < length; i++) { // Calculate the sum of arrays x, y, x*y, x*x, y*y
        sumx += x[i];
        sumy += y[i];
        sumxy += xy[i];
        sumxx += xx[i];
        sumyy += yy[i];
    }

    //Based on formula http://www.socscistatistics.com/tests/pearson/
    return ((length * sumxy) - (sumx * sumy)) / Math.sqrt(((length * sumxx) - (sumx * sumx)) * ((length * sumyy) - (sumy * sumy)));
}
