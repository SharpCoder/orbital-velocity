export function zero(): number[] {
    return [0, 0, 0];
}

export function normalize(value: number, start: number, end: number) {
    const width = end - start; //
    const offsetValue = value - start; // value relative to 0
    return offsetValue - Math.floor(offsetValue / width) * width + start;
}
