import { bookingService } from "../../services/bookingService";
import { readPrivateSnapshot, savePrivateSnapshot } from "../live-map/liveMapStorage";

const QUEUE_TYPE = "booking-queue";
const MAX_RETRIES = 4;
let activeSync = null;

function operationId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `booking-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("smart-safar:booking-queue"));
}

async function readQueue(token) {
  const snapshot = await readPrivateSnapshot(token, QUEUE_TYPE);
  return Array.isArray(snapshot?.data?.operations) ? snapshot.data.operations : [];
}

async function writeQueue(token, operations) {
  await savePrivateSnapshot(token, QUEUE_TYPE, { version: 1, operations: operations.slice(-30) });
  notify();
  return operations;
}

export async function listPendingBookings(token) {
  return readQueue(token);
}

export async function savePendingBooking(token, payload, summary) {
  const operations = await readQueue(token);
  const existing = operations.find((operation) => ["waiting", "retrying", "synchronizing"].includes(operation.status)
    && operation.payload.bus === payload.bus && operation.payload.seatNumber === payload.seatNumber);
  if (existing) return existing;
  const operation = {
    id: operationId(),
    type: "booking-request",
    status: "waiting",
    payload,
    summary,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    attempts: 0,
  };
  await writeQueue(token, [...operations, operation]);
  return operation;
}

export async function getBookingQueueSummary(token) {
  const operations = await readQueue(token);
  return {
    pending: operations.filter((operation) => ["waiting", "retrying", "synchronizing"].includes(operation.status)).length,
    attention: operations.filter((operation) => operation.status === "needs-attention").length,
  };
}

export async function discardPendingBooking(token, id) {
  const operations = await readQueue(token);
  return writeQueue(token, operations.filter((operation) => operation.id !== id));
}

export async function retryPendingBooking(token, id) {
  const operations = await readQueue(token);
  const next = operations.map((operation) => operation.id === id
    ? { ...operation, status: "waiting", message: "", nextAttemptAt: 0, updatedAt: Date.now() }
    : operation);
  return writeQueue(token, next);
}

function failureState(error, operation) {
  const status = error?.response?.status;
  const message = error?.response?.data?.message || error?.message || "Unable to confirm this booking request.";
  if (status === 409) return { status: "needs-attention", message: /seat|available/i.test(message) ? "Your selected seat is no longer available. Please choose another seat." : message };
  if ([400, 401, 403, 404].includes(status) || operation.attempts + 1 >= MAX_RETRIES) return { status: "needs-attention", message };
  return { status: "retrying", message, nextAttemptAt: Date.now() + Math.min(300000, 15000 * (2 ** operation.attempts)) };
}

export async function syncPendingBookings(token) {
  if (!token || typeof navigator === "undefined" || !navigator.onLine) return [];
  if (activeSync) return activeSync;
  activeSync = (async () => {
    let operations = await readQueue(token);
    for (let index = 0; index < operations.length; index += 1) {
      const operation = operations[index];
      if (!["waiting", "retrying"].includes(operation.status) || (operation.nextAttemptAt && operation.nextAttemptAt > Date.now())) continue;
      operations[index] = { ...operation, status: "synchronizing", updatedAt: Date.now() };
      await writeQueue(token, operations);
      try {
        const booking = await bookingService.create(operation.payload, { headers: { "Idempotency-Key": operation.id } });
        operations[index] = { ...operations[index], status: "confirmed", bookingId: booking?._id || null, updatedAt: Date.now(), message: "Confirmed by Smart Safar." };
      } catch (error) {
        operations[index] = { ...operations[index], ...failureState(error, operation), attempts: operation.attempts + 1, updatedAt: Date.now() };
      }
      await writeQueue(token, operations);
    }
    return operations;
  })().finally(() => { activeSync = null; });
  return activeSync;
}
