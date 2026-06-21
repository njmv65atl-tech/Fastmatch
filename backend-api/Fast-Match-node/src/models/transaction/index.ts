import mongoose from "mongoose";
import { TransactionSchema } from "./schema";
import { TransactionInterface } from "./types";

const Transaction = mongoose.model<TransactionInterface>('transactions', TransactionSchema);

export { Transaction };
