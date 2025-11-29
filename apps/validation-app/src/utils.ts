export function productRange(a: number, b: number) {
    let result = a,
        i = a;
    while (i++ < b) {
        result *= i;
    }
    return result;
}
