export const concat = <T extends { toString(): string } | undefined | null>(...args: T[]): string => {
    return args
        .filter(Boolean)
        .join(' ');
};
