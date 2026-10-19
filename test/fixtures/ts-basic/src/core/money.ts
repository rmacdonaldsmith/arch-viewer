export type Money = { cents: number };

export function add(a: Money, b: Money): Money {
  return { cents: a.cents + b.cents };
}
