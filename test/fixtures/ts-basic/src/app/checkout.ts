import path from "node:path";
import { Order } from "../domain";
import type { Order as SameOrder } from "../domain";

export function checkout(order: Order, other?: SameOrder): string {
  return path.join("orders", order.id, other?.id ?? "");
}
