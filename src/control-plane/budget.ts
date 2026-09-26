export class BudgetError extends Error {}

export interface Reservation {
  id: string;
  bucket: string;
  amount: number;
}

interface BucketState {
  limit: number;
  reserved: number;
  spent: number;
}

/**
 * Tracks budget per bucket (e.g. "inference:daily", "ads:monthly") with an
 * atomic reserve -> commit/release flow, so concurrent callers cannot
 * double-spend past the limit. Financial (store) budget and inference
 * budget must use different bucket names, per the master plan.
 */
export class BudgetGuard {
  private readonly buckets = new Map<string, BucketState>();
  private readonly reservations = new Map<string, Reservation>();
  private sequence = 0;

  setLimit(bucket: string, limit: number): void {
    if (limit < 0) {
      throw new BudgetError(`El limite de '${bucket}' no puede ser negativo.`);
    }
    const existing = this.buckets.get(bucket);
    this.buckets.set(bucket, { limit, reserved: existing?.reserved ?? 0, spent: existing?.spent ?? 0 });
  }

  private bucketOf(bucket: string): BucketState {
    const state = this.buckets.get(bucket);
    if (!state) {
      throw new BudgetError(`El bucket de presupuesto '${bucket}' no tiene limite configurado.`);
    }
    return state;
  }

  available(bucket: string): number {
    const state = this.bucketOf(bucket);
    return state.limit - state.reserved - state.spent;
  }

  /** Reserves budget before an external call is made. Throws if it would exceed the limit. */
  reserve(bucket: string, amount: number): Reservation {
    if (amount <= 0) {
      throw new BudgetError("El monto a reservar debe ser positivo.");
    }
    const state = this.bucketOf(bucket);
    if (amount > state.limit - state.reserved - state.spent) {
      throw new BudgetError(`Presupuesto insuficiente en '${bucket}': disponible=${state.limit - state.reserved - state.spent}, solicitado=${amount}.`);
    }
    state.reserved += amount;
    this.sequence += 1;
    const reservation: Reservation = { id: `res_${this.sequence}`, bucket, amount };
    this.reservations.set(reservation.id, reservation);
    return reservation;
  }

  /** Commits a reservation once the actual (observed) cost is known. */
  commit(reservationId: string, actualAmount: number): void {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      throw new BudgetError(`Reserva desconocida o ya liquidada: '${reservationId}'.`);
    }
    const state = this.bucketOf(reservation.bucket);
    state.reserved -= reservation.amount;
    state.spent += actualAmount;
    this.reservations.delete(reservationId);
  }

  /** Releases a reservation when the underlying call failed, without recording spend. */
  release(reservationId: string): void {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) {
      throw new BudgetError(`Reserva desconocida o ya liquidada: '${reservationId}'.`);
    }
    const state = this.bucketOf(reservation.bucket);
    state.reserved -= reservation.amount;
    this.reservations.delete(reservationId);
  }
}
