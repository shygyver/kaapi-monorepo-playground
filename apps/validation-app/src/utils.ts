export function binomialCoefficient(n: number, r: number) {
    if (r < 0 || r > n) return 0;
    let result = 1;
    for (let i = 1; i <= r; i++) {
        result = (result * (n - i + 1)) / i;
    }
    return result;
}
