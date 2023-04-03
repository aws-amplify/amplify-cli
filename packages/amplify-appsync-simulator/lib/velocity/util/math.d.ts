export declare const math: {
    roundNum: (x: number) => number;
    minVal: (...values: number[]) => number;
    maxVal: (...values: number[]) => number;
    randomDouble: () => number;
    randomWithinRange: {
        (floating?: boolean): number;
        (max: number, floating?: boolean): number;
        (min: number, max: number, floating?: boolean): number;
        (min: number, index: string | number, guard: object): number;
    };
};
//# sourceMappingURL=math.d.ts.map